# Netlify Deployment Guide

## 🌊 Deploy to Netlify

This branch is configured for Netlify's JAMstack platform with serverless functions.

### Prerequisites
- Netlify account
- GitHub connected to Netlify
- External database (PostgreSQL recommended)

### Step 1: Prepare for Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init
```

### Step 2: Configure Build Settings
The `netlify.toml` file includes:
- **Build Command**: `bun run build`
- **Publish Directory**: `.next`
- **Functions Directory**: `netlify/functions`
- **Redirects**: API routes to Netlify Functions

### Step 3: Environment Variables
In Netlify dashboard, set these environment variables:

```env
# Required
NEXTAUTH_SECRET=your-very-secure-secret-key
NEXTAUTH_URL=https://your-app.netlify.app
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
Z_AI_API_KEY=your-z-ai-api-key
OPENAI_API_KEY=your-openai-key
NODE_ENV=production
```

### Step 4: Deploy
```bash
# Deploy to production
netlify deploy --prod

# Or connect to GitHub for auto-deploys
netlify deploy --prod --dir=.next
```

### Step 5: Database Setup for Netlify
Since Netlify doesn't provide databases, use external services:

1. **Supabase** (recommended)
2. **Neon** 
3. **PlanetScale**
4. **Railway PostgreSQL**

### Netlify-Specific Features
- ✅ **Global CDN** with automatic HTTPS
- ✅ **Serverless Functions** for API routes
- ✅ **Instant rollbacks** and preview deploys
- ✅ **Form handling** and identity management
- ✅ **Edge functions** for global performance
- ✅ **Split testing** and A/B testing

### Performance Optimizations
- ✅ **Automatic caching** for static assets
- ✅ **Image optimization** with Next.js Image
- ✅ **Code splitting** and lazy loading
- ✅ **Minification** and compression

### Monitoring
- Netlify Analytics for visitor insights
- Function logs for debugging
- Deploy notifications
- Performance monitoring

## 🎯 Quick Deploy Command
```bash
netlify deploy --prod --env DATABASE_URL=your-db-url --env NEXTAUTH_SECRET=your-secret
```

## 🔧 Netlify Functions Setup

For API routes to work on Netlify, the app uses redirects to route API calls to Netlify Functions:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## 📊 Database Integration

### Supabase Setup (Recommended)
```bash
# Install Supabase client
npm install @supabase/supabase-js

# Environment variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Alternative: External PostgreSQL
```env
DATABASE_URL=postgresql://user:password@external-db-host:5432/database
```

## 🚀 Continuous Deployment

Connect your GitHub repository to Netlify for:
- **Automatic deployments** on push to main
- **Preview deployments** for pull requests
- **Branch deploys** for different environments
- **Rollback capabilities** with one click