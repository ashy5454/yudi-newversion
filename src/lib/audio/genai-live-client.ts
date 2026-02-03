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
  // Emitted when user's voice input is transcribed
  inputTranscript: (text: string) => void;
  // Emitted when AI's voice output is transcribed
  outputTranscript: (text: string) => void;
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
      console.log('Connecting to Live API with model: gemini-2.5-flash-native-audio-preview-12-2025 (v1beta)');

      // 🧼 CRITICAL: Log config to verify it's clean (helps debug 1007 errors)
      console.log('📤 Connecting to Gemini Live API');
      console.log('📤 Model:', this.model);
      console.log('📤 Config type check:', {
        hasResponseModalities: !!config.responseModalities,
        responseModalitiesIsArray: Array.isArray(config.responseModalities),
        responseModalitiesLength: config.responseModalities?.length || 0,
        hasSpeechConfig: !!config.speechConfig,
        hasSystemInstruction: !!config.systemInstruction
      });

      // CRITICAL: Validate config structure before sending (prevent 1007)
      if (!config.responseModalities || !Array.isArray(config.responseModalities)) {
        console.error('❌ ERROR: responseModalities must be a non-empty array!');
        console.error('   Received:', config.responseModalities);
        throw new Error('Invalid config: responseModalities must be a non-empty array');
      }

      if (config.responseModalities.length === 0) {
        console.error('❌ ERROR: responseModalities array is empty!');
        throw new Error('Invalid config: responseModalities array cannot be empty');
      }

      // CRITICAL: For gemini-2.5-flash-native-audio-preview-12-2025, languageCode may not be supported
      // Remove languageCode if present to avoid "Unsupported language code" errors
      if (config.speechConfig?.languageCode) {
        console.warn(`⚠️ WARNING: languageCode "${config.speechConfig.languageCode}" may not be supported by this model`);
        console.warn('   Removing languageCode - model will auto-detect language or use default');
        // Remove languageCode to avoid errors
        delete config.speechConfig.languageCode;
      }

      // Validate system instruction length (very long instructions might cause issues)
      if (config.systemInstruction && typeof config.systemInstruction === 'object' && 'parts' in config.systemInstruction && config.systemInstruction.parts) {
        const parts = Array.isArray(config.systemInstruction.parts) ? config.systemInstruction.parts : [];
        const totalLength = parts
          .map((p: any) => (typeof p === 'object' && p && 'text' in p ? (p.text || '') : '').length)
          .reduce((a: number, b: number) => a + b, 0);

        if (totalLength > 50000) { // 50KB limit (conservative)
          console.warn(`⚠️ WARNING: System instruction is very long (${totalLength} chars). This might cause 1007 errors.`);
          console.warn('   Consider truncating or simplifying the system instruction.');
        }
      }

      // Create a working copy of config to avoid mutating the original
      let workingConfig: LiveConnectConfig = {
        ...config,
        speechConfig: config.speechConfig ? { ...config.speechConfig } : undefined,
      };

      // Remove languageCode from working copy if present
      if (workingConfig.speechConfig && 'languageCode' in workingConfig.speechConfig) {
        const { languageCode, ...speechConfigWithoutLang } = workingConfig.speechConfig;
        workingConfig.speechConfig = speechConfigWithoutLang;
      }

      // 🧼 CRITICAL: Sanitize config for UTF-8 encoding before sending
      // Error 1007 = Invalid UTF-8 data - we must ensure all strings are valid UTF-8
      const sanitizeConfigForUTF8 = (obj: any): any => {
        if (typeof obj === 'string') {
          // Remove invalid UTF-8 sequences
          try {
            // Test if string can be encoded as UTF-8
            new TextEncoder().encode(obj);
            // Remove control characters (except newline, tab, carriage return)
            return obj.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
          } catch (error) {
            console.error('⚠️ Invalid UTF-8 in string, sanitizing:', obj.substring(0, 100));
            // Remove problematic characters
            return obj.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
              .replace(/[^\u0000-\uFFFF]/g, '\uFFFD'); // Replace non-BMP chars
          }
        }
        if (Array.isArray(obj)) {
          return obj.map(item => sanitizeConfigForUTF8(item));
        }
        if (obj && typeof obj === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeConfigForUTF8(value);
          }
          return sanitized;
        }
        return obj;
      };

      // Sanitize the entire config (use workingConfig)
      const sanitizedConfig = sanitizeConfigForUTF8(workingConfig);

      // Try to stringify to check for circular references or invalid values
      try {
        const configString = JSON.stringify(sanitizedConfig, (key, value) => {
          // If value is undefined, skip it
          if (value === undefined) return undefined;
          // If it's an object, check for circular refs
          if (typeof value === 'object' && value !== null) {
            if (key === 'responseModalities' && Array.isArray(value)) {
              // Convert enum values to strings if needed
              return value.map(v => typeof v === 'string' ? v : (v?.toString() || String(v)));
            }
          }
          return value;
        }, 2);
        console.log('📤 Config JSON (UTF-8 sanitized):', configString);
        console.log('📤 Config size:', configString.length, 'bytes');

        // Verify it can be encoded as UTF-8
        try {
          const utf8Bytes = new TextEncoder().encode(configString);
          console.log('✅ Config can be encoded as UTF-8 (', utf8Bytes.length, 'bytes)');
        } catch (utf8Error) {
          console.error('❌ ERROR: Config cannot be encoded as UTF-8:', utf8Error);
          throw new Error('Config contains invalid UTF-8 sequences');
        }
      } catch (stringifyError) {
        console.error('❌ ERROR: Config cannot be stringified (circular reference or invalid value):', stringifyError);
        throw new Error('Invalid config: contains circular references or non-serializable values');
      }

      // Add timeout to the connection attempt
      // The SDK will handle the actual WebSocket setup internally
      // CRITICAL: Use sanitized config to prevent UTF-8 errors
      const connectionPromise = this.client.live.connect({
        model: this.model,
        config: sanitizedConfig, // Pass UTF-8 sanitized config (prevents 1007 error)
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

      // Enhanced error message for model not found errors
      const errorMessage = e instanceof Error ? e.message : 'Unknown connection error';
      if (errorMessage.includes('not found') || errorMessage.includes('not supported')) {
        console.error('🚨 MODEL ERROR: The model', this.model, 'is not available for Live API');
        console.error('💡 TIP: Try using a model that supports bidiGenerateContent endpoint');
        console.error('💡 TIP: Check Google AI Studio or Vertex AI documentation for supported Live API models');
        console.error('💡 TIP: You may need to use a different model name or check your API key permissions');
      }
      
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
      console.error('❌ Cannot send: Connection not ready', {
        status: this._status,
        hasSession: !!this.session
      });
      this.emit('error', new ErrorEvent('error', { message: 'Client is not connected' }));
      return;
    }

    // 🚨 CRITICAL: Check if session is actually usable (not closing/closed)
    try {
      // Test if we can actually send (session might be in closing state)
      if (!this.session || (this.session as any).closed || (this.session as any).closing) {
        console.error('❌ Cannot send: Session is closing or closed');
        this.emit('error', new ErrorEvent('error', { message: 'Session is closing or closed' }));
        return;
      }
    } catch (testError) {
      console.error('❌ Cannot send: Session test failed', testError);
      return;
    }

    try {
      chunks.forEach((chunk, index) => {
        // Validate mimeType and data
        if (!chunk.mimeType || !chunk.data) {
          console.error(`❌ ERROR: Invalid chunk at index ${index}:`, chunk);
          return;
        }

        // 🧼 CRITICAL: Sanitize Base64 before sending (prevents 1007 errors)
        let cleanBase64 = chunk.data;
        const originalLength = cleanBase64.length;

        // Remove data URI header if present (e.g., "data:audio/pcm;base64,")
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',').pop() || cleanBase64;
        }
        cleanBase64 = cleanBase64.trim();

        // Validate Base64 format (must be pure Base64, no invalid characters)
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Pattern.test(cleanBase64)) {
          console.error(`❌ ERROR: Data at index ${index} is NOT valid Base64 after sanitization!`);
          console.error(`   Original length: ${originalLength}, Clean length: ${cleanBase64.length}`);
          console.error(`   First 50 chars: ${cleanBase64.substring(0, 50)}`);
          throw new Error(`Invalid Base64 format at index ${index} - contains invalid characters`);
        }

        if (cleanBase64.length === 0) {
          console.warn(`⚠️ Skipping empty chunk at index ${index}`);
          return;
        }

        // Log first chunk for debugging (only once)
        if (index === 0 && chunks.length > 0) {
          console.log('📤 Sending audio chunk:', {
            mimeType: chunk.mimeType,
            dataLength: cleanBase64.length,
            preview: cleanBase64.substring(0, 20) + '...'
          });
        }

        // Send sanitized chunk
        try {
          // 🚨 CRITICAL: Check session state before sending to prevent "CLOSING/CLOSED" errors
          if (!this.session || (this.session as any).closed || (this.session as any).closing) {
            // Session is closing/closed, don't attempt to send
            return;
          }

          const sanitizedChunk = { mimeType: chunk.mimeType, data: cleanBase64 };
          this.session.sendRealtimeInput({ media: sanitizedChunk });
        } catch (sendError: any) {
          // Handle "WebSocket is already in CLOSING or CLOSED state" errors gracefully
          if (sendError?.message?.includes('CLOSING') ||
            sendError?.message?.includes('CLOSED') ||
            sendError?.message?.includes('already in')) {
            // Connection is closing/closed, stop sending - don't spam errors
            console.log('ℹ️ Connection closing/closed, stopping audio send (this is normal during disconnection)');
            return; // Don't throw - just stop sending
          }
          // Log other errors but don't crash
          console.error('❌ Error sending audio chunk:', sendError);
        }
      });
    } catch (error) {
      console.error('❌ Error sending realtime input:', error);
      this.emit('error', new ErrorEvent('error', {
        message: `Failed to send realtime input: ${error instanceof Error ? error.message : String(error)}`
      }));
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
        console.log('✅ Turn complete received - Connection stays open for next turn');
        this.emit('turncomplete');
        // CRITICAL: Don't close connection! It should stay open for the next user input
        // The connection should remain active for continuous conversation
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

      // Handle input transcription (what the user said)
      // CRITICAL: Input transcription is for debugging only - DO NOT use it in responses
      // This is what the user said - we should NOT repeat it back to them
      if (serverContent.inputTranscription?.text) {
        const userTranscript = serverContent.inputTranscription.text.trim();
        console.log('📥 Input transcription (user said):', userTranscript);
        // Emit event so components can save to database for training
        this.emit('inputTranscript', userTranscript);
      }

      // Handle output transcription (what the AI said)
      if (serverContent.outputTranscription?.text) {
        const aiTranscript = serverContent.outputTranscription.text.trim();
        console.log('📤 Output transcription (AI said):', aiTranscript);
        // Emit event so components can save to database for training
        this.emit('outputTranscript', aiTranscript);
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
    console.log('🔌 WebSocket onClose called', {
      code: e.code,
      reason: e.reason || 'None',
      wasClean: e.wasClean,
      timestamp: new Date().toISOString()
    });

    // Enhanced close code logging
    const closeCodeDescriptions: Record<number, string> = {
      1000: '✅ Normal closure (1000) - Connection closed cleanly',
      1001: '⚠️ Going away (1001) - Endpoint is going away',
      1002: '❌ Protocol error (1002) - Protocol violation',
      1003: '❌ Unsupported data (1003) - Invalid data type',
      1005: '❌ No status received (1005) - No close frame received',
      1006: '❌ Abnormal closure (1006) - Connection lost without close frame',
      1007: '❌ Invalid frame payload (1007) - Invalid UTF-8 data',
      1008: '❌ Policy violation (1008) - Policy violation',
      1009: '❌ Message too big (1009) - Message too large',
      1010: '❌ Extension error (1010) - Extension negotiation failed',
      1011: '❌ Server error (1011) - Server internal error',
      1012: '❌ Service restart (1012) - Service restarting',
      1013: '❌ Try again later (1013) - Temporary server condition',
      1014: '❌ Bad gateway (1014) - Bad gateway response',
      1015: '❌ TLS handshake failure (1015) - TLS handshake failed'
    };

    const description = closeCodeDescriptions[e.code] || `⚠️ Unknown close code: ${e.code}`;
    console.log(description);

    // 🚨 Specific error handling for 1008 (Policy violation)
    if (e.code === 1008) {
      console.error('❌ ERROR 1008: Policy violation - API key has referrer restrictions!');
      console.error('🔧 FIX: Go to Google Cloud Console → APIs & Services → Credentials');
      console.error('   → Edit your NEXT_PUBLIC_GEMINI_API_KEY');
      console.error('   → Under "Application restrictions", select "None" OR add:');
      console.error('      - localhost:3000/*');
      console.error('      - localhost:*/*');
      console.error('      - Your production domain (e.g., yourdomain.com/*)');
      console.error('   → Save and try again');
    }

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
      // Check if it's a voice-related error
      if (reason.toLowerCase().includes('voice') || reason.toLowerCase().includes('not available')) {
        reason = `Invalid voice name: ${reason}`;
        console.error(`🚨 VOICE ERROR: The selected voice is not available for gemini-2.5-flash-native-audio-preview-12-2025. Error: ${reason}`);
      } else {
        reason = 'Invalid frame payload data';
      }
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
