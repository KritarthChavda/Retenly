#!/usr/bin/env node
/**
 * Seed messy, real-world feedback for a given public form slug.
 * Usage:
 *   node scripts/seed-feedback.js [slug] [count] [baseUrl]
 *
 * Adds:
 * - Gibberish & nonsense entries (10–15% of feedbacks)
 * - Short, ungrammatical, bilingual comments (English + Gujarati + Hinglish)
 * - One-word blurts, emojis, typos, random casing, incomplete thoughts
 */

const DEFAULT_SLUG = process.argv[2] || 'downtown'
const DEFAULT_COUNT = Number(process.argv[3] ?? 100)
const DEFAULT_BASE_URL = process.argv[4] || 'http://localhost:3000'

const experiences = [
  'Excellent', 'Very good', 'Pretty good', 'Okay-ish', 'Not great', 'Poor', 'Terrible'
]

// --- micro comments ---
const microPos = [
  'good taste',
  'liked it',
  'very nice',
  'mast food',
  'worth the price',
  'staff was polite',
  'fresh food',
  'will come again',
  'service was quick',
  'felt satisfied'
]

const microNeu = [
  'okay overall',
  'average taste',
  'nothing special',
  'can improve',
  'it was fine',
  'normal experience',
  'expected better',
  'not bad not great'
]

const microNeg = [
  'not good',
  'taste was off',
  'too salty',
  'food was cold',
  'service slow',
  'not worth it',
  'disappointed',
  'won’t order again'
]

// --- short, messy phrases ---
const shortPos = [
  'butter naan was soft and fresh',
  'paneer tikka had good flavor',
  'soup was hot and tasty',
  'staff handled us nicely',
  'quick service even on weekend',
  'ambience was calm and clean',
  'mocktails were refreshing',
  'dal bukhara was rich and filling',
  'good quantity for price',
  'family liked the food'
]

const shortNeu = [
  'taste was okay but portion felt less',
  'food good but service little slow',
  'price slightly high for quantity',
  'ambience nice but noisy in evening',
  'menu confusing for first time',
  'soup arrived late but was warm',
  'cleanliness okay, can be better',
  'average experience overall'
]

const shortNeg = [
  'hot and sour soup was cold',
  'paneer was chewy and dry',
  'nachos were soggy',
  'service was slow during dinner time',
  'bill had extra item added',
  'vegetables felt undercooked',
  'thai coconut soup lacked flavor',
  'too much salt in gravy',
  'wait time was very long',
  'not happy with service'
]

// --- Gujarati / Hinglish ---
const guPos = [
  'khavanu saras hatu',
  'paneer khub soft hatu',
  'service saras che',
  'staff vinamra che',
  'bhav barabar che',
  'family ne gamyu'
]

const guNeu = [
  'bas thik che',
  'taste average che',
  'time thodu vadhu lagyo',
  'price thodu high lage che',
  'chaley che'
]

const guNeg = [
  'swad nathi avyo',
  'khub kharu hatu',
  'thandu aavyu',
  'order late aavyo',
  'bhav vadhare che'
]

// --- gibberish / nonsense ---
const gibberishPool = [
  'ok',
  'hmm',
  'idk',
  'whatever',
  'not sure',
  '…',
  '????',
  'no comments',
  'skip',
  'nothing to say'
]

// --- dishes to sometimes include ---
const dishes = [
  'butter naan',
  'paneer tikka',
  'dal bukhara',
  'hot and sour soup',
  'thai coconut soup',
  'nachos',
  'mocktails',
  'vegetable curry',
  'cheesecake',
  'ravioli'
]

// --- helpers ---
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const rc = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1))

const firstNames = ['Alex','Taylor','Jordan','Morgan','Casey','Riley','Avery','Dakota','Jamie','Parker','Sasha','Dev','Nina','Arjun','Priya','Kiran','Leah','Ishaan','Sam','Meera']
const lastNames  = ['Smith','Johnson','Lee','Taylor','Patel','Garcia','Chen','Brown','Singh','Martin','Kumar','Shah','Nguyen','Lopez','Murthy']
function randomPhone() {
  const prefixes = ['98', '91', '99', '87', '75', '77']
  const prefix = rc(prefixes)
  const suffix = Math.floor(10000000 + Math.random() * 90000000).toString()
  return `+91${prefix}${suffix}`
}

// --- noise injectors ---
function stretch(s) {
  if (s.length < 3 || Math.random() < 0.5) return s
  const i = randInt(1, s.length - 2)
  const ch = s[i]
  const reps = randInt(2, 5)
  return s.slice(0, i) + ch.repeat(reps) + s.slice(i + 1)
}
function randomCase(s) {
  if (Math.random() < 0.6) return s
  return s.split('').map(c => Math.random() < 0.5 ? c.toUpperCase() : c.toLowerCase()).join('')
}
function addPunct(s) {
  const tails = ['.', '!', '!!', '…', '', '!!!']
  return s + rc(tails)
}
function addEmoji(s) {
  if (Math.random() < 0.6) return s
  const e = rc([' 🤌', ' 😍', ' 🙂', ' 😑', ' 🤯', ' ✨', ' 🙏', ' 😬'])
  return s + e
}
function typo(s) {
  if (s.length < 5 || Math.random() < 0.5) return s
  const i = randInt(1, s.length - 2)
  return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2)
}
function maybeDish(s) {
  if (Math.random() < 0.45) {
    const d = rc(dishes)
    const joiners = [' — ', ' : ', ' - ', ' | ']
    return `${s}${rc(joiners)}${d}`
  }
  return s
}

// --- messy comment generator ---
function buildNoisyComment(sentiment) {
  // 15% chance: pure gibberish
  if (Math.random() < 0.15) {
    return rc(gibberishPool)
  }

  let base
  const roll = Math.random()
  if (sentiment === 'positive') {
    base = roll < 0.55 ? rc(microPos) : (roll < 0.8 ? rc(shortPos) : rc(guPos))
  } else if (sentiment === 'negative') {
    base = roll < 0.55 ? rc(microNeg) : (roll < 0.8 ? rc(shortNeg) : rc(guNeg))
  } else {
    base = roll < 0.55 ? rc(microNeu) : (roll < 0.8 ? rc(shortNeu) : rc(guNeu))
  }

  if (Math.random() < 0.2)
    base = `${base} ${rc(sentiment === 'positive' ? microPos : sentiment === 'negative' ? microNeg : microNeu)}`

  base = maybeDish(base)
  base = addEmoji(addPunct(randomCase(stretch(typo(base)))))

  if (Math.random() < 0.15)
    base = rc(sentiment === 'positive' ? microPos : sentiment === 'negative' ? microNeg : microNeu)

  return base.trim()
}

// --- rating/experience mapping ---
function ratingForSentiment(sentiment) {
  if (sentiment === 'positive') return rc([5,5,4])
  if (sentiment === 'negative') return rc([1,2,2])
  return rc([3,3,4])
}
function experienceForRating(r) {
  if (r >= 5) return 'Excellent'
  if (r === 4) return 'Pretty good'
  if (r === 3) return 'Okay-ish'
  if (r === 2) return 'Poor'
  return 'Terrible'
}

// --- build payload ---
function buildPayload() {
  const p = Math.random()
  const sentiment = p < 0.45 ? 'positive' : p < 0.70 ? 'negative' : 'neutral'
  const rating = ratingForSentiment(sentiment)
  const experience = experienceForRating(rating)
  const name = `${rc(firstNames)} ${rc(lastNames)}`
  const feedback = buildNoisyComment(sentiment)

  return {
    name,
    customerName: name,
    phone: randomPhone(),
    experience,
    feedback,
    rating
  }
}

// --- API calls ---
async function fetchForm(baseUrl, slug) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/forms/${slug}`)
  if (!response.ok) throw new Error(`Failed to fetch form (${response.status} ${response.statusText})`)
  return response.json()
}

async function submitFeedback(baseUrl, slug, answers) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/forms/${slug}/submit`, {
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

// --- runner ---
const log = (...a) => console.log(...a)

async function main() {
  const slug = DEFAULT_SLUG
  const count = Number.isFinite(DEFAULT_COUNT) ? DEFAULT_COUNT : 100
  const baseUrl = DEFAULT_BASE_URL

  log(`➡️  Target form: ${baseUrl}/api/forms/${slug}`)
  log(`➡️  Seeding ${count} messy feedback entries (with gibberish)`)

  try {
    const formResponse = await fetchForm(baseUrl, slug)
    log(`✅ Retrieved form "${formResponse.form?.title ?? 'Unknown'}" for restaurant "${formResponse.restaurant?.name ?? 'Unknown'}"`)
  } catch (e) {
    console.error('❌ Failed to fetch form metadata:', e.message)
    process.exit(1)
  }

  for (let i = 1; i <= count; i++) {
    const answers = buildPayload()
    try {
      const result = await submitFeedback(baseUrl, slug, answers)
      log(`✅ Submission ${i}/${count}:`, result.feedbackId ?? result.id ?? 'ok')
    } catch (e) {
      console.error(`❌ Submission ${i}/${count} failed:`, e.message)
    }
    if (i !== count) await wait(150 + Math.floor(Math.random() * 400))
  }

  log('🏁 Seeding complete')
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
