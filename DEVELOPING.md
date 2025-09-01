# 🚀 Retenly Development Guide

This guide covers setting up and developing the Retenly restaurant feedback system.

## 📋 Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- PostgreSQL database (Supabase recommended)
- Git

## 🛠️ Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd restaurant-feedback
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secure-jwt-secret-here"

# Admin Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# Email Configuration (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@retenly.com"
FROM_NAME="Retenly"
```

**Important**: Replace the `DATABASE_URL` with your actual Supabase connection string.

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# If no migrations exist, create initial migration
npx prisma migrate dev --name init
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔐 Authentication

### Admin Access
- **URL**: `/admin/login`
- **Default Credentials**: `admin` / `admin123`
- **Dashboard**: `/admin`

### Restaurant Access
- **URL**: `/restaurant/login`
- **Credentials**: Generated when creating restaurants via admin panel

## 🧪 Testing

### Smoke Test
Run the end-to-end smoke test to verify system functionality:

```bash
# Install tsx if not already installed
npm install -g tsx

# Run smoke test
tsx scripts/smoke.ts
```

Expected output:
```
🚀 Starting Retenly smoke test...
✅ All smoke tests passed! The system is working correctly.
```

### Data Fix Script
If you have existing data issues, run the fix script:

```bash
tsx scripts/fix-data.ts
```

## 🏗️ Project Structure

```
restaurant-feedback/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard routes
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Restaurant owner dashboard
│   │   ├── forms/             # Public feedback forms
│   │   └── restaurant/        # Restaurant-specific routes
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # Authentication (Node.js)
│   │   ├── auth-edge.ts      # JWT operations (Edge)
│   │   ├── prisma.ts         # Database client
│   │   └── sentiment.ts      # Sentiment analysis
│   └── middleware.ts          # Route protection
├── prisma/                    # Database schema and migrations
├── scripts/                   # Utility scripts
│   ├── smoke.ts              # End-to-end testing
│   └── fix-data.ts           # Data repair
└── .env                      # Environment variables
```

## 🔧 Key Features

### 1. Multi-tenant Architecture
- Each restaurant has isolated data
- Unique slugs for public forms
- Separate authentication for admin and restaurants

### 2. Feedback System
- Legacy experience-based feedback (YO!, Pretty good, etc.)
- Dynamic form support with custom questions
- Sentiment analysis and rating calculation

### 3. Analytics Dashboard
- Real-time feedback statistics
- Sentiment distribution charts
- CSAT and NPS scoring
- Most-loved feature analysis

## 🚨 Troubleshooting

### Common Issues

#### 1. "Prisma did not initialize yet" Error
**Cause**: Prisma being imported in Edge runtime
**Solution**: Add `export const runtime = 'nodejs'` to API routes using Prisma

#### 2. Authentication Redirects to Home
**Cause**: JWT token not being set properly
**Solution**: Check cookie settings and JWT secret in environment

#### 3. Analytics Showing 0
**Cause**: Data mapping issues or missing sentiment/rating fields
**Solution**: Run `tsx scripts/fix-data.ts` to repair existing data

#### 4. Database Connection Issues
**Cause**: Incorrect DATABASE_URL or Supabase configuration
**Solution**: Verify connection string and ensure database is accessible

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=true
NODE_ENV=development
```

## 🚀 Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Environment Variables
Ensure all production environment variables are set:
- `DATABASE_URL` (Supabase production)
- `JWT_SECRET` (secure random string)
- `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Email configuration

### 3. Database Migration

```bash
npx prisma migrate deploy
```

### 4. Deploy to Platform
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Custom Server**: Copy `.next` folder and run `npm start`

## 📚 API Documentation

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/restaurants` - List restaurants
- `POST /api/admin/restaurants` - Create restaurant
- `GET /api/admin/forms` - List forms
- `POST /api/admin/forms` - Create form

### Restaurant Endpoints
- `POST /api/restaurant/login` - Restaurant authentication
- `GET /api/restaurant/dashboard` - Dashboard analytics
- `GET /api/restaurant/feedbacks` - Feedback list

### Public Endpoints
- `GET /api/forms/[slug]` - Get public form
- `POST /api/forms/[slug]/submit` - Submit feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For development issues:
1. Check this guide
2. Run smoke tests
3. Check browser console for errors
4. Verify environment variables
5. Check database connectivity

## 🔄 Updates

Keep dependencies updated:

```bash
npm update
npx prisma generate
```

After major updates, always run:
```bash
npm run build
tsx scripts/smoke.ts
```
