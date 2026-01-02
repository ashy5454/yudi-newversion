import { AudioStreamer } from '@/lib/audio/audio-streamer';
import { DEFAULT_LIVE_API_MODEL } from '@/lib/audio/constants';
import { GenAILiveClient } from '@/lib/audio/genai-live-client';
import { audioContext } from '@/lib/audio/utils';
import VolMeterWorket from '@/lib/audio/vol-meter';
import { generateSystemInstruction, UserContext } from '@/lib/audio/system-instruction';
import { LiveConnectConfig } from '@google/genai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * 🧼 SAFE Base64 Conversion Helper
 * Converts ArrayBuffer or Blob to clean Base64 string (prevents 1007 errors)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * 🧼 SANITIZE Base64 String
 * Removes data URI headers and ensures pure Base64 (critical for WebSocket UTF-8)
 */
function sanitizeBase64(input: string | Blob | ArrayBuffer): string {
  let base64String = '';

  // Handle different input types
  if (input instanceof Blob) {
    // For Blobs, we'd need async handling - but AudioRecorder already converts to string
    throw new Error('Blob input requires async handling - use sanitizeBase64Async instead');
  } else if (input instanceof ArrayBuffer) {
    base64String = arrayBufferToBase64(input);
  } else if (typeof input === 'string') {
    base64String = input;
  } else {
    throw new Error(`Invalid input type for Base64 sanitization: ${typeof input}`);
  }

  // CRITICAL: Remove data URI headers (e.g., "data:audio/pcm;base64,")
  // Gemini Live API requires PURE Base64 only - headers cause 1007 errors!
  if (base64String.includes(',')) {
    const parts = base64String.split(',');
    // Take everything after the last comma (in case of multiple commas)
    base64String = parts[parts.length - 1];
  }

  // Remove any whitespace/newlines that might have snuck in
  base64String = base64String.trim();

  // Validate Base64 format (should only contain Base64 characters)
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Pattern.test(base64String)) {
    console.error('⚠️ WARNING: Base64 string contains invalid characters after sanitization');
    console.error('   First 100 chars:', base64String.substring(0, 100));
    // Remove invalid characters (but this shouldn't happen if input is valid)
    base64String = base64String.replace(/[^A-Za-z0-9+/=]/g, '');
  }

  return base64String;
}

/**
 * 🧼 ASYNC version for Blob input
 */
async function sanitizeBase64Async(input: Blob | ArrayBuffer | string): Promise<string> {
  if (input instanceof Blob) {
    const arrayBuffer = await input.arrayBuffer();
    return sanitizeBase64(arrayBuffer);
  }
  return sanitizeBase64(input);
}

export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;

  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;
  isConnecting: boolean;

  volume: number;
  initializeAudio: () => Promise<void>;
  sanitizeAudioBase64: (base64: string) => string; // Helper to sanitize Base64 before sending
};

export function useLiveApi({
  apiKey,
  model = DEFAULT_LIVE_API_MODEL,
  userContext,
}: {
  apiKey: string;
  model?: string;
  userContext?: UserContext;
}): UseLiveApiResults {
  const client = useMemo(() => new GenAILiveClient(apiKey, model), [apiKey]);

  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const connectionAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const connectRef = useRef<(() => Promise<void>) | null>(null);
  const audioInitializedRef = useRef(false);

  // 🛡️ SAFETY LOCK: Prevents immediate disconnection
  const isSafetyLockedRef = useRef(false);
  const safetyLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SAFETY_LOCK_DURATION = 3000; // 3 seconds immunity period

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>({});

  const setConfigWithLogging = useCallback((newConfig: LiveConnectConfig) => {
    console.log('Setting config in use-live-api:', newConfig);

    // If userContext is provided, generate and inject system instruction
    if (userContext) {
      const systemInstruction = generateSystemInstruction(userContext);
      console.log('Generated system instruction:', systemInstruction.substring(0, 200) + '...');

      const enhancedConfig: LiveConnectConfig = {
        ...newConfig,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
      };

      setConfig(enhancedConfig);
    } else {
      setConfig(newConfig);
    }
  }, [userContext]);

  // Initialize audio context only after user interaction
  const initializeAudio = useCallback(async () => {
    // Only initialize audio context on the client side
    if (typeof window === 'undefined') {
      return;
    }

    if (audioInitializedRef.current || audioStreamerRef.current) {
      console.log('Audio already initialized');
      return;
    }

    try {
      console.log('Initializing audio context after user interaction...');
      const audioCtx = await audioContext({ id: 'audio-out' });
      console.log('Audio context created successfully');

      // Resume audio context if it's suspended
      if (audioCtx.state === 'suspended') {
        console.log('Audio context suspended, resuming...');
        await audioCtx.resume();
        console.log('Audio context resumed successfully');
      }

      audioStreamerRef.current = new AudioStreamer(audioCtx);
      console.log('Audio streamer created');

      await audioStreamerRef.current
        .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
          setVolume(ev.data.volume);
        });

      console.log('VU meter worklet added successfully');
      audioInitializedRef.current = true;
    } catch (err) {
      console.error('Error initializing audio context:', err);
      throw err;
    }
  }, []);

  // Event handlers defined with useCallback at the top level
  const onOpen = useCallback(() => {
    console.log('WebSocket connection opened');
    setConnected(true);
    setIsConnecting(false);
    connectionAttemptsRef.current = 0; // Reset connection attempts on successful connection
  }, []);

  const onClose = useCallback((event: CloseEvent) => {
    console.log('🔌 WebSocket connection closed', { code: event.code, reason: event.reason, wasClean: event.wasClean });

    // 🛡️ SAFETY LOCK: Block disconnection during immunity period
    if (isSafetyLockedRef.current) {
      console.warn('⚠️ Disconnect BLOCKED by Safety Lock! Reconnecting immediately...');
      console.log(`🛡️ Safety Lock active - Connection will stay open for ${SAFETY_LOCK_DURATION}ms`);

      // Attempt to reconnect immediately (don't let it close)
      if (connectRef.current && config && Object.keys(config).length > 0) {
        setTimeout(() => {
          if (isSafetyLockedRef.current) {
            console.log('🔄 Auto-reconnecting during safety lock period...');
            connectRef.current?.().catch(err => {
              console.error('❌ Auto-reconnect failed:', err);
            });
          }
        }, 100); // Try to reconnect quickly
      }
      return; // Ignore the close event!
    }

    setConnected(false);
    setIsConnecting(false);

    // Log detailed close code information
    if (event.code === 1000) {
      console.log('✅ Normal closure (1000) - Connection closed cleanly');
    } else if (event.code === 1006) {
      console.error('❌ Abnormal closure (1006) - Connection lost without close frame');
    } else if (event.code === 1007) {
      // CRITICAL: 1007 = Invalid Data Payload
      console.error('❌❌❌ ERROR 1007: Invalid Data Payload ❌❌❌');
      console.error('This means the frontend sent malformed data to Gemini Live API.');
      console.error('Possible causes:');
      console.error('  1. Invalid config format (extra properties, wrong types)');
      console.error('  2. Audio data not Base64 encoded correctly');
      console.error('  3. MIME type format incorrect');
      console.error('  4. Invalid JSON structure in setup/config message');
      console.error('Check console logs above for validation errors.');
      console.error('Config that was sent:', JSON.stringify(config, null, 2));
    } else if (event.code === 1011) {
      console.error('❌ Server internal error (1011) - Server terminated connection');
    } else {
      console.warn(`⚠️ Unexpected close code: ${event.code} - Reason: ${event.reason || 'None'}`);
    }

    // 🚨 CRITICAL FIX: Attempt reconnection for 1011 errors (server terminated connection)
    // This can happen if config is invalid or server has issues - we should try to reconnect
    if (event.code === 1011) {
      console.error('❌ Server internal error (1011) - Server terminated connection');
      console.log('🔄 Attempting to reconnect after server error...');

      // Wait a bit before reconnecting to avoid hammering the server
      if (connectionAttemptsRef.current < maxReconnectAttempts) {
        connectionAttemptsRef.current++;
        setTimeout(() => {
          if (!connected && !isConnecting && connectRef.current && config && Object.keys(config).length > 0) {
            console.log(`🔄 Reconnecting after 1011 error (attempt ${connectionAttemptsRef.current}/${maxReconnectAttempts})...`);
            connectRef.current().catch(err => {
              console.error('❌ Reconnection after 1011 failed:', err);
            });
          }
        }, 3000); // Wait 3 seconds before reconnecting
      } else {
        console.error('❌ Max reconnection attempts reached for 1011 error');
      }
      return;
    }

    // Handle unexpected disconnections
    if (event.code !== 1000 && connectionAttemptsRef.current < maxReconnectAttempts) {
      console.log(`Unexpected disconnection, attempting reconnect (${connectionAttemptsRef.current + 1}/${maxReconnectAttempts})`);
      connectionAttemptsRef.current++;

      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!connected && !isConnecting && connectRef.current) {
          connectRef.current().catch(err => {
            console.error('Reconnection failed:', err);
          });
        }
      }, 2000);
    }
  }, [connected, isConnecting, config]);

  const onError = useCallback((error: ErrorEvent) => {
    console.error('❌ WebSocket connection error:', {
      message: error.message,
      type: error.type,
      target: error.target,
      isSafetyLocked: isSafetyLockedRef.current
    });

    // Don't set disconnected if safety lock is active (try to recover)
    if (!isSafetyLockedRef.current) {
      setConnected(false);
      setIsConnecting(false);
    } else {
      console.warn('🛡️ Error occurred but Safety Lock is active - Attempting to maintain connection');
    }
  }, []);

  const stopAudioStreamer = useCallback(() => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
    }
  }, []);

  const onAudio = useCallback((data: ArrayBuffer) => {
    if (!audioStreamerRef.current) {
      console.warn('⚠️ Audio streamer not available');
      return;
    }

    // 🚀 LATENCY OPTIMIZATION: Resume audio context immediately without blocking
    const context = audioStreamerRef.current.context;
    if (context.state === 'suspended') {
      // Don't await - resume in background to avoid blocking audio playback
      context.resume().catch(err => {
        console.error('❌ Failed to resume audio context:', err);
      });
    }

    // 🚀 LATENCY OPTIMIZATION: Add audio immediately - no delays or checks
    try {
      audioStreamerRef.current.addPCM16(new Uint8Array(data));
    } catch (error) {
      console.error('❌ Failed to add audio to streamer:', error);
    }
  }, []);

  const onSetupComplete = useCallback(() => {
    console.log('Setup complete event received in use-live-api hook');
  }, []);

  // WebSocket event handlers with proper state management
  useEffect(() => {
    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('error', onError);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);
    client.on('setupcomplete', onSetupComplete);

    return () => {
      // Clean up event listeners
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('error', onError);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('setupcomplete', onSetupComplete);
    };
  }, [client, onOpen, onClose, onError, stopAudioStreamer, onAudio, onSetupComplete]);

  const connect = useCallback(async () => {
    console.log('🔌 Connect called with config:', config);
    if (!config || Object.keys(config).length === 0) {
      throw new Error('config has not been set');
    }

    if (isConnecting || connected) {
      console.log('Already connecting or connected, skipping connection attempt');
      return;
    }

    // 🛡️ ACTIVATE SAFETY LOCK - Prevent disconnection for 3 seconds
    isSafetyLockedRef.current = true;
    console.log(`🛡️ Safety Lock ACTIVATED - Connection protected for ${SAFETY_LOCK_DURATION}ms`);

    // Clear any existing timeout
    if (safetyLockTimeoutRef.current) {
      clearTimeout(safetyLockTimeoutRef.current);
    }

    // Release safety lock after duration
    safetyLockTimeoutRef.current = setTimeout(() => {
      isSafetyLockedRef.current = false;
      console.log('🛡️ Safety Lock RELEASED - Normal disconnection now allowed');
      safetyLockTimeoutRef.current = null;
    }, SAFETY_LOCK_DURATION);

    setIsConnecting(true);
    client.disconnect();

    // CRITICAL FIX: Clean config - preserve structure, ensure enums are correct
    // Error 1007 = Invalid payload - we must preserve enums and arrays correctly
    // IMPORTANT: Convert Modality enum to string if needed (SDK might expect string)
    const responseModalities = config.responseModalities || [];
    const normalizedModalities = responseModalities.map((mod: any) => {
      // If it's already a string, keep it
      if (typeof mod === 'string') return mod;
      // If it's an enum object with a value property, extract it
      if (mod && typeof mod === 'object' && 'value' in mod) return mod.value;
      // If it has a toString method, use it
      if (mod && typeof mod.toString === 'function') {
        const str = mod.toString();
        // If toString returns something like "Modality.AUDIO", extract "AUDIO"
        if (str.includes('.')) return str.split('.').pop() || str;
        return str;
      }
      // Fallback: convert to string
      return String(mod);
    });

    // 🧼 CRITICAL: Sanitize system instruction text for UTF-8 encoding
    // Error 1007 can be caused by invalid UTF-8 sequences in the system instruction
    // Made more resilient - won't throw errors that break the app
    const sanitizeTextForUTF8 = (text: string): string => {
      if (!text || typeof text !== 'string') {
        return '';
      }
      try {
        // Remove any control characters except newlines, tabs, and carriage returns
        let sanitized = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

        // Try to encode/decode to ensure valid UTF-8 (non-fatal, won't throw)
        try {
          const utf8Bytes = new TextEncoder().encode(sanitized);
          sanitized = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(utf8Bytes);
        } catch (encodeError) {
          // If encoding fails, just use the cleaned string
          console.warn('⚠️ UTF-8 encoding check failed (non-fatal):', encodeError);
        }

        return sanitized;
      } catch (error) {
        console.error('⚠️ UTF-8 sanitization error (using fallback):', error);
        // Safe fallback: just remove control characters
        return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      }
    };

    // Sanitize system instruction parts (safe, won't throw)
    const sanitizeSystemInstruction = (instruction: { parts: Array<{ text: string }> }) => {
      if (!instruction || !instruction.parts || !Array.isArray(instruction.parts)) {
        return { parts: [] };
      }
      return {
        parts: instruction.parts
          .filter(part => part && part.text)
          .map(part => ({
            text: sanitizeTextForUTF8(part.text)
          }))
      };
    };

    // Build enhanced config safely
    let systemInstructionParts: Array<{ text: string }> = [];

    if (config.systemInstruction && typeof config.systemInstruction === 'object' && 'parts' in config.systemInstruction && config.systemInstruction.parts) {
      const sanitized = sanitizeSystemInstruction(config.systemInstruction as { parts: Array<{ text: string }> });
      systemInstructionParts = [...sanitized.parts];
    }

    // Add keep-alive message
    systemInstructionParts.push({
      text: sanitizeTextForUTF8("Keep the connection open. Do NOT stop listening until user is done.")
    });

    const enhancedConfig: LiveConnectConfig = {
      // Use normalized modalities (strings, not enum objects)
      responseModalities: normalizedModalities as any,
      // Preserve speechConfig exactly as-is
      ...(config.speechConfig && { speechConfig: config.speechConfig }),
      // Sanitize system instruction text for UTF-8 (CRITICAL for preventing 1007 errors)
      systemInstruction: {
        parts: systemInstructionParts
      }
    };

    // CRITICAL: Ensure responseModalities is an array and not empty
    if (!Array.isArray(enhancedConfig.responseModalities) || enhancedConfig.responseModalities.length === 0) {
      console.error('❌ ERROR: responseModalities is invalid! This will cause 1007 error.');
      console.error('   Expected: Array with at least one Modality enum/string');
      console.error('   Got:', enhancedConfig.responseModalities);
      throw new Error('Invalid config: responseModalities must be a non-empty array');
    }

    // Log the config structure (this will show if Modality enum is preserved)
    console.log('🔍 Config structure before sending:');
    console.log('   Original responseModalities:', responseModalities);
    console.log('   Normalized responseModalities:', normalizedModalities);
    console.log('   responseModalities[0] type:', typeof enhancedConfig.responseModalities[0]);
    console.log('   responseModalities[0] value:', enhancedConfig.responseModalities[0]);

    // Test JSON serialization to catch any issues before sending
    try {
      const testString = JSON.stringify(enhancedConfig);
      const configSizeKB = (testString.length / 1024).toFixed(2);

      console.log('✅ Config can be serialized to JSON (length:', testString.length, 'chars,', configSizeKB, 'KB)');

      // ⚠️ WARNING: Very large configs can cause 1007 errors
      if (testString.length > 10000) { // 10KB threshold
        console.warn(`⚠️ WARNING: Config is very large (${configSizeKB}KB)! This might cause 1007 errors.`);
        console.warn('   Consider reducing system instruction length or splitting into multiple parts.');
        console.warn('   First 500 chars:', testString.substring(0, 500));
      } else {
        console.log('   First 200 chars:', testString.substring(0, 200));
      }
    } catch (serializeError) {
      console.error('❌ ERROR: Config cannot be serialized!', serializeError);
      throw new Error('Config serialization failed - check for circular references or invalid values');
    }

    // The SDK should handle the rest, but we've ensured it's clean
    const finalConfig = enhancedConfig;

    // Add retry logic for connection
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        console.log(`🔄 Attempting to connect (${4 - retries}/3)...`);
        await client.connect(finalConfig);
        console.log('✅ Successfully connected to GenAI Live');
        console.log('🛡️ Safety Lock is protecting this connection from premature disconnection');
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown connection error');
        console.error(`❌ Connection attempt failed (${4 - retries}/3):`, lastError);
        console.error('Full error details:', JSON.stringify(lastError, Object.getOwnPropertyNames(lastError)));
        retries--;

        if (retries > 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // All retries failed - release safety lock
    isSafetyLockedRef.current = false;
    if (safetyLockTimeoutRef.current) {
      clearTimeout(safetyLockTimeoutRef.current);
      safetyLockTimeoutRef.current = null;
    }

    setIsConnecting(false);
    throw lastError || new Error('Failed to connect after multiple attempts');
  }, [client, config, isConnecting, connected]);

  // Store the connect function in a ref so it can be accessed by the onClose handler
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnect called');

    // 🛡️ SAFETY LOCK: Block manual disconnect during immunity period
    if (isSafetyLockedRef.current) {
      console.warn('⚠️ Manual disconnect BLOCKED by Safety Lock');
      console.log('🛡️ Wait for Safety Lock to release before disconnecting');
      return; // Ignore disconnect command!
    }

    // Release safety lock if manually disconnecting
    if (safetyLockTimeoutRef.current) {
      clearTimeout(safetyLockTimeoutRef.current);
      safetyLockTimeoutRef.current = null;
    }
    isSafetyLockedRef.current = false;

    client.disconnect();
    setConnected(false);
    setIsConnecting(false);
    connectionAttemptsRef.current = 0;
  }, [client]);

  // 🧼 EXPORT Base64 sanitization helper for use in components
  const sanitizeAudioBase64 = useCallback((base64Input: string): string => {
    try {
      return sanitizeBase64(base64Input);
    } catch (error) {
      console.error('❌ Failed to sanitize Base64 audio data:', error);
      // Return original as fallback (but this might cause 1007 errors)
      return base64Input;
    }
  }, []);

  return {
    client,
    setConfig: setConfigWithLogging,
    config,
    connect,
    disconnect,
    connected,
    isConnecting,
    volume,
    initializeAudio,
    sanitizeAudioBase64, // Export helper for components
  };
}
