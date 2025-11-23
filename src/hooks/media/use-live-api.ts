import { AudioStreamer } from '@/lib/audio/audio-streamer';
import { DEFAULT_LIVE_API_MODEL } from '@/lib/audio/constants';
import { GenAILiveClient } from '@/lib/audio/genai-live-client';
import { audioContext } from '@/lib/audio/utils';
import VolMeterWorket from '@/lib/audio/vol-meter';
import { LiveConnectConfig } from '@google/genai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
};

export function useLiveApi({
  apiKey,
  model = DEFAULT_LIVE_API_MODEL,
}: {
  apiKey: string;
  model?: string;
}): UseLiveApiResults {
  const client = useMemo(() => new GenAILiveClient(apiKey, model), [apiKey]);

  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const connectionAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const connectRef = useRef<(() => Promise<void>) | null>(null);
  const audioInitializedRef = useRef(false);

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>({});

  const setConfigWithLogging = useCallback((newConfig: LiveConnectConfig) => {
    console.log('Setting config in use-live-api:', newConfig);
    setConfig(newConfig);
  }, []);

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
    console.log('WebSocket connection closed', event.code, event.reason);
    setConnected(false);
    setIsConnecting(false);

    // Don't attempt reconnection for certain error codes
    if (event.code === 1011) {
      console.log('Server internal error (1011), not attempting reconnection');
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
  }, [connected, isConnecting]);

  const onError = useCallback((error: ErrorEvent) => {
    console.error('WebSocket connection error:', error);
    setConnected(false);
    setIsConnecting(false);
  }, []);

  const stopAudioStreamer = useCallback(() => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
    }
  }, []);

  const onAudio = useCallback((data: ArrayBuffer) => {
    console.log('Received audio data:', data.byteLength, 'bytes');
    if (audioStreamerRef.current) {
      // Ensure audio context is resumed
      if (audioStreamerRef.current.context.state === 'suspended') {
        console.log('Audio context suspended, attempting to resume...');
        audioStreamerRef.current.context.resume().then(() => {
          console.log('Audio context resumed, adding audio data');
          audioStreamerRef.current!.addPCM16(new Uint8Array(data));
        }).catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      } else {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
        console.log('Audio data added to streamer');
      }
    } else {
      console.warn('Audio streamer not available, cannot play audio');
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
    console.log('Connect called with config:', config);
    if (!config || Object.keys(config).length === 0) {
      throw new Error('config has not been set');
    }

    if (isConnecting || connected) {
      console.log('Already connecting or connected, skipping connection attempt');
      return;
    }

    setIsConnecting(true);
    client.disconnect();

    // Add retry logic for connection
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        console.log(`Attempting to connect (${4 - retries}/3)...`);
        await client.connect(config);
        console.log('Successfully connected to GenAI Live');
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown connection error');
        console.error(`Connection attempt failed (${4 - retries}/3):`, lastError);
        console.error('Full error details:', JSON.stringify(lastError, Object.getOwnPropertyNames(lastError)));
        retries--;

        if (retries > 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // All retries failed
    setIsConnecting(false);
    throw lastError || new Error('Failed to connect after multiple attempts');
  }, [client, config, isConnecting, connected]);

  // Store the connect function in a ref so it can be accessed by the onClose handler
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    console.log('Disconnect called');
    client.disconnect();
    setConnected(false);
    setIsConnecting(false);
    connectionAttemptsRef.current = 0;
  }, [client]);

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
  };
}
