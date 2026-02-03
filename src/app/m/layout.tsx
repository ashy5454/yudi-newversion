"use client";

import { ReactNode, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthContext';
import { UserClientDb } from '@/lib/firebase/clientDb';
import GenderPreferenceModal from '@/components/GenderPreferenceModal';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading, updateGenderPreference } = useAuth();
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingGender, setCheckingGender] = useState(true);

  useEffect(() => {
    const checkGenderPreference = async () => {
      if (loading || !user) {
        setCheckingGender(false);
        return;
      }

      try {
        const userData = await UserClientDb.getById(user.uid);
        // Show modal if user doesn't have gender preference set
        if (userData && !userData.genderPreference) {
          setShowGenderModal(true);
        }
      } catch (error) {
        console.error('Error checking gender preference:', error);
      } finally {
        setCheckingGender(false);
      }
    };

    checkGenderPreference();
  }, [user, loading]);

  const handleGenderSubmit = async (username: string, genderPreference: string) => {
    setIsSubmitting(true);
    try {
      await updateGenderPreference(genderPreference, username);
      setShowGenderModal(false);
    } catch (error) {
      console.error('Error updating name and gender preference:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingGender) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {children}
      <GenderPreferenceModal
        open={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        onSubmit={handleGenderSubmit}
        loading={isSubmitting}
      />
    </ProtectedRoute>
  );
} 