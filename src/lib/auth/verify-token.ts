/**
 * Server-side token verification utilities
 */
import { NextRequest } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/firebase-admin';
import { getAuthTokenFromCookie } from './cookie-utils';

/**
 * Verify auth token from request
 * Returns decoded token or null if invalid
 */
export async function verifyAuthToken(req: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    // Get token from cookie
    const cookieHeader = req.headers.get('cookie');
    const token = getAuthTokenFromCookie(cookieHeader);

    if (!token) {
      return null;
    }

    // Verify token with Firebase Admin
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

/**
 * Middleware helper to check authentication
 */
export async function requireAuth(req: NextRequest): Promise<{ uid: string; email?: string } | null> {
  const user = await verifyAuthToken(req);
  
  if (!user) {
    return null;
  }

  return user;
}
