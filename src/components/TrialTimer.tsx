"use client";

import { useAccessControl } from "@/hooks/useAccessControl";

export default function TrialTimer() {
  const { isTrial, remainingTextTime, remainingVoiceTime, isTextTrialExpired, isVoiceTrialExpired } = useAccessControl();

  if (!isTrial) {
    return null; // Don't show timer for approved users
  }

  // Only show timer if at least one trial has started
  // If both timers are at full duration (4:00), it means neither has started yet
  const TRIAL_DURATION_MS = 4 * 60 * 1000; // 4 minutes
  const textStarted = remainingTextTime < TRIAL_DURATION_MS;
  const voiceStarted = remainingVoiceTime < TRIAL_DURATION_MS;
  
  // Don't show timer if neither trial has started
  if (!textStarted && !voiceStarted) {
    return null;
  }

  // Use the minimum remaining time (whichever is running)
  const remainingTime = Math.min(remainingTextTime, remainingVoiceTime);
  const isExpired = isTextTrialExpired || isVoiceTrialExpired;

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isLowTime = remainingTime < 60000; // Less than 1 minute

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg font-mono text-lg font-bold transition-all ${
        isExpired
          ? 'bg-red-600 text-white animate-pulse'
          : isLowTime
          ? 'bg-red-500/90 text-white animate-pulse'
          : 'bg-yellow-500/90 text-black'
      }`}
    >
      {isExpired ? 'Trial Expired' : formattedTime}
    </div>
  );
}

