import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Handles POST requests to submit restaurant feedback
 * 
 * @param request - The incoming request containing feedback data
 * @returns NextResponse with success/error status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phoneNumber, experience, feedback } = body

    // Validate required fields
    if (!name || !phoneNumber || !experience) {
      return NextResponse.json(
        { error: 'Name, phone number, and experience are required' },
        { status: 400 }
      )
    }

    // Validate experience options
    const validExperiences = ['YO!', 'Pretty good', 'Okay-ish', 'Not great', 'Poor']
    if (!validExperiences.includes(experience)) {
      return NextResponse.json(
        { error: 'Invalid experience selection' },
        { status: 400 }
      )
    }

    // Create feedback record in database, connected to default form
    const newFeedback = await prisma.feedback.create({
      data: {
        name,
        phoneNumber,
        experience,
        feedback: feedback || null,
        form: {
          connect: {
            id: 'default-form'
          }
        }
      },
    })

    return NextResponse.json(
      { 
        message: 'Feedback submitted successfully!',
        id: newFeedback.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 