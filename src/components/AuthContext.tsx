'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseAuthUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/firebase';
import { UserClientDb } from '@/lib/firebase/clientDb';
import { AuthContextType, FirebaseUser } from '@/lib/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user document in Firestore if it doesn't exist
  const createUserDocument = async (firebaseUser: FirebaseAuthUser, username?: string, genderPreference?: string) => {
    try {
      // Check if user document already exists
      const existingUser = await UserClientDb.getById(firebaseUser.uid);

      if (!existingUser) {
        const isAnonymous = firebaseUser.isAnonymous;
        // Create new user document with trial access
        const userData: any = {
          id: firebaseUser.uid,
          displayName: username || firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL || '',
          credit: {
            amount: 100, // Default credit balance
            totalCredits: 100,
            totalSpent: 0,
            totalEarned: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          status: 'active',
          accessLevel: 'trial' as const, // Default to trial access
          isAnonymous: isAnonymous || false,
        };

        // Only include username if it's provided (Firestore doesn't allow undefined)
        if (username) {
          userData.username = username;
        }

        // Only include genderPreference if it's provided (Firestore doesn't allow undefined)
        if (genderPreference) {
          userData.genderPreference = genderPreference;
        }

        await UserClientDb.create(userData, firebaseUser.uid);
        console.log('User document created successfully with trial access');
      } else if (username && existingUser.isAnonymous) {
        // Update anonymous user with username and gender preference if provided
        const updateData: any = {
          displayName: username,
          username: username,
        };
        if (genderPreference) {
          updateData.genderPreference = genderPreference;
        }
        await UserClientDb.update(firebaseUser.uid, updateData);
      } else if (genderPreference && !existingUser.genderPreference) {
        // Update regular user with gender preference if not set
        await UserClientDb.update(firebaseUser.uid, {
          genderPreference: genderPreference,
        });
      }
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  };

  useEffect(() => {
    // Guard: ensure Firebase auth is initialized before subscribing
    if (!auth) {
      console.warn('Firebase auth not initialized yet in AuthProvider');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
      if (firebaseUser) {
        const userData: FirebaseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
        };
        setUser(userData);

        // Create user document if it doesn't exist (username will be set later via modal)
        await createUserDocument(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      if (!auth || !googleProvider) throw new Error('Firebase not initialized');
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Set token via API route (httpOnly cookie - for middleware route protection)
      // This is non-blocking - if it fails, Authorization header will still work
      fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      }).catch((cookieError) => {
        // Silent fail - cookies are just for middleware, Authorization header is primary
        console.debug('Cookie set failed (non-critical):', cookieError);
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInAnonymouslyAuth = async (): Promise<FirebaseAuthUser> => {
    try {
      setLoading(true);
      if (!auth) throw new Error('Firebase not initialized');
      const result = await signInAnonymously(auth);
      const idToken = await result.user.getIdToken();

      // Set token via API route (httpOnly cookie - for middleware route protection)
      // This is non-blocking - if it fails, Authorization header will still work
      fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      }).catch((cookieError) => {
        // Silent fail - cookies are just for middleware, Authorization header is primary
        console.debug('Cookie set failed (non-critical):', cookieError);
      });

      return result.user;
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      // Provide helpful error message for common issues
      if (error?.code === 'auth/admin-restricted-operation') {
        throw new Error('Anonymous authentication is not enabled in Firebase. Please enable it in Firebase Console > Authentication > Sign-in method > Anonymous.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAnonymousUsername = async (username: string, genderPreference: string) => {
    if (!user || !user.isAnonymous || !auth.currentUser) return;
    try {
      await createUserDocument(auth.currentUser, username, genderPreference);
      // Update local user state
      setUser({
        ...user,
        displayName: username,
      });
    } catch (error) {
      console.error('Error updating anonymous username:', error);
      throw error;
    }
  };

  const updateGenderPreference = async (genderPreference: string, username?: string) => {
    if (!user || !auth.currentUser) return;
    try {
      await createUserDocument(auth.currentUser, username, genderPreference);
      // Update local user state if username provided
      if (username) {
        setUser({
          ...user,
          displayName: username,
        });
      }
    } catch (error) {
      console.error('Error updating gender preference:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      if (!auth) throw new Error('Firebase not initialized');
      await firebaseSignOut(auth);

      // Delete token via API route
      try {
        await fetch('/api/auth/set-token', {
          method: 'DELETE',
        });
      } catch (cookieError) {
        // Fallback to client-side cookie deletion
        console.warn('Failed to delete httpOnly cookie, using fallback:', cookieError);
        const { deleteAuthCookie } = await import('@/lib/auth/cookie-utils');
        deleteAuthCookie();
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInAnonymously: signInAnonymouslyAuth,
    updateAnonymousUsername,
    updateGenderPreference,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 