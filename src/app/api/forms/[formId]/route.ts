import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET: Fetch a specific form with its questions
 * 
 * @param request - The incoming request
 * @param params - Route parameters containing formId
 * @returns NextResponse with form data or error
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

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 