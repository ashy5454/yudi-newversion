"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { UserClientDb } from "@/lib/firebase/clientDb";
import { User } from "@/lib/firebase/dbTypes";

const TRIAL_DURATION_MS = 4 * 60 * 1000; // 4 minutes in milliseconds

export interface AccessControlState {
  accessLevel: 'trial' | 'approved';
  isTrial: boolean;
  isApproved: boolean;
  remainingTextTime: number; // Remaining time for text chat in ms
  remainingVoiceTime: number; // Remaining time for voice call in ms
  isTextTrialExpired: boolean;
  isVoiceTrialExpired: boolean;
  isLoading: boolean;
}

export function useAccessControl(): AccessControlState {
  const { user } = useAuth();
  const [accessLevel, setAccessLevel] = useState<'trial' | 'approved'>('trial');
  const [trialStartedAt, setTrialStartedAt] = useState<Date | null>(null);
  const [voiceTrialStartedAt, setVoiceTrialStartedAt] = useState<Date | null>(null);
  const [remainingTextTime, setRemainingTextTime] = useState<number>(TRIAL_DURATION_MS);
  const [remainingVoiceTime, setRemainingVoiceTime] = useState<number>(TRIAL_DURATION_MS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        const userData = await UserClientDb.getById(user.uid);
        if (userData) {
          const level = userData.accessLevel || 'trial';
          setAccessLevel(level);
          
          if (userData.trialStartedAt) {
            const startedAt = userData.trialStartedAt instanceof Date 
              ? userData.trialStartedAt 
              : new Date(userData.trialStartedAt);
            setTrialStartedAt(startedAt);
          } else {
            setTrialStartedAt(null);
          }
          
          if (userData.voiceTrialStartedAt) {
            const startedAt = userData.voiceTrialStartedAt instanceof Date 
              ? userData.voiceTrialStartedAt 
              : new Date(userData.voiceTrialStartedAt);
            setVoiceTrialStartedAt(startedAt);
          } else {
            setVoiceTrialStartedAt(null);
          }
        }
      } catch (error) {
        console.error('Error loading user access data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
    
    // Set up a listener to refresh when user data changes (less frequent to avoid spam)
    const refreshInterval = setInterval(loadUserData, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  // Calculate remaining time for text chat
  useEffect(() => {
    if (!user || accessLevel === 'approved') {
      setRemainingTextTime(TRIAL_DURATION_MS);
      return;
    }
    
    // If trial hasn't started yet, keep it at full duration
    if (!trialStartedAt) {
      setRemainingTextTime(TRIAL_DURATION_MS);
      return;
    }

    const updateRemainingTime = () => {
      const now = Date.now();
      const startedAt = trialStartedAt instanceof Date 
        ? trialStartedAt.getTime() 
        : new Date(trialStartedAt).getTime();
      const elapsed = now - startedAt;
      const remaining = Math.max(0, TRIAL_DURATION_MS - elapsed);
      setRemainingTextTime(remaining);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [user, accessLevel, trialStartedAt]);

  // Calculate remaining time for voice call
  useEffect(() => {
    if (!user || accessLevel === 'approved') {
      setRemainingVoiceTime(TRIAL_DURATION_MS);
      return;
    }
    
    // If trial hasn't started yet, keep it at full duration
    if (!voiceTrialStartedAt) {
      setRemainingVoiceTime(TRIAL_DURATION_MS);
      return;
    }

    const updateRemainingTime = () => {
      const now = Date.now();
      const startedAt = voiceTrialStartedAt instanceof Date 
        ? voiceTrialStartedAt.getTime() 
        : new Date(voiceTrialStartedAt).getTime();
      const elapsed = now - startedAt;
      const remaining = Math.max(0, TRIAL_DURATION_MS - elapsed);
      setRemainingVoiceTime(remaining);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [user, accessLevel, voiceTrialStartedAt]);

  // Only consider expired if trial has actually started AND time has run out
  const isTextTrialExpired = accessLevel === 'trial' && trialStartedAt !== null && remainingTextTime <= 0;
  const isVoiceTrialExpired = accessLevel === 'trial' && voiceTrialStartedAt !== null && remainingVoiceTime <= 0;

  return {
    accessLevel,
    isTrial: accessLevel === 'trial',
    isApproved: accessLevel === 'approved',
    remainingTextTime,
    remainingVoiceTime,
    isTextTrialExpired,
    isVoiceTrialExpired,
    isLoading,
  };
}

// Helper function to start text chat trial
export async function startTextTrial(userId: string): Promise<void> {
  try {
    const userData = await UserClientDb.getById(userId);
    if (userData && !userData.trialStartedAt) {
      // Only start if not already started
      await UserClientDb.update(userId, {
        trialStartedAt: new Date(),
        accessLevel: 'trial' as const,
      });
    }
  } catch (error) {
    console.error('Error starting text trial:', error);
  }
}

// Helper function to start voice call trial
export async function startVoiceTrial(userId: string): Promise<void> {
  try {
    const userData = await UserClientDb.getById(userId);
    if (userData && !userData.voiceTrialStartedAt) {
      // Only start if not already started
      await UserClientDb.update(userId, {
        voiceTrialStartedAt: new Date(),
        accessLevel: 'trial' as const,
      });
    }
  } catch (error) {
    console.error('Error starting voice trial:', error);
  }
}

// Helper function to reset trials (for testing/development only)
export async function resetTrials(userId: string): Promise<void> {
  try {
    await UserClientDb.update(userId, {
      trialStartedAt: null,
      voiceTrialStartedAt: null,
      accessLevel: 'trial' as const,
    });
    console.log('[AccessControl] Trials reset for user:', userId);
  } catch (error) {
    console.error('Error resetting trials:', error);
  }
}

