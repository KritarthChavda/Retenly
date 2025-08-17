import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST: Submit form responses
 * 
 * @param request - The incoming request with form answers
 * @param params - Route parameters containing formId
 * @returns NextResponse with success/error status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params
    const body = await request.json()
    const { answers } = body

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }

    // Verify form exists
    const form = await prisma.form.findUnique({
      where: { id: formId }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Store the response
    const response = await prisma.response.create({
      data: {
        formId,
        answers: JSON.stringify(answers)
      }
    })

    return NextResponse.json({
      message: 'Response submitted successfully',
      responseId: response.id
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting response:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 