"use client";

import { ReactNode } from "react";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useAuth } from "@/components/AuthContext";
import TrialTimer from "./TrialTimer";
import TrialLockout from "./TrialLockout";

interface AccessControlWrapperProps {
  children: ReactNode;
}

export default function AccessControlWrapper({ children }: AccessControlWrapperProps) {
  const { user, loading: authLoading } = useAuth();
  const { isTrial, isLoading } = useAccessControl();

  // Don't show access control for unauthenticated users (landing page, sign in, etc.)
  if (!user) {
    return <>{children}</>;
  }

  // Show loading only for authenticated users
  if (authLoading || isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Only show timer and lockout for authenticated users
  return (
    <>
      {isTrial && <TrialTimer />}
      <TrialLockout />
      {children}
    </>
  );
}

