# BLOGIFY Setup Guide

Complete setup instructions for the BLOGIFY platform.

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Database
```bash
# PostgreSQL should be running
createdb blogify
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://localhost/blogify"
JWT_SECRET="your-secret-key-here"
OPENAI_API_KEY="sk-..."
```

### 4. Run Migrations
```bash
npm run db:migrate
```

### 5. Start Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Detailed Setup

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- API Keys:
  - OpenAI: https://platform.openai.com/api-keys
  - Groq (optional): https://console.groq.com

### Step 1: Clone Repository
```bash
git clone <your-repo-url>
cd blogify
```

### Step 2: Install Node Dependencies
```bash
npm install
# or with pnpm
pnpm install
```

### Step 3: PostgreSQL Setup

**Option A: Local PostgreSQL**
```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

# Windows
# Download installer from postgresql.org
```

**Option B: Docker PostgreSQL**
```bash
docker run --name blogify-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=blogify \
  -p 5432:5432 \
  -d postgres:15
```

Create database:
```bash
createdb blogify
```

### Step 4: Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/blogify"

# Server Configuration
PORT=5000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security
JWT_SECRET="generate-a-secure-random-string-here"

# AI APIs
OPENAI_API_KEY="sk-your-openai-key"
GROQ_API_KEY="gsk-your-groq-key"

# Frontend API
NEXT_PUBLIC_API_URL=http://localhost:5000

# WebRTC/Streaming (optional)
NEXT_PUBLIC_STUN_SERVERS="stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302"
```

### Step 5: Database Migrations
```bash
# Create all tables
npm run db:migrate

# (Optional) Add sample data
npm run db:seed
```

### Step 6: Start Development Servers

**Terminal 1 - Express Backend:**
```bash
npm run dev:server
# Server runs on http://localhost:5000
```

**Terminal 2 - Next.js Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### Step 7: Create Test Account
1. Visit http://localhost:3000
2. Click "Get Started"
3. Register with email and password
4. You're logged in!

---

## Feature Testing

### Test Blog Creation
1. Navigate to "Create" in top navigation
2. Enter title and content
3. Click "AI Assistant" > "Generate Draft" (requires OpenAI key)
4. Click "Publish Now"

### Test Live Streaming
1. Go to Creator Dashboard
2. Click "New Stream"
3. Configure stream title and description
4. Start streaming with WebRTC or RTMP

### Test AI Features
- **Generate Draft**: Auto-write blog content
- **Improve Content**: Enhance grammar and clarity
- **SEO Suggestions**: Get optimization tips
- **Generate Headlines**: Create title variations
- **Generate Tags**: Auto-tag content

### Test Real-Time Chat
1. Open a live stream
2. Type in the chat sidebar
3. Messages appear in real-time across all viewers

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres

# Check connection string in .env.local
DATABASE_URL="postgresql://user:password@host:port/dbname"
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run db:migrate
```

### OpenAI API Errors
- Verify API key in .env.local
- Check quota at https://platform.openai.com/account/billing
- Ensure `gpt-4` model access (may need to upgrade account)

### Socket.io Connection Issues
- Check backend is running on correct port
- Verify `NEXT_PUBLIC_API_URL` in .env.local
- Clear browser cache and refresh

---

## Production Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Self-Hosted Deployment
```bash
# Build frontend
npm run build

# Start production server
npm start
```

Set environment variables for production:
- Strong `JWT_SECRET`
- Production database URL
- Production API keys

---

## Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start just backend
npm run dev:server

# Build for production
npm run build

# Run production server
npm start

# Database operations
npm run db:migrate      # Run pending migrations
npm run db:seed         # Add sample data
npm run db:reset        # Reset database (dev only)

# Linting
npm run lint            # Check code quality
npm run lint --fix      # Auto-fix issues
```

---

## Project Structure Overview

```
├── app/                    # Next.js frontend
│   ├── (auth)/            # Auth routes
│   ├── (main)/            # Main app
│   ├── contexts/          # React contexts
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
├── server/                # Express backend
│   ├── index.js          # Server entry
│   └── routes/           # API endpoints
├── prisma/               # Database config
│   └── schema.prisma     # Data model
├── public/               # Static files
├── .env.example          # Environment template
├── package.json          # Dependencies
├── README.md             # Documentation
└── SETUP.md             # This file
```

---

## Performance Optimization

### Frontend
- Enable Image Optimization in Next.js config
- Use SWR for efficient data fetching
- Code splitting with dynamic imports

### Backend
- Connection pooling for PostgreSQL
- Redis caching (optional)
- Rate limiting on API routes

### Database
- Index frequently queried columns
- Archive old stream records
- Optimize vector embeddings queries

---

## Security Checklist

- [ ] Change `JWT_SECRET` to a secure random value
- [ ] Enable HTTPS in production
- [ ] Set secure cookies (`secure: true`)
- [ ] Configure CORS for your domain
- [ ] Use environment variables for all secrets
- [ ] Enable database backups
- [ ] Implement rate limiting
- [ ] Add content moderation
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## Next Steps

1. **Customize Branding**: Update logo and colors in Header.tsx
2. **Add Email Notifications**: Integrate email service
3. **Enable Payments**: Add Stripe for monetization
4. **Advanced Search**: Implement Elasticsearch
5. **Mobile App**: Create React Native app
6. **Analytics**: Integrate analytics service
7. **CDN**: Use Cloudflare for media delivery

---

Need help? Check the README.md or open an issue on GitHub.
