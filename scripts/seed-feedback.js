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
  'good', 'nice', 'mast', 'solid', 'awesome', 'wow', 'super', 'great', 'bhaut saras', 'laajawab',
  '👌', '👍', '🔥', '❤️', 'bdiya', 'khoob', 'taste on point', 'lovd it', 'OP', '10/10'
]
const microNeu = [
  'ok', 'fine', 'thik thak', 'average', 'theek', 'hmm', 'meh', 'chaleyga', 'chale', 'saru',
  '🤷', '🙂', '…', 'hmmm', 'it was ok'
]
const microNeg = [
  'bad', 'meh', 'not good', 'kharab', 'boro', 'ghatia', 'bekar', 'nope', '👎', '😐',
  'cold', 'late', 'salt too much', 'boring', 'faltu', '👎🏻', '🤢'
]

// --- short, messy phrases ---
const shortPos = [
  'cheesecake OP boss', 'service mast yaar', 'staff bahu saras 👌', 'mocktail fresh, liked',
  'paneer soft soft', 'soup garam and tasty', 'ambience nice, music light', 'fast delivery 💨',
  'dal bukhara wow yrr', 'kachori vibes but ravioli superb', 'value good for group'
]
const shortNeu = [
  'portion thik hai, price thoda high', 'noise zyada on weekend', 'ok ok, can try',
  'taste fine but not consistent', 'service friendly par slow', 'soup thik, came late',
  'cleanliness okay, table chipkoo thoda', 'menu long, confusing a bit'
]
const shortNeg = [
  'mocktail bland yaar', 'nachos soggy 🥲', 'dal watery, no depth', 'paneer dry + salty',
  'bill me extra item 🤨', 'server forgot tissues', 'khow suey very less qty',
  'thai soup me coconut taste nahi', 'chowder too salty', 'veg undercooked, limp'
]

// --- Gujarati / Hinglish ---
const guPos = [
  'taste saras che', 'staff khub vinamra', 'service jhakkas che', 'garam ane tasty',
  'price pan barabar', 'majaa aavyu'
]
const guNeu = [
  'bas theek che', 'chale che', 'avarage che', 'thodu noisy hatu', 'time lagi gayo'
]
const guNeg = [
  'swad nathi avyo', 'khub kharu hatu', 'bhav vadhare', 'thandu aavyu', 'order late'
]

// --- gibberish / nonsense ---
const gibberishPool = [
  'Hiiii', 'hjfchjdf', 'yoooo', 'ufrrefif', 'aaaaa', 'hello??', 'abcdeee', 'kajdkad',
  'no idea lol', 'whatt', '😵‍💫', '🥴🥴', 'jst asdfg', '?!?!?', 'hmmm idk', 'bsssss',
  '....', '????', 'u there', 'uhuhuhuh', 'ye kya tha', 'chalo bye', '😶‍🌫️', 'bruhhh',
  'reeee', 'dfgdfgdf', 'ghjgjhgj', 'sdf sdf sdf', 'bhhh', '🤪🤪🤪', 'haaaaan', 'okokok',
  'bla bla', 'xD', '💀💀💀'
]

// --- dishes to sometimes include ---
const dishes = [
  'cheesecake', 'mocktails', 'Hot & Sour soup', 'Potato & Leek soup', 'nachos',
  'paneer tikka', 'dal bukhara', 'ravioli', 'thai coconut soup', 'vegetable chauputas'
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
