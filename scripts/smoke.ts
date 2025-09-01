#!/usr/bin/env tsx

/**
 * Smoke test script for Retenly restaurant feedback system
 * Tests end-to-end functionality: restaurant creation, form creation, feedback submission, and analytics
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function smokeTest() {
  console.log('🚀 Starting Retenly smoke test...')
  
  try {
    // 1. Create a test restaurant
    console.log('\n📝 Step 1: Creating test restaurant...')
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Smoke Test Resto',
        email: 'test@x.com',
        slug: 'smoke-test-resto',
        username: 'smoketest',
        password: 'hashed_password_here' // In real test, this would be properly hashed
      }
    })
    console.log(`✅ Restaurant created: ${restaurant.name} (ID: ${restaurant.id})`)

    // 2. Create a form for the restaurant
    console.log('\n📋 Step 2: Creating test form...')
    const form = await prisma.form.create({
      data: {
        title: 'Smoke Test Feedback Form',
        restaurantId: restaurant.id,
        questions: [
          { question: 'How was your experience?', type: 'rating', required: true },
          { question: 'Any additional comments?', type: 'text', required: false }
        ]
      }
    })
    console.log(`✅ Form created: ${form.title} (ID: ${form.id})`)

    // 3. Create test feedback entries
    console.log('\n💬 Step 3: Creating test feedback...')
    const feedbacks = await Promise.all([
      prisma.feedback.create({
        data: {
          formId: form.id,
          name: 'John Doe',
          phoneNumber: '+1234567890',
          experience: 'YO!',
          feedback: 'Amazing food and service!',
          sentiment: 'positive',
          rating: 5
        }
      }),
      prisma.feedback.create({
        data: {
          formId: form.id,
          name: 'Jane Smith',
          phoneNumber: '+0987654321',
          experience: 'Okay-ish',
          feedback: 'Food was okay, service could be better',
          sentiment: 'neutral',
          rating: 3
        }
      }),
      prisma.feedback.create({
        data: {
          formId: form.id,
          name: 'Bob Wilson',
          phoneNumber: '+1122334455',
          experience: 'Poor',
          feedback: 'Not satisfied with the experience',
          sentiment: 'negative',
          rating: 1
        }
      })
    ])
    console.log(`✅ Created ${feedbacks.length} feedback entries`)

    // 4. Test analytics calculation
    console.log('\n📊 Step 4: Testing analytics...')
    
    // Get all feedback for this restaurant
    const allFeedbacks = await prisma.feedback.findMany({
      where: {
        form: {
          restaurantId: restaurant.id
        }
      }
    })

    // Calculate expected values
    const totalFeedback = allFeedbacks.length
    const totalRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0)
    const averageRating = totalFeedback > 0 ? totalRating / totalFeedback : 0
    
    const positiveCount = allFeedbacks.filter(f => f.sentiment === 'positive').length
    const neutralCount = allFeedbacks.filter(f => f.sentiment === 'neutral').length
    const negativeCount = allFeedbacks.filter(f => f.sentiment === 'negative').length

    console.log(`📈 Analytics Results:`)
    console.log(`   Total Feedback: ${totalFeedback}`)
    console.log(`   Average Rating: ${averageRating.toFixed(1)}/5`)
    console.log(`   Sentiment Distribution:`)
    console.log(`     Positive: ${positiveCount}`)
    console.log(`     Neutral: ${neutralCount}`)
    console.log(`     Negative: ${negativeCount}`)

    // 5. Verify expectations
    console.log('\n✅ Step 5: Verifying expectations...')
    
    const expectations = [
      { name: 'Total feedback count', actual: totalFeedback, expected: 3 },
      { name: 'Average rating', actual: Math.round(averageRating * 10) / 10, expected: 3.0 },
      { name: 'Positive sentiment count', actual: positiveCount, expected: 1 },
      { name: 'Neutral sentiment count', actual: neutralCount, expected: 1 },
      { name: 'Negative sentiment count', actual: negativeCount, expected: 1 }
    ]

    let allPassed = true
    expectations.forEach(exp => {
      if (exp.actual === exp.expected) {
        console.log(`   ✅ ${exp.name}: ${exp.actual} (expected: ${exp.expected})`)
      } else {
        console.log(`   ❌ ${exp.name}: ${exp.actual} (expected: ${exp.expected})`)
        allPassed = false
      }
    })

    if (allPassed) {
      console.log('\n🎉 All smoke tests passed! The system is working correctly.')
    } else {
      console.log('\n💥 Some smoke tests failed. Please check the system.')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n💥 Smoke test failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the smoke test
smokeTest().catch(error => {
  console.error('💥 Smoke test crashed:', error)
  process.exit(1)
})
