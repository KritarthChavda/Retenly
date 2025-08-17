#!/usr/bin/env node

/**
 * Setup script for Restaurant Feedback Form
 * This script helps initialize the database and provides setup instructions
 */

const fs = require('fs');
const path = require('path');

console.log('🍽️  Restaurant Feedback Form Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `# Database URL for PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_feedback"

# You can use a local PostgreSQL database or a cloud service like:
# - Supabase: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
# - Neon: postgresql://[user]:[password]@[endpoint]/[database]
# - Railway: postgresql://[user]:[password]@[host]:[port]/[database]
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created!');
  console.log('⚠️  Please update the DATABASE_URL with your actual database credentials\n');
} else {
  console.log('✅ .env file already exists\n');
}

console.log('📋 Next Steps:');
console.log('1. Update the DATABASE_URL in your .env file with your PostgreSQL connection string');
console.log('2. Run: npx prisma migrate dev --name init');
console.log('3. Run: npm run dev');
console.log('4. Open http://localhost:3000 in your browser\n');

console.log('🚀 Database Options:');
console.log('- Local PostgreSQL: Install PostgreSQL locally');
console.log('- Supabase: Free tier at https://supabase.com');
console.log('- Neon: Serverless at https://neon.tech');
console.log('- Railway: Easy deployment at https://railway.app\n');

console.log('�� Happy coding!'); 