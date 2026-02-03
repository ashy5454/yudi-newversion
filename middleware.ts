import { NextRequest, NextResponse } from 'next/server'
import { getAuthTokenFromCookie } from '@/lib/auth/cookie-utils'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // Get token from cookie (just check existence - full verification happens in API routes)
  const cookieHeader = req.headers.get('cookie')
  const token = getAuthTokenFromCookie(cookieHeader)
  const isLoggedIn = !!token // Basic check - full verification in API routes

  // ✅ Case 1: Not logged in and trying to access protected routes
  if (!isLoggedIn && pathname.startsWith('/m')) {
    if (pathname !== '/') {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // ✅ Case 2: Logged in and trying to access public login page "/"
  if (isLoggedIn && pathname === '/') {
    url.pathname = '/m'
    return NextResponse.redirect(url)
  }

  // ✅ Otherwise allow request through
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/m/:path*'], // Apply middleware only to these routes
}
