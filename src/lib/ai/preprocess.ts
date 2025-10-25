// src/lib/ai/preprocess.ts
const STOP_WORDS = new Set([
  "the","a","and","or","but","with","to","of","for","in","on","it","is","was","were","be",
  "this","that","an","at","as","from","by","very","really","just","had","have","has",
  "okay","ok","hmm","meh","fine","nice"
])

// minimal Gujarati/Hindi lexicon -> English hinting (we do NOT output it, only normalize)
const LEXICON: Record<string,string> = {
  // taste
  "swad":"taste","swad nathi avyo":"did not like taste","bland":"bland","kharu":"salty",
  "khara":"salty","namak jyada":"too salty","thandu":"cold","garam":"hot",
  // time/service
  "der":"late","late":"late","time lagi gayo":"slow","slow":"slow",
  // quantity/price
  "bhav vadhare":"price high","price high":"price high","ghat":"small portion","kam qty":"small portion",
  // quality/items
  "mast":"great","badiya":"great","laajawab":"great","saras":"great","khoob":"great",
  // housekeeping
  "saaf":"clean","cleanliness":"cleanliness",
}

const EMOJI_ONLY = /^[\p{Emoji_Presentation}\p{Emoji}\s]+$/u
const NON_LETTER_ONLY = /^[^A-Za-z\u0A80-\u0AFF]+$/ // allow Gujarati block
const PHONE = /\+?\d[\d\s\-()]{8,}/g

export type CleanRecord = {
  id: string
  sentiment: "positive"|"negative"|"neutral"
  rating: number|null
  feedback: string
}

export function preprocess(records: CleanRecord[]): CleanRecord[] {
  return records
    .map(r => ({...r, feedback: sanitize(r.feedback)}))
    .filter(r => isMeaningful(r.feedback))
    .map(r => ({...r, feedback: lexNormalize(r.feedback)}))
}

function sanitize(text: string): string {
  if (!text) return ""
  let t = text.replace(PHONE, "[phone]").replace(/["“”‘’]/g,"'").replace(/\s+/g," ").trim()
  // collapse long letter stretches: goooood -> good
  t = t.replace(/([A-Za-z\u0A80-\u0AFF])\1{2,}/g, "$1$1")
  return t
}

function isMeaningful(t: string): boolean {
  if (!t || t.length < 3) return false
  if (EMOJI_ONLY.test(t)) return false
  if (NON_LETTER_ONLY.test(t)) return false // only symbols/numbers
  // single token and unknown -> drop
  const toks = t.toLowerCase().split(/[^a-zA-Z\u0A80-\u0AFF]+/).filter(Boolean)
  if (toks.length === 1 && !LEXICON[toks[0]] && toks[0].length < 4) return false
  return true
}

function lexNormalize(t: string): string {
  const toks = t.split(/\b/)
  return toks.map(tok => {
    const key = tok.toLowerCase().trim()
    return LEXICON[key] ? LEXICON[key] : tok
  }).join("")
}
