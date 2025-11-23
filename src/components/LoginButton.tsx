'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthContext';
import { LogIn, LogOut, Loader2, User, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppBackground from './main/AppBackground';
import { LoaderOne } from './ui/loader';

export const LoginButton: React.FC = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <AppBackground>
        <div className='h-screen w-screen flex flex-col items-center justify-center'>
          <Button disabled className="btn-primary w-full max-w-xs">
            <LoaderOne />
          </Button>
        </div>
      </AppBackground>
    );
  }

  if (user) {
    return (
      <AppBackground>
        <div className='h-screen w-screen flex flex-col items-center justify-center'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="btn-primary border-gradient">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                  <AvatarFallback className="text-xs">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.displayName || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <div className='h-screen w-screen flex flex-col items-center justify-center p-4'>

        <img src="/yudi.svg" alt="Yudi" className="h-40 w-40 inline-block mr-2 invert" />
        <h1 className="text-2xl font-bold mb-2">Welcome to Yudi</h1>
        <p className="text-muted-foreground mb-6">Please sign in to continue
        </p>
        <Button onClick={handleSignIn} className="btn-primary w-full max-w-xs gradient-primary text-primary-foreground shadow-lg hover:shadow-xl">
          <LogIn className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>
      </div>
    </AppBackground>
  );
}; 