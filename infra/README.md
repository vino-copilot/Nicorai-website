# AWS Infrastructure Terraform Template

This directory contains Terraform templates that can be used to provision the AWS infrastructure required for this application.

## Infrastructure Components

- S3 bucket for static website hosting
- CloudFront distribution for CDN
- Elastic Beanstalk for API Gateway
- ElastiCache for Redis
- IAM roles and policies

## How to Use

1. Install Terraform
2. Update the variables in `variables.tf`
3. Run `terraform init`
4. Run `terraform plan`
5. Run `terraform apply`

## Important Notes

- Remember to destroy resources when not needed to avoid unnecessary costs
- Store state files securely, as they may contain sensitive information
