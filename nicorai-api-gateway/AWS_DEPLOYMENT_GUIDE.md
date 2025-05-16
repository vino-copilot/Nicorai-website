# AWS Elastic Beanstalk Deployment Guide

## Prerequisites
- AWS Account
- AWS CLI installed and configured
- EB CLI (Elastic Beanstalk Command Line Interface) installed

## Installation Steps

### 1. Install AWS CLI & EB CLI
```bash
# Install AWS CLI
pip install awscli
aws configure  # Enter your AWS credentials

# Install EB CLI
pip install awsebcli
```

### 2. Initialize Elastic Beanstalk application

Navigate to your project directory and run:
```bash
cd nicorai-api-gateway
eb init
```

Follow the prompts:
- Select region
- Create new application (or select existing)
- Select Node.js platform
- Set up SSH for instance access (optional)

### 3. Create environment and deploy

```bash
eb create nicorai-api-prod
```

### 4. Configure environment variables

Set the environment variables needed for your application:
```bash
eb setenv PORT=4000 REDIS_URL=your-redis-url N8N_WEBHOOK_URL=your-n8n-webhook-url
```

### 5. For future deployments

After making changes to your code:
```bash
eb deploy
```

### 6. Open the deployed application

```bash
eb open
```

### 7. View logs

```bash
eb logs
```

### 8. Terminate environment when no longer needed

```bash
eb terminate nicorai-api-prod
```

## Additional AWS Services You Might Need

### Amazon ElastiCache (for Redis)
Since your application uses Redis, you'll need to set up ElastiCache:
1. Create a Redis cluster in the same VPC as your Elastic Beanstalk environment
2. Configure security groups to allow access from your EB environment
3. Use the Redis endpoint in your REDIS_URL environment variable

### Amazon RDS (if you need a database)
If you need a database:
1. Create an RDS instance in the same VPC
2. Configure security groups
3. Add the database connection string as an environment variable

### Amazon Route 53 & ACM (for custom domain with HTTPS)
For a custom domain with HTTPS:
1. Register domain or configure existing domain in Route 53
2. Request SSL certificate from ACM
3. Configure HTTPS listener in Elastic Beanstalk environment

## Monitoring and Logging
- Set up CloudWatch for monitoring
- Configure CloudWatch Alarms for critical metrics
- Enable enhanced health reporting in Elastic Beanstalk
