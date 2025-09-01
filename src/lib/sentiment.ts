/**
 * Sentiment analysis utilities for feedback processing
 */

export interface FeedbackData {
  experience?: string
  rating?: number | null
}

export interface SentimentDistribution {
  positive: number
  neutral: number
  negative: number
}

/**
 * Analyze feedback experience and map to sentiment
 * 
 * @param experience - The experience string from feedback
 * @returns Sentiment classification
 */
export function analyzeFeedbackExperience(experience: string): 'positive' | 'neutral' | 'negative' {
  switch (experience) {
    case 'YO!':
    case 'Pretty good':
      return 'positive'
    case 'Okay-ish':
      return 'neutral'
    case 'Not great':
    case 'Poor':
      return 'negative'
    default:
      return 'neutral'
  }
}

/**
 * Analyze numeric rating and map to sentiment
 * 
 * @param rating - Numeric rating (1-5)
 * @returns Sentiment classification
 */
export function analyzeNumericRating(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}

/**
 * Extract rating from answers JSON
 * 
 * @param answers - JSON string or object containing form answers
 * @returns Numeric rating or null if not found
 */
export function extractRatingFromAnswers(answers: any): number | null {
  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers)
    } catch {
      return null
    }
  }

  // Look for rating questions (1-5 scale)
  for (const [question, answer] of Object.entries(answers)) {
    if (typeof answer === 'number' && answer >= 1 && answer <= 5) {
      return answer
    }
  }

  return null
}

/**
 * Calculate sentiment distribution from feedback data
 * 
 * @param feedbackData - Array of feedback data objects
 * @returns Sentiment distribution counts
 */
export function calculateSentimentDistribution(feedbackData: FeedbackData[]): SentimentDistribution {
  let positive = 0
  let neutral = 0
  let negative = 0

  feedbackData.forEach(item => {
    if (item.experience) {
      const sentiment = analyzeFeedbackExperience(item.experience)
      if (sentiment === 'positive') positive++
      else if (sentiment === 'neutral') neutral++
      else negative++
    } else if (item.rating) {
      const sentiment = analyzeNumericRating(item.rating)
      if (sentiment === 'positive') positive++
      else if (sentiment === 'neutral') neutral++
      else negative++
    }
  })

  return { positive, neutral, negative }
}

/**
 * Calculate average rating from feedback data
 * 
 * @param feedbackData - Array of feedback data objects
 * @returns Average rating or 0 if no ratings
 */
export function calculateAverageRating(feedbackData: FeedbackData[]): number {
  let totalRating = 0
  let ratingCount = 0

  feedbackData.forEach(item => {
    if (item.experience) {
      // Map experience to rating
      let rating: number
      switch (item.experience) {
        case 'YO!': rating = 5; break
        case 'Pretty good': rating = 4; break
        case 'Okay-ish': rating = 3; break
        case 'Not great': rating = 2; break
        case 'Poor': rating = 1; break
        default: rating = 3
      }
      totalRating += rating
      ratingCount++
    } else if (item.rating) {
      totalRating += item.rating
      ratingCount++
    }
  })

  return ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0
}

/**
 * Extracts customer name from dynamic form answers
 */
export function extractCustomerName(answers: Record<string, any>): string {
  const nameFields = ['name', 'customerName', 'fullName', 'firstName', 'first_name', 'customer_name']
  
  for (const field of nameFields) {
    if (answers[field] && typeof answers[field] === 'string' && answers[field].trim()) {
      return answers[field].trim()
    }
  }
  
  // Look for any string that could be a name
  const possibleNames = Object.values(answers).filter((value): value is string => 
    typeof value === 'string' && 
    value.length > 0 && 
    value.length < 50 && 
    !value.includes('@') && 
    !value.includes('http') &&
    !value.match(/^\d+$/) && // Not just numbers
    !value.match(/^\+?\d[\d\s\-\(\)]+$/) // Not a phone number
  )
  
  if (possibleNames.length > 0) {
    return possibleNames.sort((a, b) => a.length - b.length)[0]
  }
  
  return 'Anonymous'
}

/**
 * Extracts feedback text from dynamic form answers
 */
export function extractFeedbackText(answers: Record<string, any>): string {
  const feedbackFields = ['feedback', 'comment', 'comments', 'message', 'text', 'description', 'review']
  
  for (const field of feedbackFields) {
    if (answers[field] && typeof answers[field] === 'string' && answers[field].trim()) {
      return answers[field].trim()
    }
  }
  
  // Look for the longest string that could be feedback
  const possibleFeedback = Object.values(answers).filter((value): value is string => 
    typeof value === 'string' && 
    value.length > 10 && 
    value.length < 1000 && 
    !value.includes('@') && 
    !value.includes('http') &&
    !value.match(/^\+?\d[\d\s\-\(\)]+$/) // Not a phone number
  )
  
  if (possibleFeedback.length > 0) {
    return possibleFeedback.sort((a, b) => b.length - a.length)[0]
  }
  
  return 'No text feedback provided'
}

/**
 * Extracts phone number from dynamic form answers
 */
export function extractPhoneNumber(answers: Record<string, any>): string {
  const phoneFields = ['phone', 'phoneNumber', 'phone_number', 'mobile', 'contact', 'phoneNum']
  
  for (const field of phoneFields) {
    if (answers[field] && typeof answers[field] === 'string' && answers[field].trim()) {
      return answers[field].trim()
    }
  }
  
  // Look for strings that look like phone numbers
  const possiblePhones = Object.values(answers).filter((value): value is string => 
    typeof value === 'string' && 
    !!value.match(/^\+?\d[\d\s\-\(\)]+$/) &&
    value.replace(/\D/g, '').length >= 10
  )
  
  if (possiblePhones.length > 0) {
    return possiblePhones[0]
  }
  
  return 'N/A'
}
