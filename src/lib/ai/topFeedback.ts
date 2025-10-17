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

const POSITIVE_EXPERIENCES = new Set(["yo!", "pretty good", "great", "excellent", "amazing"])
const NEGATIVE_EXPERIENCES = new Set(["not great", "poor", "bad", "terrible", "awful"])

const FEEDBACK_SELECTION = {
  id: true,
  sentiment: true,
  rating: true,
  feedback: true,
  experience: true,
  createdAt: true
} as const

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
  const lastHighlight = await prisma.topFeedback.findFirst({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true }
  })

  const rawFeedbacks = await prisma.feedback.findMany({
    where: {
      form: {
        restaurantId
      },
      createdAt: lastHighlight?.createdAt ? { gt: lastHighlight.createdAt } : undefined
    },
    select: FEEDBACK_SELECTION,
    orderBy: {
      createdAt: "desc"
    }
  })

  const normalizedFeedbacks = normalizeFeedbackBatch(rawFeedbacks)

  const positiveCandidates = normalizedFeedbacks.filter(
    (item) => item.normalizedSentiment === "positive"
  )
  const negativeCandidates = normalizedFeedbacks.filter(
    (item) => item.normalizedSentiment === "negative"
  )

  let positiveRecords = positiveCandidates
    .slice(0, DEFAULT_POSITIVE_COUNT)
    .map((item) => buildFeedbackRecord(item, "positive"))
  let negativeRecords = negativeCandidates
    .slice(0, DEFAULT_NEGATIVE_COUNT)
    .map((item) => buildFeedbackRecord(item, "negative"))

  const usedIds = new Set([...positiveRecords.map((item) => item.id), ...negativeRecords.map((item) => item.id)])

  if (positiveRecords.length < DEFAULT_POSITIVE_COUNT) {
    const needed = DEFAULT_POSITIVE_COUNT - positiveRecords.length
    const fallback = await loadAdditionalFeedback(
      restaurantId,
      "positive",
      lastHighlight?.createdAt ?? null,
      usedIds,
      needed
    )
    positiveRecords = positiveRecords.concat(fallback)
  }

  if (negativeRecords.length < DEFAULT_NEGATIVE_COUNT) {
    const needed = DEFAULT_NEGATIVE_COUNT - negativeRecords.length
    const fallback = await loadAdditionalFeedback(
      restaurantId,
      "negative",
      lastHighlight?.createdAt ?? null,
      usedIds,
      needed
    )
    negativeRecords = negativeRecords.concat(fallback)
  }

  const records: FeedbackRecord[] = [...positiveRecords, ...negativeRecords]

  if (!records.length) {
    return null
  }

  const positiveTarget = DEFAULT_POSITIVE_COUNT
  const negativeTarget = DEFAULT_NEGATIVE_COUNT

  const result = await curateTopFeedback(records, {
    positiveCount: positiveTarget,
    negativeCount: negativeTarget
  })
  const limitedResult: CuratedFeedbackResult = {
    ...result,
    positive: result.positive.slice(0, positiveTarget),
    negative: result.negative.slice(0, negativeTarget)
  }

  const now = new Date()
  const generatedAt = Number.isNaN(Date.parse(limitedResult.generatedAt))
    ? now
    : new Date(limitedResult.generatedAt)
  const data = [
    ...limitedResult.positive.map((item) =>
      buildTopFeedbackRow(restaurantId, "positive", item, limitedResult.model, generatedAt, now)
    ),
    ...limitedResult.negative.map((item) =>
      buildTopFeedbackRow(restaurantId, "negative", item, limitedResult.model, generatedAt, now)
    )
  ]

  if (data.length) {
    await prisma.topFeedback.createMany({
      data,
      skipDuplicates: false
    })
  }

  return limitedResult
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

function normalizeFeedbackSentiment(item: {
  sentiment: string | null
  experience: string | null
  rating: number | null
}): FeedbackRecord["sentiment"] {
  const direct = (item.sentiment ?? "").toLowerCase()
  if (direct === "positive" || direct === "negative") {
    return direct
  }

  if (direct === "neutral") {
    const ratingSentiment = ratingToSentiment(item.rating)
    if (ratingSentiment !== "neutral") {
      return ratingSentiment
    }
  }

  const ratingBased = ratingToSentiment(item.rating)
  if (ratingBased !== "neutral") {
    return ratingBased
  }

  const experience = (item.experience ?? "").toLowerCase()
  if (POSITIVE_EXPERIENCES.has(experience)) {
    return "positive"
  }
  if (NEGATIVE_EXPERIENCES.has(experience)) {
    return "negative"
  }

  return "neutral"
}

function ratingToSentiment(rating: number | null): FeedbackRecord["sentiment"] {
  if (typeof rating === "number") {
    if (rating >= 4) {
      return "positive"
    }
    if (rating > 0 && rating <= 2) {
      return "negative"
    }
  }

  return "neutral"
}

function buildFeedbackRecord(
  item: {
    id: string
    rating: number | null
    feedback: string | null
    experience: string | null
    createdAt: Date
  },
  sentiment: FeedbackRecord["sentiment"]
): FeedbackRecord {
  return {
    id: item.id,
    sentiment,
    rating: item.rating,
    feedback: item.feedback?.trim() || item.experience || "",
    createdAt: item.createdAt
  }
}

type NormalizedFeedback = {
  id: string
  sentiment: string | null
  rating: number | null
  feedback: string | null
  experience: string | null
  createdAt: Date
  normalizedSentiment: FeedbackRecord["sentiment"]
}

function normalizeFeedbackBatch(
  items: Array<{
    id: string
    sentiment: string | null
    rating: number | null
    feedback: string | null
    experience: string | null
    createdAt: Date
  }>
): NormalizedFeedback[] {
  return items.map((item) => ({
    ...item,
    normalizedSentiment: normalizeFeedbackSentiment(item)
  }))
}

async function loadAdditionalFeedback(
  restaurantId: string,
  sentiment: FeedbackRecord["sentiment"],
  beforeDate: Date | null,
  usedIds: Set<string>,
  needed: number
): Promise<FeedbackRecord[]> {
  if (needed <= 0) {
    return []
  }

  const raw = await prisma.feedback.findMany({
    where: {
      form: {
        restaurantId
      },
      id: usedIds.size ? { notIn: Array.from(usedIds) } : undefined,
      createdAt: beforeDate ? { lte: beforeDate } : undefined
    },
    select: FEEDBACK_SELECTION,
    orderBy: {
      createdAt: "desc"
    },
    take: needed * 5
  })

  const normalized = normalizeFeedbackBatch(raw).filter(
    (item) => item.normalizedSentiment === sentiment && !usedIds.has(item.id)
  )

  const selected = normalized.slice(0, needed).map((item) => buildFeedbackRecord(item, sentiment))

  for (const record of selected) {
    usedIds.add(record.id)
  }

  return selected
}
