# AWS Deployment Guide

## 🚀 Deploy to AWS

This branch includes complete AWS infrastructure setup using CloudFormation, ECS, and related services.

### Prerequisites
- AWS CLI installed and configured
- Docker installed
- AWS account with appropriate permissions
- Domain name (optional, for custom domain)

### Architecture Overview

#### AWS Services Used
- **VPC** - Isolated network environment
- **ECS Fargate** - Container orchestration
- **RDS PostgreSQL** - Managed database
- **ElastiCache Redis** - In-memory caching
- **Application Load Balancer** - Traffic distribution
- **S3** - Static asset storage
- **CloudWatch** - Logging and monitoring
- **CloudFormation** - Infrastructure as Code

#### Infrastructure Components
- **VPC** with public and private subnets
- **Application Load Balancer** with SSL termination
- **ECS Fargate** service for auto-scaling
- **RDS PostgreSQL** with encryption and backups
- **ElastiCache Redis** for session storage
- **S3 bucket** for file uploads and static assets

### Step 1: Configure AWS CLI
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (us-east-1)
# Enter default output format (json)
```

### Step 2: Deploy Infrastructure
```bash
# Make deployment script executable
chmod +x deploy-aws.sh

# Deploy to AWS (production environment)
./deploy-aws.sh production us-east-1 esg-pathfinder.com

# Or deploy to staging
./deploy-aws.sh staging us-east-1 staging.esg-pathfinder.com
```

### Step 3: Manual Deployment Steps

#### 3.1 Build and Push Docker Image
```bash
# Set environment variables
export ENVIRONMENT=production
export REGION=us-east-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Build Docker image
docker build -t $ENVIRONMENT-esg-pathfinder:latest .

# Create ECR repository
aws ecr create-repository --repository-name $ENVIRONMENT-esg-pathfinder --region $REGION

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Tag and push image
docker tag $ENVIRONMENT-esg-pathfinder:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ENVIRONMENT-esg-pathfinder:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ENVIRONMENT-esg-pathfinder:latest
```

#### 3.2 Deploy CloudFormation Stack
```bash
# Deploy infrastructure
aws cloudformation deploy \
  --template-file cloudformation.yml \
  --stack-name production-esg-pathfinder \
  --parameter-overrides \
    Environment=production \
    DomainName=esg-pathfinder.com \
    DatabasePassword=YourSecurePassword123 \
    NextAuthSecret=YourVerySecureSecretKey32CharsLong \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### 3.3 Configure Database
```bash
# Get database endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name production-esg-pathfinder --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text --region us-east-1)

# Connect to database and run migrations
# (You'll need to bastion host or ECS exec for this)
```

### Step 4: Domain and SSL Setup

#### 4.1 Route 53 Configuration
```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone --name esg-pathfinder.com --caller-reference $(date +%s)

# Get Load Balancer DNS name
ALB_DNS=$(aws cloudformation describe-stacks --stack-name production-esg-pathfinder --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text --region us-east-1)

# Create A record
aws route53 change-resource-record-sets --hosted-zone-id YOUR_HOSTED_ZONE_ID --change-batch '{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "esg-pathfinder.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "'$ALB_DNS'",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}'
```

#### 4.2 SSL Certificate
```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name esg-pathfinder.com \
  --subject-alternative-names www.esg-pathfinder.com \
  --validation-method DNS

# Update CloudFormation to use HTTPS
# (Add certificate ARN to listener configuration)
```

### Step 5: Monitoring and Logging

#### CloudWatch Metrics
```bash
# View ECS service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=production-esg-pathfinder \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average
```

#### View Logs
```bash
# View ECS task logs
aws logs tail /ecs/production-esg-pathfinder --follow --region us-east-1

# View specific log stream
aws logs get-log-events --log-group-name /ecs/production-esg-pathfinder --log-stream-name ecs/production-esg-pathfinder/esg-pathfinder-app/STREAM_ID --region us-east-1
```

### Step 6: Database Management

#### Connect to Database
```bash
# Create bastion host for database access
# Or use AWS Systems Manager Session Manager

# Connect using psql
psql -h $DB_ENDPOINT -U postgres -d esgpathfinder
```

#### Database Backups
```bash
# Create manual backup
aws rds create-db-snapshot \
  --db-instance-identifier production-esg-pathfinder-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots --db-instance-identifier production-esg-pathfinder-db
```

### Step 7: Scaling and Performance

#### Auto Scaling
```bash
# Update service to enable auto scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/production-esg-pathfinder/production-esg-pathfinder \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/production-esg-pathfinder/production-esg-pathfinder \
  --policy-name esg-pathfinder-scale-out \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

### Security Considerations

#### Security Groups
- Application tier only accepts traffic from ALB
- Database tier only accepts traffic from application
- ALB accepts HTTP/HTTPS from anywhere

#### IAM Roles
- ECS Task Role with least privilege
- ECS Execution Role for pulling images and logging
- Separate roles for different services

#### Encryption
- RDS encryption at rest
- ElastiCache encryption in transit and at rest
- S3 bucket encryption
- SSL/TLS for all traffic

### Cost Optimization

#### Resource Sizing
- Use t3.micro for development/staging
- Use right-sizing for production based on metrics
- Enable Graviton instances for cost savings

#### Savings Plans
```bash
# Create compute savings plan
aws ce create-savings-plan \
  --savings-plan-offering-id "savings-plan-id" \
  --commitment "USD" "10.0" "MONTHLY" \
  --upfront-payment "PARTIAL" \
  --purchase-term "1Y" \
  --plan-type "COMPUTE"
```

### Troubleshooting

#### Common Issues
1. **ECS Service Not Starting**: Check task definition and security groups
2. **Database Connection Failed**: Verify security group rules and passwords
3. **Load Balancer Health Checks**: Ensure health check path is accessible
4. **SSL Certificate**: Validate domain ownership and DNS configuration

#### Debug Commands
```bash
# Describe ECS service
aws ecs describe-services --cluster production-esg-pathfinder --services production-esg-pathfinder

# Describe ECS tasks
aws ecs describe-tasks --cluster production-esg-pathfinder --tasks TASK_ID

# Get CloudFormation events
aws cloudformation describe-stack-events --stack-name production-esg-pathfinder

# Check Load Balancer logs
aws elbv2 describe-load-balancers --names production-esg-pathfinder-alb
```

## 🎯 Quick Deployment Commands
```bash
# One-command deployment
./deploy-aws.sh production us-east-1 esg-pathfinder.com

# Monitor deployment
aws cloudformation describe-stacks --stack-name production-esg-pathfinder

# Access application
open http://$(aws cloudformation describe-stacks --stack-name production-esg-pathfinder --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text)
```

## 📊 Estimated Costs (Monthly)

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| ECS Fargate | 2 tasks, 0.5 vCPU, 1GB RAM | $40-60 |
| RDS PostgreSQL | db.t3.micro, 20GB storage | $15-20 |
| ElastiCache Redis | cache.t3.micro | $10-15 |
| ALB | Application Load Balancer | $25-30 |
| S3 | 50GB storage | $1-2 |
| Data Transfer | 100GB outbound | $9-12 |
| **Total** | | **$100-140** |

*Prices are estimates and vary by region and usage*