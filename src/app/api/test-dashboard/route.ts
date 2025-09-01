import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Test endpoint to debug dashboard data retrieval
 * 
 * @param request - The incoming request
 * @returns NextResponse with debug information
 */
export async function GET(request: NextRequest) {
  try {
    // Get all restaurants
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        username: true
      }
    })

    // Get all forms
    const forms = await prisma.form.findMany({
      select: {
        id: true,
        title: true,
        restaurantId: true,
        _count: {
          select: {
            feedbacks: true,
            responses: true
          }
        }
      }
    })

    // Get all feedbacks
    const feedbacks = await prisma.feedback.findMany({
      select: {
        id: true,
        experience: true,
        feedback: true,
        name: true,
        formId: true
      }
    })

    // Get all responses
    const responses = await prisma.response.findMany({
      select: {
        id: true,
        answers: true,
        formId: true
      }
    })

    return NextResponse.json({
      summary: {
        restaurantsCount: restaurants.length,
        formsCount: forms.length,
        feedbacksCount: feedbacks.length,
        responsesCount: responses.length
      },
      restaurants: restaurants,
      forms: forms,
      feedbacks: feedbacks.slice(0, 5), // First 5 feedbacks
      responses: responses.slice(0, 5)   // First 5 responses
    })
  } catch (error) {
    console.error('Test dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
