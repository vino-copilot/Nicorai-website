# GitHub Secrets Required for CI/CD Pipeline (MVP Version)

The following secrets need to be set in your GitHub repository settings for the cost-optimized MVP deployment:

## AWS Credentials
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: The AWS region where your resources are deployed (e.g., us-east-1)

## Frontend (S3 and CloudFront)
- `S3_BUCKET_NAME`: The name of your S3 bucket for frontend hosting
- `CLOUDFRONT_DISTRIBUTION_ID`: Your CloudFront distribution ID
- `CLOUDFRONT_DOMAIN_NAME`: The CloudFront domain name (optional, for deployment report)
- `NEXT_PUBLIC_API_URL`: URL of your API Gateway (backend)

## Backend (Elastic Beanstalk - Single Instance)
- `EB_APPLICATION_NAME`: Your Elastic Beanstalk application name (e.g., nicorai-api)
- `EB_ENVIRONMENT_NAME`: Your Elastic Beanstalk environment name (e.g., nicorai-api-prod)
- `REDIS_URL`: URL for your external Redis service
- `N8N_WEBHOOK_URL`: URL for your N8N webhook

## How to Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings"
3. Navigate to "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Add each secret with its name and value

## Obtaining Secret Values

After deploying your infrastructure with Terraform, you can get these values:

```bash
# Run this after terraform apply
terraform output

# Expected output:
# frontend_bucket_name = "nicorai-frontend"
# cloudfront_distribution_id = "E1A2B3C4D5E6F7"
# cloudfront_domain_name = "d1234abcdef.cloudfront.net"
# eb_environment_url = "nicorai-api-prod.us-east-1.elasticbeanstalk.com"
```

Note: For the `REDIS_URL` secret, use the URL from your external Redis provider.

Use these outputs to set the corresponding GitHub secrets.
