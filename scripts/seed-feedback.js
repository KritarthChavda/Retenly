#!/usr/bin/env node

/**
 * Seed feedback submissions for a given public form slug.
 *
 * Usage:
 *   node scripts/seed-feedback.js [slug] [count] [baseUrl]
 *
 * Defaults:
 *   slug    -> "downtown"
 *   count   -> 10
 *   baseUrl -> "http://localhost:3000"
 */

const DEFAULT_SLUG = process.argv[2] || 'downtown'
const DEFAULT_COUNT = Number(process.argv[3] ?? 10)
const DEFAULT_BASE_URL = process.argv[4] || 'http://localhost:3000'

const experiences = ['YO!', 'Pretty good', 'Okay-ish', 'Not great', 'Poor']
const sampleComments = [
  'Loved the ambience and the staff were very friendly.',
  'Service was quick and the burger tasted amazing!',
  'Food was decent but the wait time was a bit long.',
  'The place was okay, could use a bit more variety on the menu.',
  'Not very satisfied with the cleanliness today.'
]
const firstNames = ['Alex', 'Taylor', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Avery', 'Dakota', 'Jamie', 'Parker']
const lastNames = ['Smith', 'Johnson', 'Lee', 'Taylor', 'Patel', 'Garcia', 'Chen', 'Brown', 'Singh', 'Martin']

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomPhone() {
  const prefix = ['987', '912', '998', '871', '756'][Math.floor(Math.random() * 5)]
  const suffix = Math.floor(1000000 + Math.random() * 9000000).toString()
  return `+1${prefix}${suffix}`
}

function buildPayload() {
  const name = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`
  const experience = randomChoice(experiences)
  const feedback = randomChoice(sampleComments)

  return {
    name,
    customerName: name,
    phone: randomPhone(),
    experience,
    feedback,
    rating: (() => {
      switch (experience) {
        case 'YO!':
          return 5
        case 'Pretty good':
          return 4
        case 'Okay-ish':
          return 3
        case 'Not great':
          return 2
        case 'Poor':
          return 1
        default:
          return 3
      }
    })()
  }
}

async function fetchForm(baseUrl, slug) {
  const response = await fetch(`${baseUrl}/api/forms/${slug}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch form (${response.status} ${response.statusText})`)
  }
  return response.json()
}

async function submitFeedback(baseUrl, slug, answers) {
  const response = await fetch(`${baseUrl}/api/forms/${slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Submission failed (${response.status} ${response.statusText}): ${body}`)
  }

  return response.json()
}

async function main() {
  const slug = DEFAULT_SLUG
  const count = Number.isFinite(DEFAULT_COUNT) ? DEFAULT_COUNT : 10
  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, '')

  console.log(`➡️  Target form: ${baseUrl}/api/forms/${slug}`)

  try {
    const formResponse = await fetchForm(baseUrl, slug)
    console.log(`✅ Retrieved form "${formResponse.form?.title ?? 'Unknown'}" for restaurant "${formResponse.restaurant?.name ?? 'Unknown'}"`)
  } catch (error) {
    console.error('❌ Failed to fetch form metadata:', error.message)
    process.exit(1)
  }

  for (let i = 1; i <= count; i++) {
    const answers = buildPayload()
    try {
      const result = await submitFeedback(baseUrl, slug, answers)
      console.log(`✅ Submission ${i}/${count}:`, result.feedbackId)
    } catch (error) {
      console.error(`❌ Submission ${i}/${count} failed:`, error.message)
    }

    // Small delay to avoid hammering the server
    if (i !== count) {
      await wait(300)
    }
  }

  console.log('🏁 Seeding complete')
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
