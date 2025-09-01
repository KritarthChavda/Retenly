export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyRestaurantCredentials, createToken } from '@/lib/auth'

/**
 * Restaurant login API endpoint
 * 
 * @param request - The incoming request
 * @returns NextResponse with authentication result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Verify restaurant credentials
    const authResult = await verifyRestaurantCredentials(username, password)

    if (!authResult.success || !authResult.user) {
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

    return response
  } catch (error) {
    console.error('Restaurant login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}