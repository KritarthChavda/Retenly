import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { feedbackSchema, sanitizeText, formatPhoneNumberToE164, validatePhoneNumber } from '@/lib/validation'
import { logger } from '@/lib/logger'
import type { Form, Restaurant } from '@/generated/prisma'


/**
 * Production-ready feedback submission API with duplicate prevention
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { formId, restaurantSlug } = body

    // Validate phone number first (required behavior)
    const rawPhone = body?.phoneNumber
    if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (!validatePhoneNumber(rawPhone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    const normalizedPhone = formatPhoneNumberToE164(rawPhone)
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Unable to format phone number' }, { status: 400 })
    }

    // Replace body.phoneNumber with normalized value so downstream validation sees formatted number
    body.phoneNumber = normalizedPhone

    // Now run the full schema validation for the rest of the fields
    const validation = feedbackSchema.safeParse(body)
    if (!validation.success) {
      // Logger likely expects a string — stringify metadata
      logger.warn(
        `Feedback validation failed | errors=${JSON.stringify(
          validation.error.errors
        )} | ip=${request.headers.get('x-forwarded-for') ?? 'unknown'}`
      )
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, phoneNumber, experience, feedback, voiceRecordingUrl } = validation.data

    // Sanitize text inputs
    const sanitizedName = sanitizeText(name)
    const sanitizedFeedback = feedback ? sanitizeText(feedback) : null

    // Find form by ID or restaurant slug (typed to include restaurant relation)
    let targetForm: (Form & { restaurant: Restaurant | null }) | null = null

    if (formId) {
      targetForm = await prisma.form.findUnique({
        where: { id: formId },
        include: { restaurant: true }, // include restaurant for redirect
      })
    } else if (restaurantSlug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: restaurantSlug },
        include: {
          forms: { take: 1, include: { restaurant: true } }, // include restaurant on forms
        },
      })
      targetForm = restaurant?.forms[0] ?? null
    }

    if (!targetForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Hash the phone number
    // const hashedPhoneNumber = await bcrypt.hash(phoneNumber, 10)

    // Create feedback record
    const newFeedback = await prisma.feedback.create({
      data: {
        name: sanitizedName,
        phoneNumber,
        experience,
        feedback: sanitizedFeedback,
        voiceRecordingUrl,
        formId: targetForm.id,
      },
    })

    logger.info(
      `Feedback submitted successfully | feedbackId=${newFeedback.id} | formId=${targetForm.id} | restaurantId=${targetForm.restaurantId} | experience=${experience} | duration=${Date.now() - startTime}ms`
    )

    // Build redirect slug robustly
    const slugForRedirect = restaurantSlug ?? targetForm.restaurant?.slug ?? null

    return NextResponse.json(
      {
        message: 'Feedback submitted successfully!',
        id: newFeedback.id,
        ...(slugForRedirect
          ? { redirectUrl: `/forms/${slugForRedirect}/thank-you` }
          : {}),
      },
      { status: 201 }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error(
      `Error submitting feedback | error=${msg} | duration=${Date.now() - startTime}ms`
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
