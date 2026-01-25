# Vercel Deployment Guide

## 🚀 Deploy to Vercel

This branch is optimized for Vercel deployment with automatic scaling and global CDN.

### Prerequisites
- Vercel account
- GitHub connected to Vercel
- PostgreSQL database (recommended for production)

### Step 1: Connect to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### Step 2: Configure Environment Variables
In Vercel dashboard, set these environment variables:

```env
# Required
NEXTAUTH_SECRET=your-very-secure-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
Z_AI_API_KEY=your-z-ai-api-key
OPENAI_API_KEY=your-openai-key
```

### Step 3: Deploy
```bash
# Deploy to production
vercel --prod

# Or connect to GitHub for auto-deploys
vercel --prod --confirm
```

### Step 4: Post-Deployment
1. **Set up custom domain** in Vercel dashboard
2. **Configure database** (use Vercel Postgres or external)
3. **Run database migrations**:
   ```bash
   vercel env pull .env.production
   bun run db:migrate
   npx tsx seed-admin.ts
   ```

### Vercel-Specific Features
- ✅ **Automatic HTTPS** and global CDN
- ✅ **Serverless Functions** for API routes
- ✅ **Automatic scaling** with zero downtime
- ✅ **Preview deployments** for every PR
- ✅ **Analytics** and performance monitoring
- ✅ **Custom domains** with SSL certificates

### Database Options
1. **Vercel Postgres** (recommended)
2. **Supabase**
3. **Neon**
4. **Railway PostgreSQL**
5. **AWS RDS**

### Performance Optimizations
- ✅ Edge caching for static assets
- ✅ Image optimization with Next.js Image
- ✅ Code splitting and lazy loading
- ✅ Automatic compression

### Monitoring
- Vercel Analytics for performance
- Vercel Speed Insights
- Custom error tracking
- Uptime monitoring

## 🎯 Quick Deploy Command
```bash
vercel --prod --env DATABASE_URL=your-db-url --env NEXTAUTH_SECRET=your-secret
```