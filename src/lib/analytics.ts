import { prisma } from './prisma'
import { logger } from './logger'

/**
 * Production-ready analytics and dashboard calculations
 */

export interface FeedbackAnalytics {
  totalFeedbacks: number
  averageRating: number
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  recentTrends: {
    thisWeek: number
    lastWeek: number
    growth: number
  }
}

export interface ResponseAnalytics {
  totalResponses: number
  completionRate: number
  averageResponseTime: number
  popularAnswers: Record<string, any>
}

/**
 * Calculate comprehensive feedback analytics for a restaurant
 */
export async function calculateFeedbackAnalytics(restaurantId: string): Promise<FeedbackAnalytics> {
  try {
    // Get all feedbacks for the restaurant
    const feedbacks = await prisma.feedback.findMany({
      where: {
        form: {
          restaurantId
        }
      },
      include: {
        form: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get responses for dynamic forms
    const responses = await prisma.response.findMany({
      where: {
        form: {
          restaurantId
        }
      },
      include: {
        form: true
      }
    })

    // Calculate total feedbacks
    const totalFeedbacks = feedbacks.length + responses.length

    // Calculate average rating
    let totalRating = 0
    let ratingCount = 0
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    // Process standard feedbacks
    feedbacks.forEach((feedback: any) => {
      const rating = mapExperienceToRating(feedback.experience)
      totalRating += rating
      ratingCount++
      ratingDistribution[rating as keyof typeof ratingDistribution]++
    })

    // Process dynamic form responses
    responses.forEach((response: any) => {
      try {
        const answers = JSON.parse(response.answers)
        const rating = extractRatingFromAnswers(answers)
        totalRating += rating
        ratingCount++
        ratingDistribution[rating as keyof typeof ratingDistribution]++
      } catch (error) {
        logger.warn('Failed to parse response answers', { responseId: response.id, error })
      }
    })

    const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0

    // Calculate sentiment distribution
    let positive = 0, neutral = 0, negative = 0

    feedbacks.forEach((feedback: any) => {
      const sentiment = mapExperienceToSentiment(feedback.experience)
      if (sentiment === 'positive') positive++
      else if (sentiment === 'neutral') neutral++
      else negative++
    })

    responses.forEach((response: any) => {
      try {
        const answers = JSON.parse(response.answers)
        const rating = extractRatingFromAnswers(answers)
        const sentiment = mapRatingToSentiment(rating)
        if (sentiment === 'positive') positive++
        else if (sentiment === 'neutral') neutral++
        else negative++
      } catch (error) {
        logger.warn('Failed to analyze response sentiment', { responseId: response.id, error })
      }
    })

    // Calculate recent trends
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const thisWeekFeedbacks = feedbacks.filter((f: any) => f.createdAt >= oneWeekAgo).length +
                             responses.filter((r: any) => r.createdAt >= oneWeekAgo).length

    const lastWeekFeedbacks = feedbacks.filter((f: any) => 
      f.createdAt >= twoWeeksAgo && f.createdAt < oneWeekAgo
    ).length + responses.filter((r: any) => 
      r.createdAt >= twoWeeksAgo && r.createdAt < oneWeekAgo
    ).length

    const growth = lastWeekFeedbacks > 0 
      ? Math.round(((thisWeekFeedbacks - lastWeekFeedbacks) / lastWeekFeedbacks) * 100)
      : thisWeekFeedbacks > 0 ? 100 : 0

    return {
      totalFeedbacks,
      averageRating,
      sentimentDistribution: { positive, neutral, negative },
      ratingDistribution,
      recentTrends: {
        thisWeek: thisWeekFeedbacks,
        lastWeek: lastWeekFeedbacks,
        growth
      }
    }
  } catch (error) {
    logger.error('Error calculating feedback analytics', { restaurantId, error })
    throw new Error('Failed to calculate analytics')
  }
}

/**
 * Calculate response analytics for dynamic forms
 */
export async function calculateResponseAnalytics(formId: string): Promise<ResponseAnalytics> {
  try {
    const responses = await prisma.response.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' }
    })

    const totalResponses = responses.length
    
    // Calculate completion rate (assuming all stored responses are complete)
    const completionRate = 100

    // Calculate average response time (placeholder - would need to track start/end times)
    const averageResponseTime = 0

    // Analyze popular answers
    const popularAnswers: Record<string, any> = {}
    
    responses.forEach((response: any) => {
      try {
        const answers = JSON.parse(response.answers)
        Object.entries(answers).forEach(([key, value]) => {
          if (!popularAnswers[key]) {
            popularAnswers[key] = {}
          }
          
          const stringValue = String(value)
          popularAnswers[key][stringValue] = (popularAnswers[key][stringValue] || 0) + 1
        })
      } catch (error) {
        logger.warn('Failed to parse response for analytics', { responseId: response.id, error })
      }
    })

    return {
      totalResponses,
      completionRate,
      averageResponseTime,
      popularAnswers
    }
  } catch (error) {
    logger.error('Error calculating response analytics', { formId, error })
    throw new Error('Failed to calculate response analytics')
  }
}

/**
 * Map experience string to rating number
 */
function mapExperienceToRating(experience: string): number {
  switch (experience) {
    case 'YO!':
    case '😍':
      return 5
    case 'Pretty good':
    case '😊':
      return 4
    case 'Okay-ish':
    case '😐':
      return 3
    case 'Poor':
    case '🙁':
      return 2
    case 'Not great':
    case '😡':
      return 1
    default:
      return 3
  }
}

/**
 * Map experience string to sentiment
 */
function mapExperienceToSentiment(experience: string): 'positive' | 'neutral' | 'negative' {
  const rating = mapExperienceToRating(experience)
  return mapRatingToSentiment(rating)
}

/**
 * Map rating number to sentiment
 */
function mapRatingToSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}

/**
 * Extract rating from dynamic form answers
 */
function extractRatingFromAnswers(answers: Record<string, any>): number {
  // Look for numeric ratings (1-5 scale)
  const numericRatings = Object.values(answers).filter((value): value is number => 
    typeof value === 'number' && value >= 1 && value <= 5
  )
  
  if (numericRatings.length > 0) {
    return Math.round(numericRatings[0])
  }
  
  // Look for text-based ratings
  const textValues = Object.values(answers).filter((value): value is string => 
    typeof value === 'string'
  )
  
  for (const text of textValues) {
    const lowerText = text.toLowerCase().trim()
    
    if (lowerText.includes('excellent') || lowerText.includes('amazing') || lowerText === 'yo!') {
      return 5
    }
    if (lowerText.includes('good') || lowerText.includes('great') || lowerText === 'pretty good') {
      return 4
    }
    if (lowerText.includes('okay') || lowerText.includes('fine') || lowerText === 'okay-ish') {
      return 3
    }
    if (lowerText.includes('poor') || lowerText === 'poor') {
      return 2
    }
    if (lowerText.includes('terrible') || lowerText.includes('bad') || lowerText === 'not great') {
      return 1
    }
  }
  
  return 3 // Default neutral rating
}

/**
 * Get analytics for admin dashboard (all restaurants)
 */
export async function getAdminAnalytics() {
  try {
    const restaurants = await prisma.restaurant.count()
    const totalFeedbacks = await prisma.feedback.count()
    const totalResponses = await prisma.response.count()
    
    const recentFeedbacks = await prisma.feedback.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        form: {
          include: {
            restaurant: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return {
      totalRestaurants: restaurants,
      totalFeedbacks: totalFeedbacks + totalResponses,
      recentActivity: recentFeedbacks
    }
  } catch (error) {
    logger.error('Error calculating admin analytics', { error })
    throw new Error('Failed to calculate admin analytics')
  }
}
