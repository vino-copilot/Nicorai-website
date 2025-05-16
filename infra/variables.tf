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
  description = "The subnet IDs for the ElastiCache Redis instance"
  type        = list(string)
}

variable "vpc_id" {
  description = "The VPC ID for the security groups"
  type        = string
}
