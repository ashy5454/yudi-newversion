'use client';

import React from 'react';
import { useAuth } from '@/components/AuthContext';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">
            Please sign in to access this page.
          </p>
          <Link href="/">
            <Button variant={"secondary"}>
              <LogIn className="mr-2" />
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 