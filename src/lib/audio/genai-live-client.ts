import {
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from '@google/genai';
import EventEmitter from 'eventemitter3';
import { DEFAULT_LIVE_API_MODEL } from './constants';
import { difference } from 'lodash';
import { base64ToArrayBuffer } from './utils';

/**
 * Represents a single log entry in the system.
 * Used for tracking and displaying system events, messages, and errors.
 */
export interface StreamingLog {
  // Optional count for repeated log entries
  count?: number;
  // Optional additional data associated with the log
  data?: unknown;
  // Timestamp of when the log was created
  date: Date;
  // The log message content
  message: string | object;
  // The type/category of the log entry
  type: string;
}

/**
 * Event types that can be emitted by the MultimodalLiveClient.
 * Each event corresponds to a specific message from GenAI or client state change.
 */
export interface LiveClientEventTypes {
  // Emitted when audio data is received
  audio: (data: ArrayBuffer) => void;
  // Emitted when the connection closes
  close: (event: CloseEvent) => void;
  // Emitted when content is received from the server
  content: (data: LiveServerContent) => void;
  // Emitted when an error occurs
  error: (e: ErrorEvent) => void;
  // Emitted when the server interrupts the current generation
  interrupted: () => void;
  // Emitted for logging events
  log: (log: StreamingLog) => void;
  // Emitted when the connection opens
  open: () => void;
  // Emitted when the initial setup is complete
  setupcomplete: () => void;
  // Emitted when a tool call is received
  toolcall: (toolCall: LiveServerToolCall) => void;
  // Emitted when a tool call is cancelled
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  // Emitted when the current turn is complete
  turncomplete: () => void;
}

export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  public readonly model: string = DEFAULT_LIVE_API_MODEL;

  protected readonly client: GoogleGenAI;
  protected session?: Session;
  private _status: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private setupCompleteEmitted = false; // Flag to prevent duplicate setup complete events

  public get status() {
    return this._status;
  }

  /**
   * Creates a new GenAILiveClient instance.
   * @param apiKey - API key for authentication with Google GenAI
   * @param model - Optional model name to override the default model
   */
  constructor(apiKey: string, model?: string) {
    super();
    if (model) this.model = model;

    console.log('Initializing GenAILiveClient with token/API key:', apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'MISSING');

    this.client = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  public async connect(config: LiveConnectConfig): Promise<boolean> {
    if (this._status === 'connected' || this._status === 'connecting') {
      return false;
    }

    this._status = 'connecting';
    this.setupCompleteEmitted = false; // Reset flag for new connection
    const callbacks: LiveCallbacks = {
      onopen: this.onOpen.bind(this),
      onmessage: this.onMessage.bind(this),
      onerror: this.onError.bind(this),
      onclose: this.onClose.bind(this),
    };

    try {
      console.log('Attempting to connect to GenAI Live with model:', this.model);

      // Add timeout to the connection attempt
      const connectionPromise = this.client.live.connect({
        model: this.model,
        config: {
          ...config,
        },
        callbacks,
      });

      // Set a 30-second timeout for the connection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
      });

      this.session = await Promise.race([connectionPromise, timeoutPromise]) as Session;

      console.log('Successfully connected to GenAI Live');
      console.log('Session object:', this.session);

      // For ephemeral tokens, don't wait for setup complete
      // The connection is ready immediately after establishment
      console.log('Connection established, ready to proceed');

    } catch (e) {
      console.error('Error connecting to GenAI Live:', e);
      this._status = 'disconnected';
      this.session = undefined;
      this.setupCompleteEmitted = false;

      // Emit a more specific error
      const errorMessage = e instanceof Error ? e.message : 'Unknown connection error';
      this.emit('error', new ErrorEvent('error', { message: `Connection failed: ${errorMessage}` }));
      return false;
    }

    this._status = 'connected';
    return true;
  }

  public disconnect() {
    this.session?.close();
    this.session = undefined;
    this._status = 'disconnected';
    this.setupCompleteEmitted = false; // Reset flag on disconnect

    this.log('client.close', `Disconnected`);
    return true;
  }

  public send(parts: Part | Part[], turnComplete: boolean = true) {
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    this.session.sendClientContent({ turns: parts, turnComplete });
    this.log(`client.send`, parts);
  }

  public sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (this._status !== 'connected' || !this.session) {
      console.warn('Cannot send realtime input: client is not connected');
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }

    try {
      chunks.forEach(chunk => {
        this.session!.sendRealtimeInput({ media: chunk });
      });

      let hasAudio = false;
      let hasVideo = false;
      for (let i = 0; i < chunks.length; i++) {
        const ch = chunks[i];
        if (ch.mimeType.includes('audio')) hasAudio = true;
        if (ch.mimeType.includes('image')) hasVideo = true;
        if (hasAudio && hasVideo) break;
      }

      let message = 'unknown';
      if (hasAudio && hasVideo) message = 'audio + video';
      else if (hasAudio) message = 'audio';
      else if (hasVideo) message = 'video';
      this.log(`client.realtimeInput`, message);
    } catch (error) {
      console.error('Error sending realtime input:', error);
      this._status = 'disconnected';
      this.emit('error', new ErrorEvent('error', { message: `Failed to send realtime input: ${error}` }));
    }
  }

  public sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    if (
      toolResponse.functionResponses &&
      toolResponse.functionResponses.length
    ) {
      this.session.sendToolResponse({
        functionResponses: toolResponse.functionResponses!,
      });
    }

    this.log(`client.toolResponse`, { toolResponse });
  }

  protected onMessage(message: LiveServerMessage) {
    console.log('Received message from server:', message);
    console.log('Message type:', typeof message, 'Keys:', Object.keys(message));
    console.log('Raw message stringified:', JSON.stringify(message, null, 2));

    // According to the documentation, messages have exactly one of these fields:
    // - setupComplete
    // - serverContent
    // - toolCall
    // - toolCallCancellation
    // - goAway
    // - sessionResumptionUpdate

    // Check for setupComplete first (this is the most important for our use case)
    if (message.setupComplete !== undefined && !this.setupCompleteEmitted) {
      console.log('Setup complete received, emitting setupcomplete event');
      this.setupCompleteEmitted = true;
      this.emit('setupcomplete');
      return;
    }

    // Check for serverContent
    if (message.serverContent) {
      const { serverContent } = message;

      // Emit setupcomplete when we receive any server content (but only once)
      // This indicates the connection is ready and working
      if (!this.setupCompleteEmitted) {
        console.log('Emitting setupcomplete on first server content');
        this.setupCompleteEmitted = true;
        this.emit('setupcomplete');
      }

      // Check for generation complete
      if (serverContent.generationComplete) {
        console.log('Generation complete received');
      }

      // Check for turn complete
      if (serverContent.turnComplete) {
        console.log('Turn complete received');
        this.emit('turncomplete');
      }

      // Check for interrupted
      if (serverContent.interrupted) {
        console.log('Generation interrupted');
        this.emit('interrupted');
      }

      // Handle model turn content (audio, text, etc.)
      if (serverContent.modelTurn) {
        let parts: Part[] = serverContent.modelTurn.parts || [];

        // Extract audio parts
        const audioParts = parts.filter(p =>
          p.inlineData?.mimeType?.startsWith('audio/pcm')
        );
        const base64s = audioParts.map(p => p.inlineData?.data);
        const otherParts = difference(parts, audioParts);

        // Emit audio data
        base64s.forEach(b64 => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit('audio', data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
          }
        });

        // Emit other content (text, etc.)
        if (otherParts.length > 0) {
          const content: LiveServerContent = { modelTurn: { parts: otherParts } };
          this.emit('content', content);
          this.log(`server.content`, otherParts);
        }
      }

      // Handle input transcription
      if (serverContent.inputTranscription) {
        console.log('Input transcription:', serverContent.inputTranscription.text);
      }

      // Handle output transcription
      if (serverContent.outputTranscription) {
        console.log('Output transcription:', serverContent.outputTranscription.text);
      }

      return;
    }

    // Check for tool call
    if (message.toolCall) {
      console.log('Tool call received:', message.toolCall);
      this.emit('toolcall', message.toolCall);
      return;
    }

    // Check for tool call cancellation
    if (message.toolCallCancellation) {
      console.log('Tool call cancellation received:', message.toolCallCancellation);
      this.emit('toolcallcancellation', message.toolCallCancellation);
      return;
    }

    // Check for go away message
    if (message.goAway) {
      console.log('Go away message received:', message.goAway);
      // Handle graceful shutdown
      this.disconnect();
      return;
    }

    // Check for session resumption update
    if (message.sessionResumptionUpdate) {
      console.log('Session resumption update:', message.sessionResumptionUpdate);
      return;
    }

    // If we get here, it's an unknown message type
    console.log('Received unknown message type:', message);
  }

  protected onError(e: ErrorEvent) {
    this._status = 'disconnected';
    console.error('WebSocket error:', e);

    // Handle specific WebSocket errors
    let errorMessage = `Could not connect to GenAI Live: ${e.message}`;

    if (e.message.includes('timeout')) {
      errorMessage = 'Connection timeout. Please check your internet connection and try again.';
    } else if (e.message.includes('CLOSING') || e.message.includes('CLOSED')) {
      errorMessage = 'WebSocket connection was closed unexpectedly. Please try reconnecting.';
    } else if (e.message.includes('Failed to fetch')) {
      errorMessage = 'Network error. Please check your internet connection.';
    }

    this.log(`server.${e.type}`, errorMessage);
    this.emit('error', e);
  }

  protected onOpen() {
    console.log('WebSocket onOpen called');
    this._status = 'connected';
    this.emit('open');

    // Fallback: emit setupcomplete after a short delay if no messages are received
    // This ensures the connection is considered ready even if no setup complete event is sent
    setTimeout(() => {
      if (this._status === 'connected' && !this.setupCompleteEmitted) {
        console.log('Fallback: emitting setupcomplete after connection established');
        this.setupCompleteEmitted = true;
        this.emit('setupcomplete');
      }
    }, 2000); // Wait 2 seconds for any messages, then proceed
  }

  protected onClose(e: CloseEvent) {
    console.log('WebSocket onClose called with code:', e.code, 'reason:', e.reason);
    this._status = 'disconnected';
    let reason = e.reason || '';

    // Handle specific close codes
    if (e.code === 1000) {
      reason = 'Normal closure';
    } else if (e.code === 1001) {
      reason = 'Going away';
    } else if (e.code === 1002) {
      reason = 'Protocol error';
    } else if (e.code === 1003) {
      reason = 'Unsupported data';
    } else if (e.code === 1005) {
      reason = 'No status received';
    } else if (e.code === 1006) {
      reason = 'Abnormal closure';
    } else if (e.code === 1007) {
      reason = 'Invalid frame payload data';
    } else if (e.code === 1008) {
      reason = 'Policy violation';
    } else if (e.code === 1009) {
      reason = 'Message too big';
    } else if (e.code === 1010) {
      reason = 'Client terminating';
    } else if (e.code === 1011) {
      reason = 'Server error';
    } else if (e.code === 1012) {
      reason = 'Service restart';
    } else if (e.code === 1013) {
      reason = 'Try again later';
    } else if (e.code === 1014) {
      reason = 'Bad gateway';
    } else if (e.code === 1015) {
      reason = 'TLS handshake';
    }

    if (reason.toLowerCase().includes('error')) {
      const prelude = 'ERROR]';
      const preludeIndex = reason.indexOf(prelude);
      if (preludeIndex > 0) {
        reason = reason.slice(preludeIndex + prelude.length + 1, Infinity);
      }
    }

    this.log(
      `server.${e.type}`,
      `disconnected ${reason ? `with reason: ${reason}` : ``}`
    );
    this.emit('close', e);
  }

  /**
   * Internal method to emit a log event.
   * @param type - Log type
   * @param message - Log message
   */
  protected log(type: string, message: string | object) {
    this.emit('log', {
      type,
      message,
      date: new Date(),
    });
  }
}
