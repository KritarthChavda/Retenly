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

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/forms',
    '/api/feedback',
    '/api/forms',
    '/api/upload',
    '/admin/login',
    '/restaurant/login'
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
  console.log('🔍 About to verify token...')
  const user = await verifyToken(token)
  console.log('🔍 Token verification result:', user)
  
  if (!user) {
    console.log('❌ Invalid token, redirecting to home')
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
const requestHeaders = new Headers(request.headers)
requestHeaders.set('x-user-id', user.id)
requestHeaders.set('x-user-type', user.type)

// Only attach restaurantId if restaurant
if (user.type === 'restaurant' && user.restaurantId) {
  requestHeaders.set('x-restaurant-id', user.restaurantId)
}

// Attach admin id if admin
if (user.type === 'admin') {
  requestHeaders.set('x-admin-id', user.id)
}

return NextResponse.next({
  request: {
    headers: requestHeaders,
  },
})
}
