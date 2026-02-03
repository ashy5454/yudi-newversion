import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';

/**
 * API route to set httpOnly auth token cookie
 * This is more secure than setting cookies client-side
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction || req.nextUrl.protocol === 'https:';

    // Set httpOnly cookie (more secure - not accessible via JavaScript)
    cookieStore.set('authToken', token, {
      httpOnly: true, // Prevents XSS attacks
      secure: isSecure, // Only send over HTTPS in production
      sameSite: 'lax', // CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ message: 'Token set successfully' });
  } catch (error: any) {
    console.error('Error setting auth token:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete auth token cookie
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('authToken');

    return NextResponse.json({ message: 'Token deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting auth token:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
