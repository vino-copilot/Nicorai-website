variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "frontend_bucket_name" {
  description = "The name of the S3 bucket for frontend hosting"
  type        = string
}

variable "apprunner_service_name" {
  description = "The name of the App Runner service"
  type        = string
  default     = "nicorai-api-gateway"
}

variable "github_repository_url" {
  description = "The URL of the GitHub repository"
  type        = string
  default     = "https://github.com/yourusername/nicorai"
}

variable "github_branch" {
  description = "The branch to deploy from"
  type        = string
  default     = "main"
}

variable "github_connection_arn" {
  description = "The ARN of the GitHub connection in AWS"
  type        = string
}

variable "n8n_webhook_url" {
  description = "URL of the N8N webhook"
  type        = string
  default     = "https://n8n.srv810314.hstgr.cloud/webhook/chat"
}

variable "subnet_ids" {
  description = "The subnet IDs for resources that need subnet placement"
  type        = list(string)
}

variable "vpc_id" {
  description = "The VPC ID for the security groups"
  type        = string
}

variable "external_redis_url" {
  description = "URL of the external Redis service"
  type        = string
}
