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
    console.log('=== FEEDBACKS API CALLED ===')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Get restaurant ID from JWT token in headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    const userType = request.headers.get('x-user-type')
    
    console.log('Extracted from headers:', { userId, userType })
    
    if (!userId || userType !== 'restaurant') {
      console.log('❌ Authentication failed:', { userId, userType })
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
        const sentiment = analyzeFeedbackExperience(feedback.experience)
        // Map experience to rating
        let rating: number
        switch (feedback.experience) {
          case 'YO!': rating = 5; break
          case 'Pretty good': rating = 4; break
          case 'Okay-ish': rating = 3; break
          case 'Not great': rating = 2; break
          case 'Poor': rating = 1; break
          default: rating = 3
        }
        
        return {
          id: feedback.id,
          type: 'feedback',
          formTitle: feedback.form?.title || 'Unknown Form',
          formId: feedback.form?.id || 'unknown',
          name: feedback.name || 'Anonymous',
          phoneNumber: feedback.phoneNumber || 'N/A',
          experience: feedback.experience || 'N/A',
          feedback: feedback.feedback || 'No text feedback',
          rating: rating || 3,
          createdAt: feedback.createdAt,
          sentiment: sentiment || 'neutral'
        }
      }),
      ...responses.map(response => {
        try {
          const answers = JSON.parse(response.answers)
          
          // Extract readable name from answers
          const customerName = extractCustomerName(answers)
          
          // Extract readable feedback text from answers
          const feedbackText = extractFeedbackText(answers)
          
          // Extract rating from answers and calculate sentiment
          const rating = extractRatingFromAnswers(answers) || 3
          const sentiment = rating >= 4 ? 'positive' : 
                           rating === 3 ? 'neutral' : 
                           'negative'
          
          return {
            id: response.id,
            type: 'response',
            formTitle: response.form?.title || 'Unknown Form',
            formId: response.form?.id || 'unknown',
            name: customerName || 'Anonymous',
            phoneNumber: extractPhoneNumber(answers) || 'N/A',
            experience: 'N/A',
            feedback: feedbackText || 'No text feedback',
            rating: rating || 3,
            createdAt: response.createdAt,
            sentiment: sentiment || 'neutral'
          }
        } catch (error) {
          console.error('Error parsing response answers:', error)
          return {
            id: response.id,
            type: 'response',
            formTitle: response.form?.title || 'Unknown Form',
            formId: response.form?.id || 'unknown',
            name: 'Anonymous',
            phoneNumber: 'N/A',
            experience: 'N/A',
            feedback: 'No text feedback',
            rating: 3,
            createdAt: response.createdAt,
            sentiment: 'neutral'
          }
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

 