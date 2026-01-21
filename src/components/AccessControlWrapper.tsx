"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/AuthContext";

interface AccessControlWrapperProps {
  children: ReactNode;
}

export default function AccessControlWrapper({ children }: AccessControlWrapperProps) {
  const { user, loading: authLoading } = useAuth();

  // Don't show access control for unauthenticated users (landing page, sign in, etc.)
  if (!user) {
    return <>{children}</>;
  }

  // Show loading only for authenticated users
  if (authLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // No trial restrictions - full access for everyone
  return <>{children}</>;
}

