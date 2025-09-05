// Simple script to test the API endpoints
const fetch = require('node-fetch');

async function testAPIs() {
  try {
    console.log('=== TESTING API ENDPOINTS ===');
    
    // Test dashboard API
    console.log('\n1. Testing /api/restaurant/dashboard...');
    const dashboardResponse = await fetch('http://localhost:3000/api/restaurant/dashboard', {
      headers: {
        'Cookie': 'auth-token=test-token' // This will fail but we can see the response
      }
    });
    
    console.log('Dashboard API Status:', dashboardResponse.status);
    if (dashboardResponse.status === 401) {
      console.log('✅ Dashboard API is properly protected (401 Unauthorized)');
    } else {
      const dashboardData = await dashboardResponse.json();
      console.log('Dashboard API Response:', JSON.stringify(dashboardData, null, 2));
    }
    
    // Test feedbacks API
    console.log('\n2. Testing /api/restaurant/feedbacks...');
    const feedbacksResponse = await fetch('http://localhost:3000/api/restaurant/feedbacks', {
      headers: {
        'Cookie': 'auth-token=test-token' // This will fail but we can see the response
      }
    });
    
    console.log('Feedbacks API Status:', feedbacksResponse.status);
    if (feedbacksResponse.status === 401) {
      console.log('✅ Feedbacks API is properly protected (401 Unauthorized)');
    } else {
      const feedbacksData = await feedbacksResponse.json();
      console.log('Feedbacks API Response:', JSON.stringify(feedbacksData, null, 2));
    }
    
    console.log('\n=== API TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error testing APIs:', error.message);
  }
}

testAPIs();
