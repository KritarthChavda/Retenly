// app/api/test/get-feedback-by-phone/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma' // or your own db import
import {formatPhoneNumberToE164 } from '@/lib/validation'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Forbidden', { status: 403 })
  }

  const { phoneNumber } = await req.json()

  if (!phoneNumber) {
    return new Response(
      JSON.stringify({ error: 'phoneNumber is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const normalizedPhone = formatPhoneNumberToE164(phoneNumber) || phoneNumber



  // IMPORTANT: query the same table where /api/forms/[slug]/submit writes.
  // Adjust table name and field names accordingly.
  const feedback = await prisma.feedback.findFirst({
    where: { phoneNumber: normalizedPhone },
    orderBy: { createdAt: 'desc' },
  })

  console.log('TEST API lookup for phone:', normalizedPhone, 'result:', feedback)

  return new Response(
    JSON.stringify({ feedback }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
