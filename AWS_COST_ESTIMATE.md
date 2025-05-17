# AWS Infrastructure and Deployment Cost Breakdown

This document provides an estimated cost breakdown for the AWS services used in this application.

## Monthly Cost Estimates (USD)

### Frontend Infrastructure
| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| S3 | 5 GB storage | $0.12 |
| S3 | 10,000 GET requests | $0.04 |
| S3 | 1,000 PUT requests | $0.05 |
| CloudFront | 50 GB data transfer | $4.25 |
| **Frontend Subtotal** | | **$4.46** |

### Backend Infrastructure
| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| Elastic Beanstalk | t4g.micro instance | $8.03 |
| ElastiCache (Redis) | cache.t4g.micro | $13.14 |
| Load Balancer | Application Load Balancer | $16.20 |
| Data Transfer | 100 GB | $9.00 |
| **Backend Subtotal** | | **$46.37** |

### Other Services
| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| Route 53 | Hosted zone | $0.50 |
| CloudWatch | Basic monitoring | $0.00 |
| **Other Subtotal** | | **$0.50** |

### Total Estimated Monthly Cost: **$51.33**

## Cost Optimization Tips

1. **Use Reserved Instances**: Purchase reserved instances for Elastic Beanstalk to reduce costs by up to 75%.
2. **Scale Down During Off-Hours**: Configure automatic scaling to reduce instance count during low-traffic periods.
3. **CloudFront Cache Optimization**: Maximize cache hit ratio to reduce origin requests.
4. **Lifecycle Policies**: Set up lifecycle policies for S3 to transition older objects to cheaper storage classes.
5. **Monitoring and Alerting**: Set up CloudWatch alarms to alert on unexpected cost increases.
6. **AWS Free Tier**: Leverage free tier offerings for development and testing environments.

## Cost Calculation Assumptions
- Low to medium traffic website (5,000-10,000 visitors per month)
- Moderate API usage
- US East (N. Virginia) region pricing
- Prices as of May 2025 (subject to change)

## Notes
- Actual costs may vary based on usage patterns, data transfer, and region selection.
- This estimate does not include costs for additional services that might be added later.
- AWS provides a Free Tier for the first 12 months for many services, which could significantly reduce initial costs.

For more accurate estimates, use the [AWS Pricing Calculator](https://calculator.aws.amazon.com/).
