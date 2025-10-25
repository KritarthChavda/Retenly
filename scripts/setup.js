#!/usr/bin/env node

/**
 * Setup script for Restaurant Feedback Form
 * This script helps initialize the database and provides setup instructions
 */

import fs from 'fs';
import path from 'path';           // or: import path from 'node:path'
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


console.log('🍽️  Restaurant Feedback Form Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
let createdEnvFile = false;
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
  createdEnvFile = true;
} else {
  console.log('✅ .env file already exists\n');
}

// Load environment variables if possible
dotenv.config({ path: envPath });

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

async function ensureAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  Skipping admin creation because DATABASE_URL is not configured. Update your .env and rerun this script.\n');
    return;
  }

  if (process.env.DATABASE_URL.includes('username:password')) {
    console.log('⚠️  Skipping admin creation because the DATABASE_URL still contains placeholder credentials. Update it with real connection details and rerun this script.\n');
    return;
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const saltRounds = 12;

  let prisma;
  try {
    prisma = new PrismaClient();

    const existingAdmin = await prisma.admin.findUnique({
      where: { username }
    });

    if (existingAdmin) {
      console.log(`✅ Admin user "${username}" already exists.\n`);
      return;
    }

    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

    await prisma.admin.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    console.log(`✅ Created admin user "${username}".`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log('🔐 No ADMIN_PASSWORD set in environment. Using default password "admin123" — update ADMIN_PASSWORD in .env and rerun the script to reset it.\n');
    } else {
      console.log('🔐 Admin password sourced from ADMIN_PASSWORD environment variable.\n');
    }
  } catch (error) {
    console.error('❌ Failed to ensure admin user exists. Make sure dependencies are installed and Prisma client is generated:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

async function run() {
  if (createdEnvFile) {
    console.log('ℹ️  Admin creation skipped for now because a new .env file was generated. Configure your database credentials and rerun this script to create the admin user.\n');
  } else {
    await ensureAdminUser();
  }

  console.log('�� Happy coding!');
}

run().catch((error) => {
  console.error('❌ Encountered an unexpected error during setup:', error);
  process.exit(1);
});
