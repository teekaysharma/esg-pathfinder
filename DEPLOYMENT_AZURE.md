# Azure Deployment Guide

## ☁️ Deploy to Microsoft Azure

This branch includes complete Azure infrastructure setup using ARM templates, Azure Container Registry, and Azure App Service.

### Prerequisites
- Azure CLI installed and configured
- Docker installed
- Azure subscription with appropriate permissions
- Azure Container Registry access

### Architecture Overview

#### Azure Services Used
- **App Service** - Container hosting for Next.js application
- **Azure Container Registry (ACR)** - Private Docker registry
- **Azure Database for PostgreSQL** - Managed database service
- **Azure Cache for Redis** - In-memory caching
- **Azure Storage Account** - File and blob storage
- **Azure Key Vault** - Secret management
- **Application Insights** - Monitoring and logging
- **Virtual Network** - Network isolation

#### Infrastructure Components
- **App Service Plan** (Premium V2) for container hosting
- **Azure Container Registry** for private Docker images
- **PostgreSQL Flexible Server** with high availability
- **Redis Cache** for session storage
- **Storage Account** for file uploads
- **Key Vault** for secure secret management
- **Virtual Network** with service endpoints

### Step 1: Configure Azure CLI
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set subscription (if multiple)
az account set --subscription "your-subscription-id"

# Verify configuration
az account show
```

### Step 2: Deploy Infrastructure
```bash
# Make deployment script executable
chmod +x deploy-azure.sh

# Deploy to Azure (production environment)
./deploy-azure.sh production "East US" esg-pathfinder

# Or deploy to staging
./deploy-azure.sh staging "West US" esg-pathfinder-staging
```

### Step 3: Manual Deployment Steps

#### 3.1 Create Resource Group
```bash
# Create resource group
az group create \
  --name esg-pathfinder-production-rg \
  --location "East US"
```

#### 3.2 Deploy ARM Template
```bash
# Deploy infrastructure
az deployment group create \
  --resource-group esg-pathfinder-production-rg \
  --template-file azuredeploy.json \
  --parameters \
    environment=production \
    appName=esg-pathfinder \
    databasePassword=YourSecurePassword123 \
    nextAuthSecret=YourVerySecureSecretKey32CharsLongMinimum
```

#### 3.3 Build and Push Docker Image
```bash
# Get ACR credentials
ACR_NAME=$(az deployment group show \
  --resource-group esg-pathfinder-production-rg \
  --name azuredeploy \
  --query properties.outputs.containerRegistryName.value \
  --output tsv)

# Build Docker image
docker build -t esg-pathfinder:latest .

# Tag image for ACR
docker tag esg-pathfinder:latest $ACR_NAME.azurecr.io/esg-pathfinder:latest

# Push to ACR
az acr login --name $ACR_NAME
docker push $ACR_NAME.azurecr.io/esg-pathfinder:latest
```

#### 3.4 Configure Application Settings
```bash
# Get resource names
APP_NAME=$(az deployment group show \
  --resource-group esg-pathfinder-production-rg \
  --name azuredeploy \
  --query properties.outputs.appServiceName.value \
  --output tsv)

# Update app settings
az webapp config appsettings set \
  --resource-group esg-pathfinder-production-rg \
  --name $APP_NAME \
  --settings \
    DATABASE_URL="postgresql://postgres:password@server:5432/database" \
    REDIS_URL="redis://server:6379" \
    NEXTAUTH_SECRET="your-secret-key"
```

### Step 4: Domain and SSL Setup

#### 4.1 Custom Domain Configuration
```bash
# Add custom domain
az webapp config hostname add \
  --resource-group esg-pathfinder-production-rg \
  --webapp-name $APP_NAME \
  --hostname esg-pathfinder.com

# Verify domain ownership
# (Add TXT record to DNS as instructed by Azure)
```

#### 4.2 SSL Certificate
```bash
# Create App Service certificate
az webapp config ssl create \
  --resource-group esg-pathfinder-production-rg \
  --webapp-name $APP_NAME \
  --hostname esg-pathfinder.com \
  --certificate-name esg-pathfinder-cert

# Bind SSL certificate
az webapp config ssl bind \
  --resource-group esg-pathfinder-production-rg \
  --webapp-name $APP_NAME \
  --certificate-thumbprint $(az webapp config ssl list \
    --resource-group esg-pathfinder-production-rg \
    --query [0].thumbprint --output tsv) \
  --name esg-pathfinder.com
```

### Step 5: Monitoring and Logging

#### Application Insights
```bash
# Get Application Insights key
APP_INSIGHTS_KEY=$(az monitor app-insights component show \
  --app esg-pathfinder-ai \
  --resource-group esg-pathfinder-production-rg \
  --query instrumentationKey --output tsv)

# Add to app settings
az webapp config appsettings set \
  --resource-group esg-pathfinder-production-rg \
  --name $APP_NAME \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$APP_INSIGHTS_KEY
```

#### View Logs
```bash
# Enable log streaming
az webapp log tail \
  --resource-group esg-pathfinder-production-rg \
  --name $APP_NAME

# View container logs
az webapp log config \
  --resource-group esg-pathfinder-production-rg \
  --name $APP_NAME \
  --web-server-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true
```

### Step 6: Database Management

#### Connect to PostgreSQL
```bash
# Get database credentials
DB_SERVER=$(az deployment group show \
  --resource-group esg-pathfinder-production-rg \
  --name azuredeploy \
  --query properties.outputs.databaseServerName.value \
  --output tsv)

# Connect using psql
psql -h $DB_SERVER.postgres.database.azure.com -U postgres -d esgpathfinder
```

#### Database Backups
```bash
# Create manual backup
az postgres flexible-server backup create \
  --resource-group esg-pathfinder-production-rg \
  --server-name $DB_SERVER \
  --backup-name manual-backup-$(date +%Y%m%d)

# List backups
az postgres flexible-server backup list \
  --resource-group esg-pathfinder-production-rg \
  --server-name $DB_SERVER
```

### Step 7: Storage and CDN

#### Configure Storage Account
```bash
# Get storage account name
STORAGE_ACCOUNT=$(az deployment group show \
  --resource-group esg-pathfinder-production-rg \
  --name azuredeploy \
  --query properties.outputs.storageAccountName.value \
  --output tsv)

# Create container for uploads
az storage container create \
  --name uploads \
  --account-name $STORAGE_ACCOUNT \
  --public-access blob

# Generate SAS token for app access
SAS_TOKEN=$(az storage account generate-sas \
  --account-name $STORAGE_ACCOUNT \
  --services b \
  --resource-types sco \
  --permissions racwdlup \
  --expiry $(date -u -d '+1 year' +%Y-%m-%dT%H:%M:%SZ) \
  --output tsv)
```

#### Configure Azure CDN
```bash
# Create CDN profile
az cdn profile create \
  --resource-group esg-pathfinder-production-rg \
  --name esg-pathfinder-cdn \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --resource-group esg-pathfinder-production-rg \
  --profile-name esg-pathfinder-cdn \
  --name esg-pathfinder-cdn-endpoint \
  --origin-host-name $APP_NAME.azurewebsites.net
```

### Step 8: Scaling and Performance

#### Scale Up App Service
```bash
# Scale up to Premium V2
az appservice plan update \
  --resource-group esg-pathfinder-production-rg \
  --name esg-pathfinder-plan \
  --sku P2v2

# Scale out (increase instances)
az appservice plan update \
  --resource-group esg-pathfinder-production-rg \
  --name esg-pathfinder-plan \
  --number-of-workers 3
```

#### Auto-scaling
```bash
# Create auto-scale rule
az monitor autoscale create \
  --resource-group esg-pathfinder-production-rg \
  --resource-name esg-pathfinder-plan \
  --resource-type Microsoft.Web/serverfarms \
  --min-count 2 \
  --max-count 10 \
  --count 2

# Add scale rule based on CPU
az monitor autoscale rule create \
  --resource-group esg-pathfinder-production-rg \
  --autoscale-name esg-pathfinder-autoscale \
  --condition "Percentage CPU > 70" \
  --scale out 1
```

### Security Considerations

#### Network Security
- **Virtual Network** isolates resources
- **Service Endpoints** secure database access
- **Private Endpoints** for internal communication
- **Network Security Groups** control traffic flow

#### Identity and Access
- **Managed Identity** for Azure resources
- **Role-Based Access Control (RBAC)** for users
- **Key Vault** for secret management
- **Azure AD** integration for authentication

#### Data Protection
- **Encryption at rest** for all Azure services
- **Encryption in transit** with TLS 1.2
- **Backup and retention** policies
- **Compliance certifications**

### Cost Optimization

#### Resource Sizing
- **App Service**: P1v2 for production, B1 for dev
- **Database**: Burstable B2s for cost efficiency
- **Redis**: Basic tier for caching
- **Storage**: Standard LRS with lifecycle management

#### Cost Management
```bash
# Set up budget alerts
az consumption budget create \
  --resource-group esg-pathfinder-production-rg \
  --name esg-pathfinder-budget \
  --category cost \
  --amount 200 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d '+1 year' +%Y-%m-01)

# Enable cost analysis
az costmanagement query \
  --resource-group esg-pathfinder-production-rg \
  --type AmortizedCost \
  --dataset-granularity Monthly \
  --timeframe MonthToDate
```

### Troubleshooting

#### Common Issues
1. **Container won't start**: Check Docker image and ACR permissions
2. **Database connection failed**: Verify VNET configuration and firewall rules
3. **SSL certificate issues**: Validate domain ownership and certificate binding
4. **Performance problems**: Check App Service plan and scaling settings

#### Debug Commands
```bash
# Check App Service logs
az webapp log tail --resource-group esg-pathfinder-production-rg --name $APP_NAME

# Check container logs
az webapp config container show-log-url \
  --resource-group esg-pathfinder-production-rg \
  --name $APP_NAME

# Debug deployment
az deployment group show \
  --resource-group esg-pathfinder-production-rg \
  --name azuredeploy \
  --verbose

# Check resource health
az monitor activity-log list \
  --resource-group esg-pathfinder-production-rg \
  --offset 7d
```

## 🎯 Quick Deployment Commands
```bash
# One-command deployment
./deploy-azure.sh production "East US" esg-pathfinder

# Monitor deployment
az webapp log tail --resource-group esg-pathfinder-production-rg --name esg-pathfinder-production

# Access application
open https://esg-pathfinder-production.azurewebsites.net
```

## 📊 Estimated Costs (Monthly)

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| App Service | P1v2, 2 instances | $100-150 |
| PostgreSQL | B_Standard_B2s, 32GB | $50-70 |
| Redis Cache | Basic C0 | $25-35 |
| Storage Account | 100GB Standard LRS | $2-5 |
| Application Insights | Standard tier | $20-30 |
| **Total** | | **$197-290** |

*Prices are estimates and vary by region and usage*