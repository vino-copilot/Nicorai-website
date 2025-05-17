# App Runner Migration Summary

This document summarizes the changes made to migrate from Elastic Beanstalk to App Runner for the backend API.

## Changes Made

### Infrastructure (Terraform)
- Replaced Elastic Beanstalk resources with App Runner service
- Added IAM roles for App Runner ECR access and service execution
- Updated variables and outputs to reflect App Runner settings

### CI/CD Pipeline
- Updated GitHub Actions workflows for App Runner deployment
- Added workflow for ECR repository creation
- Modified maintenance checks for App Runner health monitoring
- Updated full stack deployment workflow to use App Runner endpoints

### Docker Configuration
- Added Dockerfile for containerizing the Node.js API
- Added App Runner configuration file (apprunner.yaml)

### Documentation
- Created App Runner setup guide
- Updated scaling guide for App Runner service
- Updated cost estimates to reflect App Runner pricing
- Updated GitHub secrets documentation

## Benefits of App Runner

1. **Simplified Operations**: No need to manage EC2 instances, load balancers, or auto-scaling groups
2. **Built-in Auto-scaling**: Automatically scales based on traffic without additional configuration
3. **Faster Deployments**: Direct deployment from container images
4. **High Availability**: Managed service with built-in redundancy
5. **Simplified Security**: Managed VPC connectivity and security

## Cost Impact

The migration from Elastic Beanstalk (single instance) to App Runner has increased the monthly cost from approximately $17.49 to $39.81, but provides:

- Better scalability
- Higher availability
- Zero server management
- Automatic traffic-based scaling
- Simplified deployment process

## Next Steps

1. Run the Create ECR Repository workflow
2. Apply the updated Terraform configuration
3. Update GitHub secrets for App Runner
4. Deploy the application with the full stack workflow
