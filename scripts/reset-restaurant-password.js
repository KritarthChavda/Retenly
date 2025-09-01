const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetRestaurantPassword() {
  try {
    console.log('🔍 Resetting password for Wok on Fire restaurant...')
    
    // Find the restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: 'wok-on-fire' }
    })
    
    if (!restaurant) {
      console.error('❌ Restaurant not found')
      return
    }
    
    console.log('✅ Restaurant found:', {
      id: restaurant.id,
      name: restaurant.name,
      username: restaurant.username,
      slug: restaurant.slug
    })
    
    // Generate new password
    const newPassword = 'wok123456'
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    // Update the password
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Password updated successfully!')
    console.log('📋 New credentials:')
    console.log(`   Username: ${restaurant.username}`)
    console.log(`   Password: ${newPassword}`)
    console.log('\n🔗 Login URL: http://localhost:3000/restaurant/login')
    
  } catch (error) {
    console.error('❌ Error resetting password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetRestaurantPassword()
