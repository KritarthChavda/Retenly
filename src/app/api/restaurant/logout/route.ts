import { NextRequest, NextResponse } from 'next/server'

/**
 * Restaurant logout API endpoint
 * 
 * @param request - The incoming request
 * @returns NextResponse with cleared session cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Create response with success message
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    )

    // Clear restaurant session cookie
    response.cookies.set('restaurant-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expire immediately
    })

    return response
  } catch (error) {
    console.error('Restaurant logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 