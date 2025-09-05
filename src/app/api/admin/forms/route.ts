export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch all forms with restaurant and question/feedback counts
 * POST: Create a new form with questions
 * 
 * @param request - The incoming request
 * @returns NextResponse with forms data or creation result
 */
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }
    const forms = await prisma.form.findMany({
      include: {
        restaurant: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            questions: true,
            feedbacks: true,
            responses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }
    const body = await request.json()
    const { 
      restaurantSlug, 
      title, 
      subtitle, 
      closingMessage, 
      logoUrl, 
      coverImageUrl, 
      questions 
    } = body

    if (!restaurantSlug || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Restaurant slug, title, and questions array are required' },
        { status: 400 }
      )
    }

    // Verify restaurant exists by slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Create form with questions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const form = await tx.form.create({
        data: {
          restaurantId: restaurant.id,
          title,
          subtitle: subtitle || null,
          closingMessage: closingMessage || null,
          logoUrl: logoUrl || null,
          coverImageUrl: coverImageUrl || null
        }
      })

      // Create questions
      const createdQuestions = await Promise.all(
        questions.map((question: any) =>
          tx.question.create({
            data: {
              formId: form.id,
              questionText: question.questionText,
              type: question.type,
              options: question.options ? JSON.stringify(question.options) : null
            }
          })
        )
      )

      return { form, questions: createdQuestions }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 