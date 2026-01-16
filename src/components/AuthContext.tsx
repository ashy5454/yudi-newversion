'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
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
  const createUserDocument = async (firebaseUser: FirebaseAuthUser) => {
    try {
      // Check if user document already exists
      const existingUser = await UserClientDb.getById(firebaseUser.uid);
      
      if (!existingUser) {
        // Create new user document with trial access
        const userData = {
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Anonymous User',
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
        };
        
        await UserClientDb.create(userData, firebaseUser.uid);
        console.log('User document created successfully with trial access');
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
        };
        setUser(userData);

        // Create user document if it doesn't exist
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
      //  Store ID token in a cookie for server-side use
      document.cookie = `authToken=${idToken}; path=/; max-age=3600; SameSite=Lax`;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      if (!auth) throw new Error('Firebase not initialized');
      await firebaseSignOut(auth);
      document.cookie = 'authToken=; path=/; max-age=0'; // 🧹 delete cookie
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
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 