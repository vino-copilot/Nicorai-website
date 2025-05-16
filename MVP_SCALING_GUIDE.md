# MVP Infrastructure Deployment Guide

This guide explains how to deploy the cost-optimized MVP infrastructure for the NicorAI application.

## Infrastructure Overview

This MVP setup uses a simplified, cost-effective AWS architecture:

### Frontend
- S3 for static file hosting
- CloudFront for content delivery

### Backend
- Elastic Beanstalk with a single EC2 instance (no load balancer)
- Small ElastiCache Redis instance (cache.t1.micro)

## Deployment Steps

### 1. Deploy Infrastructure with Terraform

```bash
cd infra
terraform init
terraform apply
```

### 2. Set up GitHub Secrets

Add all required secrets to your GitHub repository (see GITHUB_SECRETS_SETUP.md).

### 3. Push Code to GitHub

The GitHub Actions workflows will automatically deploy your code to the infrastructure.

## Scaling Plan

When your traffic increases beyond what a single instance can handle, follow these steps to scale:

### 1. Update Terraform Configuration

```terraform
# Change from SingleInstance to LoadBalanced
setting {
  namespace = "aws:elasticbeanstalk:environment"
  name      = "EnvironmentType"
  value     = "LoadBalanced"
}

# Re-enable auto-scaling
setting {
  namespace = "aws:autoscaling:asg"
  name      = "MinSize"
  value     = "2"
}

setting {
  namespace = "aws:autoscaling:asg"
  name      = "MaxSize" 
  value     = "4"
}

# Optionally upgrade Redis
resource "aws_elasticache_cluster" "redis" {
  # Change from cache.t1.micro to cache.t4g.micro or larger
  node_type = "cache.t4g.micro"
  # ...other settings remain the same
}
```

### 2. Apply the Changes

```bash
terraform apply
```

### 3. Monitor Performance

Use CloudWatch to monitor CPU, memory, and network metrics to determine if further scaling is needed.

## Performance Considerations

The MVP setup is suitable for:
- Up to ~100 concurrent users
- Low to moderate API request volumes
- Basic Redis caching needs

Monitor these metrics closely as your user base grows to determine when to scale up.
