import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

/**
 * Restaurant login API endpoint
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

    // Find restaurant by username
    const restaurant = await prisma.restaurant.findUnique({
      where: { username }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, restaurant.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create response with success message
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          username: restaurant.username
        }
      },
      { status: 200 }
    )

    // Set restaurant session cookie
    response.cookies.set('restaurant-session', restaurant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
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