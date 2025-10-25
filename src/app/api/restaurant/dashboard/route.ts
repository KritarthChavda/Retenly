export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  calculateSentimentDistribution,
  calculateAverageRating 
} from '@/lib/sentiment'
import { verifyToken } from '@/lib/auth-edge'
import { HighlightWindow } from '@/generated/prisma' 

function safeParseThemes(s: string): string[] { try { return JSON.parse(s) } catch { return [] } }
function computeMostLoved(rows: any[]): string {
  const keywords = ['food','service','ambience','staff','delicious','great','amazing','love','excellent']
  const counts: Record<string,number> = {}
  for (const r of rows) {
    const t = (r.feedback || "").toLowerCase()
    for (const k of keywords) if (t.includes(k)) counts[k] = (counts[k]||0)+1
  }
  return Object.keys(counts).length ? Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0] : 'No feedback yet'
}

// map query param -> enum
function resolveWindow(
  key: '7d' | '30d' | '90d'
): { windowEnum: HighlightWindow; start: Date; end: Date } {
  const end = new Date()
  const days = key === '7d' ? 7 : key === '30d' ? 30 : 90
  const start = new Date(end)
  start.setDate(end.getDate() - days)

  const windowEnum =
    key === '7d' ? HighlightWindow.D7 :
    key === '30d' ? HighlightWindow.D30 :
                    HighlightWindow.D90

  return { windowEnum, start, end }
}

/**
 * GET: Fetch restaurant dashboard data including analytics and feedback
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload || payload.type !== 'restaurant') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const restaurantId = payload.id
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const includeAllFeedbacks = searchParams.get('includeAllFeedbacks') === 'true'
    const windowKey = (searchParams.get('window') ?? '30d') as '7d'|'30d'|'90d'

    // ✅ compute enum + bounds once
    const { windowEnum, start, end } = resolveWindow(windowKey)

    // feedbacks in window
    const allFeedbacks = await prisma.feedback.findMany({
      where: { form: { restaurantId }, createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'desc' }
    })

    const totalFeedbackCount = allFeedbacks.length
    const feedbackData = allFeedbacks.map(f => ({ experience: f.experience, rating: f.rating }))

    const sentimentDistribution = calculateSentimentDistribution(feedbackData)
    const averageRating = calculateAverageRating(feedbackData)

    const csatScore = totalFeedbackCount ? Math.round((sentimentDistribution.positive / totalFeedbackCount) * 100) : 0
    const npsScore  = totalFeedbackCount ? Math.round(((sentimentDistribution.positive - sentimentDistribution.negative) / totalFeedbackCount) * 100) : 0

    // ⬇️ THIS is the fix: use enum + range (no strings like "_30d")
    const curatedHighlights = await prisma.topFeedback.findMany({
      where: {
        restaurantId,
        window: windowEnum,             // 👈 enum, not string
      },
      orderBy: [{ generatedAt: 'desc' }, { confidence: 'desc' }]
    })

    const topHighlights = curatedHighlights.map(item => ({
      id: item.feedbackId ?? item.id,
      summary: item.summary,
      generatedAt: item.generatedAt,
      themes: safeParseThemes(item.themes),
      confidence: item.confidence,
      type: item.type === 'negative' ? 'negative' as const : 'positive' as const
    }))

    const response = {
      restaurant,
      analytics: {
        totalFeedbackCount,
        sentimentData: sentimentDistribution,
        csatScore,
        npsScore,
        mostLovedFeature: computeMostLoved(allFeedbacks),
        averageRating,
        repeatFeedbackRate: 0, // placeholder
        kpiCardData: buildKpis()
      },
      topHighlights,
      recentFeedbacks: allFeedbacks.slice(0, 20),
      forms: [],
      allFeedbacks: includeAllFeedbacks ? allFeedbacks : []
    }

    return NextResponse.json(response)

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// keep your existing buildKpis or define it if missing
function buildKpis() {
  return {
    totalFeedback: { change: 0, changeLabel: 'vs last month' },
    averageRating: { change: 0, changeLabel: 'vs last month' },
    positiveFeedback: { change: 0, changeLabel: 'vs last month' },
    repeatFeedbackRate: { change: 0, changeLabel: 'vs last month' }
  }
}
