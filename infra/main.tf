provider "aws" {
  region = var.aws_region
}

# S3 bucket for frontend hosting
resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# CloudFront distribution for frontend
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3Origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # Handle SPA routing by redirecting all paths to index.html
  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }
}

# App Runner service for backend API using GitHub source connection
resource "aws_apprunner_service" "api_gateway" {
  service_name = var.apprunner_service_name

  source_configuration {
    auto_deployments_enabled = true
    
    code_repository {
      code_configuration {
        configuration_source = "API"
        
        code_configuration_values {
          runtime = "NODEJS_20"
          build_command = "npm ci"
          start_command = "node index.js"
          port = "4000"
          runtime_environment_variables = {
            "NODE_ENV"        = "production"
            "REDIS_URL"       = var.external_redis_url
            "N8N_WEBHOOK_URL" = var.n8n_webhook_url
          }
        }
      }
      
      repository_url = var.github_repository_url
      source_code_version {
        type = "BRANCH"
        value = var.github_branch
      }
      
      connection_arn = var.github_connection_arn
    }
  }
  
  instance_configuration {
    cpu = "1 vCPU"
    memory = "2 GB"
    instance_role_arn = aws_iam_role.apprunner_instance_role.arn
  }
  
  tags = {
    Name = "nicorai-api-gateway"
  }
}

# Using external Redis service, no AWS ElastiCache resources needed
