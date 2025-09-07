// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFeedbackData() {
  try {
    console.log('=== CHECKING FEEDBACK DATA ===');
    
    // Get all feedback entries
    const feedbacks = await prisma.feedback.findMany({
      include: {
        form: {
          select: {
            title: true,
            restaurant: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${feedbacks.length} feedback entries:`);
    
    feedbacks.forEach((feedback, index) => {
      console.log(`\n--- Feedback ${index + 1} ---`);
      console.log('ID:', feedback.id);
      console.log('Name:', feedback.name);
      console.log('Phone Number:', feedback.phoneNumber);
      console.log('Experience:', feedback.experience);
      console.log('Feedback Text:', feedback.feedback);
      console.log('Rating:', feedback.rating);
      console.log('Sentiment:', feedback.sentiment);
      console.log('Created At:', feedback.createdAt);
      console.log('Form Title:', feedback.form?.title);
      console.log('Restaurant:', feedback.form?.restaurant?.name);
    });
    
    // Check if phone numbers are hashed
    const hashedPhones = feedbacks.filter(f => f.phoneNumber && f.phoneNumber.startsWith('$2b$'));
    if (hashedPhones.length > 0) {
      console.log(`\n⚠️  Found ${hashedPhones.length} feedback entries with hashed phone numbers`);
      console.log('This suggests phone numbers are being hashed instead of stored as plain text');
    }
    
  } catch (error) {
    console.error('Error checking feedback data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFeedbackData();
