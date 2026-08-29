export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Dynamic routing API for restaurant feedback forms by slug
 * GET: Fetch form data for a restaurant by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Business slug is required' },
        { status: 400 }
      )
    }

    console.log('Fetching form for restaurant slug:', slug)

    // Find restaurant by slug with its forms
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        forms: {
          include: {
            questions: {
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }, // Get the most recent form
          take: 1
        }
      }
    })

    if (!restaurant) {
      console.warn('Restaurant not found by slug:', slug)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const form = restaurant.forms[0]
    if (!form) {
      console.warn('No forms found for restaurant:', { restaurantId: restaurant.id, slug })
      return NextResponse.json(
        { error: 'No feedback form available for this business' },
        { status: 404 }
      )
    }

    console.log('Form fetched successfully:', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      formId: form.id,
      formTitle: form.title,
      questionsCount: form.questions.length
    })

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug
      },
      form: {
        id: form.id,
        title: form.title,
        subtitle: form.subtitle,
        closingMessage: form.closingMessage,
        logoUrl: form.logoUrl,
        coverImageUrl: form.coverImageUrl,
        questions: form.questions
      }
    })
  } catch (error) {
    console.error('Error fetching form by slug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
