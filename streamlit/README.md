# ESG Pathfinder Streamlit Dashboard

A secure, feature-rich Streamlit dashboard for ESG (Environmental, Social, and Governance) compliance management.

## 🔐 Security Features

This dashboard implements enterprise-grade security measures:

- **🔐 Authentication System**: Secure login with session management
- **🛡️ Input Validation**: Comprehensive validation and sanitization
- **🚨 Error Handling**: Structured error handling and logging
- **🗄️ Secure Database**: Connection pooling and parameterized queries
- **⏰ Session Management**: Automatic timeout and logout
- **📊 Activity Logging**: Comprehensive audit trail

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- SQLite (included) or PostgreSQL for production

### Installation

1. **Clone and navigate to the streamlit directory:**
   ```bash
   cd streamlit
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the dashboard:**
   ```bash
   streamlit run streamlit_app.py
   ```

5. **Open your browser** and navigate to `http://localhost:8501`

### Default Login

- **Username**: `admin`
- **Password**: `admin123` (⚠️ Change this in production!)

## 📋 Features

### 🏠 Dashboard
- **Project Overview**: Key metrics and statistics
- **Recent Activity**: Latest projects and updates
- **Visual Analytics**: Charts and graphs for ESG data
- **Status Tracking**: Project status distribution

### 📁 Project Management
- **Create Projects**: Secure project creation with validation
- **Edit Projects**: Update project details and status
- **Delete Projects**: Safe project deletion with confirmation
- **Project Search**: Filter and search projects

### 📊 ESG Data Management
- **Data Entry**: Secure ESG metric input
- **Category Organization**: Environmental, Social, Governance
- **Time Series**: Yearly and quarterly tracking
- **Data Validation**: Comprehensive input validation

### ⚙️ Admin Panel
- **System Health**: Database connection status
- **User Management**: User activity monitoring
- **Error Tracking**: Session error history
- **System Metrics**: Performance indicators

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=sqlite:///esg_pathfinder.db

# Authentication (CHANGE IN PRODUCTION!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password_here
ADMIN_EMAIL=admin@esg-pathfinder.com

# Security
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
SESSION_TIMEOUT_HOURS=2

# Rate Limiting
MAX_LOGIN_ATTEMPTS=3
LOCKOUT_DURATION_MINUTES=15
```

### Database Setup

The app uses SQLite by default. For PostgreSQL:

```bash
# Install PostgreSQL driver
pip install psycopg2-binary

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/esg_pathfinder
```

## 🛡️ Security Implementation

### Authentication System

- **Password Hashing**: PBKDF2 with salt (100,000 iterations)
- **Session Management**: Secure session tokens with timeout
- **Account Lockout**: Automatic lockout after failed attempts
- **Role-Based Access**: Admin and user roles

### Input Validation

- **XSS Prevention**: HTML escaping for all user inputs
- **SQL Injection Prevention**: Parameterized queries only
- **Data Validation**: Type checking and range validation
- **Length Limits**: Maximum field length enforcement

### Error Handling

- **Structured Logging**: Comprehensive error logging
- **User-Friendly Messages**: Safe error display
- **Session Tracking**: Error history per session
- **Performance Monitoring**: Query and page load tracking

## 📊 ESG Framework Support

The dashboard supports major ESG frameworks:

- **🏛️ TCFD**: Task Force on Climate-related Financial Disclosures
- **🇪🇺 CSRD**: Corporate Sustainability Reporting Directive
- **📈 GRI**: Global Reporting Initiative
- **🏢 SASB**: Sustainability Accounting Standards Board
- **📋 IFRS**: International Financial Reporting Standards

## 🔍 Monitoring and Logging

### Log Files

- **Application Log**: `esg_dashboard.log`
- **Error Tracking**: Session-based error history
- **User Activity**: Action logging with timestamps
- **Performance Metrics**: Query timing and page load times

### Admin Monitoring

- **Database Health**: Connection status and performance
- **User Sessions**: Active session monitoring
- **Error Patterns**: Recurring error identification
- **System Metrics**: Real-time system status

## 🚀 Deployment

### Production Deployment

1. **Secure Environment Variables:**
   ```bash
   # Use strong, unique passwords
   ADMIN_PASSWORD=your_secure_password_here
   JWT_SECRET=your_32_character_secret_key
   ```

2. **Database Security:**
   ```bash
   # Use PostgreSQL in production
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

3. **Run with SSL:**
   ```bash
   streamlit run streamlit_app.py --server.ssl.certFile cert.pem --server.ssl.keyFile key.pem
   ```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8501

CMD ["streamlit", "run", "streamlit_app.py", "--server.address=0.0.0.0"]
```

## 🧪 Testing

Run the security tests:

```bash
# Test authentication
python -c "from auth import auth; print('Auth system working')"

# Test database connection
python -c "from database import db; print('DB connection:', db.test_connection())"

# Test validation
python -c "from validation import InputValidator; print('Validation system working')"
```

## 📝 Development

### Project Structure

```
streamlit/
├── streamlit_app.py          # Main application
├── auth.py                   # Authentication system
├── database.py               # Database operations
├── validation.py             # Input validation
├── error_handling.py         # Error handling & logging
├── requirements.txt          # Python dependencies
├── .env.example             # Environment template
└── README.md                # This file
```

### Adding New Features

1. **Authentication**: Use `auth.require_auth()` for protected pages
2. **Database**: Use secure functions in `database.py`
3. **Validation**: Use validators in `validation.py`
4. **Error Handling**: Use `@error_handler` decorator

## 🔒 Security Best Practices

### For Production

1. **Change Default Credentials**: Always change admin password
2. **Use HTTPS**: Enable SSL/TLS encryption
3. **Environment Variables**: Never commit secrets to git
4. **Regular Updates**: Keep dependencies updated
5. **Database Security**: Use strong database passwords
6. **Backup Strategy**: Regular database backups
7. **Monitoring**: Set up log monitoring and alerts

### Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure database security
- [ ] Set up log rotation
- [ ] Monitor error logs
- [ ] Regular security updates
- [ ] Backup configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement security best practices
4. Add tests for new features
5. Submit a pull request

## 📞 Support

For security issues or questions:
- 📧 Email: security@esg-pathfinder.com
- 🐛 Issues: GitHub Issues (for non-security issues)
- 📖 Documentation: Check this README first

## 📄 License

This project is licensed under the MIT License - see the main project LICENSE file for details.

---

⚠️ **Security Notice**: This dashboard handles sensitive ESG data. Ensure proper security measures are in place before deploying to production.