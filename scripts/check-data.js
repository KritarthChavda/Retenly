const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== CHECKING DATABASE DATA ===');
    
    // Check restaurants
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true, username: true, slug: true }
    });
    console.log('Restaurants:', restaurants);
    
    // Check forms
    const forms = await prisma.form.findMany({
      select: { id: true, title: true, restaurantId: true }
    });
    console.log('Forms:', forms);
    
    // Check feedbacks
    const feedbacks = await prisma.feedback.findMany({
      select: { id: true, name: true, experience: true, feedback: true, createdAt: true }
    });
    console.log('Feedbacks:', feedbacks);
    
    // Check responses
    const responses = await prisma.response.findMany({
      select: { id: true, answers: true, createdAt: true }
    });
    console.log('Responses:', responses);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
