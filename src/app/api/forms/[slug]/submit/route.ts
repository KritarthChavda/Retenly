export const runtime = 'nodejs'

import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractPhoneNumber, extractCustomerName, extractRatingFromAnswers } from '@/lib/sentiment'
import { validatePhoneNumber, formatPhoneNumberToE164 } from '@/lib/validation'

/**
 * POST: Submit feedback for a restaurant by slug
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    console.log('Submitting feedback for slug:', slug, 'Body:', body)

    // Validate input
    if (!body.answers || typeof body.answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid input: answers object is required' },
        { status: 400 }
      )
    }

    const { answers } = body

    // Find restaurant by slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        forms: {
          include: {
            questions: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!restaurant || !restaurant.forms[0]) {
      console.warn('Restaurant or form not found for slug:', slug)
      return NextResponse.json(
        { error: 'Restaurant form not found' },
        { status: 404 }
      )
    }

    const form = restaurant.forms[0]
    const phoneNumber = extractPhoneNumber(answers)
    const customerName = extractCustomerName(answers)

    // Validate & normalize phone number first (required behavior)
    let normalizedPhone: string | null = null
    if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) {
      if (!validatePhoneNumber(phoneNumber)) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      }
      normalizedPhone = formatPhoneNumberToE164(phoneNumber)
      if (!normalizedPhone) {
        return NextResponse.json({ error: 'Unable to format phone number' }, { status: 400 })
      }
    }

    console.log('Processing feedback:', {
      restaurantName: restaurant.name,
      formTitle: form.title,
      customerName,
      phoneNumber: normalizedPhone ?? phoneNumber,
      experience: answers.experience
    })

    // Hash the phone number
    // const hashedPhoneNumber = phoneNumber && phoneNumber !== 'N/A' ? await bcrypt.hash(phoneNumber, 10) : ''

    
    // Extract experience and rating
    const experience = answers.experience || null
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    let rating = 3

    if (experience && typeof experience === 'string') {
      // Map experience to sentiment and rating
      switch (experience) {
        case 'YO!':
          sentiment = 'positive'
          rating = 5
          break
        case 'Pretty good':
          sentiment = 'positive'
          rating = 4
          break
        case 'Okay-ish':
          sentiment = 'neutral'
          rating = 3
          break
        case 'Not great':
          sentiment = 'negative'
          rating = 2
          break
        case 'Poor':
          sentiment = 'negative'
          rating = 1
          break
        default:
          sentiment = 'neutral'
          rating = 3
      }
    } else {
      rating = extractRatingFromAnswers(answers) || 3
      if (rating >= 4) sentiment = 'positive'
      else if (rating <= 2) sentiment = 'negative'
    }

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        formId: form.id,
        name: customerName,
        phoneNumber: normalizedPhone ?? phoneNumber,
        experience: experience,
        sentiment: sentiment,
        rating: rating,
        feedback: answers.feedback || null
      }
    })

    console.log('Feedback submitted successfully:', {
      feedbackId: feedback.id,
      restaurantId: restaurant.id,
      formId: form.id,
      customerName,
      phoneNumber,
      experience,
      sentiment,
      rating
    })

    console.log('Feedback submitted successfully:', { feedbackId: feedback.id, phoneNumber: feedback.phoneNumber })

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: 'Feedback submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting feedback:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
