import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch all feedback data for restaurant dashboard table
 * 
 * @param request - The incoming request with restaurant session and query params
 * @returns NextResponse with feedback data
 */
export async function GET(request: NextRequest) {
  try {
    // Get restaurant ID from session cookie
    const restaurantSession = request.cookies.get('restaurant-session')
    
    if (!restaurantSession) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const restaurantId = restaurantSession.value

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
      ...feedbacks.map(feedback => ({
        id: feedback.id,
        type: 'feedback',
        formTitle: feedback.form.title,
        formId: feedback.form.id,
        name: feedback.name,
        phoneNumber: feedback.phoneNumber,
        experience: feedback.experience,
        feedback: feedback.feedback,
        createdAt: feedback.createdAt,
        sentiment: getSentiment(feedback.experience)
      })),
      ...responses.map(response => {
        const answers = JSON.parse(response.answers)
        return {
          id: response.id,
          type: 'response',
          formTitle: response.form.title,
          formId: response.form.id,
          name: 'Anonymous',
          phoneNumber: 'N/A',
          experience: 'N/A',
          feedback: JSON.stringify(answers),
          createdAt: response.createdAt,
          sentiment: getSentimentFromAnswers(answers)
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
      feedbacks: allFeedbackData,
      forms,
      totalCount: allFeedbackData.length
    })
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get sentiment from experience rating
 * 
 * @param experience - The experience rating
 * @returns Sentiment string
 */
function getSentiment(experience: string): string {
  switch (experience) {
    case 'YO!':
    case 'Pretty good':
      return 'Positive'
    case 'Okay-ish':
      return 'Neutral'
    case 'Not great':
      return 'Negative'
    default:
      return 'Unknown'
  }
}

/**
 * Helper function to get sentiment from response answers
 * 
 * @param answers - The response answers object
 * @returns Sentiment string
 */
function getSentimentFromAnswers(answers: Record<string, any>): string {
  const ratings = Object.values(answers).filter((value): value is number => 
    typeof value === 'number' && value >= 1 && value <= 5
  )
  
  if (ratings.length === 0) return 'Unknown'
  
  const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  
  if (avgRating >= 4) return 'Positive'
  if (avgRating >= 3) return 'Neutral'
  return 'Negative'
} 