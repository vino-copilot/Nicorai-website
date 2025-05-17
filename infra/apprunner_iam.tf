# IAM roles for App Runner
# No ECR access role needed when using GitHub source connection

resource "aws_iam_role" "apprunner_instance_role" {
  name = "AppRunnerInstanceRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })
}

resource "aws_iam_role_policy" "apprunner_instance_policy" {
  name = "AppRunnerInstancePolicy"
  role = aws_iam_role.apprunner_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })
}
