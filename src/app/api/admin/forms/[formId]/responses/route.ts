import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch all responses for a specific form
 * 
 * @param request - The incoming request
 * @param params - Route parameters containing formId
 * @returns NextResponse with responses data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Verify form exists
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        restaurant: {
          select: {
            name: true
          }
        },
        questions: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Fetch responses
    const responses = await prisma.response.findMany({
      where: { formId },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse answers for each response
    const responsesWithAnswers = responses.map(response => ({
      ...response,
      answers: JSON.parse(response.answers)
    }))

    return NextResponse.json({
      form,
      responses: responsesWithAnswers
    })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 