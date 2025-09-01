# Retenly - Production Deployment Guide

## Overview
Retenly is a production-ready restaurant feedback platform built with Next.js 15, PostgreSQL, and modern security practices.

## Architecture
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with JWT authentication
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Nodemailer with SMTP support
- **Logging**: Pino for structured logging
- **Authentication**: JWT tokens with secure cookies

## Deployment Stack
- **Frontend**: Vercel (recommended)
- **Database**: Supabase or Render PostgreSQL
- **Email**: Gmail SMTP or SendGrid
- **Domain**: retenly.in

## Environment Variables

### Required for Production
```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Security (CRITICAL - Generate secure values)
JWT_SECRET="your-256-bit-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
ENCRYPTION_KEY="your-32-character-encryption-key"

# Admin Credentials
ADMIN_USERNAME="your-admin-username"
ADMIN_PASSWORD="your-secure-admin-password"

# Email Configuration
EMAIL_SERVICE="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@retenly.in"
FROM_NAME="Retenly"

# URLs
NEXT_PUBLIC_FRONTEND_URL="https://retenly.in"
NEXT_PUBLIC_API_URL="https://retenly.in"

# Optional
LOG_LEVEL="info"
ALLOWED_ORIGINS="https://retenly.in,https://www.retenly.in"
```

## Step-by-Step Deployment

### 1. Database Setup (Supabase)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy database URL from Settings > Database
4. Run migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### 2. Email Setup (Gmail)
1. Enable 2FA on Gmail account
2. Generate App Password:
   - Google Account > Security > 2-Step Verification > App passwords
3. Use app password as `SMTP_PASS`

### 3. Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel dashboard
5. Configure custom domain: retenly.in

### 4. Domain Configuration
Set up the following DNS records:
```
A     @           76.76.19.19
CNAME www         retenly.vercel.app
CNAME admin       retenly.vercel.app
CNAME restaurant  retenly.vercel.app
```

### 5. SSL Certificate
Vercel automatically provides SSL certificates for custom domains.

## Post-Deployment Setup

### 1. Create Admin User
The admin user is automatically created on first API call using environment variables.

### 2. Test Email Configuration
```bash
curl -X POST https://retenly.in/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### 3. Verify Authentication
- Admin login: https://retenly.in/admin
- Restaurant login: https://retenly.in/restaurant/login

## URL Structure

### Production URLs
- **Main site**: https://retenly.in
- **Admin dashboard**: https://retenly.in/admin
- **Restaurant login**: https://retenly.in/restaurant/login
- **Feedback forms**: https://retenly.in/forms/{restaurant-slug}

### API Endpoints
- **Admin APIs**: https://retenly.in/api/admin/*
- **Restaurant APIs**: https://retenly.in/api/restaurant/*
- **Public APIs**: https://retenly.in/api/feedback, /api/forms/*

## Security Features

### Authentication
- JWT tokens with 7-day expiration
- Secure HTTP-only cookies
- Password hashing with bcrypt (12 rounds)
- Admin and restaurant role separation

### Data Protection
- Input validation with Zod schemas
- XSS protection through sanitization
- SQL injection prevention via Prisma
- Rate limiting (configurable)

### Logging & Monitoring
- Structured logging with Pino
- Request/response logging
- Error tracking
- Security event logging

## Maintenance

### Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Deploy to production
npx prisma migrate deploy
```

### Monitoring
- Check Vercel dashboard for deployment status
- Monitor database performance in Supabase
- Review application logs for errors

### Backup
- Supabase provides automatic backups
- Export data: `pg_dump DATABASE_URL > backup.sql`

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL format
   - Check Supabase connection limits
   - Ensure IP allowlisting if required

2. **Email Not Sending**
   - Verify SMTP credentials
   - Check Gmail app password
   - Test with simple SMTP client

3. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check cookie settings
   - Clear browser cookies

4. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Review build logs in Vercel

### Support
For deployment issues, check:
1. Vercel deployment logs
2. Supabase database logs
3. Application error logs
4. Network connectivity

## Performance Optimization

### Database
- Use connection pooling
- Add database indexes for frequently queried fields
- Monitor slow queries

### Frontend
- Image optimization enabled by default
- Static generation where possible
- CDN caching via Vercel

### API
- Response caching for static data
- Pagination for large datasets
- Compression enabled

## Security Checklist

- [ ] Strong JWT_SECRET (256+ bits)
- [ ] Secure admin credentials
- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Email credentials protected
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Logging configured
- [ ] Backup strategy in place
