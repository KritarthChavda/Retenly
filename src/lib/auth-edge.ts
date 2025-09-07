import { jwtVerify, SignJWT } from 'jose'
import { JWTPayload } from './types/auth'


/**
 * Verify JWT token (Edge-compatible, no Prisma)
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    console.log('🔍 [auth-edge] Verifying JWT token...');
    if (!token) {
        console.log('❌ [auth-edge] Token is null or undefined');
        return null;
    }
    console.log('🔍 [auth-edge] Received token:', token);
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
    
    // Properly await the JWT verification
    const { payload } = await jwtVerify(token, secret);
    
    console.log('✅ [auth-edge] JWT verification successful, payload:', payload);
    
    if (payload && typeof payload === 'object') {
      const result = {
        id: payload.id as string,
        username: payload.username as string,
        type: payload.type as 'admin' | 'restaurant',
        restaurantId: payload.restaurantId as string | undefined
      };
      console.log('✅ [auth-edge] Extracted user data:', result);
      return result;
    }
    
    console.log('❌ [auth-edge] Invalid payload structure');
    return null;
  } catch (error) {
    console.error('❌ [auth-edge] JWT verification failed:', error);
    return null;
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
    
    const token = await new SignJWT({ ...payload })
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
