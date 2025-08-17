import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to protect admin routes
 * 
 * @param request - The incoming request
 * @returns NextResponse with appropriate redirect or continue
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Skip middleware for login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check for admin session cookie
    const adminSession = request.cookies.get('admin-session')
    
    if (!adminSession) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // For now, we'll use a simple session check
    // In production, you'd verify the session token
    if (adminSession.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Restaurant dashboard routes protection
  if (pathname.startsWith('/dashboard')) {
    // Check for restaurant session cookie
    const restaurantSession = request.cookies.get('restaurant-session')
    
    if (!restaurantSession) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL('/restaurant/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*']
} 