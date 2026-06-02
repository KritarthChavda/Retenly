import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from './prisma'
import { createToken as createJWTToken, verifyToken } from './auth-edge'
import { JWTPayload } from './types/auth' 

export interface AuthResult {
  success: boolean
  user?: JWTPayload
  error?: string
}

// Get admin credentials from environment
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'


/**
 * Hash password using bcrypt
 * 
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 * 
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate random string for credentials (cryptographically secure)
 * 
 * @param length - Length of string to generate
 * @returns Random string
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(bytes[i] % chars.length)
  }
  return result
}

/**
 * Generate secure password (cryptographically secure)
 * 
 * @param length - Length of password
 * @returns Secure password
 */
export function generateSecurePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(bytes[i] % chars.length)
  }
  return result
}

/**
 * Get or create admin user
 * 
 * @returns Admin user data
 */
export async function getOrCreateAdmin(): Promise<{ id: string; username: string }> {
  let admin = await prisma.admin.findUnique({
    where: { username: ADMIN_USERNAME }
  })

  if (!admin) {
    const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'admin123')
    admin = await prisma.admin.create({
      data: {
        username: ADMIN_USERNAME,
        password: hashedPassword
      }
    })
  }

  return { id: admin.id, username: admin.username }
}

/**
 * Verify admin credentials
 * 
 * @param username - Admin username
 * @param password - Admin password
 * @returns Authentication result
 */
export async function verifyAdminCredentials(username: string, password: string): Promise<AuthResult> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { username }
    })
    
    if (admin) {
      const isValidPassword = await verifyPassword(password, admin.password)
      if (isValidPassword) {
        const payload: JWTPayload = {
          id: admin.id,
          username: admin.username,
          type: 'admin'
        }
        
        console.log('Admin login successful (database)', { username })
        return { success: true, user: payload }
      }
    }
    
    console.warn('Admin login attempt with invalid credentials', { username })
    return { success: false, error: 'Invalid credentials' }
  } catch (error) {
    console.error('Error verifying admin credentials', { error, username })
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Verify restaurant owner credentials
 * 
 * @param username - Restaurant username
 * @param password - Restaurant password
 * @returns Authentication result
 */
export async function verifyRestaurantCredentials(username: string, password: string): Promise<AuthResult> {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { username }
    })

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' }
    }

    const isValidPassword = await verifyPassword(password, restaurant.password)
    if (!isValidPassword) {
      return { success: false, error: 'Invalid password' }
    }

    const payload: JWTPayload = {
      id: restaurant.id,
      username: restaurant.username,
      type: 'restaurant',
      restaurantId: restaurant.id
    }

    return { success: true, user: payload }
  } catch (error) {
    console.error('Error verifying restaurant credentials', { error, username })
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Generate restaurant credentials
 * 
 * @returns Generated username and password
 */
export function generateRestaurantCredentials() {
  return {
    username: generateRandomString(8),
    password: generateSecurePassword(12)
  }
}

/**
 * Create JWT token
 * 
 * @param user - User payload
 * @returns JWT token
 */
export async function createToken(user: JWTPayload): Promise<string> {
  return createJWTToken(user)
}


export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return { success: false, error: 'No token provided' }
  }

  const payload = await verifyToken(token)
  if (!payload || payload.type !== 'admin') {
    return { success: false, error: 'Invalid or unauthorized token' }
  }

  return { success: true, user: payload }
}

export async function requireRestaurant(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return { success: false, error: 'No token provided' }
  }

  const payload = await verifyToken(token)
  if (!payload || payload.type !== 'restaurant') {
    return { success: false, error: 'Invalid or unauthorized token' }
  }

  return { success: true, user: payload }
}

export async function getRestaurantIdFromToken(request: NextRequest): Promise<string | null> {
  const result = await requireRestaurant(request);
  if (result.success && result.user && result.user.restaurantId) {
    return result.user.restaurantId;
  }
  return null;
}
