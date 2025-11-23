"use client";
import { AudioRecorder } from '@/lib/audio/audio-recorder';
import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { useLiveAPIContext } from '@/components/audio/LiveAPIContext';
import { HourglassIcon, MicIcon, MicOffIcon, PauseIcon, PlayIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export type ControlTrayProps = {
  children?: ReactNode;
  roomId: string;
};

function ControlTray({ children, roomId }: ControlTrayProps) {
  const { client, connected, connect, disconnect, isConnecting, config, initializeAudio } = useLiveAPIContext();
  const [muted, setMuted] = useState(false);
  const [audioReceived, setAudioReceived] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const isRecordingRef = useRef(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const lastVolumeTimeRef = useRef(0);
  const router = useRouter();

  const handleCancelClick = () => {
    router.push(`/m/${roomId}/chat`);
  }

  // Initialize audio recorder
  useEffect(() => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();

      // Listen for volume changes
      audioRecorderRef.current.on('volume', (volume: number) => {
        setCurrentVolume(volume);
        if (volume > 0.01) { // User is speaking
          lastVolumeTimeRef.current = Date.now();
        }
      });
    }
  }, []);

  // Handle connect button click with audio context resume
  const handleConnectClick = useCallback(async () => {
    if (connected) {
      disconnect();
    } else {
      // Initialize audio context on user interaction before connecting
      try {
        await initializeAudio();
        console.log('Audio context initialized on connect button click');
      } catch (error) {
        console.warn('Could not initialize audio context:', error);
      }

      connect();
    }
  }, [connected, connect, disconnect, initializeAudio]);

  // Listen for setup completion
  useEffect(() => {
    const handleSetupComplete = () => {
      console.log('ControlTray: Setup complete, ready to start audio recording');
      console.log('ControlTray: Previous setupComplete state:', setupComplete);
      setSetupComplete(true);
      console.log('ControlTray: New setupComplete state:', true);
    };

    client.on('setupcomplete', handleSetupComplete);

    // For ephemeral tokens, also set a fallback timeout
    const fallbackTimeout = setTimeout(() => {
      if (connected && client.status === 'connected' && !setupComplete) {
        console.log('ControlTray: Fallback - proceeding without setupComplete for ephemeral token');
        setSetupComplete(true);
      }
    }, 3000); // 3 second fallback

    return () => {
      client.off('setupcomplete', handleSetupComplete);
      clearTimeout(fallbackTimeout);
    };
  }, [client, connected, setupComplete]);

  // Listen for audio data
  useEffect(() => {
    const handleAudio = () => {
      setAudioReceived(true);
      // Reset after 2 seconds if no more audio
      setTimeout(() => setAudioReceived(false), 2000);
    };

    client.on('audio', handleAudio);

    return () => {
      client.off('audio', handleAudio);
    };
  }, [client]);

  // Listen for audio streamer events
  useEffect(() => {
    const handleAudioPlayback = () => {
      console.log('Audio playback started');
    };

    // Add event listener for audio playback if available
    if (client && (client as any).audioStreamer) {
      (client as any).audioStreamer.on('playback', handleAudioPlayback);
    }

    return () => {
      if (client && (client as any).audioStreamer) {
        (client as any).audioStreamer.off('playback', handleAudioPlayback);
      }
    };
  }, [client]);

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // Handle audio recording with proper WebSocket state management
  const handleAudioData = useCallback((base64: string) => {
    // Only send data if we're actually connected and the WebSocket is in OPEN state
    if (connected && client.status === 'connected' && setupComplete && isRecordingRef.current) {
      try {
        client.sendRealtimeInput([
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64,
          },
        ]);
      } catch (error) {
        console.warn('Failed to send audio data:', error);
        // Don't stop recording on send errors, just log them
        // The connection might recover
      }
    }
  }, [connected, client, setupComplete]);

  useEffect(() => {
    const onData = handleAudioData;
    const audioRecorder = audioRecorderRef.current;

    console.log('ControlTray recording effect triggered with dependencies:', {
      connected,
      setupComplete,
      muted,
      hasAudioRecorder: !!audioRecorder,
      isRecording: isRecordingRef.current,
      audioRecorderIsRecording: audioRecorder?.isRecording,
      clientStatus: client.status
    });

    // Ensure audio recorder is properly initialized
    if (!audioRecorder) {
      console.log('Audio recorder not available');
      return;
    }

    // Start recording if connected, setup is complete, and not muted
    if (connected && setupComplete && !muted && !isRecordingRef.current) {
      console.log('Starting audio recording (setup complete)');
      isRecordingRef.current = true;
      audioRecorder.on('data', onData).start().catch((error: Error) => {
        console.error('Failed to start audio recording:', error);
        isRecordingRef.current = false;
      });
    }
    // Stop recording only if we're disconnected, muted, or setup is not complete
    else if ((!connected || muted || !setupComplete) && isRecordingRef.current) {
      console.log('Stopping audio recording due to state change:', {
        connected,
        muted,
        setupComplete,
        currentVolume,
        timeSinceLastVolume: Date.now() - lastVolumeTimeRef.current
      });

      // Don't stop recording if the user is actively speaking (within last 2 seconds)
      const timeSinceLastVolume = Date.now() - lastVolumeTimeRef.current;
      if (timeSinceLastVolume < 2000 && currentVolume > 0.01) {
        console.log('User is actively speaking, delaying recording stop');
        return () => {
          audioRecorder.off('data', onData);
        };
      }

      // Add a small delay to prevent stopping due to temporary state changes
      const stopTimeout = setTimeout(() => {
        if (isRecordingRef.current) {
          console.log('Actually stopping audio recording after delay');
          isRecordingRef.current = false;
          audioRecorder.stop();
        }
      }, 500); // 500ms delay

      return () => {
        clearTimeout(stopTimeout);
        audioRecorder.off('data', onData);
      };
    }

    // Additional check: if connected for more than 3 seconds and still not recording, force start
    if (connected && !setupComplete && !muted && !isRecordingRef.current) {
      const forceStartTimeout = setTimeout(() => {
        if (connected && client.status === 'connected' && !muted && !isRecordingRef.current) {
          console.log('Force starting audio recording after timeout');
          setSetupComplete(true);
          isRecordingRef.current = true;
          audioRecorder.on('data', onData).start().catch((error: Error) => {
            console.error('Failed to force start audio recording:', error);
            isRecordingRef.current = false;
          });
        }
      }, 3000);

      return () => {
        clearTimeout(forceStartTimeout);
        audioRecorder.off('data', onData);
      };
    }

    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, setupComplete, muted, handleAudioData, client.status]);

  // Reset setup completion when connection is lost
  useEffect(() => {
    if (!connected) {
      setSetupComplete(false);
      setAudioReceived(false);
    }
  }, [connected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current && audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        isRecordingRef.current = false;
      }
    };
  }, []);

  return (
    <section className="flex items-center justify-center gap-6 w-fit p-3 bg-background/60 rounded-lg text-card-foreground">
      <nav className={cn('flex flex-col items-center gap-2', { 'opacity-50 pointer-events-none': !connected })}>
        <button
          className={cn('p-3 rounded-full cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors', 'mic-button')}
          onClick={() => setMuted(!muted)}
        >
          {!muted ? (
            <span className={cn('text-xl', {
              'text-red-500': currentVolume > 0.01 && isRecordingRef.current
            })}>
              <MicIcon />
            </span>
          ) : (
            <span className="text-xl"><MicOffIcon /></span>
          )}
        </button>
        {audioReceived && (
          <div className="flex items-center gap-1 text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs">Audio</span>
          </div>
        )}
        {children}
      </nav>

      <div className={cn('flex flex-col items-center gap-3', { 'text-primary': connected })}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center">
            <button
              ref={connectButtonRef}
              className={cn('p-4 rounded-3xl transition-colors cursor-pointer', {
                'bg-primary text-primary-foreground hover:bg-primary/90': connected,
                'bg-secondary text-secondary-foreground hover:bg-secondary/80': !connected
              })}
              onClick={handleConnectClick}
              disabled={isConnecting || (!connected && (!config || Object.keys(config).length === 0))}
            >
              <span className="text-xl">
                {isConnecting ? (<HourglassIcon />) : connected ? (<PauseIcon />) : (<PlayIcon />)}
              </span>
            </button>
          </div>
        </div>
        <span className="text-sm font-medium">
          {isConnecting ? 'Connecting...' : connected ? (setupComplete ? (audioReceived ? 'Playing Audio' : 'Streaming') : 'Setting up...') : (!config || Object.keys(config).length === 0) ? 'Configuring...' : 'Ready'}
        </span>
      </div>

      <Button variant={"ghost"} size={"icon"} className='rounded-full' onClick={handleCancelClick}>
        <XIcon />
      </Button>

    </section>
  );
}

export default memo(ControlTray);
