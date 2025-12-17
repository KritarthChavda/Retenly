export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(
      100,
      Math.max(1, limitParam ? parseInt(limitParam, 10) || 0 : 20)
    )

    const feedbacks = await prisma.demoFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ feedbacks })
  } catch (error) {
    console.error('Error fetching demo feedbacks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demo feedbacks' },
      { status: 500 }
    )
  }
}
