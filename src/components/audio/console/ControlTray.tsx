"use client";
import { AudioRecorder } from '@/lib/audio/audio-recorder';
import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { useLiveAPIContext } from '@/components/audio/LiveAPIContext';
import { HourglassIcon, MicIcon, MicOffIcon, PauseIcon, PlayIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';

export type ControlTrayProps = {
  children?: ReactNode;
  roomId: string;
};

function ControlTray({ children, roomId }: ControlTrayProps) {
  const { client, connected, connect, disconnect, isConnecting, config, initializeAudio } = useLiveAPIContext();
  const { user } = useAuth();
  const { } = useAccessControl();
  const [muted, setMuted] = useState(false);
  const [audioReceived, setAudioReceived] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const isRecordingRef = useRef(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const lastVolumeTimeRef = useRef(0);
  const recordingStartTimeRef = useRef<number>(0); // Track when recording started
  const speechDetectedRef = useRef(false); // Track if user has spoken
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null); // Interval for checking silence
  const isRecordingLockedRef = useRef(false); // 🛡️ SAFETY LOCK: Prevents stopping during immunity period
  const safetyLockTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout to release safety lock
  const router = useRouter();

  // Constants for recording behavior
  const SAFETY_LOCK_DURATION = 4000; // 4 seconds immunity period - mic CANNOT be stopped
  const VOLUME_THRESHOLD = 0.01; // Minimum volume to consider as speech
  const lastAIResponseTimeRef = useRef<number>(0); // Track when AI last responded
  const recordingMonitorIntervalRef = useRef<NodeJS.Timeout | null>(null); // Monitor recording health
  // 🚨 REMOVED: SILENCE_THRESHOLD - Recording NEVER stops automatically on silence

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
        if (volume > VOLUME_THRESHOLD) { // User is speaking
          lastVolumeTimeRef.current = Date.now();
          speechDetectedRef.current = true; // Mark that speech has been detected

          // 🚨 INTERRUPTION HANDLING: Stop AI audio when user starts speaking
          if (client && (client as any).audioStreamer) {
            console.log('🛑 User speaking detected - Interrupting AI audio playback');
            (client as any).audioStreamer.stop();
          }
        }
      });
    }
  }, [client]);

  // Request microphone permission BEFORE connecting
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ getUserMedia not supported in this browser');
        alert('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return false;
      }

      console.log('🎤 Requesting microphone permission...');
      // Request permission (this will show browser prompt on first call)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the test stream (we just wanted permission)
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Microphone permission granted');
      return true;
    } catch (error: any) {
      console.error('❌ Microphone permission denied:', error);

      // User-friendly error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone permission was denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert(`Failed to access microphone: ${error.message || 'Unknown error'}. Please check your browser settings.`);
      }

      return false;
    }
  }, []);

  // Handle connect button click with permission request FIRST
  const handleConnectClick = useCallback(async (e?: React.MouseEvent) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (connected) {
      disconnect();
      return;
    }


    // CRITICAL: Request microphone permission FIRST, before connecting
    console.log('🔄 Connect button clicked - Requesting microphone permission first...');
    const permissionGranted = await requestMicrophonePermission();

    if (!permissionGranted) {
      console.error('❌ Cannot connect: Microphone permission denied');
      return; // Don't connect if permission denied
    }

    // Initialize audio context on user interaction before connecting
    try {
      await initializeAudio();
      console.log('✅ Audio context initialized on connect button click');
    } catch (error) {
      console.warn('⚠️ Could not initialize audio context:', error);
      // Continue anyway, audio context might be initialized elsewhere
    }

    // Now connect (permission is granted)
    console.log('✅ Permission granted - Connecting...');
    connect();
  }, [connected, connect, disconnect, initializeAudio, requestMicrophonePermission]);

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
      // Mark that AI just responded - don't stop recording immediately after AI speaks
      lastAIResponseTimeRef.current = Date.now();
      // Reset after 2 seconds if no more audio
      setTimeout(() => setAudioReceived(false), 2000);
    };

    client.on('audio', handleAudio);

    return () => {
      client.off('audio', handleAudio);
    };
  }, [client]);

  // Listen for turn completion - CRITICAL: Ensure recording ALWAYS continues (NEVER disconnect)
  useEffect(() => {
    const handleTurnComplete = () => {
      console.log('✅ Turn complete - AI finished speaking, microphone stays OPEN (like a phone call)');
      // Update AI response time
      lastAIResponseTimeRef.current = Date.now();

      // CRITICAL: ALWAYS ensure recording is active after AI finishes speaking
      // 🚨 NEVER disconnect - just ensure recording continues
      if (connected && setupComplete && !muted) {
        if (!isRecordingRef.current && audioRecorderRef.current) {
          console.log('🔄 CRITICAL: Recording stopped! Restarting immediately after AI turn complete...');
          // Force restart recording
          isRecordingRef.current = true;
          recordingStartTimeRef.current = Date.now();
          lastVolumeTimeRef.current = Date.now();
          speechDetectedRef.current = false;

          audioRecorderRef.current.start().catch((error: Error) => {
            console.error('❌ Failed to restart recording after turn complete:', error);
            isRecordingRef.current = false;
          });
        } else {
          console.log('✅ Recording active - microphone open and listening');
        }
      }

      // 🚨 CRITICAL: DO NOT disconnect or close connection
      // Connection stays open forever until user manually clicks disconnect
    };

    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client, connected, setupComplete, muted]);

  // 🚨 CRITICAL: Listen for connection close (especially 1011 errors) and prepare for reconnection
  useEffect(() => {
    const handleClose = (event: CloseEvent) => {
      console.log('🔌 Connection closed in ControlTray:', event.code, event.reason);

      // For 1011 errors (server terminated), reset recording state for reconnection
      if (event.code === 1011) {
        console.log('⚠️ Server error (1011) - Recording will restart after reconnection succeeds');
        // Reset recording state - it will restart automatically when connection is restored
        isRecordingRef.current = false;
        setSetupComplete(false);
      }
    };

    client.on('close', handleClose);

    return () => {
      client.off('close', handleClose);
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
  // Use ref for handleAudioData to avoid recreating the callback and causing effect re-runs
  const handleAudioDataRef = useRef<(base64: string) => void | undefined>(undefined);

  const audioChunkCountRef = useRef(0);
  const lastAudioChunkTimeRef = useRef(0);

  useEffect(() => {
    handleAudioDataRef.current = (base64: string) => {
      // 🚨 CRITICAL: Check connection state BEFORE attempting to send
      // This prevents "WebSocket is already in CLOSING or CLOSED state" errors
      if (!connected || client.status !== 'connected' || !setupComplete || !isRecordingRef.current) {
        return; // Don't try to send if connection is not ready
      }

      // Double-check session is actually usable (not closing/closed)
      try {
        if ((client as any).session?.closed || (client as any).session?.closing) {
          return; // Session is closing/closed, don't send
        }
      } catch (checkError) {
        // Session check failed, don't send
        return;
      }

      // Only send data if we're actually connected and the WebSocket is in OPEN state
      if (connected && client.status === 'connected' && setupComplete && isRecordingRef.current) {
        try {
          // 🧼 CRITICAL: Sanitize Base64 before sending (prevents 1007 errors)
          let cleanBase64 = base64.trim();
          if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',').pop() || cleanBase64;
          }
          if (!cleanBase64 || cleanBase64.length === 0) {
            return; // Skip empty chunks
          }

          // Track chunk sending for debugging
          audioChunkCountRef.current++;
          const now = Date.now();
          const timeSinceLastChunk = now - lastAudioChunkTimeRef.current;
          lastAudioChunkTimeRef.current = now;

          // Log first few chunks and periodically to track flow
          if (audioChunkCountRef.current <= 5 || audioChunkCountRef.current % 50 === 0) {
            console.log(`📤 Sending audio chunk #${audioChunkCountRef.current} (${cleanBase64.length} bytes, ${timeSinceLastChunk}ms since last)`);
          }

          // Warn if chunks are being sent too slowly (might indicate issue)
          if (timeSinceLastChunk > 2000) {
            console.warn(`⚠️ Slow audio chunk rate: ${timeSinceLastChunk}ms since last chunk`);
          }

          client.sendRealtimeInput([
            {
              mimeType: 'audio/pcm;rate=16000',
              data: cleanBase64,
            },
          ]);
        } catch (error) {
          console.error('❌ Failed to send audio data:', error);
          // Don't give up - connection might recover
        }
      } else {
        // Log why we're not sending (for debugging) - but try to recover
        if (!connected || client.status !== 'connected') {
          console.error('❌ NOT SENDING AUDIO: Connection not ready', { connected, status: client.status });
        } else if (!setupComplete) {
          console.warn('⚠️ NOT SENDING AUDIO: Setup not complete - this should happen automatically');
        } else if (!isRecordingRef.current) {
          console.error('❌ NOT SENDING AUDIO: Recording stopped! This should NOT happen while connected.');
          // CRITICAL: Try to restart recording if it stopped unexpectedly
          if (connected && setupComplete && !muted && audioRecorderRef.current) {
            console.log('🔄 Attempting to restart recording...');
            isRecordingRef.current = true;
            recordingStartTimeRef.current = Date.now();
            audioRecorderRef.current.start().catch((error: Error) => {
              console.error('❌ Failed to auto-restart recording:', error);
              isRecordingRef.current = false;
            });
          }
        }
      }
    };
  }, [connected, client, setupComplete]);

  // 🛡️ SAFETY LOCK: Release function
  const releaseSafetyLock = useCallback(() => {
    isRecordingLockedRef.current = false;
    console.log('🛡️ Safety Lock RELEASED - Recording can now be stopped');
    if (safetyLockTimeoutRef.current) {
      clearTimeout(safetyLockTimeoutRef.current);
      safetyLockTimeoutRef.current = null;
    }
  }, []);

  // 🛡️ SAFETY LOCK: Activate function
  const activateSafetyLock = useCallback(() => {
    isRecordingLockedRef.current = true;
    console.log('🎤 Mic Started - Safety Lock ON (4 seconds immunity)');

    // Clear any existing timeout
    if (safetyLockTimeoutRef.current) {
      clearTimeout(safetyLockTimeoutRef.current);
    }

    // Release lock after 4 seconds
    safetyLockTimeoutRef.current = setTimeout(() => {
      releaseSafetyLock();
    }, SAFETY_LOCK_DURATION);
  }, [releaseSafetyLock]);

  // 🛡️ SAFETY LOCK: Internal stop function (bypasses lock check - use carefully!)
  const forceStopRecording = useCallback((audioRecorder: AudioRecorder, reason: string) => {
    console.log(`🛑 Force stopping recording: ${reason}`);
    isRecordingRef.current = false;
    audioRecorder.stop();

    // Clean up silence check interval
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }

    // Clean up safety lock timeout
    if (safetyLockTimeoutRef.current) {
      clearTimeout(safetyLockTimeoutRef.current);
      safetyLockTimeoutRef.current = null;
    }

    // Reset tracking
    speechDetectedRef.current = false;
    recordingStartTimeRef.current = 0;
    isRecordingLockedRef.current = false;
  }, []);

  // 🚨 REMOVED: All silence-based stopping logic
  // Recording stays ON continuously - like a real phone call
  // Only stops when user manually clicks disconnect or mute
  const monitorRecordingHealth = useCallback((audioRecorder: AudioRecorder) => {
    // Only monitor health - NEVER stop recording automatically
    if (!isRecordingRef.current) return;

    // Just log health status - no stopping logic
    const now = Date.now();
    const timeSinceLastVolume = now - lastVolumeTimeRef.current;
    const timeSinceAIResponse = now - lastAIResponseTimeRef.current;
    const recordingDuration = now - recordingStartTimeRef.current;

    // Periodic health check (every 10 seconds)
    if (recordingDuration % 10000 < 2000) {
      console.log(`📊 Recording health: Active for ${Math.round(recordingDuration / 1000)}s | ${Math.round(timeSinceLastVolume / 1000)}s since last speech | Mic stays open indefinitely`);
    }
  }, []);

  useEffect(() => {
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

    const onData = (base64: string) => {
      if (handleAudioDataRef.current) {
        handleAudioDataRef.current(base64);
      }
    };

    // CRITICAL FIX: Always remove old listeners before adding new ones to prevent duplicates
    audioRecorder.off('data', onData);

    // Start recording if connected, setup is complete, and not muted
    // CRITICAL: Keep recording continuously - don't stop after AI responds
    if (connected && setupComplete && !muted && !isRecordingRef.current) {
      console.log('🎤 Starting/Resuming audio recording (setup complete) - Continuous conversation mode');

      // CRITICAL: Reset all state before starting
      isRecordingRef.current = true;
      recordingStartTimeRef.current = Date.now(); // Track when recording started
      speechDetectedRef.current = false; // Reset speech detection
      lastVolumeTimeRef.current = Date.now(); // Initialize last volume time
      lastAIResponseTimeRef.current = Date.now(); // Initialize AI response time (assume it's ready to listen)
      isRecordingLockedRef.current = false; // Reset lock state
      audioChunkCountRef.current = 0; // Reset chunk counter
      lastAudioChunkTimeRef.current = Date.now(); // Reset chunk timing

      // DON'T activate safety lock yet - wait until recording actually starts successfully

      // Attach listener BEFORE starting
      audioRecorder.on('data', onData);

      audioRecorder.start().then(() => {
        console.log('✅ Recording started successfully');

        // 🛡️ ACTIVATE SAFETY LOCK ONLY AFTER RECORDING STARTS SUCCESSFULLY
        // This ensures permission was granted and recording is actually active
        activateSafetyLock();
        console.log(`🛡️ Safety Lock active for ${SAFETY_LOCK_DURATION}ms - Recording is protected from stopping`);

        // Start monitoring recording health (check every 5 seconds)
        // 🚨 CRITICAL: NO auto-stop logic - recording stays on forever like a phone call
        if (silenceCheckIntervalRef.current) {
          clearInterval(silenceCheckIntervalRef.current);
        }
        silenceCheckIntervalRef.current = setInterval(() => {
          monitorRecordingHealth(audioRecorder);

          // CRITICAL: Monitor that recording is actually active - auto-restart if stopped
          if (connected && setupComplete && !muted && !isRecordingRef.current && audioRecorderRef.current) {
            console.warn('⚠️ WARNING: Recording stopped but should be active! Auto-restarting...');
            // Restart recording if it stopped unexpectedly
            isRecordingRef.current = true;
            recordingStartTimeRef.current = Date.now();
            audioRecorderRef.current.start().catch((error: Error) => {
              console.error('❌ Failed to restart recording in monitor:', error);
              isRecordingRef.current = false;
            });
          }

          // Log audio chunk health (informational only, no action)
          const timeSinceLastChunk = Date.now() - lastAudioChunkTimeRef.current;
          if (timeSinceLastChunk > 5000 && isRecordingRef.current) {
            console.log(`📊 Audio status: ${Math.round(timeSinceLastChunk / 1000)}s since last chunk (normal if user is silent)`);
          }
        }, 5000); // Check every 5 seconds
      }).catch((error: Error) => {
        console.error('❌ Failed to start audio recording:', error);
        isRecordingRef.current = false;
        recordingStartTimeRef.current = 0;
        isRecordingLockedRef.current = false; // Release lock on error
        speechDetectedRef.current = false; // Reset speech detection

        // Remove event listener on error
        audioRecorder.off('data', onData);

        if (silenceCheckIntervalRef.current) {
          clearInterval(silenceCheckIntervalRef.current);
          silenceCheckIntervalRef.current = null;
        }
        if (safetyLockTimeoutRef.current) {
          clearTimeout(safetyLockTimeoutRef.current);
          safetyLockTimeoutRef.current = null;
        }
      });
    }
    // Stop recording ONLY if explicitly disconnected or muted - with SAFETY LOCK protection
    else if ((!connected || muted) && isRecordingRef.current) {
      const isLocked = isRecordingLockedRef.current;
      console.log('🛑 Stop requested - Blocked?', isLocked, {
        connected,
        muted,
        recordingDuration: Date.now() - recordingStartTimeRef.current,
      });

      // 🛡️ SAFETY LOCK: Block stop if lock is active
      if (isLocked) {
        console.log('⚠️ Stop blocked by Safety Lock - Recording is protected for', SAFETY_LOCK_DURATION, 'ms');
        console.log('🛡️ Recording will continue until Safety Lock is released');

        // Wait for lock to be released, then stop
        const waitForLockRelease = () => {
          if (!isRecordingLockedRef.current && isRecordingRef.current) {
            console.log('🛡️ Safety Lock released, now stopping recording');
            forceStopRecording(audioRecorder, 'Disconnected/Muted after lock release');
            audioRecorder.off('data', onData);
          } else if (isRecordingRef.current) {
            // Still locked, check again in 100ms
            setTimeout(waitForLockRelease, 100);
          }
        };

        // Start checking for lock release
        setTimeout(waitForLockRelease, 100);

        return () => {
          audioRecorder.off('data', onData);
        };
      }

      // Safety lock not active, can stop immediately
      console.log('✅ Safety Lock not active, stopping recording immediately');
      forceStopRecording(audioRecorder, 'Disconnected/Muted (no lock)');

      return () => {
        audioRecorder.off('data', onData);
      };
    }

    // Additional check: if connected for more than 3 seconds and still not recording, force start
    if (connected && !setupComplete && !muted && !isRecordingRef.current) {
      const forceStartTimeout = setTimeout(() => {
        if (connected && client.status === 'connected' && !muted && !isRecordingRef.current) {
          console.log('Force starting audio recording after timeout');
          setSetupComplete(true);
        }
      }, 3000);

      return () => {
        clearTimeout(forceStartTimeout);
      };
    }

    // Cleanup function
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, setupComplete, muted, client.status, monitorRecordingHealth, activateSafetyLock, forceStopRecording]);

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
      // Clear silence check interval
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
        silenceCheckIntervalRef.current = null;
      }

      // Clear safety lock timeout
      if (safetyLockTimeoutRef.current) {
        clearTimeout(safetyLockTimeoutRef.current);
        safetyLockTimeoutRef.current = null;
      }

      if (isRecordingRef.current && audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        isRecordingRef.current = false;
      }

      // Reset tracking
      speechDetectedRef.current = false;
      recordingStartTimeRef.current = 0;
      isRecordingLockedRef.current = false;
    };
  }, []);

  return (
    <section className="flex items-center justify-center gap-6 w-fit p-3 bg-background/60 rounded-lg text-card-foreground">
      <nav className={cn('flex flex-col items-center gap-2', { 'opacity-50 pointer-events-none': !connected })}>
        <button
          className={cn('p-3 rounded-full cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all', 'mic-button', {
            'bg-red-500/20 animate-pulse ring-2 ring-red-500': isRecordingRef.current && !muted,
            'text-red-500': isRecordingRef.current && !muted
          })}
          onClick={(e) => {
            // 🛡️ Fix event bubbling to prevent double-clicks
            e.preventDefault();
            e.stopPropagation();

            // 🛡️ SAFETY LOCK: Block mute/unmute if recording is locked
            if (isRecordingLockedRef.current && isRecordingRef.current) {
              console.log('⚠️ Mute toggle blocked by Safety Lock');
              return;
            }

            setMuted(!muted);
          }}
        >
          {!muted ? (
            <span className={cn('text-xl', {
              'text-red-500': isRecordingRef.current
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConnectClick(e);
              }}
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
