import { audioContext } from './utils';

import { createWorketFromSrc } from './audioworklet-registry';
import EventEmitter from 'eventemitter3';
import AudioRecordingWorklet from './audio-processing';
import VolMeterWorket from './vol-meter';

/**
 * 🧼 BULLETPROOF Base64 Conversion using FileReader
 * The old String.fromCharCode method creates invalid UTF-8 sequences from raw audio bytes,
 * causing WebSocket 1007 errors. FileReader handles binary data correctly.
 */
async function arrayBufferToBase64Safe(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const reader = new FileReader();

    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        // FileReader.readAsDataURL returns "data:application/octet-stream;base64,XXXXX"
        // We need to strip the header and get only the Base64 part
        const base64Data = result.split(',')[1];
        if (!base64Data) {
          reject(new Error('Failed to extract Base64 data from FileReader result'));
          return;
        }
        resolve(base64Data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('FileReader failed to convert ArrayBuffer to Base64'));
    };

    // This converts the binary blob to a safe Base64 string
    reader.readAsDataURL(blob);
  });
}

/**
 * @deprecated Use arrayBufferToBase64Safe instead - this creates invalid UTF-8 from audio bytes
 */
function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }


  get isRecording(): boolean {
    return this.recording && this.stream !== undefined;
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Could not request user media');
    }

    // CRITICAL FIX: If already recording or starting, stop first to ensure clean state
    if (this.recording || this.stream) {
      console.log('⚠️ AudioRecorder: Already recording/starting. Cleaning up first...');
      this.stop();
      // Wait a bit for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.starting = new Promise(async (resolve, reject) => {
      try {
        // Ensure previous state is cleared
        this.recording = false;
        this.stream = undefined;
        this.source = undefined;
        this.recordingWorklet = undefined;
        this.vuWorklet = undefined;

        console.log('🎤 AudioRecorder: Requesting new media stream...');
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ AudioRecorder: Media stream obtained');

        this.audioContext = await audioContext({ sampleRate: this.sampleRate });

        // CRITICAL: Ensure audio context is running (might be suspended)
        if (this.audioContext.state === 'suspended') {
          console.log('⚠️ AudioRecorder: AudioContext suspended, resuming...');
          await this.audioContext.resume();
        }

        this.source = this.audioContext.createMediaStreamSource(this.stream);
        console.log('✅ AudioRecorder: MediaStreamSource created');

        const workletName = 'audio-recorder-worklet';
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName
        );

        // 🚀 LATENCY OPTIMIZATION: Use async handler but don't await - let chunks process in parallel
        // This allows multiple chunks to be converted simultaneously, reducing overall latency
        this.recordingWorklet.port.onmessage = (ev: MessageEvent) => {
          // Worklet processes recording floats and messages converted buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            // 🧼 BULLETPROOF Base64 conversion using FileReader (prevents 1007 errors)
            // Convert async but don't block - process chunks in parallel for lower latency
            arrayBufferToBase64Safe(arrayBuffer)
              .then((base64String) => {
                this.emit('data', base64String);
              })
              .catch((error) => {
                console.error('❌ Failed to convert audio chunk to Base64:', error);
                // Don't emit data if conversion fails - prevents sending corrupted chunks
              });
          }
        };
        this.source.connect(this.recordingWorklet);

        // vu meter worklet
        const vuWorkletName = 'vu-meter';
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket)
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit('volume', ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
        console.log('✅ AudioRecorder: Recording started successfully');
        resolve();
        this.starting = null;
      } catch (error) {
        console.error('❌ AudioRecorder: Failed to start recording:', error);
        // Cleanup on error
        this.recording = false;
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = undefined;
        }
        this.starting = null;
        reject(error);
      }
    });

    return this.starting;
  }

  stop() {
    // It is plausible that stop would be called before start completes,
    // such as if the Websocket immediately hangs up
    const handleStop = () => {
      this.recording = false;

      // Properly disconnect and cleanup source
      if (this.source) {
        this.source.disconnect();
        this.source = undefined;
      }

      // Stop and cleanup stream tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false; // Disable track before stopping
        });
        this.stream = undefined;
      }

      // Cleanup worklets
      if (this.recordingWorklet) {
        this.recordingWorklet.disconnect();
        this.recordingWorklet = undefined;
      }

      if (this.vuWorklet) {
        this.vuWorklet.disconnect();
        this.vuWorklet = undefined;
      }

      // Clear audio context reference (but don't close it - it might be shared)
      // this.audioContext = undefined; // Don't clear - might be shared context

      // Clear starting promise to allow fresh start
      this.starting = null;
    };

    if (this.starting) {
      this.starting.then(handleStop).catch(() => {
        // Even if start failed, cleanup
        handleStop();
      });
      return;
    }
    handleStop();
  }
}
