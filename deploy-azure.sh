#!/bin/bash

# Azure Deployment Script for ESG Pathfinder
# This script automates the deployment to Azure using ARM templates and Azure Container Instances

set -e

# Configuration
ENVIRONMENT=${1:-production}
LOCATION=${2:-East US}
APP_NAME=${3:-esg-pathfinder}

echo "🚀 Deploying ESG Pathfinder to Azure"
echo "Environment: $ENVIRONMENT"
echo "Location: $LOCATION"
echo "App Name: $APP_NAME"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in to Azure
if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure first."
    echo "Run: az login"
    exit 1
fi

# Set subscription (if multiple)
echo "📋 Available subscriptions:"
az account list --output table
echo "Please enter subscription ID to use (or press Enter to use default):"
read -r SUBSCRIPTION_ID

if [ -n "$SUBSCRIPTION_ID" ]; then
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Create resource group
RESOURCE_GROUP="$APP_NAME-$ENVIRONMENT-rg"
echo "📦 Creating resource group: $RESOURCE_GROUP"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 64)

echo "🏗️ Deploying Azure resources..."

# Deploy ARM template
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file azuredeploy.json \
  --parameters \
    environment="$ENVIRONMENT" \
    appName="$APP_NAME" \
    databasePassword="$DB_PASSWORD" \
    nextAuthSecret="$AUTH_SECRET" \
  --verbose

echo "📊 Getting deployment outputs..."

# Get resource IDs and names
APP_SERVICE_URL=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name azuredeploy --query properties.outputs.appServiceUrl.value --output tsv)
DB_SERVER_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name azuredeploy --query properties.outputs.databaseServerName.value --output tsv)
REDIS_CACHE_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name azuredeploy --query properties.outputs.redisCacheName.value --output tsv)
STORAGE_ACCOUNT_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name azuredeploy --query properties.outputs.storageAccountName.value --output tsv)
CONTAINER_REGISTRY_NAME=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name azuredeploy --query properties.outputs.containerRegistryName.value --output tsv)

echo "🐳 Building and pushing Docker image..."

# Build Docker image
docker build -t $APP_NAME:latest .

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name "$CONTAINER_REGISTRY_NAME" --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$CONTAINER_REGISTRY_NAME" --query passwords[0].value --output tsv)
ACR_LOGIN_SERVER=$(az acr show --name "$CONTAINER_REGISTRY_NAME" --query loginServer --output tsv)

# Login to ACR
docker login "$ACR_LOGIN_SERVER" --username "$ACR_USERNAME" --password "$ACR_PASSWORD"

# Tag and push image
docker tag $APP_NAME:latest "$ACR_LOGIN_SERVER/$APP_NAME:latest"
docker push "$ACR_LOGIN_SERVER/$APP_NAME:latest"

echo "🔧 Configuring application settings..."

# Get database connection string
DB_CONNECTION_STRING=$(az postgres flexible-server show-connection-string \
  --server-name "$DB_SERVER_NAME" \
  --database "$APP_NAME-db" \
  --admin-user "postgres" \
  --admin-password "$DB_PASSWORD" \
  --output tsv)

# Get Redis connection string
REDIS_CONNECTION_STRING=$(az redis show \
  --name "$REDIS_CACHE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query hostName --output tsv)

# Update App Service settings
az webapp config appsettings set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME-$ENVIRONMENT" \
  --settings \
    DATABASE_URL="$DB_CONNECTION_STRING" \
    REDIS_URL="redis://:$REDIS_PASSWORD@$REDIS_CONNECTION_STRING:6379" \
    AZURE_STORAGE_ACCOUNT="$STORAGE_ACCOUNT_NAME" \
    AZURE_CONTAINER_NAME="uploads" \
    Z_AI_API_KEY="$Z_AI_API_KEY" \
    OPENAI_API_KEY="$OPENAI_API_KEY"

echo "🗄️ Running database migrations..."

# Restart app service to apply changes
az webapp restart --resource-group "$RESOURCE_GROUP" --name "$APP_NAME-$ENVIRONMENT"

# Wait for app to be ready
echo "⏳ Waiting for application to start..."
sleep 30

# Run database migrations (using SSH or web app console)
# For production, you might want to use Azure Container Instances for one-off tasks

echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Details:"
echo "App Service URL: $APP_SERVICE_URL"
echo "Database Server: $DB_SERVER_NAME"
echo "Redis Cache: $REDIS_CACHE_NAME"
echo "Storage Account: $STORAGE_ACCOUNT_NAME"
echo "Container Registry: $CONTAINER_REGISTRY_NAME"
echo ""
echo "🌐 Application URL: $APP_SERVICE_URL"
echo ""
echo "🔧 Next Steps:"
echo "1. Configure custom domain in Azure DNS"
echo "2. Set up SSL certificate using Azure App Service Certificate"
echo "3. Configure Application Insights for monitoring"
echo "4. Set up Azure CDN for static assets"
echo "5. Configure backup and disaster recovery"
echo ""
echo "🗝️  Important Credentials (save these securely):"
echo "Database Password: $DB_PASSWORD"
echo "NextAuth Secret: $AUTH_SECRET"
echo ""
echo "📝 To run database migrations manually:"
echo "az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME-$ENVIRONMENT"
echo "Then run: bun run db:migrate && npx tsx seed-admin.ts"