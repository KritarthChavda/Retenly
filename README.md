# Restaurant Feedback Form

A modern, responsive restaurant feedback form built with Next.js, Tailwind CSS, and Prisma ORM with PostgreSQL.

## Features

- 🎨 Dark theme with modern, friendly design
- 📱 Fully responsive and mobile-friendly
- ✅ Form validation with real-time error feedback
- 🎭 Fun emojis and casual tone matching restaurant branding
- 💾 PostgreSQL database integration with Prisma ORM
- 🚀 Next.js API routes for backend functionality
- ⚡ Fast and optimized with TypeScript

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Ready for Vercel, Railway, or any Node.js hosting

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-feedback
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_feedback"
   ```

   **Database Options:**
   - **Local PostgreSQL**: Install PostgreSQL locally
   - **Supabase**: Free tier available at [supabase.com](https://supabase.com)
   - **Neon**: Serverless PostgreSQL at [neon.tech](https://neon.tech)
   - **Railway**: Easy deployment at [railway.app](https://railway.app)

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

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

## License

MIT License - feel free to use this project for your restaurant!

---

Built with ❤️ for better restaurant experiences
