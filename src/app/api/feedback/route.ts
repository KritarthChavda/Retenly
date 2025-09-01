import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { feedbackSchema, sanitizeText } from '@/lib/validation'
import { logger } from '@/lib/logger'

/**
 * Production-ready feedback submission API with duplicate prevention
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { formId, restaurantSlug } = body

    // Validate input
    const validation = feedbackSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Feedback validation failed', { 
        errors: validation.error.errors,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, phoneNumber, experience, feedback } = validation.data

    // Sanitize text inputs
    const sanitizedName = sanitizeText(name)
    const sanitizedFeedback = feedback ? sanitizeText(feedback) : null

    // Find form by ID or restaurant slug
    let targetForm
    if (formId) {
      targetForm = await prisma.form.findUnique({
        where: { id: formId },
        include: { restaurant: true }
      })
    } else if (restaurantSlug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: restaurantSlug },
        include: { forms: { take: 1 } }
      })
      targetForm = restaurant?.forms[0]
    }

    if (!targetForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Check for duplicate feedback (same phone + form within 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        phoneNumber,
        formId: targetForm.id,
        createdAt: {
          gte: twentyFourHoursAgo
        }
      }
    })

    if (existingFeedback) {
      logger.warn('Duplicate feedback attempt blocked', {
        phoneNumber: phoneNumber.substring(0, 4) + '****', // Partial phone for privacy
        formId: targetForm.id,
        restaurantId: targetForm.restaurantId
      })
      return NextResponse.json(
        { error: 'Feedback already submitted recently. Please try again tomorrow.' },
        { status: 409 }
      )
    }

    // Create feedback record
    const newFeedback = await prisma.feedback.create({
      data: {
        name: sanitizedName,
        phoneNumber,
        experience,
        feedback: sanitizedFeedback,
        formId: targetForm.id
      }
    })

    logger.info('Feedback submitted successfully', {
      feedbackId: newFeedback.id,
      formId: targetForm.id,
      restaurantId: targetForm.restaurantId,
      experience,
      duration: Date.now() - startTime
    })

    return NextResponse.json(
      { 
        message: 'Feedback submitted successfully!',
        id: newFeedback.id,
        redirectUrl: `/forms/${targetForm.restaurant?.slug}/thank-you`
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error submitting feedback', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 