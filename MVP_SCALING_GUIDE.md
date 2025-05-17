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

When your traffic increases beyond what the current App Runner configuration can handle, follow these steps to scale:

### 1. Update Terraform Configuration

```terraform
# Update App Runner configuration for higher capacity
resource "aws_apprunner_service" "api_gateway" {
  # ...existing config...
  
  instance_configuration {
    # Increase CPU and memory
    cpu = "2 vCPU"     # From 1 vCPU
    memory = "4 GB"    # From 2 GB
    
    # Auto-scaling configuration
    auto_scaling_configurations_arn = aws_apprunner_auto_scaling_configuration_version.api_scaling.arn
  }
}

# Add auto-scaling configuration
resource "aws_apprunner_auto_scaling_configuration_version" "api_scaling" {
  auto_scaling_configuration_name = "api-scaling"
  
  max_concurrency = 100          # Maximum concurrent requests
  max_size        = 10           # Maximum instances
  min_size        = 2            # Minimum instances (was 1)
}
```

### 2. Apply the Changes

```bash
terraform apply
```

### 3. Monitor Performance

App Runner provides built-in metrics in CloudWatch that you can use to monitor:
- CPU utilization
- Memory utilization 
- Request count and latency
- HTTP errors

## Performance Considerations

The App Runner MVP setup is suitable for:
- Up to ~200 concurrent users
- Medium API request volumes (App Runner handles scaling better than a single EC2)
- Stateless API applications
- Zero-maintenance deployment needs

One of the advantages of App Runner is that it can scale automatically based on traffic, even in the MVP setup. The service will scale out when:
- CPU utilization is high
- Memory utilization is high
- Request concurrency exceeds service capacity

Unlike a single EC2 instance in Elastic Beanstalk, App Runner can handle traffic spikes more gracefully, making it a better choice for services that might see sudden increases in traffic.
