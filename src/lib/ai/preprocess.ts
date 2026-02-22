// src/lib/ai/preprocess.ts

const STOP_WORDS = new Set([
  "the","a","and","or","but","with","to","of","for","in","on","it","is","was","were","be",
  "this","that","an","at","as","from","by","very","really","just","had","have","has",
  "okay","ok","hmm","meh","fine","nice","good","bad","awesome","wow"
])

// Gujarati / Hindi → English normalization (internal only)
const LEXICON: Record<string,string> = {
  // taste / temperature
  "swad":"taste",
  "swad nathi avyo":"bad taste",
  "kharu":"salty",
  "khara":"salty",
  "namak jyada":"too salty",
  "thandu":"cold",
  "garam":"hot",

  // service / time
  "der":"late",
  "time lagi gayo":"slow",
  "slow":"slow",

  // price / quantity
  "bhav vadhare":"price high",
  "price high":"price high",
  "ghat":"small portion",
  "kam qty":"small portion",

  // praise
  "mast":"great",
  "badiya":"great",
  "laajawab":"great",
  "saras":"great",
  "khoob":"great",

  // hygiene
  "saaf":"clean",
  "cleanliness":"cleanliness",
}

// words that imply *something actionable*
const CONCRETE_HINTS = [
  // food
  "naan","roti","butter","paneer","dal","rice","soup","gravy","sabji",
  "pizza","burger","pasta","noodles","sandwich",

  // service
  "staff","service","wait","time","delay","order",

  // quality
  "cold","hot","salty","spicy","bland","undercooked","overcooked",

  // price / quantity
  "price","portion","quantity","cost",

  // hygiene
  "clean","dirty","table","water","washroom"
]

// generic junk we don’t want insights from
const GENERIC_NOUNS = ["food","dish","item","things"]

const EMOJI_ONLY = /^[\p{Emoji_Presentation}\p{Emoji}\s]+$/u
const NON_LETTER_ONLY = /^[^A-Za-z\u0A80-\u0AFF]+$/
const PHONE = /\+?\d[\d\s\-()]{8,}/g

export type CleanRecord = {
  id: string
  sentiment: "positive" | "negative" | "neutral"
  rating: number | null
  feedback: string
}

export function preprocess(records: CleanRecord[]): CleanRecord[] {
  return records
    .map(r => ({ ...r, feedback: sanitize(r.feedback) }))
    .filter(r => isMeaningful(r.feedback))
    .map(r => {
  const normalized = lexNormalize(r.feedback)
  const ratingHint = r.rating ? `[rating:${r.rating}] ` : ""
  return { ...r, feedback: ratingHint + normalized }
})
}

function sanitize(text: string): string {
  if (!text) return ""

  let t = text
    .replace(PHONE, "[phone]")
    .replace(/["“”‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()

  // goooood → good
  t = t.replace(/([A-Za-z\u0A80-\u0AFF])\1{2,}/g, "$1$1")

  // good good good → good
  t = t.replace(/\b(\w+)(\s+\1\b)+/gi, "$1")

  return t
}

function isMeaningful(text: string): boolean {
  if (!text || text.length < 2) return false
  if (EMOJI_ONLY.test(text)) return false
  if (NON_LETTER_ONLY.test(text)) return false

  const toks = text
    .toLowerCase()
    .split(/[^a-zA-Z\u0A80-\u0AFF]+/)
    .filter(tok => tok && !STOP_WORDS.has(tok))

  if (!toks.length) return false
  return true
}

function lexNormalize(text: string): string {
  const parts = text.split(/\b/)
  return parts
    .map(p => {
      const k = p.toLowerCase().trim()
      return LEXICON[k] ? LEXICON[k] : p
    })
    .join("")
}
