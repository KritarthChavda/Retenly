import { Groq } from "groq-sdk"
import { AI_CURATOR_SYSTEM_PROMPT, AI_CURATOR_USER_PROMPT } from "./prompts.js"
import { prisma } from "../prisma.js"

interface GroqChatCompletionChoice {
  index: number
  message?: {
    role?: string
    content?: string | null
  }
}

interface GroqChatCompletion {
  id: string
  choices: GroqChatCompletionChoice[]
  model?: string
  created?: number
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

interface CuratorOptions {
  model?: string
  positiveCount?: number
  negativeCount?: number
  temperature?: number
}

const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b"
const DEFAULT_POSITIVE_COUNT = 3
const DEFAULT_NEGATIVE_COUNT = 3

const STOP_WORDS = new Set([
  "the",
  "a",
  "and",
  "or",
  "but",
  "with",
  "to",
  "of",
  "for",
  "in",
  "on",
  "it",
  "is",
  "was",
  "were",
  "be",
  "this",
  "that",
  "an",
  "at",
  "as",
  "from",
  "by",
  "very",
  "really",
  "just",
  "had",
  "have",
  "has"
])

const FALLBACK_THEMES = {
  positive: ["Service", "Food quality", "Ambience", "Staff friendliness"],
  negative: ["Wait times", "Order accuracy", "Cleanliness", "Communication"]
}

export async function curateTopFeedback(
  feedbacks: FeedbackRecord[],
  options: CuratorOptions = {}
): Promise<CuratedFeedbackResult> {
  const positive = feedbacks.filter((item) => item.sentiment === "positive")
  const negative = feedbacks.filter((item) => item.sentiment === "negative")

  const positiveCount = options.positiveCount ?? DEFAULT_POSITIVE_COUNT
  const negativeCount = options.negativeCount ?? DEFAULT_NEGATIVE_COUNT

  if (!process.env.GROQ_API_KEY) {
    return heuristicCuratedResult(positive, negative, positiveCount, negativeCount)
  }

  try {
    const response = await callGroq(feedbacks, {
      model: options.model ?? DEFAULT_MODEL,
      temperature: options.temperature ?? 0.2,
      positiveCount,
      negativeCount
    })

    if (!response) {
      return heuristicCuratedResult(positive, negative, positiveCount, negativeCount)
    }

    const parsed = parseModelResponse(response)
    if (!parsed) {
      return heuristicCuratedResult(positive, negative, positiveCount, negativeCount)
    }

    return parsed
  } catch (error) {
    console.error("[curateTopFeedback] Falling back to heuristics:", error)
    return heuristicCuratedResult(positive, negative, positiveCount, negativeCount)
  }
}

export async function regenerateTopFeedbackForRestaurant(restaurantId: string) {
  const feedbacks = await prisma.feedback.findMany({
    where: {
      form: {
        restaurantId
      }
    },
    select: {
      id: true,
      sentiment: true,
      rating: true,
      feedback: true,
      experience: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  const records: FeedbackRecord[] = feedbacks.map((item) => ({
    id: item.id,
    sentiment: (item.sentiment as FeedbackRecord["sentiment"]) || "neutral",
    rating: item.rating,
    feedback: item.feedback?.trim() || item.experience || "",
    createdAt: item.createdAt
  }))

  if (!records.length) {
    await prisma.topFeedback.deleteMany({ where: { restaurantId } })
    return null
  }

  const result = await curateTopFeedback(records)

  const now = new Date()
  const generatedAt = Number.isNaN(Date.parse(result.generatedAt))
    ? now
    : new Date(result.generatedAt)
  const data = [
    ...result.positive.map((item) =>
      buildTopFeedbackRow(restaurantId, "positive", item, result.model, generatedAt, now)
    ),
    ...result.negative.map((item) =>
      buildTopFeedbackRow(restaurantId, "negative", item, result.model, generatedAt, now)
    )
  ]

  await prisma.$transaction([
    prisma.topFeedback.deleteMany({ where: { restaurantId } }),
    ...(data.length
      ? [
          prisma.topFeedback.createMany({
            data,
            skipDuplicates: false
          })
        ]
      : [])
  ])

  return result
}

function buildTopFeedbackRow(
  restaurantId: string,
  type: "positive" | "negative",
  item: CuratedFeedbackItem,
  model: string,
  generatedAt: Date,
  now: Date
) {
  return {
    restaurantId,
    feedbackId: item.representativeIds?.[0] ?? null,
    type,
    summary: item.summary,
    themes: JSON.stringify(item.themes ?? []),
    representativeIds: JSON.stringify(item.representativeIds ?? []),
    confidence: typeof item.confidence === "number" ? clamp(item.confidence, 0, 1) : 0.7,
    model,
    generatedAt,
    createdAt: now,
    updatedAt: now
  }
}

async function callGroq(
  feedbacks: FeedbackRecord[],
  params: Required<Pick<CuratorOptions, "model" | "temperature">> & {
    positiveCount: number
    negativeCount: number
  }
): Promise<GroqChatCompletion | null> {
  const payload = buildPromptPayload(feedbacks, params.positiveCount, params.negativeCount)

  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
  })

  const completion = await client.chat.completions.create({
    model: params.model,
    temperature: params.temperature,
    max_completion_tokens: 2048,
    top_p: 1,
    stream: false,
    reasoning_effort: "medium",
    stop: null,
    messages: [
      {
        role: "system",
        content: AI_CURATOR_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: AI_CURATOR_USER_PROMPT(payload)
      }
    ],
    response_format: {
      type: "json_object"
    }
  })

  return completion as GroqChatCompletion
}

function buildPromptPayload(feedbacks: FeedbackRecord[], positiveCount: number, negativeCount: number) {
  const sanitized = feedbacks.map((item) => ({
    id: item.id,
    sentiment: item.sentiment,
    rating: item.rating ?? null,
    feedback: sanitizeFeedbackText(item.feedback)
  }))

  return JSON.stringify(
    {
      instructions: {
        counts: {
          positive: positiveCount,
          negative: negativeCount
        }
      },
      data: sanitized
    },
    null,
    2
  )
}

function sanitizeFeedbackText(text: string) {
  return text.replace(/["“”‘’]/g, "'").replace(/\s+/g, " ").trim()
}

function parseModelResponse(response: GroqChatCompletion): CuratedFeedbackResult | null {
  const content = response.choices?.[0]?.message?.content
  if (!content) {
    return null
  }

  try {
    const parsed = JSON.parse(content) as CuratedFeedbackResult
    if (!parsed.positive || !parsed.negative) {
      return null
    }

    return {
      positive: normalizeItems(parsed.positive),
      negative: normalizeItems(parsed.negative),
      model: response.model ?? DEFAULT_MODEL,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error("[curateTopFeedback] Failed to parse model JSON", error, content)
    return null
  }
}

function normalizeItems(items: CuratedFeedbackItem[]): CuratedFeedbackItem[] {
  return items.map((item) => ({
    summary: item.summary?.trim() ?? "Summary not available.",
    themes: item.themes?.map((theme) => theme.trim()).filter(Boolean) ?? [],
    representativeIds: item.representativeIds?.slice(0, 5) ?? [],
    confidence: typeof item.confidence === "number" ? clamp(item.confidence, 0, 1) : 0.7
  }))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function heuristicCuratedResult(
  positive: FeedbackRecord[],
  negative: FeedbackRecord[],
  positiveCount: number,
  negativeCount: number
): CuratedFeedbackResult {
  return {
    positive: buildHeuristicSummaries(positive, "positive", positiveCount),
    negative: buildHeuristicSummaries(negative, "negative", negativeCount),
    model: "heuristic-fallback",
    generatedAt: new Date().toISOString()
  }
}

function buildHeuristicSummaries(
  feedbacks: FeedbackRecord[],
  sentiment: "positive" | "negative",
  count: number
): CuratedFeedbackItem[] {
  if (!feedbacks.length) {
    return []
  }

  const ranked = [...feedbacks].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, count * 2)

  return ranked
    .slice(0, count)
    .map((item, index): CuratedFeedbackItem => {
      const keywords = extractKeywords(item.feedback, sentiment) ?? FALLBACK_THEMES[sentiment]
      const summary = sentiment === "positive"
        ? `Highlight customer appreciation for ${keywords.join(", ")}.`
        : `Customers would like improvements in ${keywords.join(", ")}.`

      return {
        summary,
        themes: keywords,
        representativeIds: [item.id],
        confidence: 0.45 + index * 0.1
      }
    })
}

function extractKeywords(text: string, sentiment: "positive" | "negative") {
  if (!text) {
    return FALLBACK_THEMES[sentiment]
  }

  const frequency = Object.create(null) as Record<string, number>
  const tokens = text
    .toLowerCase()
    .split(/[^a-zA-Z]+/)
    .filter((token) => token && !STOP_WORDS.has(token) && token.length > 2)

  for (const token of tokens) {
    frequency[token] = (frequency[token] ?? 0) + 1
  }

  const sorted = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([token]) => token)

  if (!sorted.length) {
    return FALLBACK_THEMES[sentiment]
  }

  return sorted
}
