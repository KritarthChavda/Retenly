export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  calculateSentimentDistribution,
  calculateAverageRating 
} from '@/lib/sentiment'
import { verifyToken } from '@/lib/auth-edge'

function safeParseThemes(serialized: string | null | undefined): string[] {
  if (!serialized) return []
  try {
    const parsed = JSON.parse(serialized)
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return []
  }
}

/**
 * GET: Fetch restaurant dashboard data including analytics and feedback
 * 
 * @param request - The incoming request with restaurant session
 * @returns NextResponse with dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== [api/restaurant/dashboard] DASHBOARD API CALLED ===');
    
    const token = request.cookies.get('auth-token')?.value
    console.log('[api/restaurant/dashboard] Token found:', !!token);
    
    if (!token) {
      console.log('❌ [api/restaurant/dashboard] No token found in cookies');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    console.log('[api/restaurant/dashboard] Token verification result:', payload);
    
    if (!payload || payload.type !== 'restaurant') {
      console.log('❌ [api/restaurant/dashboard] Invalid token or not restaurant user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurantId = payload.id
    console.log('[api/restaurant/dashboard] Authenticated user ID:', restaurantId);

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url);
    const includeAllFeedbacks = searchParams.get('includeAllFeedbacks') === 'true';

    const allFeedbacks = await prisma.feedback.findMany({
        where: {
            form: {
                restaurantId: restaurantId
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const totalFeedbackCount = allFeedbacks.length;

    const feedbackData = allFeedbacks.map(f => ({ experience: f.experience, rating: f.rating }));

    const sentimentDistribution = calculateSentimentDistribution(feedbackData)
    const averageRating = calculateAverageRating(feedbackData)

    const csatScore = totalFeedbackCount > 0 
      ? Math.round((sentimentDistribution.positive / totalFeedbackCount) * 100) 
      : 0

    const npsScore = totalFeedbackCount > 0 
      ? Math.round(((sentimentDistribution.positive - sentimentDistribution.negative) / totalFeedbackCount) * 100) 
      : 0

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

    const curatedHighlights = await prisma.topFeedback.findMany({
      where: { restaurantId },
      orderBy: [
        { generatedAt: 'desc' },
        { confidence: 'desc' }
      ]
    })

    let topHighlights = curatedHighlights.slice(0, 6).map((item) => ({
      id: item.feedbackId ?? item.id,
      summary: item.summary,
      generatedAt: item.generatedAt,
      themes: safeParseThemes(item.themes),
      confidence: item.confidence,
      type: item.type === 'negative' ? 'negative' as const : 'positive' as const
    }))

    if (!topHighlights.length) {
      const fallbackPositive = allFeedbacks
        .filter(f => f.experience === 'YO!' || f.experience === 'Pretty good')
        .slice(0, 3)
        .map((f) => ({
          id: f.id,
          summary: f.feedback || f.experience || 'Guests reported a positive experience.',
          generatedAt: f.createdAt,
          themes: [],
          confidence: 0.6,
          type: 'positive' as const
        }))

      const fallbackNegative = allFeedbacks
        .filter(f => f.experience === 'Not great' || f.experience === 'Poor')
        .slice(0, 3)
        .map((f) => ({
          id: f.id,
          summary: f.feedback || f.experience || 'Guests reported issues requiring attention.',
          generatedAt: f.createdAt,
          themes: [],
          confidence: 0.6,
          type: 'negative' as const
        }))

      topHighlights = [...fallbackPositive, ...fallbackNegative]
    }

    const sentimentData = {
      positive: sentimentDistribution.positive,
      neutral: sentimentDistribution.neutral,
      negative: sentimentDistribution.negative
    }

    const phoneCounts = allFeedbacks.reduce((acc, feedback) => {
      const rawPhone = typeof feedback.phoneNumber === 'string' ? feedback.phoneNumber.trim() : ''
      if (!rawPhone || rawPhone.toLowerCase() === 'n/a') {
        return acc
      }
      const normalizedPhone = rawPhone.replace(/\s+/g, '')
      acc.set(normalizedPhone, (acc.get(normalizedPhone) ?? 0) + 1)
      return acc
    }, new Map<string, number>())

    const totalUniqueCustomers = phoneCounts.size
    const repeatCustomers = Array.from(phoneCounts.values()).filter(count => count > 1).length
    const repeatFeedbackRate =
      totalUniqueCustomers > 0
        ? Math.round((repeatCustomers / totalUniqueCustomers) * 100)
        : 0

    const forms = await prisma.form.findMany({
        where: { restaurantId },
        include: {
            _count: {
                select: { feedbacks: true, responses: true }
            }
        }
    });

    const responseData: any = {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        username: restaurant.username,
        logoUrl: (restaurant as any).logoUrl
      },
      analytics: {
        totalFeedbackCount,
        sentimentData,
        csatScore,
        npsScore,
        mostLovedFeature,
        averageRating,
        repeatFeedbackRate,
        kpiCardData: {
            totalFeedback: { change: 12, changeLabel: 'vs last month' },
            averageRating: { change: 8, changeLabel: 'vs last month' },
            positiveFeedback: { change: 5, changeLabel: 'vs last month' },
            repeatFeedbackRate: { change: 3, changeLabel: 'vs last month' }
        }
      },
      topHighlights,
      recentFeedbacks: allFeedbacks.slice(0, 10).map(f => ({
        id: f.id,
        name: f.name || 'Anonymous',
        text: f.feedback || 'No text feedback',
        experience: f.experience,
        rating: f.rating || 3,
        sentiment: f.sentiment || 'neutral',
        createdAt: f.createdAt,
        phoneNumber: f.phoneNumber || 'N/A'
      })),
      forms: forms.map(form => ({
        id: form.id,
        title: form.title,
        feedbackCount: form._count.feedbacks,
        responseCount: form._count.responses
      }))
    };

    if (includeAllFeedbacks) {
        responseData.allFeedbacks = allFeedbacks;
    }

    responseData.topHighlightsGeneratedAt =
      curatedHighlights[0]?.generatedAt ?? topHighlights[0]?.generatedAt ?? null

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
