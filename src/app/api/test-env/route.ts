import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasGroqApiKey: !!process.env.GROQ_API_KEY,
    keyLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0,
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    supabaseUrl: !!process.env.SUPABASE_URL,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  })
}
