// src/lib/ai/topFeedback.ts
import { Groq } from "groq-sdk"
import { AI_CURATOR_SYSTEM_PROMPT, AI_CURATOR_USER_PROMPT } from "./prompts"
import { preprocess } from "./preprocess"
import { prisma } from "../prisma"
import { HighlightWindow } from "@/generated/prisma"

import type { WindowKey } from "./types"

const DEFAULT_MODEL = "llama-3.3-70b-versatile"
const DEFAULT_TEMP = 0.2

const WINDOW_ENUM: Record<WindowKey, HighlightWindow> = {
  "7d": HighlightWindow.D7,
  "30d": HighlightWindow.D30,
  "90d": HighlightWindow.D90
}

export interface FeedbackRecord {
  id: string
  sentiment: "positive" | "negative" | "neutral"
  rating?: number | null
  feedback: string
  createdAt?: Date | string
}

export interface CuratedFeedbackItem {
  summary: string
  themes: string[]
  representativeIds: string[]
  confidence: number
}

export interface CuratedFeedbackResult {
  positive: CuratedFeedbackItem[]
  negative: CuratedFeedbackItem[]
  model: string
  generatedAt: string
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Jaccard similarity between two strings (word-level sets).
 */
function similarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/))
  const setB = new Set(b.toLowerCase().split(/\s+/))
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

/**
 * Cross-list deduplication: removes items whose summary OR themes are too
 * similar to anything already accepted in `result`.
 * Uses a higher threshold (0.55) than before so "wait time" and "slow service"
 * collapse into one theme instead of generating two near-identical cards.
 */
function dedupeThemes(items: CuratedFeedbackItem[]): CuratedFeedbackItem[] {
  const SUMMARY_THRESHOLD = 0.55   // was 0.75 — catches more near-duplicates
  const THEME_OVERLAP_THRESHOLD = 0.6

  const result: CuratedFeedbackItem[] = []
  const seenSummaries = new Set<string>()

  for (const item of items) {
    const normalizedSummary = item.summary
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()

    // exact duplicate guard
    if (seenSummaries.has(normalizedSummary)) continue
    seenSummaries.add(normalizedSummary)

    // fuzzy summary duplicate guard
    const summaryTooClose = result.some(
      existing => similarity(existing.summary, item.summary) > SUMMARY_THRESHOLD
    )
    if (summaryTooClose) continue

    // theme-overlap guard — catches cases like ["wait time","service"] vs ["slow service","wait"]
    const themesTooClose = result.some(existing => {
      const existingThemes = new Set(existing.themes.map(t => t.toLowerCase()))
      const newThemes = item.themes.map(t => t.toLowerCase())
      const overlap = newThemes.filter(t => existingThemes.has(t)).length
      const union = new Set([...existingThemes, ...newThemes]).size
      return union > 0 && overlap / union > THEME_OVERLAP_THRESHOLD
    })
    if (themesTooClose) continue

    result.push(item)
  }

  return result
}

// ─── Generic Summary Blocker ──────────────────────────────────────────────────

function isGenericSummary(s: string): boolean {
  return /good food|good experience|serve good|maintain|customers are happy|keep it up|well done/i.test(s)
}

// ─── Main Curation Function ───────────────────────────────────────────────────

export async function curateTopFeedback(
  feedbacks: FeedbackRecord[],
  {
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMP,
    windowKey,
    businessName
  }: { model?: string; temperature?: number; windowKey?: WindowKey; businessName?: string } = {}
): Promise<CuratedFeedbackResult> {

  const cleaned = preprocess(
    feedbacks.map(f => ({
      id: f.id,
      sentiment: f.sentiment,
      rating: f.rating ?? null,
      feedback: f.feedback ?? ""
    }))
  )

  if (!cleaned.length) {
    return { positive: [], negative: [], model: "no-data", generatedAt: new Date().toISOString() }
  }

  if (!process.env.GROQ_API_KEY) {
    return { positive: [], negative: [], model: "no-key", generatedAt: new Date().toISOString() }
  }

  const payload = JSON.stringify({ data: cleaned }, null, 2)
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await client.chat.completions.create({
    model,
    temperature,
    top_p: 0.9,
    max_completion_tokens: 1800,
    stream: false,
    messages: [
      { role: "system", content: AI_CURATOR_SYSTEM_PROMPT },
      // Pass windowKey so the prompt can tailor its perspective
      { role: "user", content: AI_CURATOR_USER_PROMPT(payload, windowKey ?? "30d", businessName) }
    ],
    response_format: { type: "json_object" }
  })

  const content = completion.choices?.[0]?.message?.content
  const now = new Date().toISOString()

  if (!content) {
    return { positive: [], negative: [], model, generatedAt: now }
  }

  try {
    const parsed = JSON.parse(content) as CuratedFeedbackResult

    // ── Raised thresholds: confidence >= 0.72, minimum 3 representative IDs ──
    const filterStrong = (arr?: CuratedFeedbackItem[]) =>
      (arr ?? [])
        .filter(x =>
          typeof x.confidence === "number" &&
          x.confidence >= 0.72 &&            // was 0.65
          x.representativeIds?.length >= 3 && // was 2
          !isGenericSummary(x.summary)
        )
        .slice(0, 5)

    const rawPositive = filterStrong(parsed.positive)
    const rawNegative = filterStrong(parsed.negative)

    // Dedupe within each polarity group
    const dedupedPositive = dedupeThemes(rawPositive)
    const dedupedNegative = dedupeThemes(rawNegative)

    return {
      positive: dedupedPositive,
      negative: dedupedNegative,
      model,
      generatedAt: now
    }
  } catch (err) {
    console.error("❌ Failed to parse AI response:", err)
    return { positive: [], negative: [], model, generatedAt: now }
  }
}

// ─── Window Highlight Generation ─────────────────────────────────────────────

const WINDOW_CHAR_LIMIT: Record<WindowKey, number> = {
  "7d": 6_000,  
  "30d": 10_000, 
  "90d": 14_000 
}

export async function generateWindowHighlights(restaurantId: string, windowKey: WindowKey) {
  const now = new Date()
  const start = windowStartFor(windowKey, now)
  const end = now
  const windowEnum = WINDOW_ENUM[windowKey]

  const rows = await prisma.feedback.findMany({
    where: { form: { restaurantId }, createdAt: { gte: start, lt: end } },
    select: { id: true, sentiment: true, rating: true, feedback: true, voiceTranscript: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  })

  // ── Debug counts ──────────────────────────────────────────────────────────
  console.log(`[${windowKey}] Total DB rows for restaurant ${restaurantId}:`, rows.length)

  // ── FIX: use limitedRows for AI, not the full `rows` array ───────────────
  const MAX_CHARS = WINDOW_CHAR_LIMIT[windowKey]
  let totalChars = 0
  const limitedRows: typeof rows = []

  for (const r of rows) {
    const len = (r.feedback?.length ?? 0) + (r.voiceTranscript?.length ?? 0)
    if (totalChars + len > MAX_CHARS) break
    totalChars += len
    limitedRows.push(r)
  }

  console.log(`[${windowKey}] Rows sent to AI: ${limitedRows.length} (${totalChars} chars)`)

  // ── Build FeedbackRecord[] from limitedRows (was incorrectly using `rows`) ─
  const records: FeedbackRecord[] = limitedRows.map(r => {
    const textFeedback = r.feedback?.trim() || ""
    const voiceTranscriptText = r.voiceTranscript?.trim() 
      ? `[Voice Transcript]: ${r.voiceTranscript.trim()}` 
      : ""
    const combinedFeedback = [textFeedback, voiceTranscriptText].filter(Boolean).join("\n")

    return {
      id: r.id,
      sentiment: (r.sentiment as FeedbackRecord["sentiment"]) || "neutral",
      rating: r.rating ?? null,
      feedback: combinedFeedback || "No feedback text provided",
      createdAt: r.createdAt
    }
  })

  // Fetch business name for LLM context
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { name: true }
  })
  const businessName = restaurant?.name || undefined

  const result = await curateTopFeedback(records, { windowKey, businessName })

  // Delete stale highlights for this window.
  //
  // This used to also require windowStart >= start && windowEnd <= end, which only
  // ever matched rows generated for the *current* bounds. Rows from earlier runs
  // have an older windowStart, so they never matched and were never removed — they
  // piled up run after run until the dashboard was rendering dozens of highlights
  // from months-old feedback. Every row for this restaurant+window is superseded by
  // the batch we are about to write, so clear them all.
  await prisma.topFeedback.deleteMany({
    where: {
      restaurantId,
      window: windowEnum
    }
  })

  const data = [
    ...result.positive.map(i => buildRow(restaurantId, "positive", i, result.model, windowEnum, start, end)),
    ...result.negative.map(i => buildRow(restaurantId, "negative", i, result.model, windowEnum, start, end))
  ]

  if (data.length) {
    await prisma.topFeedback.createMany({ data })
  }

  console.log(`[${windowKey}] Stored ${data.length} highlights`)
  return { window: windowKey, ...result }
}

function windowStartFor(key: WindowKey, end: Date): Date {
  const days = key === "7d" ? 7 : key === "30d" ? 30 : 90
  const d = new Date(end)
  d.setDate(d.getDate() - days)
  return d
}

function buildRow(
  restaurantId: string,
  type: "positive" | "negative",
  item: CuratedFeedbackItem,
  model: string,
  windowEnum: HighlightWindow,
  windowStart: Date,
  windowEnd: Date
) {
  return {
    restaurantId,
    feedbackId: item.representativeIds?.[0] ?? null,
    type,
    summary: (item.summary ?? "").trim(),
    themes: JSON.stringify(item.themes ?? []),
    representativeIds: JSON.stringify(item.representativeIds ?? []),
    confidence: clamp(item.confidence, 0, 1),
    model,
    window: windowEnum,
    windowStart,
    windowEnd,
    generatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi)
}

/** Nightly job: generate all windows for all restaurants */
export async function generateAllWindowsForAllRestaurants() {
  const restaurants = await prisma.restaurant.findMany({ select: { id: true } })
  for (const r of restaurants) {
    for (const w of ["7d", "30d", "90d"] as WindowKey[]) {
      await generateWindowHighlights(r.id, w)
    }
  }
}