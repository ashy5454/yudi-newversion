import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  const isLoggedIn = !!token

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
