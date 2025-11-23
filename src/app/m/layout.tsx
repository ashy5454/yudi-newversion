import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
} 