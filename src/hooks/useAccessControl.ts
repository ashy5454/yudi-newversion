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
  // Always return approved access - no trial restrictions
  return {
    accessLevel: 'approved',
    isTrial: false,
    isApproved: true,
    remainingTextTime: TRIAL_DURATION_MS,
    remainingVoiceTime: TRIAL_DURATION_MS,
    isTextTrialExpired: false,
    isVoiceTrialExpired: false,
    isLoading: false,
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

