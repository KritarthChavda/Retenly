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
    //
    // MediaRecorder blobs can arrive with an empty or generic MIME type (older
    // clients, and browsers that only populate mimeType once recording starts),
    // so fall back to the extension rather than discarding the recording.
    const EXTENSION_CONTENT_TYPES: Record<string, string> = {
      webm: 'audio/webm',
      ogg: 'audio/ogg',
      mp4: 'audio/mp4',
      m4a: 'audio/mp4',
      mp3: 'audio/mpeg',
      mpeg: 'audio/mpeg',
      wav: 'audio/wav',
    }

    const declaredType = (file.type || '').toLowerCase()
    const fileExt = (file.name.split('.').pop() || '').toLowerCase()
    const isGenericType = !declaredType || declaredType === 'application/octet-stream'
    const extContentType = EXTENSION_CONTENT_TYPES[fileExt]

    if (!declaredType.startsWith('audio/') && !(isGenericType && extContentType)) {
      return NextResponse.json({ error: 'Invalid file type. Only audio files are allowed.' }, { status: 400 })
    }

    // What we hand to Supabase / Groq — never an empty string.
    const contentType = declaredType.startsWith('audio/')
      ? declaredType
      : (extContentType ?? 'audio/webm')

    // 3. Verify Feedback record exists, is recent, and has no existing upload
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { id: true, voiceRecordingUrl: true, createdAt: true }
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback record not found' }, { status: 404 })
    }

    // Already uploaded: this is a retry of a request that already succeeded, so
    // report success. Returning 400 here made the service worker treat a completed
    // upload as a permanent failure and retry it forever.
    if (feedback.voiceRecordingUrl) {
      return NextResponse.json(
        { url: feedback.voiceRecordingUrl, alreadyUploaded: true },
        { status: 200 }
      )
    }

    // Bound how late a recording may arrive, but stay well clear of the Background
    // Sync retry backoff — a 15-minute window expired before the browser's own
    // retries did, so any deferred sync was guaranteed to fail permanently.
    const creationTime = new Date(feedback.createdAt).getTime()
    const timeElapsedMs = Date.now() - creationTime
    const uploadWindowLimitMs = 24 * 60 * 60 * 1000 // 24 hours

    if (timeElapsedMs > uploadWindowLimitMs) {
      return NextResponse.json({ error: 'Upload window has expired.' }, { status: 400 })
    }

    // Colons from toISOString() are legal but awkward in object keys / URLs.
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_')
    const filePath = `voice-recordings/${timestamp}-${feedbackId}-${safeName}`

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_VOICE_RECORDINGS_BUCKET!)
      .upload(filePath, file, { contentType, upsert: false })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ error: 'Failed to upload file to Supabase' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(process.env.SUPABASE_VOICE_RECORDINGS_BUCKET!)
      .getPublicUrl(filePath)

    // 4. Link the recording to the feedback BEFORE transcribing.
    // Transcription is two blocking Groq calls with their own retry budget; if the
    // function timed out during them, the audio sat in Supabase with nothing in the
    // database pointing at it and the owner never saw the recording at all.
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { voiceRecordingUrl: publicUrl },
    })

    // 5. Convert voice recording to text using Groq Whisper API (best effort)
    let transcript: string | null = null
    if (process.env.GROQ_API_KEY) {
      try {
        console.log('🎤 [voice-upload] Starting Groq Whisper transcription...')
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        // Whisper sniffs the container, but give it a truthful name + type anyway.
        const groqFile = await toFile(fileBuffer, `voice-recording.${fileExt || 'webm'}`, {
          type: contentType,
        })

        const response = await groq.audio.transcriptions.create({
          file: groqFile,
          model: 'whisper-large-v3-turbo',
          response_format: 'json',
          prompt: 'kaise ho, kem cho, main thik hu, badhiya, maja ma, all good, delicious food, very nice, thank you, restaurant review',
        })
        transcript = response.text || null
        console.log('✅ [voice-upload] Groq transcription result:', transcript)

        // Post-processing: transliterate to Romanized text if it contains non-ASCII characters
        if (transcript && /[^\x00-\x7F]/.test(transcript)) {
          try {
            console.log('✨ [voice-upload] Non-ASCII script detected, transliterating...')
            const translitResponse = await groq.chat.completions.create({
              model: 'llama-3.1-8b-instant',
              messages: [
                {
                  role: 'system',
                  content: 'You are a precise transliterator. Convert any native script (like Devanagari, Gujarati script) into Romanized Latin characters (Hinglish/Gujlish) representing the exact spoken sounds phonetically. Do NOT translate the words into English meaning. Only output the transliterated phonetic text. If the text is already in Latin characters, return it exactly as is.'
                },
                {
                  role: 'user',
                  content: transcript
                }
              ],
              temperature: 0.1,
              max_tokens: 200
            })
            const transliterated = translitResponse.choices[0]?.message?.content?.trim()
            if (transliterated) {
              console.log('✅ [voice-upload] Transliterated result:', transliterated)
              transcript = transliterated
            }
          } catch (translitError) {
            console.error('⚠️ [voice-upload] Transliteration failed, falling back to original transcription:', translitError)
          }
        }
      } catch (transcribeError) {
        console.error('⚠️ [voice-upload] Groq transcription failed:', transcribeError)
      }
    } else {
      console.warn('⚠️ [voice-upload] GROQ_API_KEY is not defined. Skipping transcription.')
    }

    // 6. Store the transcript if we got one. The recording is already linked, so a
    // failure here costs the transcript, never the audio.
    if (transcript) {
      await prisma.feedback.update({
        where: { id: feedbackId },
        data: { voiceTranscript: transcript },
      })
    }

    return NextResponse.json({ url: publicUrl, transcript }, { status: 200 })
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
