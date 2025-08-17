import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials } from '@/lib/auth'

/**
 * Admin login API endpoint
 * 
 * @param request - The incoming request with login credentials
 * @returns NextResponse with success/error status and session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Verify admin credentials
    const isValid = await verifyAdminCredentials(username, password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create response with success message
    const response = NextResponse.json(
      { message: 'Login successful' },
      { status: 200 }
    )

    // Set admin session cookie
    response.cookies.set('admin-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 