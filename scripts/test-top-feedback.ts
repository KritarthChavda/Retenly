#!/usr/bin/env ts-node-esm

import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/index.js"
import { curateTopFeedback, FeedbackRecord } from "../src/lib/ai/topFeedback.js"

const prisma = new PrismaClient()

async function main() {
  const restaurantName = process.argv[2]
  const model = process.argv[3]

  if (!restaurantName) {
    console.error("Usage: ts-node scripts/test-top-feedback.ts \"Restaurant Name\" [model]")
    process.exit(1)
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { name: restaurantName },
    select: { id: true, name: true }
  })

  if (!restaurant) {
    console.error(`Restaurant "${restaurantName}" not found.`)
    process.exit(1)
  }

  const feedbacks = (await prisma.feedback.findMany({
    where: {
      form: {
        restaurantId: restaurant.id
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      sentiment: true,
      rating: true,
      feedback: true,
      experience: true,
      createdAt: true
    }
  })) as Array<{
    id: string
    sentiment: string | null
    rating: number | null
    feedback: string | null
    experience: string | null
    createdAt: Date
  }>

  if (!feedbacks.length) {
    console.warn(`No feedback found for restaurant "${restaurant.name}".`)
    process.exit(0)
  }

  const records: FeedbackRecord[] = feedbacks.map((item) => ({
    id: item.id,
    sentiment: (item.sentiment as FeedbackRecord["sentiment"]) || "neutral",
    rating: item.rating,
    feedback: item.feedback?.trim() || item.experience || "No detailed feedback provided.",
    createdAt: item.createdAt
  }))

  const result = await curateTopFeedback(records, {
    model: model || undefined
  })

  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((error) => {
    console.error("Failed to curate top feedback:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
