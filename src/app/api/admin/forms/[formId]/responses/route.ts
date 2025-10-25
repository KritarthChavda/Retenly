export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

function mapExperienceToRating(experience?: string | null) {
  switch (experience) {
    case 'YO!':
      return 5
    case 'Pretty good':
      return 4
    case 'Okay-ish':
      return 3
    case 'Not great':
      return 2
    case 'Poor':
      return 1
    default:
      return 3
  }
}

function buildAnswersFromFeedback(feedback: any, questions: Array<{ id: string; questionText: string; type: string }>) {
  const answers: Record<string, any> = {}
  const fallbackName = feedback.name || 'Anonymous'
  const fallbackPhone = feedback.phoneNumber || 'N/A'
  const fallbackExperience = feedback.experience || 'N/A'
  const fallbackFeedback = feedback.feedback?.toString().trim() || 'No feedback provided'
  const fallbackRating = feedback.rating || mapExperienceToRating(feedback.experience)

  for (const question of questions) {
    const text = question.questionText.toLowerCase()

    if (question.type === 'rating') {
      answers[question.id] = fallbackRating
      continue
    }

    if (text.includes('name')) {
      answers[question.id] = fallbackName
      continue
    }

    if (text.includes('phone') || text.includes('contact')) {
      answers[question.id] = fallbackPhone
      continue
    }

    if (text.includes('experience') || text.includes('overall') || text.includes('service')) {
      answers[question.id] = fallbackExperience
      continue
    }

    if (text.includes('feedback') || text.includes('comment') || text.includes('review') || text.includes('message')) {
      answers[question.id] = fallbackFeedback
      continue
    }

    answers[question.id] = fallbackFeedback
  }

  // legacy keys used by the UI as fallbacks
  answers.name = fallbackName
  answers.phoneNumber = fallbackPhone
  answers.experience = fallbackExperience
  answers.feedback = fallbackFeedback
  answers.rating = fallbackRating

  return answers
}

function normaliseResponseRecord(raw: any, questions: Array<{ id: string; questionText: string; type: string }>) {
  const answers: Record<string, any> = {}
  if (typeof raw.answers === 'string') {
    try {
      Object.assign(answers, JSON.parse(raw.answers))
    } catch (error) {
      console.warn('Failed to parse stored response answers JSON', { error })
    }
  } else if (raw.answers && typeof raw.answers === 'object') {
    Object.assign(answers, raw.answers)
  }

  // Ensure legacy keys exist for admin UI fallbacks
  if (!answers.name) {
    answers.name = answers.customerName || 'Anonymous'
  }
  if (!answers.phoneNumber) {
    answers.phoneNumber = answers.phone || 'N/A'
  }
  if (!answers.feedback) {
    answers.feedback = answers.comment || answers.message || 'No feedback provided'
  }
  if (!answers.experience && answers.rating) {
    answers.experience = answers.rating >= 4 ? 'Pretty good' : answers.rating <= 2 ? 'Not great' : 'Okay-ish'
  }

  questions.forEach((question) => {
    if (answers[question.id] === undefined) {
      const text = question.questionText.toLowerCase()
      if (text.includes('name')) {
        answers[question.id] = answers.name
      } else if (text.includes('phone') || text.includes('contact')) {
        answers[question.id] = answers.phoneNumber
      } else if (text.includes('experience')) {
        answers[question.id] = answers.experience
      } else if (question.type === 'rating') {
        answers[question.id] = answers.rating
      } else if (text.includes('feedback') || text.includes('comment') || text.includes('review')) {
        answers[question.id] = answers.feedback
      }
    }
  })

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    answers
  }
}

/**
 * GET: Fetch all responses for a specific restaurant's form
 * 
 * @param request - The incoming request
 * @param params - Route parameters containing restaurant slug
 * @returns NextResponse with responses data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { formId } = await params

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        restaurant: {
          select: {
            name: true,
            slug: true
          }
        },
        questions: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Fetch structured responses stored in the responses table
    const responses = await prisma.response.findMany({
      where: { formId: form.id },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch legacy feedback entries and normalise them into the same shape
    const feedbackEntries = await prisma.feedback.findMany({
      where: { formId: form.id },
      orderBy: { createdAt: 'desc' }
    })

    const normalisedResponses = [
      ...feedbackEntries.map((feedback) => ({
        id: feedback.id,
        createdAt: feedback.createdAt,
        answers: buildAnswersFromFeedback(feedback, form.questions)
      })),
      ...responses.map((responseRecord) => normaliseResponseRecord(responseRecord, form.questions))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      form: {
        id: form.id,
        title: form.title,
        questions: form.questions,
        restaurant: {
          name: form.restaurant.name
        }
      },
      responses: normalisedResponses
    })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
