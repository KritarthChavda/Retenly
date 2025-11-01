import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const feedbackId = formData.get('feedbackId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!feedbackId) {
      return NextResponse.json({ error: 'No feedbackId provided' }, { status: 400 })
    }

    const filePath = `voice-recordings/${new Date().toISOString()}-${file.name}`

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_VOICE_RECORDINGS_BUCKET!)
      .upload(filePath, file)

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ error: 'Failed to upload file to Supabase' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(process.env.SUPABASE_VOICE_RECORDINGS_BUCKET!)
      .getPublicUrl(filePath)

    // Update the feedback record with the voice recording URL
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { voiceRecordingUrl: publicUrl },
    });

    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
