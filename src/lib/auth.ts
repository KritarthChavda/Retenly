import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

/**
 * Authentication utilities for admin dashboard
 */

// Hardcoded admin credentials (in production, these should be in environment variables)
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

/**
 * Hash a password using bcrypt
 * 
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against its hash
 * 
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a random string for usernames and passwords
 * 
 * @param length - Length of the random string
 * @returns Random string
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Verify admin credentials
 * 
 * @param username - Admin username
 * @param password - Admin password
 * @returns Boolean indicating if credentials are valid
 */
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  if (username !== ADMIN_USERNAME) {
    return false
  }
  
  // For now, use simple comparison. In production, you'd store hashed admin password in DB
  return password === ADMIN_PASSWORD
}

/**
 * Create or get admin user
 * 
 * @returns Admin user object
 */
export async function getOrCreateAdmin() {
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: ADMIN_USERNAME }
  })

  if (existingAdmin) {
    return existingAdmin
  }

  // Create admin user if it doesn't exist
  const hashedPassword = await hashPassword(ADMIN_PASSWORD)
  return await prisma.admin.create({
    data: {
      username: ADMIN_USERNAME,
      password: hashedPassword
    }
  })
}

/**
 * Generate restaurant credentials
 * 
 * @returns Object with username and password
 */
export function generateRestaurantCredentials() {
  return {
    username: generateRandomString(8),
    password: generateRandomString(10)
  }
} 