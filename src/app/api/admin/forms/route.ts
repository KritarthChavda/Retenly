import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch all forms with restaurant and question/feedback counts
 * POST: Create a new form with questions
 * 
 * @param request - The incoming request
 * @returns NextResponse with forms data or creation result
 */
export async function GET(request: NextRequest) {
  try {
    const forms = await prisma.form.findMany({
      include: {
        restaurant: {
          select: {
            name: true
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
    const body = await request.json()
    const { 
      restaurantId, 
      title, 
      subtitle, 
      closingMessage, 
      logoUrl, 
      coverImageUrl, 
      questions 
    } = body

    if (!restaurantId || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Restaurant ID, title, and questions array are required' },
        { status: 400 }
      )
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
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
          restaurantId,
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