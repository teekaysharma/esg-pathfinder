# Railway Deployment Guide

## 🚂 Deploy to Railway

This branch is optimized for Railway's app deployment platform with built-in database support.

### Prerequisites
- Railway account
- GitHub connected to Railway
- Railway CLI (optional)

### Step 1: Connect to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### Step 2: Configure Environment Variables
In Railway dashboard, set these environment variables:

```env
# Required
NEXTAUTH_SECRET=your-very-secure-secret-key
NEXTAUTH_URL=https://your-app-name.up.railway.app
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:7912/railway

# Optional
Z_AI_API_KEY=your-z-ai-api-key
OPENAI_API_KEY=your-openai-key
NODE_ENV=production
```

### Step 3: Deploy
```bash
# Deploy to Railway
railway up

# Or connect to GitHub for auto-deploys
railway variables set NODE_ENV=production
railway up
```

### Step 4: Database Setup
Railway provides built-in PostgreSQL:

1. **Add PostgreSQL Service** in Railway dashboard
2. **Get DATABASE_URL** from service variables
3. **Run migrations**:
   ```bash
   railway run bun run db:migrate
   railway run npx tsx seed-admin.ts
   ```

### Railway-Specific Features
- ✅ **Built-in PostgreSQL** database
- ✅ **Automatic HTTPS** and custom domains
- ✅ **GitHub integration** with auto-deploys
- ✅ **Environment variables** management
- ✅ **Logs and metrics** in dashboard
- ✅ **Scale to zero** when not in use

### Performance Optimizations
- ✅ **Automatic scaling** based on traffic
- ✅ **Built-in CDN** for static assets
- ✅ **Database connection** pooling
- ✅ **Health checks** and auto-restarts

### Monitoring
- Railway dashboard for app metrics
- Database performance monitoring
- Error logs and debugging
- Deployment history

## 🎯 Quick Deploy Commands
```bash
# Set up environment
railway variables set NEXTAUTH_SECRET=your-secret
railway variables set DATABASE_URL=your-db-url

# Deploy
railway up

# Run migrations
railway run bun run db:migrate
railway run npx tsx seed-admin.ts
```

## 🐘 Database Management

### Built-in PostgreSQL
Railway provides a managed PostgreSQL database:

```bash
# View database logs
railway logs postgres

# Connect to database
railway run psql $DATABASE_URL

# Backup database
railway run pg_dump $DATABASE_URL > backup.sql
```

### Database Migrations
```bash
# Run migrations on Railway
railway run bun run db:migrate

# Seed admin user
railway run npx tsx seed-admin.ts

# Reset database
railway run bun run db:reset
```

## 🚀 Continuous Deployment

Connect GitHub to Railway for:
- **Automatic deployments** on push
- **Preview environments** for PRs
- **Environment-specific** variables
- **Rollback capabilities**

## 📊 Scaling

### Auto-scaling
- **Basic**: $0/month (sleeps after 30min)
- **Starter**: $5/month (always on)
- **Developer**: $20/month (more power)
- **Scale**: Custom pricing

### Database Scaling
- **Hobby**: Free tier available
- **Starter**: $5/month
- **Production**: Custom pricing

## 🔧 Advanced Configuration

### Custom Domain
```bash
# Add custom domain
railway domains add yourdomain.com
```

### Health Checks
The app includes health check endpoint:
```typescript
// /api/health
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Background Jobs
For background processing, add a Railway service:
```json
{
  "services": {
    "app": { ... },
    "worker": {
      "build": { "buildCommand": "bun run build:worker" },
      "deploy": { "startCommand": "bun run worker" }
    }
  }
}
```