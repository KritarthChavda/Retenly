// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestFeedback() {
  try {
    console.log('=== CREATING TEST FEEDBACK ===');
    
    // First, find a restaurant
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      console.log('No restaurant found. Please create a restaurant first.');
      return;
    }
    
    console.log('Found restaurant:', restaurant.name);
    
    // Find or create a form for this restaurant
    let form = await prisma.form.findFirst({
      where: { restaurantId: restaurant.id }
    });
    
    if (!form) {
      form = await prisma.form.create({
        data: {
          title: 'Customer Feedback Form',
          description: 'Please share your experience with us',
          restaurantId: restaurant.id,
          questions: [
            {
              id: 'name',
              type: 'text',
              label: 'Your Name',
              required: true
            },
            {
              id: 'phone',
              type: 'text',
              label: 'Phone Number',
              required: false
            },
            {
              id: 'experience',
              type: 'select',
              label: 'How was your experience?',
              options: ['YO!', 'Pretty good', 'Okay-ish', 'Not great', 'Poor'],
              required: true
            },
            {
              id: 'feedback',
              type: 'textarea',
              label: 'Additional feedback',
              required: false
            }
          ]
        }
      });
      console.log('Created form:', form.title);
    } else {
      console.log('Using existing form:', form.title);
    }
    
    // Create some test feedback entries
    const testFeedbacks = [
      {
        name: 'John Doe',
        phoneNumber: '123-456-7890',
        experience: 'YO!',
        feedback: 'Amazing food and great service! Will definitely come back.',
        formId: form.id
      },
      {
        name: 'Jane Smith',
        phoneNumber: '987-654-3210',
        experience: 'Pretty good',
        feedback: 'Good food, friendly staff. The ambiance was nice.',
        formId: form.id
      },
      {
        name: 'Bob Johnson',
        phoneNumber: '555-123-4567',
        experience: 'Okay-ish',
        feedback: 'Food was okay, but service was a bit slow.',
        formId: form.id
      },
      {
        name: 'Alice Brown',
        phoneNumber: '444-555-6666',
        experience: 'Not great',
        feedback: 'The food was cold and the waiter was rude.',
        formId: form.id
      },
      {
        name: 'Charlie Wilson',
        phoneNumber: '777-888-9999',
        experience: 'Poor',
        feedback: 'Terrible experience. Food was burnt and service was awful.',
        formId: form.id
      }
    ];
    
    for (const feedbackData of testFeedbacks) {
      const feedback = await prisma.feedback.create({
        data: feedbackData
      });
      console.log('Created feedback:', feedback.name, '-', feedback.experience);
    }
    
    console.log('✅ Test feedback created successfully!');
    
  } catch (error) {
    console.error('Error creating test feedback:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestFeedback();
