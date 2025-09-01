import { jwtVerify, SignJWT } from 'jose'

export interface JWTPayload {
  id: string
  username: string
  type: 'admin' | 'restaurant'
}

/**
 * Verify JWT token (Edge-compatible, no Prisma)
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    console.log('🔍 Verifying JWT token...')
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    
    // Properly await the JWT verification
    const { payload } = await jwtVerify(token, secret)
    
    console.log('✅ JWT verification successful, payload:', payload)
    
    if (payload && typeof payload === 'object') {
      const result = {
        id: payload.id as string,
        username: payload.username as string,
        type: payload.type as 'admin' | 'restaurant'
      }
      console.log('✅ Extracted user data:', result)
      return result
    }
    
    console.log('❌ Invalid payload structure')
    return null
  } catch (error) {
    console.error('❌ JWT verification failed:', error)
    return null
  }
}

/**
 * Create JWT token (Edge-compatible, no Prisma)
 * 
 * @param payload - JWT payload data
 * @returns JWT token string
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  try {
    console.log('🔐 Creating JWT token for:', payload)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    
    const token = await new SignJWT({ ...payload }) // spread into plain object
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('7d')
  .sign(secret)
    
    console.log('✅ JWT token created successfully')
    return token
  } catch (error) {
    console.error('❌ Error creating JWT token:', error)
    throw error
  }
}
