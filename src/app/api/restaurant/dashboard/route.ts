import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch restaurant dashboard data including analytics and feedback
 * 
 * @param request - The incoming request with restaurant session
 * @returns NextResponse with dashboard data
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

    // Get all forms for this restaurant
    const forms = await prisma.form.findMany({
      where: { restaurantId },
      include: {
        feedbacks: {
          orderBy: { createdAt: 'desc' }
        },
        responses: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Calculate analytics
    const allFeedbacks = forms.flatMap(form => form.feedbacks)
    const allResponses = forms.flatMap(form => form.responses)
    
    const totalFeedbackCount = allFeedbacks.length + allResponses.length

    // Calculate sentiment distribution (Positive/Neutral/Negative)
    let positiveCount = 0
    let neutralCount = 0
    let negativeCount = 0

    // Analyze feedbacks (experience ratings)
    allFeedbacks.forEach(feedback => {
      switch (feedback.experience) {
        case 'YO!':
        case 'Pretty good':
          positiveCount++
          break
        case 'Okay-ish':
          neutralCount++
          break
        case 'Not great':
          negativeCount++
          break
      }
    })

    // Analyze responses (rating questions)
    allResponses.forEach(response => {
      const answers = JSON.parse(response.answers)
      Object.values(answers).forEach((answer: any) => {
        if (typeof answer === 'number' && answer >= 1 && answer <= 5) {
          if (answer >= 4) positiveCount++
          else if (answer === 3) neutralCount++
          else negativeCount++
        }
      })
    })

    // Calculate CSAT (Customer Satisfaction Score)
    const totalRatings = positiveCount + neutralCount + negativeCount
    const csatScore = totalRatings > 0 ? Math.round((positiveCount / totalRatings) * 100) : 0

    // Calculate NPS (Net Promoter Score)
    const promoters = positiveCount
    const detractors = negativeCount
    const npsScore = totalRatings > 0 ? Math.round(((promoters - detractors) / totalRatings) * 100) : 0

    // Extract most-loved features from feedback text
    const positiveFeedbackTexts = allFeedbacks
      .filter(f => f.experience === 'YO!' || f.experience === 'Pretty good')
      .map(f => f.feedback)
      .filter(Boolean) as string[]

    const keywords = ['food', 'service', 'ambiance', 'staff', 'delicious', 'great', 'amazing', 'love', 'excellent']
    const keywordCounts: Record<string, number> = {}
    
    positiveFeedbackTexts.forEach(text => {
      const lowerText = text.toLowerCase()
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1
        }
      })
    })

    const mostLovedFeature = Object.keys(keywordCounts).length > 0 
      ? Object.entries(keywordCounts).sort(([,a], [,b]) => b - a)[0][0]
      : 'No feedback yet'

    // Get top 3 positive and negative feedbacks
    const topPositiveFeedbacks = allFeedbacks
      .filter(f => f.experience === 'YO!' || f.experience === 'Pretty good')
      .slice(0, 3)
      .map(f => ({
        id: f.id,
        text: f.feedback || 'No text feedback',
        experience: f.experience,
        createdAt: f.createdAt,
        name: f.name
      }))

    const topNegativeFeedbacks = allFeedbacks
      .filter(f => f.experience === 'Not great' || f.experience === 'Okay-ish')
      .slice(0, 3)
      .map(f => ({
        id: f.id,
        text: f.feedback || 'No text feedback',
        experience: f.experience,
        createdAt: f.createdAt,
        name: f.name
      }))

    // Prepare sentiment data for pie chart
    const sentimentData = {
      positive: positiveCount,
      neutral: neutralCount,
      negative: negativeCount
    }

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        username: restaurant.username
      },
      analytics: {
        totalFeedbackCount,
        sentimentData,
        csatScore,
        npsScore,
        mostLovedFeature
      },
      topPositiveFeedbacks,
      topNegativeFeedbacks,
      forms: forms.map(form => ({
        id: form.id,
        title: form.title,
        feedbackCount: form.feedbacks.length,
        responseCount: form.responses.length
      }))
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 