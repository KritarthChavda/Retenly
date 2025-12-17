export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractCustomerName,
  extractPhoneNumber,
} from '@/lib/sentiment'
import {
  formatPhoneNumberToE164,
  validatePhoneNumber,
} from '@/lib/validation'

const EXPERIENCE_RATING_MAP: Record<string, { rating: number; sentiment: 'positive' | 'neutral' | 'negative' }> = {
  'YO!': { rating: 5, sentiment: 'positive' },
  'Pretty good': { rating: 4, sentiment: 'positive' },
  'Okay-ish': { rating: 3, sentiment: 'neutral' },
  'Not great': { rating: 2, sentiment: 'negative' },
  'Poor': { rating: 1, sentiment: 'negative' },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const answers = body?.answers && typeof body.answers === 'object' ? body.answers : {}

    const customerName = extractCustomerName(answers)
    const rawPhone = extractPhoneNumber(answers)
    let normalizedPhone: string | null = null

    if (rawPhone && rawPhone !== 'N/A') {
      if (!validatePhoneNumber(rawPhone)) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      }
      normalizedPhone = formatPhoneNumberToE164(rawPhone)
      if (!normalizedPhone) {
        return NextResponse.json({ error: 'Unable to format phone number' }, { status: 400 })
      }
    }

    const experience = typeof answers.experience === 'string' ? answers.experience : null
    const mapped = experience ? EXPERIENCE_RATING_MAP[experience] : undefined
    let rating = mapped?.rating ?? 3
    let sentiment = mapped?.sentiment ?? 'neutral'

    if (!mapped && typeof answers.rating === 'number') {
      rating = answers.rating
      if (rating >= 4) sentiment = 'positive'
      else if (rating <= 2) sentiment = 'negative'
    }

    const created = await prisma.demoFeedback.create({
      data: {
        name: customerName,
        phoneNumber: normalizedPhone ?? rawPhone ?? null,
        experience,
        sentiment,
        rating,
        feedback: typeof answers.feedback === 'string' ? answers.feedback : null,
      },
    })

    return NextResponse.json({
      success: true,
      feedbackId: created.id,
      message: 'Demo feedback submitted successfully',
    })
  } catch (error) {
    console.error('Error submitting demo feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
