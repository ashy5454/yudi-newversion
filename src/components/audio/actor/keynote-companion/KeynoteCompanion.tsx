import { useEffect, useRef } from 'react';
import { Modality } from '@google/genai';

import BasicFace from '@/components/audio/actor/basic-face/BasicFace';
import { useLiveAPIContext } from '@/components/audio/LiveAPIContext';
import { Persona } from '@/lib/firebase';

export default function KeynoteCompanion({ persona }: { persona: Persona }) {
  const { client, connected, setConfig } = useLiveAPIContext();
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const hasSentInitialMessage = useRef(false);
  const connectionStableTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setupCompleteRef = useRef(false);

  // Set the configuration for the Live API
  useEffect(() => {
    const config = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        languageCode: persona.model.languageCode,
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: persona.model.voiceName },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: persona.userPrompt,
          },
        ],
      },
    };

    console.log('Setting Live API config in KeynoteCompanion:', config);
    setConfig(config);
  }, [setConfig, persona.model.languageCode, persona.model.voiceName, persona.userPrompt]);

  // Listen for setup completion
  useEffect(() => {
    const handleSetupComplete = () => {
      console.log('Setup complete event received in KeynoteCompanion, ready to send messages');
      setupCompleteRef.current = true;
    };

    console.log('Setting up setupcomplete event listener');
    client.on('setupcomplete', handleSetupComplete);

    return () => {
      console.log('Cleaning up setupcomplete event listener');
      client.off('setupcomplete', handleSetupComplete);
    };
  }, [client]);

  // Initiate the session when the Live API connection is established
  // Instruct the model to send an initial greeting message
  useEffect(() => {
    const beginSession = async () => {
      if (!connected) {
        console.log('Not connected yet, skipping initial message');
        return;
      }

      if (hasSentInitialMessage.current) {
        console.log('Initial message already sent, skipping');
        return;
      }

      // Clear any existing timeout
      if (connectionStableTimeoutRef.current) {
        clearTimeout(connectionStableTimeoutRef.current);
      }

      // Wait for setup completion and ensure connection is stable
      connectionStableTimeoutRef.current = setTimeout(async () => {
        if (!connected || client.status !== 'connected') {
          console.log('Connection not stable, skipping initial message');
          return;
        }

        // For ephemeral tokens, proceed even if setupComplete hasn't been received
        // The connection is ready immediately after establishment
        if (!setupCompleteRef.current) {
          console.log('Setup not complete yet, but proceeding for ephemeral tokens...');
          // Set a short timeout and then proceed anyway
          setTimeout(() => {
            if (connected && client.status === 'connected') {
              console.log('Proceeding with initial message for ephemeral token');
              setupCompleteRef.current = true;
              // Send the initial message
              try {
                console.log('Sending initial greeting message...');
                client.send(
                  {
                    text: 'Hello, I am ready to start our conversation.',
                  },
                  true
                );
                hasSentInitialMessage.current = true;
              } catch (error) {
                console.error('Failed to send initial message:', error);
                hasSentInitialMessage.current = false;
              }
            }
          }, 1000);
          return;
        }

        try {
          console.log('Sending initial greeting message...');
          client.send(
            {
              text: 'Hello, I am ready to start our conversation.',
            },
            true
          );
          hasSentInitialMessage.current = true;
        } catch (error) {
          console.error('Failed to send initial message:', error);
          hasSentInitialMessage.current = false; // Allow retry on next connection
        }
      }, 1000); // Wait 1 second after connection to ensure everything is ready
    };

    beginSession();

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (connectionStableTimeoutRef.current) {
        clearTimeout(connectionStableTimeoutRef.current);
      }
    };
  }, [client, connected]);

  // Reset the initial message flag when connection is lost
  useEffect(() => {
    if (!connected) {
      hasSentInitialMessage.current = false;
      setupCompleteRef.current = false;
      // Clear any pending timeout
      if (connectionStableTimeoutRef.current) {
        clearTimeout(connectionStableTimeoutRef.current);
        connectionStableTimeoutRef.current = null;
      }
    }
  }, [connected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionStableTimeoutRef.current) {
        clearTimeout(connectionStableTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <BasicFace canvasRef={faceCanvasRef!} color={persona.bodyColor} />
    </div>
  );
}
