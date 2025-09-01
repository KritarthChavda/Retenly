const { createToken, verifyToken } = require('../src/lib/auth-edge')

async function testJWT() {
  try {
    console.log('🧪 Testing JWT functionality...')
    
    // Test payload
    const testPayload = {
      id: '082a8262-61ce-4c00-80c2-b67f28b098cf', // Wok on Fire restaurant ID
      username: 'iT0SJa3U',
      type: 'restaurant'
    }
    
    console.log('📝 Test payload:', testPayload)
    
    // Create token
    console.log('\n🔐 Creating JWT token...')
    const token = await createToken(testPayload)
    console.log('✅ Token created:', token.substring(0, 50) + '...')
    
    // Verify token
    console.log('\n🔍 Verifying JWT token...')
    const verified = await verifyToken(token)
    console.log('✅ Token verified:', verified)
    
    // Test with invalid token
    console.log('\n❌ Testing invalid token...')
    const invalidResult = await verifyToken('invalid-token')
    console.log('Invalid token result:', invalidResult)
    
    console.log('\n🎉 JWT test completed!')
    
  } catch (error) {
    console.error('❌ JWT test failed:', error)
  }
}

testJWT()
