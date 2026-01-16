"use client";

import { useAccessControl } from "@/hooks/useAccessControl";
import { useAuth } from "@/components/AuthContext";
import { Button } from "./ui/button";

// Extend the Window interface to include Tally
declare global {
  interface Window {
    Tally?: any;
  }
}

export default function TrialLockout() {
  const { user } = useAuth();
  const { isTextTrialExpired, isVoiceTrialExpired, isLoading } = useAccessControl();

  // Don't show lockout for unauthenticated users
  if (!user) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  // Show lockout if either trial is expired
  if (!isTextTrialExpired && !isVoiceTrialExpired) {
    return null;
  }

  const handleJoinWaitlist = () => {
    // Open Tally popup
    if (window.Tally) {
      window.Tally.openPopup("nrQAB2", {
        layout: "modal",
        width: 500,
        overlay: true,
        emoji: {
          text: "🚀",
          animation: "tada",
        },
        autoClose: false,
      });
    } else {
      // Fallback: open in new tab
      window.open("https://tally.so/r/nrQAB2", "_blank");
    }
  };

  // Load Tally script if not already loaded
  if (typeof window !== 'undefined' && !window.Tally) {
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-primary/20">
        <h2 className="text-3xl font-bold text-foreground">
          HEYYY SORRY!
        </h2>
        <p className="text-lg text-muted-foreground">
          Your 4-minute trial has expired.
        </p>
        <p className="text-muted-foreground">
          Join the waitlist for more access!
        </p>
        <p className="text-lg text-foreground font-medium">
          Ashmith and Sam will contact you!
        </p>
        <p className="text-2xl font-bold text-foreground">
          YAP TO YUDI:)
        </p>
        <Button
          onClick={handleJoinWaitlist}
          size="lg"
          className="w-full bg-gradient-to-r from-[#428DFF] via-blue-500 to-purple-500 hover:from-[#3b7ce6] hover:via-blue-600 hover:to-purple-600 text-white"
        >
          Join the Waitlist!
        </Button>
      </div>
    </div>
  );
}

