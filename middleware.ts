import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-edge'


/**
 * Production-ready middleware for authentication and routing
 */
export async function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE EXECUTING FOR:', request.url)
  const { pathname } = request.nextUrl

  console.log('🔍 MIDDLEWARE START - Processing:', pathname)
  console.log('🔍 Request method:', request.method)
  console.log('🔍 Full URL:', request.url)
  
  // Special debug for API routes
  if (pathname.startsWith('/api/')) {
    console.log('🔍 API ROUTE DETECTED:', pathname)
    console.log('🔍 API ROUTE - Will process authentication')
  }

  // Public routes that don't require authentication
  const publicRoutes = [
  '/',
  '/forms',

  // Public APIs
  '/api/feedback',
  '/api/forms',
  '/api/upload',

  // Auth pages
  '/admin/login',
  '/restaurant/login',

  // Auth APIs (THIS IS THE FIX)
  '/api/admin/login',
  '/api/restaurant/login'
]


  // Admin routes that require admin authentication
  const adminRoutes = ['/admin', '/api/admin']
  
  // Restaurant routes that require restaurant authentication  
  const restaurantRoutes = ['/restaurant', '/api/restaurant', '/dashboard']

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  console.log('🔍 Route analysis:', {
    pathname,
    isPublicRoute,
    matchesAdmin: adminRoutes.some(route => pathname.startsWith(route)),
    matchesRestaurant: restaurantRoutes.some(route => pathname.startsWith(route))
  })

  if (isPublicRoute) {
    console.log('✅ Public route, allowing access:', pathname)
    return NextResponse.next()
  }

  // Check if route requires authentication
  const isProtectedRoute = adminRoutes.some(route => pathname.startsWith(route)) ||
                          restaurantRoutes.some(route => pathname.startsWith(route))

  if (!isProtectedRoute) {
    console.log('✅ Non-protected route, allowing access:', pathname)
    return NextResponse.next()
  }

  console.log('🔒 Protected route detected:', pathname)

  // Check authentication for protected routes
  const token = request.cookies.get('auth-token')?.value

  console.log('🔐 Auth token found:', !!token)
  if (token) {
    console.log('🔐 Token preview:', token.substring(0, 50) + '...')
  }

  if (!token) {
    console.log('❌ No auth token, redirecting to login')
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (restaurantRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/restaurant/login', request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Verify token
  console.log('🔍 [middleware] About to verify token...');
  console.log('🔍 [middleware] Token preview:', token.substring(0, 50) + '...');
  const user = await verifyToken(token)
  console.log('🔍 [middleware] Token verification result:', user);
  
  if (!user) {
    console.log('❌ [middleware] Invalid token, redirecting to home');
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  // Check authorization for admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (user.type !== 'admin') {
      console.log('❌ Non-admin trying to access admin route')
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Check authorization for restaurant routes
  if (restaurantRoutes.some(route => pathname.startsWith(route))) {
    if (user.type !== 'restaurant') {
      console.log('❌ Non-restaurant trying to access restaurant route')
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

// Add user info to headers for API routes
const response = NextResponse.next()
response.headers.set('x-user-id', user.id)
response.headers.set('x-user-type', user.type)

console.log('✅ Authentication successful, setting headers:', {
  'x-user-id': user.id,
  'x-user-type': user.type,
  'x-restaurant-id': user.restaurantId
})

// Only attach restaurantId if restaurant
if (user.type === 'restaurant' && user.restaurantId) {
  response.headers.set('x-restaurant-id', user.restaurantId)
}

// Attach admin id if admin
if (user.type === 'admin') {
  response.headers.set('x-admin-id', user.id)
}

console.log('🔍 MIDDLEWARE END - Returning response with headers')
return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
