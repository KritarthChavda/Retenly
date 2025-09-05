// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { createToken } = require('../src/lib/auth-edge');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('=== TESTING AUTHENTICATION FLOW ===');
    
    // Find a restaurant
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      console.log('No restaurant found. Please create a restaurant first.');
      return;
    }
    
    console.log('Found restaurant:', restaurant.name);
    
    // Create a JWT token
    const payload = {
      id: restaurant.id,
      username: restaurant.username,
      type: 'restaurant'
    };
    
    console.log('Creating JWT token for:', payload);
    const token = await createToken(payload);
    console.log('JWT token created:', token.substring(0, 50) + '...');
    
    // Test the token verification
    const { verifyToken } = require('../src/lib/auth-edge');
    const verified = await verifyToken(token);
    console.log('Token verification result:', verified);
    
    if (verified) {
      console.log('✅ JWT authentication is working correctly!');
      console.log('User ID:', verified.id);
      console.log('User Type:', verified.type);
    } else {
      console.log('❌ JWT authentication failed!');
    }
    
  } catch (error) {
    console.error('Error testing authentication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
