const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check restaurants
    const restaurants = await prisma.restaurant.findMany()
    console.log(`\n🏪 Restaurants found: ${restaurants.length}`)
    restaurants.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.name} (${r.slug}) - ${r.username}`)
    })
    
    // Check forms
    const forms = await prisma.form.findMany({
      include: {
        restaurant: {
          select: { name: true, slug: true }
        }
      }
    })
    console.log(`\n📋 Forms found: ${forms.length}`)
    forms.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.title} - Restaurant: ${f.restaurant.name} (${f.restaurant.slug})`)
    })
    
    // Check feedbacks
    const feedbacks = await prisma.feedback.findMany({
      include: {
        form: {
          include: {
            restaurant: {
              select: { name: true }
            }
          }
        }
      }
    })
    console.log(`\n💬 Feedbacks found: ${feedbacks.length}`)
    feedbacks.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} - ${f.experience} - ${f.form.restaurant.name}`)
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
