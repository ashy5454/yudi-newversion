"use client";
import { useLiveApi, UseLiveApiResults } from '@/hooks/media/use-live-api';
import { UserContext } from '@/lib/audio/system-instruction';
import { createContext, FC, ReactNode, useContext, useState, useEffect } from 'react';

const LiveAPIContext = createContext<UseLiveApiResults | undefined>(undefined);

export type LiveAPIProviderProps = {
  children: ReactNode;
  apiKey: string;
  userContext?: UserContext;
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
  apiKey: propApiKey,
  userContext,
  children,
}) => {
  const apiKey = (propApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "").trim();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Always call hooks at the top level - now passing userContext
  const liveAPI = useLiveApi({ apiKey: apiKey || "dummy", userContext }); // Use dummy key if missing to avoid hook errors

  useEffect(() => {
    setIsClient(true);
    console.log(`LiveAPIContext initialized. API Key present: ${!!apiKey}, Length: ${apiKey?.length}`);
  }, [apiKey]);

  // Handle connection state changes
  useEffect(() => {
    if (!apiKey) return; // Don't try to connect if no API key

    if (liveAPI.isConnecting) {
      setConnectionStatus('connecting');
    } else if (liveAPI.connected) {
      setConnectionStatus('connected');
      setError(null); // Clear any previous errors
    } else {
      setConnectionStatus('disconnected');
    }
  }, [liveAPI.isConnecting, liveAPI.connected, apiKey]);

  // Handle connection errors
  useEffect(() => {
    if (!apiKey) return; // Don't set up error handlers if no API key

    const handleError = (error: ErrorEvent) => {
      console.error('LiveAPI connection error:', error);

      // Check if it's a token-related error
      if (error.message.includes('Token has been used too many times') ||
        error.message.includes('1011') ||
        error.message.includes('Internal error')) {
        setError('Token expired or invalid. Please try starting a new call.');
        setConnectionStatus('error');
      } else {
        setError(error.message);
        setConnectionStatus('error');
      }
    };

    const handleClose = (event: CloseEvent) => {
      if (event.code === 1011) {
        if (event.reason.includes('Token has been used too many times')) {
          setError('Token expired or invalid. Please try starting a new call.');
        } else {
          setError('Server internal error. Please try again later or contact support.');
        }
        setConnectionStatus('error');
      } else if (event.code !== 1000) {
        setError(`Connection closed unexpectedly (code: ${event.code})`);
        setConnectionStatus('error');
      }
    };

    liveAPI.client.on('error', handleError);
    liveAPI.client.on('close', handleClose);

    return () => {
      liveAPI.client.off('error', handleError);
      liveAPI.client.off('close', handleClose);
    };
  }, [liveAPI.client, apiKey]);

  // Now check for API key after all hooks are called
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-lg text-red-600 mb-4">Configuration Error</div>
          <div className="text-sm text-gray-600 mb-4">
            API Key is missing. Please add <code>NEXT_PUBLIC_GEMINI_API_KEY</code> to your <code>.env</code> file and restart the server.
          </div>
        </div>
      </div>
    );
  }

  // Don't render during SSR
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Initializing...</div>
      </div>
    );
  }

  // Show error if connection failed
  if (error && connectionStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="text-lg text-destructive mb-4 font-semibold">Connection Error</div>
          <div className="text-sm text-muted-foreground mb-4 break-words font-mono bg-background/50 p-2 rounded">
            {error}
          </div>
          <button
            onClick={() => {
              setError(null);
              setConnectionStatus('connecting');
              liveAPI.connect().catch(err => {
                setError(err.message);
                setConnectionStatus('error');
              });
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveAPIContext.Provider value={liveAPI}>
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = () => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error('useLiveAPIContext must be used wihin a LiveAPIProvider');
  }
  return context;
};
