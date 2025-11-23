import React, { useEffect, useState } from 'react';
import { useLiveAPIContext } from '@/components/audio/LiveAPIContext';

export interface ExtendedErrorType {
  code?: number;
  message?: string;
  status?: string;
}

export default function ErrorScreen() {
  const { client } = useLiveAPIContext();
  const [error, setError] = useState<{ message?: string } | null>(null);

  useEffect(() => {
    function onError(error: ErrorEvent) {
      console.error(error);
      setError(error);
    }

    client.on('error', onError);

    return () => {
      client.off('error', onError);
    };
  }, [client]);

  const quotaErrorMessage =
    'It seems we have hit a quota limit. Please try again later or contact support if the issue persists.';

  let errorMessage = 'Something went wrong. Please try again.';
  let rawMessage: string | null = error?.message || null;
  let tryAgainOption = true;
  if (error?.message?.includes('RESOURCE_EXHAUSTED')) {
    errorMessage = quotaErrorMessage;
    rawMessage = null;
    tryAgainOption = false;
  }

  if (!error) {
    return <div className="hidden" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-card text-card-foreground text-center space-y-6">
      <div className="text-5xl">
        💔
      </div>
      <div className="max-w-md text-xl leading-relaxed text-muted-foreground">
        {errorMessage}
      </div>
      {tryAgainOption ? (
        <button
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          onClick={() => {
            setError(null);
          }}
        >
          Close
        </button>
      ) : null}
      {rawMessage ? (
        <div className="max-w-md text-sm leading-relaxed text-muted-foreground/60">
          {rawMessage}
        </div>
      ) : null}
    </div>
  );
}
