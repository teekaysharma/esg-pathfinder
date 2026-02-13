# 🌍 ESG Pathfinder Platform

A comprehensive, production-ready ESG (Environmental, Social, and Governance) compliance management platform supporting major global frameworks including TCFD, CSRD, GRI, SASB, and IFRS standards.

## ✨ Key Features

### 🏢 **Framework Support**
- **🏛️ TCFD** - Task Force on Climate-related Financial Disclosures
- **🇪🇺 CSRD** - Corporate Sustainability Reporting Directive
- **🌍 GRI** - Global Reporting Initiative Standards
- **🏢 SASB** - Sustainability Accounting Standards Board
- **📊 IFRS** - International Financial Reporting Standards (S1-S5)

### 🤖 **AI-Powered Assessment**
- **Z-AI SDK Integration** for intelligent compliance analysis
- **Automated Gap Analysis** with actionable recommendations
- **Confidence Scoring** for assessment reliability
- **Real-time Validation** with multi-layer quality checks

### 📊 **Comprehensive Dashboard**
- **Real-time ESG Metrics** and compliance tracking
- **Interactive Visualizations** with charts and graphs
- **Material Topic Analysis** and prioritization
- **Benchmark Comparisons** against industry standards

### 🔐 **Enterprise Security Features**
- **🛡️ Advanced Authentication** with JWT-based security
- **🚨 Rate Limiting** and DDoS protection
- **🔍 Input Validation** with XSS and SQL injection prevention
- **📊 Comprehensive Audit Trail** with structured logging
- **🔒 Role-Based Access Control** (Admin, Auditor, Analyst, Viewer)
- **🛡️ Security Headers** and CSP protection
- **📈 Performance Monitoring** with request tracking

## 🚀 Deployment Options

Choose from 7 deployment platforms:

| Platform | Branch | Deploy Time | Cost | Best For |
|----------|--------|-------------|------|----------|
| **🌊 Streamlit** | `deployment/streamlit` | 5 min | Free-$10/mo | Data apps |
| **⚡ Vercel** | `deployment/vercel` | 5 min | Free-$20/mo | Web apps |
| **🌊 Netlify** | `deployment/netlify` | 10 min | Free-$19/mo | Static sites |
| **🚂 Railway** | `deployment/railway` | 10 min | $5+/mo | Full-stack |
| **🐳 Docker** | `deployment/docker` | 15 min | Varies | Self-hosting |
| **☁️ AWS** | `deployment/aws` | 30 min | $100+/mo | Enterprise |
| **🔷 Azure** | `deployment/azure` | 30 min | $200+/mo | Enterprise |

## 🌊 Quick Start with Streamlit (Recommended)

### **Option 1: Streamlit Cloud (5 minutes)**
1. Go to [Streamlit Cloud](https://share.streamlit.io/)
2. Connect your GitHub account
3. Select: `teekaysharma/esg-pathfinder`
4. Select branch: `deployment/streamlit`
5. Main file: `streamlit_app.py`
6. Click "Deploy"

### **Option 2: Local Development**
```bash
# Clone the repository
git clone https://github.com/teekaysharma/esg-pathfinder.git
cd esg-pathfinder

# Switch to Streamlit branch
git checkout deployment/streamlit

# Install dependencies
pip install -r requirements.txt
npm install

# Run locally
streamlit run streamlit_app.py
```

### **Option 3: Docker Deployment**
```bash
# Switch to Streamlit branch
git checkout deployment/streamlit

# Build and run
docker build -t esg-pathfinder-streamlit .
docker run -p 8501:8501 esg-pathfinder-streamlit
```

## 📋 Technology Stack

### **Frontend (Streamlit)**
- **Streamlit** - Python web app framework
- **Plotly** - Interactive charts and visualizations
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computations

### **Backend (Next.js)**
- **Next.js 16** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Prisma** - Database ORM
- **NextAuth.js** - Authentication

### **Database & Infrastructure**
- **SQLite/PostgreSQL** - Database
- **Z-AI SDK** - AI-powered assessments
- **RESTful APIs** - Complete backend services

## 🎯 Platform Features

### **📊 ESG Dashboard**
- **Framework Compliance Scores** with real-time updates
- **Material Topic Analysis** and prioritization
- **Trend Visualization** with interactive charts
- **Benchmark Comparisons** against industry standards

### **🏢 Framework Assessments**
- **TCFD**: Governance, Strategy, Risk Management, Metrics & Targets
- **CSRD**: Double Materiality, ESRS Standards, Due Diligence
- **GRI**: Universal Standards, Topic Standards, Sector Standards
- **SASB**: Industry-specific standards and metrics
- **IFRS**: S1-S5 Sustainability Standards

### **📤 Data Collection**
- **Automated Data Validation** with quality scoring
- **Bulk Data Upload** (CSV, Excel, JSON)
- **Real-time Progress Tracking**
- **Confidence Scoring** for data reliability

### **📈 Analytics & Reporting**
- **Performance Analytics** with trend analysis
- **Gap Analysis** with actionable recommendations
- **Audit-Ready Reports** in multiple formats
- **Custom Framework Reports**

### **⚙️ Administration**
- **User Management** with role-based access
- **System Configuration** and settings
- **Audit Logging** with complete activity tracking
- **Backup and Maintenance** tools

## 🔧 Development Setup

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Python 3.9+ and pip
- Git

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/teekaysharma/esg-pathfinder.git
cd esg-pathfinder

# Install Node.js dependencies
npm install

# Install Python dependencies (for Streamlit)
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env.local

# Initialize database
npm run db:push

# Create admin user
npx tsx seed-admin.ts

# Start development server
npm run dev
```

### **Environment Variables**
```env
# Database
DATABASE_URL="file:./dev.db"

# 🔐 CRITICAL: Authentication (REQUIRED)
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-32-characters-long"
JWT_EXPIRES_IN="24h"

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI Services
Z_AI_API_KEY="your-z-ai-api-key"
Z_AI_BASE_URL="https://api.z-ai.dev"

# Redis Configuration (for caching and rate limiting)
REDIS_URL="redis://localhost:6379"

# Security Configuration
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE_PATH="./logs/app.log"
```

⚠️ **Important**: `JWT_SECRET` is now required for security. Generate a secure random key (minimum 32 characters).


### **Standards Readiness & Data Collection APIs**

The platform now includes project-level readiness and collection endpoints to ensure all framework requirements can be prepared before final report generation:

- `GET /api/v1/projects/{id}/standards/readiness`
  - Returns coverage score per standard (`TCFD`, `CSRD`, `ISSB`, `IFRS`, `GRI`, `SASB`)
  - Lists missing requirements and recommended next input steps

- `GET /api/v1/projects/{id}/sasb/assessment`
- `POST /api/v1/projects/{id}/sasb/assessment`
  - Stores/updates SASB industry mapping, metrics, disclosures, benchmark inputs, and gap analysis

These endpoints complement existing routes for:
- TCFD: `/api/v1/projects/{id}/tcfd/assessment`
- CSRD: `/api/v1/projects/{id}/csrd/assessment`
- ISSB: `/api/v1/projects/{id}/issb/assessment`
- GRI: `/api/v1/projects/{id}/gri/assessment`, `/api/v1/projects/{id}/gri/metrics`
- IFRS metrics: `/api/v1/projects/{id}/ifrs/metrics`
- Shared data capture: `/api/v1/projects/{id}/data-points`, `/api/v1/projects/{id}/compliance-checks`, `/api/v1/projects/{id}/workflows`

## 📚 Documentation

- **[📖 CHANGELOG](./CHANGELOG.md)** - Version history and updates
- **[🔒 Security Implementation](./SECURITY_IMPLEMENTATION.md)** - Security features and setup
- **[🧪 Testing Guide](./docs/testing.md)** - Testing framework and coverage
- **[🚀 Deployment Guide](./DEPLOYMENT.md)** - Platform-specific deployment instructions
- **[📚 API Documentation](./docs/api.md)** - Complete API reference
- **[🏢 Framework Guides](./docs/frameworks/)** - Individual framework documentation
- **[🤝 Contributing Guide](./CONTRIBUTING.md)** - Development and contribution guidelines

## 🎯 Use Cases

### **For Corporations**
- **ESG Compliance Management** across multiple frameworks
- **Automated Reporting** with audit-ready documentation
- **Risk Assessment** and mitigation strategies
- **Stakeholder Communication** with transparent ESG data

### **For Consultants**
- **Client ESG Assessments** with comprehensive analysis
- **Framework Mapping** and gap identification
- **Implementation Roadmaps** with prioritized actions
- **Benchmark Analysis** against industry standards

### **For Investors**
- **ESG Due Diligence** with standardized metrics
- **Portfolio Analysis** and risk assessment
- **Compliance Monitoring** across investments
- **Reporting Integration** with investment strategies

## 🌟 Key Differentiators

### **Comprehensive Framework Support**
- **5 Major Frameworks** in one unified platform
- **Cross-Framework Mapping** for efficient reporting
- **Automated Alignment** between different standards

### **AI-Powered Intelligence**
- **Smart Assessments** using Z-AI SDK
- **Automated Recommendations** with priority scoring
- **Confidence Metrics** for data reliability

### **Enterprise-Grade Features**
- **Role-Based Security** with audit trails
- **Scalable Architecture** for global deployment
- **Professional UI/UX** with mobile support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### **Quick Contribution Steps**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our comprehensive guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our community discussions
- **Email**: support@esgpathfinder.com

## 🎊 Ready to Transform ESG Compliance?

**Get started in minutes:**

1. **🌊 Deploy on Streamlit Cloud** - Fastest option (5 minutes)
2. **📊 Explore the Dashboard** - See framework compliance in action
3. **📤 Upload Your Data** - Start with sample data or your own
4. **🎯 Run Assessments** - Get AI-powered compliance analysis
5. **📈 Generate Reports** - Export audit-ready documentation

---

**🌍 ESG Pathfinder - Empowering Sustainable Business Decisions**

Built with ❤️ for the global sustainability community. Supercharged by [Z.ai](https://chat.z.ai) 🚀