output "frontend_bucket_name" {
  description = "The name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "apprunner_service_url" {
  description = "The URL of the App Runner service"
  value       = aws_apprunner_service.api_gateway.service_url
}

# No Redis output since using external Redis service
