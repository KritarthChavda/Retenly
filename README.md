# Retenly

A comprehensive, multi-tenant restaurant feedback platform built with modern technologies and production-ready architecture.

## 🚀 Features

### Core Platform
- 🏢 **Multi-tenant architecture** - Support for multiple restaurants
- 🔐 **Secure authentication** - JWT-based auth for admins and restaurant owners
- 📊 **Advanced analytics** - Sentiment analysis, rating calculations, trend tracking
- 📧 **Email notifications** - Automated credential delivery to restaurant owners
- 🛡️ **Production security** - Input validation, XSS protection, rate limiting

### Admin Dashboard
- 👥 **Restaurant management** - Create, manage multiple restaurants
- 📈 **System analytics** - Platform-wide statistics and insights
- 🔑 **Credential management** - Secure password generation and delivery
- 📋 **Form management** - Create and customize feedback forms

### Restaurant Dashboard
- 📊 **Real-time analytics** - Feedback sentiment, ratings, trends
- 📝 **Feedback management** - View and analyze customer responses
- 🎨 **Form customization** - Branded forms with logos and custom messages
- 📱 **Mobile-optimized** - Responsive design for all devices

### Customer Experience
- 🌐 **Dynamic routing** - Clean URLs like retenly.in/forms/restaurant-name
- 🚫 **Duplicate prevention** - Smart detection to prevent spam submissions
- ✅ **Input validation** - Real-time validation with helpful error messages
- 🎯 **Thank you pages** - Customized confirmation experiences

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API routes, JWT authentication, Prisma ORM
- **Database**: PostgreSQL with connection pooling
- **Email**: Nodemailer with SMTP support
- **Logging**: Pino structured logging
- **Security**: bcrypt, input sanitization, CORS protection
- **Deployment**: Vercel (frontend), Supabase (database)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- npm or yarn

### Quick Start

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd restaurant-feedback
   npm install
   ```

2. **Environment setup**
   Copy `env.example` to `.env` and configure:
   ```bash
   cp env.example .env
   ```
   
   **Required variables:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_feedback"
   JWT_SECRET="your-256-bit-secret-key"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="secure-password"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

3. **Database setup**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run setup  # Creates admin user
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

5. **Access the platform**
   - Main site: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin
   - Restaurant login: http://localhost:3000/restaurant/login

## Form Fields

The feedback form includes:

- **Name** (required): Customer's full name
- **Phone Number** (required): 10-digit phone number with validation
- **Experience Rating** (required): Radio buttons with emojis:
  - 🥳 YO! - Already dreaming of round 2
  - 😋 Pretty good - Happy belly  
  - 😐 Okay-ish - It's not you, it's me
  - 😠 Not great - Hard to smile
- **Feedback** (optional): Free text area for detailed comments

## Database Schema

```sql
model Feedback {
  id          String   @id @default(cuid())
  name        String
  phoneNumber String
  experience  String
  feedback    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("feedbacks")
}
```

## API Endpoints

### POST `/api/feedback`

Submits new feedback to the database.

**Request Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "1234567890",
  "experience": "YO!",
  "feedback": "Amazing food and service!"
}
```

**Response:**
```json
{
  "message": "Feedback submitted successfully!",
  "id": "clx1234567890"
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `DATABASE_URL` environment variable
4. Deploy!

### Railway

1. Connect your GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Customization

### Styling
- Modify `src/app/globals.css` for global styles
- Update component classes in `src/components/`
- Change colors in `tailwind.config.js`

### Content
- Update restaurant name and branding in `src/app/page.tsx`
- Modify form labels and messages in `src/components/FeedbackForm.tsx`
- Customize thank you message in `src/components/ThankYou.tsx`

### Database
- Add new fields in `prisma/schema.prisma`
- Run `npx prisma migrate dev` to apply changes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for better restaurant experiences
