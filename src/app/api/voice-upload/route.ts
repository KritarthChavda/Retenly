import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Groq, { toFile } from 'groq-sdk'

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

    // 1. Validate File Size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // 2. Validate File Type (must be audio format)
    const allowedTypes = ['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg']
    if (!file.type.startsWith('audio/') && !allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only audio files are allowed.' }, { status: 400 })
    }

    // 3. Verify Feedback record exists, is recent, and has no existing upload
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { id: true, voiceRecordingUrl: true, createdAt: true }
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback record not found' }, { status: 404 })
    }

    if (feedback.voiceRecordingUrl) {
      return NextResponse.json({ error: 'Voice recording already uploaded for this feedback.' }, { status: 400 })
    }

    // Limit voice upload window to 15 minutes after feedback creation
    const creationTime = new Date(feedback.createdAt).getTime()
    const timeElapsedMs = Date.now() - creationTime
    const uploadWindowLimitMs = 15 * 60 * 1000 // 15 minutes

    if (timeElapsedMs > uploadWindowLimitMs) {
      return NextResponse.json({ error: 'Upload window has expired.' }, { status: 400 })
    }

    const filePath = `voice-recordings/${new Date().toISOString()}-${file.name}`

    // Upload to Supabase
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

    // 4. Convert voice recording to text using Groq Whisper API
    let transcript: string | null = null
    if (process.env.GROQ_API_KEY) {
      try {
        console.log('🎤 [voice-upload] Starting Groq Whisper transcription...')
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const fileExt = file.name.split('.').pop() || 'webm'
        const groqFile = await toFile(fileBuffer, `voice-recording.${fileExt}`)

        const response = await groq.audio.transcriptions.create({
          file: groqFile,
          model: 'whisper-large-v3-turbo',
          response_format: 'json',
        })
        transcript = response.text || null
        console.log('✅ [voice-upload] Groq transcription result:', transcript)
      } catch (transcribeError) {
        console.error('⚠️ [voice-upload] Groq transcription failed:', transcribeError)
      }
    } else {
      console.warn('⚠️ [voice-upload] GROQ_API_KEY is not defined. Skipping transcription.')
    }

    // Update the feedback record with the voice recording URL and transcript
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { 
        voiceRecordingUrl: publicUrl,
        voiceTranscript: transcript
      },
    });

    return NextResponse.json({ url: publicUrl, transcript }, { status: 200 })
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
