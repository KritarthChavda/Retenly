#!/usr/bin/env node

/**
 * Seed feedback submissions for a given public form slug.
 *
 * Usage:
 *   node scripts/seed-feedback.js [slug] [count] [baseUrl]
 *
 * Defaults:
 *   slug    -> "downtown"
 *   count   -> 100
 *   baseUrl -> "http://localhost:3000"
 *
 * Notes:
 * - The payload shape matches the original script: { answers }
 * - Comments include references to the menu (soups, nachos, dumplings, paneer, dal, ravioli, chowder, etc.)
 */

const DEFAULT_SLUG = process.argv[2] || 'downtown'
const DEFAULT_COUNT = Number(process.argv[3] ?? 100)
const DEFAULT_BASE_URL = process.argv[4] || 'http://localhost:3000'

const experiences = [
  'Excellent',
  'Very good',
  'Pretty good',
  'Okay-ish',
  'Not great',
  'Poor',
  'Terrible'
]

const sampleComments = [
  // Positive / mixed comments referencing the menu
  'Potato Dumplings with the pepperika sauce were outstanding — well seasoned and perfectly rolled.',
  'Paneer Tikka Methi Garlic Masala had a lovely char and balanced spices. Will order again.',
  'Foil Cook Mexican Chilly Paneer was spicy and flavorful. Rice portion was generous.',
  'Dal Bukhara was rich and smooth — authentic slow-cooked flavor.',
  'Vegetable Chauputas had great texture; vegetables were fresh and the creole sauce worked well.',
  'Ravioli in Creole Sauce delivered — pasta handmade and sauce creamy with a nice basil note.',
  'Khow E Suey tasted exactly like I remembered from my travels — comforting and flavorful.',
  'Nachos Grande had crispy tortillas and a good mix of beans and jalapenos.',
  'Spicey Cheese Spinach Balls were crisp and garlicky. Nice starter.',
  'Broccoli Cheddar Cheese Soup in the bread bowl was creamy and very satisfying.',
  'Tomato Basil Herb Soup was simple and fresh — good balance of tomato and basil.',
  'Hot and Sour Soup had a nice tang; not overly spicy.',
  'Thai Coconut Soup had fresh coconut notes and a pleasant warmth from the spices.',
  'Mexican Chilly Bean Soup was hearty and filling — great on a rainy day.',
  'Potato & Leek Soup was velvety and well-seasoned.',
  // Neutral / constructive
  'Food was generally good but portions were inconsistent between dishes.',
  'Service was friendly, however the mains took longer than expected.',
  'Ambience is nice; a few of the tables were sticky which pulled the experience down.',
  'The soup temperature was perfect, but it arrived a bit late compared to the starters.',
  'Flavor profile was interesting but some items needed a bit more salt/acid to brighten them.',
  'Presentation was attractive, though the paneer felt slightly overcooked.',
  // Negative
  'Ravioli felt underfilled and the creole sauce was bland.',
  'Jalapeno Cheese Soup was too greasy and lacked freshness.',
  'Nachos Grande came soggy — chips needed to be crisper.',
  'Paneer Tikka was dry and overly salty.',
  'Dal was watery and lacked depth in seasoning.',
  'Khow E Suey portion was tiny for the price.',
  'House Favourite Chowder was overly salty and heavy on cream.',
  'Vegetables in the Vegetable Chauputas were undercooked and limp.',
  'Thai Coconut Soup had barely any coconut flavor; tasted thin.',
  'Service was slow and the server forgot our extra napkins request.',
  // Variety/realism (some mention staff, cleanliness, delivery, repeat visits)
  'Came for a quick lunch. Staff were efficient and polite. Will return.',
  'Good place for a casual meal. Noise level is high on weekends.',
  'Clean restrooms and overall tidy space. Appreciate that.',
  'We celebrated a birthday here; staff helped with a small surprise which was thoughtful.',
  'Explained a food allergy and the kitchen handled it carefully — thank you.',
  'The bill had an unexpected charge; manager corrected it without issue.',
  'Value is okay but some items feel a bit overpriced for portion size.',
  'Ordered takeaway — packaging was secure and food stayed warm.',
  'Order was partially missing in takeaway; staff apologized and resolved it quickly.',
  'Reservation held for us despite being 10 minutes late. Helpful staff.',
]

const firstNames = [
  'Alex', 'Taylor', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Avery',
  'Dakota', 'Jamie', 'Parker', 'Sasha', 'Dev', 'Nina', 'Arjun', 'Priya',
  'Kiran', 'Leah', 'Ishaan', 'Sam', 'Meera'
]

const lastNames = [
  'Smith', 'Johnson', 'Lee', 'Taylor', 'Patel', 'Garcia', 'Chen',
  'Brown', 'Singh', 'Martin', 'Kumar', 'Shah', 'Nguyen', 'Lopez', 'Murthy'
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomPhone() {
  // Use realistic local-ish numbers (India-style), change prefix and keep 10 digits
  const prefixes = ['98', '91', '99', '87', '75', '77']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(10000000 + Math.random() * 90000000).toString() // 8 digits
  return `+91${prefix}${suffix}` // e.g. +919812345678
}

function pickDishReference() {
  // small helper to optionally append a specific dish name to make feedback realistic
  const dishes = [
    'Potato Dumplings', 'Paneer Tikka Methi Garlic Masala', 'Foil Cook Mexican Chilly Paneer',
    'Dal Bukhara', 'Vegetable Chauputas', 'Ravioli in Creole Sauce', 'Khow E Suey',
    'Nachos Grande', 'Spicey Cheese Spinach Balls', 'Broccoli Cheddar Cheese Soup',
    'Jalapeno Cheese Soup', 'Tomato Basil Herb Soup', 'Mexican Chilly Bean Soup',
    'Hot And Sour Soup', 'Thai Coconut Soup', 'Potato & Leek Soup'
  ]
  return randomChoice(dishes)
}

function buildPayload() {
  const name = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`
  const experience = randomChoice(experiences)

  // pick base comment and optionally inject a dish name for realism
  let comment = randomChoice(sampleComments)

  // 60% chance to append a short specific note referencing a dish or experience detail
  if (Math.random() < 0.6) {
    const dish = pickDishReference()
    const connectors = [
      ` I tried the ${dish} and`,
      ` Specifically, the ${dish} was`,
      ` For example, the ${dish} was`,
      ` The ${dish} in particular`
    ]
    const connector = randomChoice(connectors)
    // attach a short clause that matches positive/negative tone sometimes
    const endings = [
      ' delightful and well-balanced.',
      ' a bit under-seasoned but overall good.',
      ' too salty for my taste.',
      ' served hot and fresh.',
      ' lacked the depth of flavor I expected.',
      ' portion was generous.',
      ' could use a touch more acidity.',
      ' arrived piping hot.'
    ]
    comment += connector + randomChoice(endings)
  }

  // Slightly tweak comment length and realism
  if (Math.random() < 0.15) comment += ' Would recommend for groups.'
  if (Math.random() < 0.05) comment += ' Came back next week — still good.'

  // Map experience to rating 1..5
  const rating = (() => {
    switch (experience) {
      case 'Excellent':
        return 5
      case 'Very good':
        return 5
      case 'Pretty good':
        return 4
      case 'Okay-ish':
        return 3
      case 'Not great':
        return 2
      case 'Poor':
        return 2
      case 'Terrible':
        return 1
      default:
        return 3
    }
  })()

  return {
    name,
    customerName: name,
    phone: randomPhone(),
    experience,
    feedback: comment,
    rating
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
  const count = Number.isFinite(DEFAULT_COUNT) ? DEFAULT_COUNT : 100
  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, '')

  console.log(`➡️  Target form: ${baseUrl}/api/forms/${slug}`)
  console.log(`➡️  Seeding ${count} feedback entries`)

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
      console.log(`✅ Submission ${i}/${count}:`, result.feedbackId ?? result.id ?? 'ok')
    } catch (error) {
      console.error(`❌ Submission ${i}/${count} failed:`, error.message)
    }

    // Small delay to avoid hammering the server
    if (i !== count) {
      // randomize a little to look less bot-like
      const delayMs = 200 + Math.floor(Math.random() * 400) // between 200ms and 600ms
      await wait(delayMs)
    }
  }

  console.log('🏁 Seeding complete')
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
