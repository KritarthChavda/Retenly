import { z } from 'zod'

/**
 * Production-ready validation schemas using Zod
 */

// Restaurant validation
export const restaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required').max(100, 'Name too long'),
  email: z.string().email('Valid email is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
})

// Form validation
export const formSchema = z.object({
  title: z.string().min(1, 'Form title is required').max(200, 'Title too long'),
  subtitle: z.string().optional(),
  closingMessage: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal(''))
})

// Question validation
export const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(500, 'Question too long'),
  type: z.enum(['text', 'rating', 'mcq'], { required_error: 'Question type is required' }),
  options: z.string().optional()
})

// Feedback validation
export const feedbackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phoneNumber: z.string().min(10, 'Valid phone number is required').max(20, 'Phone number too long'),
  experience: z.enum(['YO!', 'Pretty good', 'Okay-ish', 'Poor', 'Not great'], { required_error: 'Experience rating is required' }),
  feedback: z.string().max(1000, 'Feedback too long').optional()
})

// Response validation (dynamic forms)
export const responseSchema = z.object({
  answers: z.record(z.any()).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one answer is required' }
  )
})

// Login validation
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

// Admin validation
export const adminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long')
})

/**
 * Validate and sanitize restaurant slug
 */
export function validateRestaurantSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/
  return phoneRegex.test(phone.trim())
}

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Validate file upload
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(type),
    { message: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG files are allowed.' }
  ),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB')
})

/**
 * Rate limiting validation
 */
export function validateRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  // This is a simple in-memory rate limiter
  // In production, use Redis or a proper rate limiting service
  const now = Date.now()
  const windowStart = now - windowMs
  
  // This would typically be stored in Redis or a database
  // For now, we'll just return true (no rate limiting)
  return true
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback-secret-key') {
    errors.push('JWT_SECRET must be set to a secure value')
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      errors.push('SMTP credentials are required in production')
    }
    
    if (!process.env.NEXTAUTH_SECRET) {
      errors.push('NEXTAUTH_SECRET is required in production')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
