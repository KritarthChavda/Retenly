export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRestaurantCredentials, hashPassword } from '@/lib/auth'
import { generateUniqueSlug } from '@/lib/utils'
import { sendRestaurantCredentials } from '@/lib/email'

/**
 * GET: Fetch all restaurants
 * POST: Create a new restaurant
 */
export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            forms: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
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
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Restaurant name and email are required' },
        { status: 400 }
      )
    }

    // Get existing slugs to check for uniqueness
    const existingSlugs = await prisma.restaurant.findMany({
      select: { slug: true }
    })
    const existingSlugValues = existingSlugs.map(r => r.slug)

    // Generate unique slug
    const slug = generateUniqueSlug(name, existingSlugValues)

    // Generate credentials
    const credentials = generateRestaurantCredentials()
    const hashedPassword = await hashPassword(credentials.password)

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        email,
        slug,
        username: credentials.username,
        password: hashedPassword
      }
    })

    // Try to send credentials via email
    let emailSent = false
    try {
      await sendRestaurantCredentials(email, credentials.username, credentials.password, name)
      emailSent = true
    } catch (emailError) {
      console.warn('Failed to send email, but restaurant was created:', emailError)
    }

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
        slug: restaurant.slug,
        username: restaurant.username,
        createdAt: restaurant.createdAt
      },
      credentials: {
        username: credentials.username,
        password: credentials.password
      },
      emailSent
    })
  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 