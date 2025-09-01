export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  analyzeFeedbackExperience, 
  extractRatingFromAnswers,
  extractCustomerName,
  extractFeedbackText,
  extractPhoneNumber 
} from '@/lib/sentiment'

/**
 * GET: Fetch all feedback data for restaurant dashboard table
 * 
 * @param request - The incoming request with restaurant session and query params
 * @returns NextResponse with feedback data
 */
export async function GET(request: NextRequest) {
  try {
    // Get restaurant ID from JWT token in headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    const userType = request.headers.get('x-user-type')
    
    if (!userId || userType !== 'restaurant') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const restaurantId = userId

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const formId = searchParams.get('formId')

    // Build where conditions
    const whereConditions: any = {
      form: {
        restaurantId
      }
    }

    if (startDate && endDate) {
      whereConditions.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (formId) {
      whereConditions.formId = formId
    }

    // Get all feedbacks with form information
    const feedbacks = await prisma.feedback.findMany({
      where: whereConditions,
      include: {
        form: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get all responses with form information
    const responses = await prisma.response.findMany({
      where: whereConditions,
      include: {
        form: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Combine and format data
    const allFeedbackData = [
      ...feedbacks.map(feedback => {
        // Calculate rating and sentiment from experience using utility function
        const { rating, sentiment } = analyzeFeedbackExperience(feedback.experience)
        
        return {
          id: feedback.id,
          type: 'feedback',
          formTitle: feedback.form.title,
          formId: feedback.form.id,
          name: feedback.name,
          phoneNumber: feedback.phoneNumber,
          experience: feedback.experience,
          feedback: feedback.feedback,
          rating: rating,
          createdAt: feedback.createdAt,
          sentiment: sentiment
        }
      }),
      ...responses.map(response => {
        const answers = JSON.parse(response.answers)
        
        // Extract readable name from answers
        const customerName = extractCustomerName(answers)
        
        // Extract readable feedback text from answers
        const feedbackText = extractFeedbackText(answers)
        
        // Extract rating from answers and calculate sentiment
        const rating = extractRatingFromAnswers(answers)
        const { sentiment } = rating >= 4 ? { sentiment: 'positive' } : 
                             rating === 3 ? { sentiment: 'neutral' } : 
                             { sentiment: 'negative' }
        
        return {
          id: response.id,
          type: 'response',
          formTitle: response.form.title,
          formId: response.form.id,
          name: customerName,
          phoneNumber: extractPhoneNumber(answers),
          experience: 'N/A',
          feedback: feedbackText,
          rating: rating,
          createdAt: response.createdAt,
          sentiment: sentiment
        }
      })
    ]

    // Get available forms for filtering
    const forms = await prisma.form.findMany({
      where: { restaurantId },
      select: {
        id: true,
        title: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      feedbacks: allFeedbackData
    })
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

 