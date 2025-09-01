import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch all responses for a specific restaurant's form
 * 
 * @param request - The incoming request
 * @param params - Route parameters containing restaurant slug
 * @returns NextResponse with responses data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId: restaurantSlug } = await params

    if (!restaurantSlug) {
      return NextResponse.json(
        { error: 'Restaurant slug is required' },
        { status: 400 }
      )
    }

    // Find the restaurant by slug and get its most recent form
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      include: {
        forms: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            questions: {
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        }
      }
    })

    if (!restaurant || restaurant.forms.length === 0) {
      return NextResponse.json(
        { error: 'Form not found for this restaurant' },
        { status: 404 }
      )
    }

    const form = restaurant.forms[0]

    // Fetch responses for this form
    const responses = await prisma.response.findMany({
      where: { formId: form.id },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse answers for each response
    const responsesWithAnswers = responses.map(response => ({
      ...response,
      answers: JSON.parse(response.answers)
    }))

    return NextResponse.json({
      form: {
        ...form,
        restaurant: {
          name: restaurant.name
        }
      },
      responses: responsesWithAnswers
    })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 