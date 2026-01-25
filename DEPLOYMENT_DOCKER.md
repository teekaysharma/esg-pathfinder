# Docker Deployment Guide

## 🐳 Deploy with Docker

This branch includes complete Docker configuration for containerized deployment.

### Prerequisites
- Docker and Docker Compose installed
- Docker Hub account (for pushing images)
- SSL certificates (for HTTPS)

### Step 1: Build and Run Locally
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 2: Environment Configuration
Create `.env` file:
```env
# Database
POSTGRES_DB=esgpathfinder
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# Application
NEXTAUTH_SECRET=your-very-secure-secret-key
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://postgres:your-secure-password@db:5432/esgpathfinder

# AI Services
Z_AI_API_KEY=your-z-ai-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Step 3: Initialize Database
```bash
# Run database migrations
docker-compose exec app bun run db:migrate

# Create admin user
docker-compose exec app npx tsx seed-admin.ts
```

### Step 4: Access the Application
- **Application**: `https://localhost`
- **Database**: `localhost:5432`
- **Redis**: `localhost:6379`

### Production Deployment

#### Option 1: Docker Compose (Single Server)
```bash
# Clone and configure
git clone https://github.com/your-username/esg-pathfinder.git
cd esg-pathfinder
git checkout deployment/docker

# Configure environment
cp .env.example .env
# Edit .env with your values

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 2: Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml esg-pathfinder
```

#### Option 3: Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

### Container Architecture

#### Services
- **app**: Next.js application (Node.js 18 Alpine)
- **db**: PostgreSQL 15 database
- **redis**: Redis 7 for caching
- **nginx**: Reverse proxy with SSL termination

#### Multi-stage Build
1. **deps**: Install dependencies
2. **builder**: Build application
3. **runner**: Production image

### Security Features
- ✅ **Non-root user** for application
- ✅ **SSL/TLS encryption** with Nginx
- ✅ **Security headers** (CSP, HSTS, etc.)
- ✅ **Health checks** for all containers
- ✅ **Network isolation** with Docker networks

### Performance Optimizations
- ✅ **Multi-stage builds** for smaller images
- ✅ **Nginx caching** and compression
- ✅ **Redis caching** for sessions
- ✅ **Database connection** pooling
- ✅ **Static asset** optimization

### Monitoring and Logging
```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# Monitor resource usage
docker stats

# Health check
curl -f http://localhost:3000/api/health
```

### Scaling

#### Horizontal Scaling
```bash
# Scale application containers
docker-compose up -d --scale app=3

# Add load balancer
docker-compose -f docker-compose.loadbalancer.yml up -d
```

#### Database Scaling
- **Read replicas** for read operations
- **Connection pooling** with PgBouncer
- **Backups** with pg_dump

### Backup and Recovery

#### Database Backups
```bash
# Create backup
docker-compose exec db pg_dump -U postgres esgpathfinder > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres esgpathfinder < backup.sql

# Automated backups
docker-compose exec db pg_dump -U postgres esgpathfinder | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### Volume Backups
```bash
# Backup volumes
docker run --rm -v esg-pathfinder_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### SSL/TLS Setup

#### Self-Signed Certificates (Development)
```bash
# Create SSL directory
mkdir ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

#### Let's Encrypt (Production)
```bash
# Install certbot
docker run -it --rm --name certbot \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  -p 80:80 \
  certbot/certbot certonly --standalone -d yourdomain.com
```

### Production Considerations

#### Environment Variables
```env
# Production settings
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:password@db:5432/esgpathfinder

# Security
NEXTAUTH_SECRET=your-very-secure-secret-key
REDIS_PASSWORD=your-redis-password

# Performance
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
```

#### Resource Limits
```yaml
# docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🎯 Quick Deploy Commands
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# Initialize
docker-compose exec app bun run db:migrate
docker-compose exec app npx tsx seed-admin.ts

# Monitor
docker-compose logs -f
```