# 🌍 ESG Pathfinder Platform

A comprehensive, production-ready ESG (Environmental, Social, and Governance) compliance management platform supporting major global frameworks including TCFD, CSRD, GRI, SASB, and IFRS standards.

## ✨ Key Features

### 🏢 **Framework Support**
- **🏛️ TCFD** - Task Force on Climate-related Financial Disclosures
- **🇪🇺 CSRD** - Corporate Sustainability Reporting Directive
- **🌍 GRI** - Global Reporting Initiative Standards
- **🏢 SASB** - Sustainability Accounting Standards Board
- **📊 IFRS** - International Financial Reporting Standards (S1-S5)
- **💎 RJC** - Responsible Jewellery Council Code of Practices & Chain-of-Custody

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
- **RJC**: Responsible sourcing, chain-of-custody, labor/human-rights, and environmental compliance

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
- Node.js 18+ and npm
- Docker (for local PostgreSQL)
- Git

### **Local MVP Development (localhost + PostgreSQL)**
```bash
# Clone and install
git clone https://github.com/teekaysharma/esg-pathfinder.git
cd esg-pathfinder
npm install

# Configure environment
cp .env.example .env.local
cp .env.example .env

# Start local PostgreSQL
npm run db:start

# Push schema and seed admin + default organization
npm run db:setup:local

# Start app
npm run dev
```

### **Windows Local Bootstrap (No Docker, PostgreSQL Installed Locally)**
If you already have PostgreSQL and npm on Windows, use the included bootstrap package from this branch:

1. Download this branch as ZIP from GitHub and extract it.
2. Open PowerShell in the extracted project root.
3. Run one of:
```powershell
# easiest: double-click start.bat or run it from cmd
.\start.bat

# or run npm bootstrap directly
npm run bootstrap:windows
```

This startup tool will:
- Verify `node`, `npm`, and `psql` are available
- Create/update `.env` and `.env.local`
- Provision PostgreSQL role/database (`esg_user` / `esg_pathfinder` by default)
- Install npm dependencies
- Run Prisma schema push + local seed
- Start the app (`npm run dev`)

Optional flags (PowerShell):
```powershell
# Skip launching dev server after bootstrap
npm run bootstrap:windows:skipdev

# Or run script directly with custom DB values
powershell -ExecutionPolicy Bypass -File scripts/windows/bootstrap-local.ps1 `
  -DbHost localhost -DbPort 5432 -DbName esg_pathfinder -DbUser esg_user -DbPassword esg_password
```

If your postgres admin account requires a password, set `PGPASSWORD` before running the script.

### **Environment Variables**
Use `.env.example` as baseline. Minimum required values:
```env
DATABASE_URL="postgresql://esg_user:esg_password@localhost:5432/esg_pathfinder?schema=public"
JWT_SECRET="<at-least-32-characters>"
JWT_EXPIRES_IN="24h"
NEXTAUTH_SECRET="<at-least-32-characters>"
NEXTAUTH_URL="http://localhost:5000"
NODE_ENV="development"
PORT="5000"
CORS_ORIGIN="http://localhost:5000,http://localhost:3000"
```

### **Local MVP Login**
After running `npm run db:setup:local`:
- Email: `admin@esgpathfinder.com`
- Password: `Admin123!`

⚠️ **Important**: `JWT_SECRET` must be strong (minimum 32 characters).


### **Standards Readiness & Data Collection APIs**

The platform now includes project-level readiness and collection endpoints to ensure all framework requirements can be prepared before final report generation:

- `GET /api/v1/projects/{id}/standards/readiness`
  - Returns coverage score per standard (`TCFD`, `CSRD`, `ISSB`, `IFRS`, `GRI`, `SASB`, `RJC`)
  - Lists missing requirements and recommended next input steps

- `GET /api/v1/projects/{id}/sasb/assessment`
- `POST /api/v1/projects/{id}/sasb/assessment`
  - Stores/updates SASB industry mapping, metrics, disclosures, benchmark inputs, and gap analysis

- `GET /api/v1/projects/{id}/rjc/assessment`
- `POST /api/v1/projects/{id}/rjc/assessment`
  - Captures RJC controls for governance/ethics, chain-of-custody, human-rights/labor, environmental performance, due diligence, and corrective actions

These endpoints complement existing routes for:
- TCFD: `/api/v1/projects/{id}/tcfd/assessment`
- CSRD: `/api/v1/projects/{id}/csrd/assessment`
- ISSB: `/api/v1/projects/{id}/issb/assessment`
- GRI: `/api/v1/projects/{id}/gri/assessment`, `/api/v1/projects/{id}/gri/metrics`
- IFRS metrics: `/api/v1/projects/{id}/ifrs/metrics`
- Shared data capture: `/api/v1/projects/{id}/data-points`, `/api/v1/projects/{id}/compliance-checks`, `/api/v1/projects/{id}/workflows`
- RJC: `/api/v1/projects/{id}/rjc/assessment`

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