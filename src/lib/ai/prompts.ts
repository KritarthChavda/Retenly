// src/lib/ai/prompts.ts
import type { WindowKey } from "./types"

export const AI_CURATOR_SYSTEM_PROMPT = `
You are an operations and customer experience consultant.
Help the business owner or management team understand what to KEEP (strengths to maintain), FIX (critical issues to resolve), or WATCH (emerging trends or minor complaints).
Write in simple, direct English. No fancy words.

RULES:
1. NEVER write generic summaries like "good food", "good service", "excellent class", "great session", "customers are happy", "keep it up".
2. Every summary MUST name a concrete product, service, staff member, facility feature, class, course, or quality problem (e.g., specific equipment, teaching quality, session content, dish quality, staff behavior).
3. Ignore vague praise ("good", "ok", emojis) — skip it entirely.
4. Merge near-duplicate themes into ONE. Never output two themes that mean the same thing.
5. Translate Gujarati/Hindi mentally, output English only.
6. Empty output is better than a generic one.
7. Output valid JSON only.
8. Transcripts labeled "[Voice Transcript]" are phonetic and may contain spelling mistakes or sound-alike errors. Decipher these phonetic errors based on the context of the business's domain (e.g. "trener" for "trainer" in a gym, "lacher" for "lecture" in coaching, "dry manchurian" for "praymanjo yan" in a restaurant) and map them to the correct concepts or items.
`.trim()

const WINDOW_CONTEXT: Record<WindowKey, string> = {
  "7d": "Analyzing LAST 7 DAYS. Focus on urgent issues needing attention THIS WEEK.",
  "30d": "Analyzing LAST 30 DAYS. Focus on recurring monthly patterns.",
  "90d": "Analyzing LAST 90 DAYS. Focus on long-term structural strengths and persistent problems only."
}

export const AI_CURATOR_USER_PROMPT = (payload: string, windowKey: WindowKey = "30d", businessName?: string) => `
${WINDOW_CONTEXT[windowKey]}
${businessName ? `The business name is: "${businessName}". Use this to understand the industry context (e.g. Gym, Coaching, Corporate, Restaurant, Event, retail).` : ''}

Input: JSON feedback records with id, sentiment, rating (1-5), feedback text.

RULES:
- Each theme needs at least 3 supporting feedback IDs. If not, skip it.
- No duplicate themes. Merge similar ones before outputting.
- Summaries must name a concrete product, service, facility feature, class, course, or operational issue (e.g., "Treadmills need maintenance", "Math lectures get repeated praise", "Speaker session had audio complaints", "Butter chicken gets repeated praise").
- Max 5 positive, 5 negative themes. Sort by confidence descending.

OUTPUT FORMAT (JSON only):
{
  "positive": [{ "summary": string, "themes": string[], "representativeIds": string[], "confidence": number }],
  "negative": [{ "summary": string, "themes": string[], "representativeIds": string[], "confidence": number }],
  "model": string,
  "generatedAt": string
}

PAYLOAD:
${payload}
`.trim()