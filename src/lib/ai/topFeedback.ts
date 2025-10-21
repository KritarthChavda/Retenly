// src/lib/ai/topFeedback.ts
import { Groq } from "groq-sdk"
import { AI_CURATOR_SYSTEM_PROMPT, AI_CURATOR_USER_PROMPT } from "./prompts"
import { preprocess } from "./preprocess"
import { prisma } from "../prisma"
import { Prisma } from "@prisma/client"
import { HighlightWindow } from "@/generated/prisma"

export type WindowKey = "7d" | "30d" | "90d"

const DEFAULT_MODEL = "llama-3.3-70b-versatile" // Groq
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

export async function curateTopFeedback(
  feedbacks: FeedbackRecord[],
  {
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMP
  }: { model?: string; temperature?: number } = {}
): Promise<CuratedFeedbackResult> {
  // strict sentiment gate, noise filter, PII strip, light lexicon normalize
  const cleaned = preprocess(
    feedbacks.map(f => ({
      id: f.id,
      sentiment: f.sentiment,
      rating: f.rating ?? null,
      feedback: f.feedback ?? ""
    }))
  )

  if (!cleaned.length) {
    return {
      positive: [],
      negative: [],
      model: "no-data",
      generatedAt: new Date().toISOString()
    }
  }

  const payload = JSON.stringify({ data: cleaned }, null, 2)

  if (!process.env.GROQ_API_KEY) {
    // If there’s no key, return empty (UI will fallback)
    return {
      positive: [],
      negative: [],
      model: "no-key",
      generatedAt: new Date().toISOString()
    }
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const completion = await client.chat.completions.create({
    model,
    temperature,
    top_p: 0.9,
    max_completion_tokens: 1800,
    stream: false,
    messages: [
      { role: "system", content: AI_CURATOR_SYSTEM_PROMPT },
      { role: "user", content: AI_CURATOR_USER_PROMPT(payload) }
    ],
    response_format: { type: "json_object" },
    stop: null
  })

  const content = completion.choices?.[0]?.message?.content
  const now = new Date().toISOString()
  if (!content) {
    return { positive: [], negative: [], model, generatedAt: now }
  }

  try {
    const parsed = JSON.parse(content) as CuratedFeedbackResult
    // flexible count: keep only strong themes (confidence >= 0.55) and cap at 5 each
    const filterStrong = (arr?: CuratedFeedbackItem[]) =>
      (arr ?? [])
        .filter(x => typeof x.confidence === "number" && x.confidence >= 0.55)
        .slice(0, 5)

    return {
      positive: filterStrong(parsed.positive),
      negative: filterStrong(parsed.negative),
      model,
      generatedAt: now
    }
  } catch {
    return { positive: [], negative: [], model, generatedAt: now }
  }
}

/** Generate and store highlights for a single restaurant and a given window */
export async function generateWindowHighlights(restaurantId: string, windowKey: WindowKey) {
  const now = new Date()
  const start = windowStartFor(windowKey, now)
  const end = now
  const windowEnum = WINDOW_ENUM[windowKey]

  const rows = await prisma.feedback.findMany({
    where: { form: { restaurantId }, createdAt: { gte: start, lt: end } },
    select: { id: true, sentiment: true, rating: true, feedback: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  })

  const records: FeedbackRecord[] = rows.map(r => ({
    id: r.id,
    sentiment: (r.sentiment as FeedbackRecord["sentiment"]) || "neutral",
    rating: r.rating ?? null,
    feedback: r.feedback?.trim() || "",
    createdAt: r.createdAt
  }))

  const result = await curateTopFeedback(records)

  // Guarantee at least one non-empty section (your rule)
  if (!result.positive.length && !result.negative.length) {
    const pos = records.find(r => r.sentiment === "positive")
    const neg = records.find(r => r.sentiment === "negative")
    result.positive = pos
      ? [{ summary: "Guests reported a good experience.", themes: ["general"], representativeIds: [pos.id], confidence: 0.55 }]
      : []
    result.negative = !result.positive.length && neg
      ? [{ summary: "Guests reported issues requiring attention.", themes: ["general"], representativeIds: [neg.id], confidence: 0.55 }]
      : result.negative
  }

  // delete existing highlights for this window in the same time range (range match avoids ms-equality issues)
  await prisma.topFeedback.deleteMany({
    where: {
      restaurantId,
      window: windowEnum,
      windowStart: { gte: start },
      windowEnd: { lte: end }
    }
  })

  const data = [
    ...result.positive.map(i => buildRow(restaurantId, "positive", i, result.model, windowEnum, start, end)),
    ...result.negative.map(i => buildRow(restaurantId, "negative", i, result.model, windowEnum, start, end))
  ]

  if (data.length) {
    await prisma.topFeedback.createMany({ data })
  }

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
    summary: item.summary.trim(),
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

/** Nightly job: generate 7d / 30d / 90d for all restaurants */
export async function generateAllWindowsForAllRestaurants() {
  const restaurants = await prisma.restaurant.findMany({ select: { id: true } })
  for (const r of restaurants) {
    for (const w of ["7d", "30d", "90d"] as WindowKey[]) {
      await generateWindowHighlights(r.id, w)
    }
  }
}
