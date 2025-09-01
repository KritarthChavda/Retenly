export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials, createToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

/**
 * Production-ready admin login API endpoint with JWT authentication
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    
    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      logger.warn({ 
        errors: validation.error.errors,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }, 'Admin login validation failed')
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { username, password } = validation.data

    // Verify admin credentials
    const authResult = await verifyAdminCredentials(username, password)

    if (!authResult.success || !authResult.user) {
      logger.warn({ 
        username, 
        error: authResult.error,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      }, 'Admin login failed')
      return NextResponse.json(
        { error: authResult.error || 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await createToken(authResult.user)

    // Create response
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: {
          id: authResult.user.id,
          username: authResult.user.username,
          type: authResult.user.type
        }
      },
      { status: 200 }
    )

    // Set secure authentication cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    logger.info({ 
      username,
      userId: authResult.user.id,
      duration: Date.now() - startTime,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }, 'Admin login successful')

    return response
  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }, 'Admin login error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}