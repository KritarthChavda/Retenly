export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  analyzeFeedbackExperience, 
  analyzeNumericRating, 
  extractRatingFromAnswers,
  calculateSentimentDistribution,
  calculateAverageRating 
} from '@/lib/sentiment'

/**
 * GET: Fetch restaurant dashboard data including analytics and feedback
 * 
 * @param request - The incoming request with restaurant session
 * @returns NextResponse with dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== RESTAURANT DASHBOARD API CALLED ===')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Get restaurant ID from JWT token in headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    const userType = request.headers.get('x-user-type')
    
    console.log('Extracted from headers:', { userId, userType })
    
    if (!userId || userType !== 'restaurant') {
      console.error('❌ Authentication failed:', { userId, userType })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const restaurantId = userId
    console.log('🔍 Looking for restaurant with ID:', restaurantId)

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!restaurant) {
      console.error('❌ Restaurant not found in database for ID:', restaurantId)
      
      // Let's also check what restaurants exist
      const allRestaurants = await prisma.restaurant.findMany({
        select: { id: true, name: true, username: true, slug: true }
      })
      console.log('📋 All restaurants in database:', allRestaurants)
      
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    console.log('✅ Restaurant found:', {
      id: restaurant.id,
      name: restaurant.name,
      username: restaurant.username,
      slug: restaurant.slug
    })
    console.log('Looking for forms with restaurantId:', restaurantId)

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

    console.log('=== FORMS DEBUG ===')
    console.log('Forms found:', forms.length)
    forms.forEach((form, index) => {
      console.log(`Form ${index + 1}:`, {
        id: form.id,
        title: form.title,
        feedbacksCount: form.feedbacks.length,
        responsesCount: form.responses.length
      })
      
      if (form.feedbacks.length > 0) {
        console.log(`Form ${index + 1} feedbacks:`, form.feedbacks.map(f => ({
          id: f.id,
          experience: f.experience,
          feedback: f.feedback,
          name: f.name
        })))
      }
    })

    // Alternative: Direct feedback query to debug
    const directFeedbacks = await prisma.feedback.findMany({
      where: {
        form: {
          restaurantId: restaurantId
        }
      },
      include: {
        form: {
          select: {
            title: true,
            restaurant: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    console.log('=== DIRECT FEEDBACK QUERY ===')
    console.log('Direct feedbacks found:', directFeedbacks.length)
    directFeedbacks.forEach((f, index) => {
      console.log(`Direct feedback ${index + 1}:`, {
        id: f.id,
        experience: f.experience,
        feedback: f.feedback,
        name: f.name,
        formTitle: f.form.title,
        restaurantName: f.form.restaurant.name
      })
    })

    // Calculate analytics
    const allFeedbacks = directFeedbacks.length > 0 ? directFeedbacks : forms.flatMap(form => form.feedbacks)
    const allResponses = forms.flatMap(form => form.responses)

    console.log('=== USING FEEDBACK DATA ===')
    console.log('Using directFeedbacks:', directFeedbacks.length > 0)
    console.log('All feedbacks count:', allFeedbacks.length)
    console.log('All responses count:', allResponses.length)
    
    if (allFeedbacks.length > 0) {
      console.log('Sample feedback:', allFeedbacks[0])
    }
    if (allResponses.length > 0) {
      console.log('Sample response:', allResponses[0])
    }

    // Prepare feedback data for analysis
    const feedbackData = [
      ...allFeedbacks.map(f => ({ experience: f.experience })),
      ...allResponses.map(r => {
        try {
          const answers = JSON.parse(r.answers)
          const rating = extractRatingFromAnswers(answers)
          return { rating }
        } catch (error) {
          return { rating: 3 }
        }
      })
    ]

    // Calculate sentiment distribution using utility functions
    const sentimentDistribution = calculateSentimentDistribution(feedbackData)
    const averageRating = calculateAverageRating(feedbackData)
    const totalFeedbackCount = feedbackData.length

    console.log('=== CALCULATED ANALYTICS ===')
    console.log('Sentiment distribution:', sentimentDistribution)
    console.log('Average rating:', averageRating)
    console.log('Total feedback count:', totalFeedbackCount)

    // Calculate CSAT (Customer Satisfaction Score) - percentage of 4-5 star ratings
    const csatScore = totalFeedbackCount > 0 
      ? Math.round((sentimentDistribution.positive / totalFeedbackCount) * 100) 
      : 0

    // Calculate NPS (Net Promoter Score)
    const npsScore = totalFeedbackCount > 0 
      ? Math.round(((sentimentDistribution.positive - sentimentDistribution.negative) / totalFeedbackCount) * 100) 
      : 0

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
      .filter(f => f.experience === 'Not great' || f.experience === 'Poor')
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
      positive: sentimentDistribution.positive,
      neutral: sentimentDistribution.neutral,
      negative: sentimentDistribution.negative
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
        mostLovedFeature,
        averageRating
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