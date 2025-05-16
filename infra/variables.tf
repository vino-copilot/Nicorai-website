variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "frontend_bucket_name" {
  description = "The name of the S3 bucket for frontend hosting"
  type        = string
}

variable "eb_application_name" {
  description = "The name of the Elastic Beanstalk application"
  type        = string
  default     = "nicorai-api"
}

variable "eb_environment_name" {
  description = "The name of the Elastic Beanstalk environment"
  type        = string
  default     = "nicorai-api-prod"
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
