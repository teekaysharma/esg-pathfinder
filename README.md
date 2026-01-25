# ESG Pathfinder 🌍

A comprehensive ESG (Environmental, Social, and Governance) compliance platform that supports major global sustainability standards including TCFD, CSRD, GRI, SASB, and IFRS.

## 🚀 Features

### 🌍 **Comprehensive Framework Support**
- **TCFD** - Climate-related Financial Disclosures
- **CSRD** - Corporate Sustainability Reporting Directive (EU)
- **GRI** - Global Reporting Initiative Standards
- **SASB** - Sustainability Accounting Standards Board
- **IFRS** - International Financial Reporting Standards (S1-S5)

### 🤖 **AI-Powered Assessment**
- Intelligent compliance analysis using Z-AI SDK
- Automated gap analysis and recommendations
- Confidence scoring and validation
- Real-time progress tracking

### 📊 **Advanced Analytics**
- Interactive dashboards with visual compliance scores
- Materiality assessment and risk analysis
- Data validation with quality scoring
- Comprehensive reporting and export capabilities

### 👥 **Enterprise Features**
- Role-based access control (Admin, Auditor, Analyst, Viewer)
- Complete audit trail and activity logging
- Workflow management with approval processes
- Multi-project support with centralized management

### 🔧 **Developer-Friendly**
- Next.js 16 with TypeScript
- Prisma ORM with SQLite/PostgreSQL
- RESTful APIs with comprehensive documentation
- Modern UI with shadcn/ui and Tailwind CSS

## 📋 System Requirements

- **Node.js** 18+ or **Bun** 1.0+
- **Database**: SQLite (development) or PostgreSQL (production)
- **Package Manager**: Bun (recommended) or npm/yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/esg-pathfinder.git
cd esg-pathfinder
```

### 2. Install Dependencies
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_SECRET="your-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI Services (Optional)
Z_AI_API_KEY="your-z-ai-api-key"
Z_AI_BASE_URL="https://api.z-ai.dev"

# External APIs (Optional)
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Initialize Database
```bash
bun run db:push
npx tsx seed-admin.ts
```

### 5. Start Development Server
```bash
bun run dev
```

Visit `http://localhost:3000` to access the application.

### 6. Admin Access
- **URL**: `http://localhost:3000/admin`
- **Email**: `admin@esgpathfinder.com`
- **Password**: `Admin123!`

## 🌳 Platform-Specific Deployment

This repository includes platform-specific branches for easy deployment:

| Platform | Branch | Description |
|----------|--------|-------------|
| **Vercel** | `deployment/vercel` | Optimized for Vercel hosting |
| **Netlify** | `deployment/netlify` | Configured for Netlify deployment |
| **Railway** | `deployment/railway` | Railway platform setup |
| **Docker** | `deployment/docker` | Containerized deployment |
| **AWS** | `deployment/aws` | AWS infrastructure setup |
| **Azure** | `deployment/azure` | Microsoft Azure deployment |

### 🎯 Vercel Deployment (Recommended)
```bash
git checkout deployment/vercel
vercel
```

### 🌊 Netlify Deployment
```bash
git checkout deployment/netlify
netlify deploy --prod
```

### 🚂 Railway Deployment
```bash
git checkout deployment/railway
railway up
```

### 🐳 Docker Deployment
```bash
git checkout deployment/docker
docker-compose up -d
```

## 📚 Documentation

### API Documentation
- **Base URL**: `http://localhost:3000/api/v1`
- **Authentication**: Bearer token required
- **Format**: JSON

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Current user info

#### Framework Assessments
- `GET /projects/[id]/tcfd/assessment` - TCFD assessment
- `GET /projects/[id]/csrd/assessment` - CSRD assessment
- `GET /projects/[id]/gri/assessment` - GRI assessment
- `GET /projects/[id]/sasb/assessment` - SASB assessment
- `GET /projects/[id]/ifrs/assessment` - IFRS assessment

#### Admin APIs
- `GET /admin/stats` - System statistics
- `GET /admin/users` - User management
- `GET /admin/audit-logs` - Audit logs

### Database Schema
The application uses Prisma ORM with the following main models:
- `User` - User accounts and roles
- `Project` - ESG projects and workspaces
- `TCFDAssessment`, `CSRDAssessment`, `GRIAssessment`, `SASBAssessment`, `IFRSAssessment` - Framework-specific data
- `DataPoint` - ESG metrics and validation
- `AuditLog` - System activity tracking

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand + TanStack Query
- **Authentication**: NextAuth.js v4

### Backend
- **API**: Next.js API Routes with RESTful design
- **Database**: Prisma ORM with SQLite/PostgreSQL
- **Validation**: Zod schema validation
- **AI Integration**: Z-AI SDK for intelligent assessments

### Security
- **Authentication**: JWT-based with secure sessions
- **Authorization**: Role-based access control
- **Validation**: Input sanitization and SQL injection prevention
- **Audit**: Complete activity logging

## 🧪 Testing

```bash
# Run linting
bun run lint

# Run type checking
bun run type-check

# Run tests (when implemented)
bun run test
```

## 📦 Project Structure

```
esg-pathfinder/
├── src/                    # Next.js application source
│   ├── app/               # App Router pages and API routes
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility functions and configurations
│   └── types/            # TypeScript type definitions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── docs/                 # Additional documentation
├── deployment/           # Platform-specific configurations
└── scripts/              # Build and deployment scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Open an issue on GitHub
- **Discussions**: Join our GitHub Discussions
- **Email**: support@esgpathfinder.com

## 🎯 Roadmap

- [ ] XBRL taxonomy support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Advanced AI insights
- [ ] Multi-language support
- [ ] Advanced reporting templates

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/esg-pathfinder&type=Date)](https://star-history.com/#your-username/esg-pathfinder&Date)

---

**Built with ❤️ for sustainable business practices**