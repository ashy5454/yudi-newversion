'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/firebase';
import { useAuth } from '@/components/AuthContext';

export const useAuthToken = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      if (!user) {
        setToken(null);
        return;
      }

      try {
        setLoading(true);
        const idToken = await auth.currentUser?.getIdToken();
        setToken(idToken || null);
      } catch (error) {
        console.error('Error getting auth token:', error);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    getToken();
  }, [user]);

  return { token, loading };
}; 