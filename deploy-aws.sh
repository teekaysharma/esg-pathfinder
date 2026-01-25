#!/bin/bash

# AWS Deployment Script for ESG Pathfinder
# This script automates the deployment to AWS using CloudFormation and ECS

set -e

# Configuration
ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}
DOMAIN_NAME=${3:-esg-pathfinder.com}

echo "🚀 Deploying ESG Pathfinder to AWS"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Domain: $DOMAIN_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Please configure AWS credentials first."
    echo "Run: aws configure"
    exit 1
fi

# Set AWS region
export AWS_REGION=$REGION

echo "📦 Building and pushing Docker image..."

# Build Docker image
docker build -t $ENVIRONMENT-esg-pathfinder:latest .

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repository if it doesn't exist
aws ecr describe-repositories --repository-names $ENVIRONMENT-esg-pathfinder || \
aws ecr create-repository --repository-name $ENVIRONMENT-esg-pathfinder

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Tag and push image
docker tag $ENVIRONMENT-esg-pathfinder:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ENVIRONMENT-esg-pathfinder:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ENVIRONMENT-esg-pathfinder:latest

echo "🏗️ Deploying CloudFormation stack..."

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 64)

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file cloudformation.yml \
  --stack-name $ENVIRONMENT-esg-pathfinder \
  --parameter-overrides \
    Environment=$ENVIRONMENT \
    DomainName=$DOMAIN_NAME \
    DatabasePassword=$DB_PASSWORD \
    NextAuthSecret=$AUTH_SECRET \
  --capabilities CAPABILITY_IAM \
  --region $REGION

echo "⏳ Waiting for stack deployment to complete..."
aws cloudformation wait stack-create-complete --stack-name $ENVIRONMENT-esg-pathfinder --region $REGION

echo "🔧 Getting stack outputs..."
LOAD_BALANCER_DNS=$(aws cloudformation describe-stacks --stack-name $ENVIRONMENT-esg-pathfinder --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text --region $REGION)
DATABASE_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $ENVIRONMENT-esg-pathfinder --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text --region $REGION)
REDIS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $ENVIRONMENT-esg-pathfinder --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' --output text --region $REGION)
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name $ENVIRONMENT-esg-pathfinder --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' --output text --region $REGION)

echo "🗄️ Running database migrations..."

# Update ECS service with environment variables
aws ecs update-service \
  --cluster $ENVIRONMENT-esg-pathfinder \
  --service $ENVIRONMENT-esg-pathfinder \
  --force-new-deployment \
  --region $REGION

# Wait for service to be stable
aws ecs wait services-stable --cluster $ENVIRONMENT-esg-pathfinder --services $ENVIRONMENT-esg-pathfinder --region $REGION

echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Details:"
echo "Load Balancer DNS: $LOAD_BALANCER_DNS"
echo "Database Endpoint: $DATABASE_ENDPOINT"
echo "Redis Endpoint: $REDIS_ENDPOINT"
echo "S3 Bucket: $S3_BUCKET"
echo ""
echo "🌐 Application URL: http://$LOAD_BALANCER_DNS"
echo ""
echo "🔧 Next Steps:"
echo "1. Configure your domain to point to: $LOAD_BALANCER_DNS"
echo "2. Set up SSL certificate using AWS Certificate Manager"
echo "3. Update Route 53 to point your domain to the Load Balancer"
echo "4. Run database migrations and seed data:"
echo "   aws ecs execute-command --cluster $ENVIRONMENT-esg-pathfinder --task \$TASK_ID --container esg-pathfinder-app --command 'bun run db:migrate' --interactive"
echo "   aws ecs execute-command --cluster $ENVIRONMENT-esg-pathfinder --task \$TASK_ID --container esg-pathfinder-app --command 'npx tsx seed-admin.ts' --interactive"