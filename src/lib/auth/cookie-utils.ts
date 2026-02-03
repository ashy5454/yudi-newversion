/**
 * Secure Cookie Management for Authentication
 * Uses httpOnly cookies set via API route for security
 */

export const COOKIE_NAME = 'authToken';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Set auth token cookie (client-side - for immediate use)
 * Note: For production, use httpOnly cookies set via API route
 */
export const setAuthCookie = (token: string) => {
  if (typeof document === 'undefined') return;
  
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || window.location.protocol === 'https:';
  
  // Set cookie with secure options
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
};

/**
 * Delete auth token cookie
 */
export const deleteAuthCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
};

/**
 * Get auth token from cookie (server-side)
 */
export const getAuthTokenFromCookie = (cookieHeader: string | null): string | null => {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[COOKIE_NAME] || null;
};
