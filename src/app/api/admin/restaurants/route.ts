import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateRestaurantCredentials } from '@/lib/auth'

/**
 * GET: Fetch all restaurants with form counts
 * POST: Create a new restaurant
 * 
 * @param request - The incoming request
 * @returns NextResponse with restaurants data or creation result
 */
export async function GET(request: NextRequest) {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            forms: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Restaurant name is required' },
        { status: 400 }
      )
    }

    // Generate unique credentials
    const credentials = generateRestaurantCredentials()
    const hashedPassword = await hashPassword(credentials.password)

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        username: credentials.username,
        password: hashedPassword
      }
    })

    return NextResponse.json({
      restaurant,
      credentials: {
        username: credentials.username,
        password: credentials.password
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 