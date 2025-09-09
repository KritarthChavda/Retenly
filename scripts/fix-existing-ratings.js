import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function fixExistingRatings() {
  try {
    console.log('🔧 Fixing existing feedback ratings...');
    
    // Get all feedback entries that don't have a rating
    const feedbacksWithoutRating = await prisma.feedback.findMany({
      where: {
        rating: null
      }
    });
    
    console.log(`Found ${feedbacksWithoutRating.length} feedback entries without ratings`);
    
    for (const feedback of feedbacksWithoutRating) {
      // Map experience to rating
      let rating;
      switch (feedback.experience) {
        case 'YO!': 
          rating = 5; 
          break;
        case 'Pretty good': 
          rating = 4; 
          break;
        case 'Okay-ish': 
          rating = 3; 
          break;
        case 'Not great': 
          rating = 2; 
          break;
        case 'Poor': 
          rating = 1; 
          break;
        default: 
          rating = 3;
      }
      
      // Update the feedback with the calculated rating
      await prisma.feedback.update({
        where: { id: feedback.id },
        data: { 
          rating: rating,
          sentiment: rating >= 4 ? 'positive' : 
                   rating === 3 ? 'neutral' : 
                   'negative'
        }
      });
      
      console.log(`✅ Updated feedback ${feedback.id}: experience="${feedback.experience}" -> rating=${rating}`);
    }
    
    console.log('🎉 All existing feedback ratings have been fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing ratings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingRatings();
