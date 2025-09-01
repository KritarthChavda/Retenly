#!/usr/bin/env tsx

/**
 * Fix existing data script for Retenly restaurant feedback system
 * Fixes sentiment and rating issues in existing feedback data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixData() {
  console.log('🔧 Starting data fix script...')
  
  try {
    // 1. Fix existing feedback sentiment and ratings
    console.log('\n📝 Step 1: Fixing existing feedback data...')
    
    const feedbacks = await prisma.feedback.findMany({
      where: {
        OR: [
          { sentiment: null },
          { rating: null },
          { sentiment: '' }
        ]
      }
    })

    console.log(`Found ${feedbacks.length} feedbacks to fix`)

    for (const feedback of feedbacks) {
      // Map experience to sentiment and rating
      let sentiment: string
      let rating: number
      
      switch (feedback.experience) {
        case 'YO!':
          sentiment = 'positive'
          rating = 5
          break
        case 'Pretty good':
          sentiment = 'positive'
          rating = 4
          break
        case 'Okay-ish':
          sentiment = 'neutral'
          rating = 3
          break
        case 'Not great':
          sentiment = 'negative'
          rating = 2
          break
        case 'Poor':
          sentiment = 'negative'
          rating = 1
          break
        default:
          sentiment = 'neutral'
          rating = 3
      }

      // Update the feedback
      await prisma.feedback.update({
        where: { id: feedback.id },
        data: {
          sentiment,
          rating
        }
      })

      console.log(`✅ Fixed feedback ${feedback.id}: ${feedback.experience} → ${sentiment} (${rating}/5)`)
    }

    // 2. Ensure all forms have proper restaurant associations
    console.log('\n📋 Step 2: Checking form associations...')
    
    const forms = await prisma.form.findMany({
      where: {
        restaurantId: null
      }
    })

    if (forms.length > 0) {
      console.log(`Found ${forms.length} forms without restaurant associations`)
      
      // Get or create a default restaurant
      let defaultRestaurant = await prisma.restaurant.findFirst({
        where: { name: 'Default Restaurant' }
      })

      if (!defaultRestaurant) {
        defaultRestaurant = await prisma.restaurant.create({
          data: {
            name: 'Default Restaurant',
            email: 'default@retenly.com',
            slug: 'default-restaurant',
            username: 'default',
            password: 'hashed_default_password'
          }
        })
        console.log('✅ Created default restaurant')
      }

      // Associate orphaned forms with default restaurant
      for (const form of forms) {
        await prisma.form.update({
          where: { id: form.id },
          data: { restaurantId: defaultRestaurant.id }
        })
        console.log(`✅ Associated form ${form.id} with default restaurant`)
      }
    } else {
      console.log('✅ All forms have proper restaurant associations')
    }

    // 3. Verify data integrity
    console.log('\n🔍 Step 3: Verifying data integrity...')
    
    const totalFeedbacks = await prisma.feedback.count()
    const feedbacksWithSentiment = await prisma.feedback.count({
      where: { sentiment: { not: null } }
    })
    const feedbacksWithRating = await prisma.feedback.count({
      where: { rating: { not: null } }
    })

    console.log(`📊 Data integrity check:`)
    console.log(`   Total feedbacks: ${totalFeedbacks}`)
    console.log(`   With sentiment: ${feedbacksWithSentiment}`)
    console.log(`   With rating: ${feedbacksWithRating}`)

    if (totalFeedbacks === feedbacksWithSentiment && totalFeedbacks === feedbacksWithRating) {
      console.log('✅ All feedback data is properly formatted')
    } else {
      console.log('⚠️  Some feedback data still needs attention')
    }

    console.log('\n🎉 Data fix script completed successfully!')

  } catch (error) {
    console.error('\n💥 Data fix script failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the data fix script
fixData().catch(error => {
  console.error('💥 Data fix script crashed:', error)
  process.exit(1)
})
