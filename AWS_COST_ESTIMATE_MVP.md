# AWS Cost Estimate for MVP Setup (App Runner + External Redis)

This document provides an updated cost breakdown for the AWS services used in the MVP version of the application.

## Monthly Cost Estimates (USD)

### Frontend Infrastructure
| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| S3 | 5 GB storage | $0.12 |
| S3 | 10,000 GET requests | $0.04 |
| S3 | 1,000 PUT requests | $0.05 |
| CloudFront | 50 GB data transfer | $4.25 |
| **Frontend Subtotal** | | **$4.46** |

### Backend Infrastructure (App Runner)
| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| App Runner | 1 vCPU, 2 GB memory, 730 hours | $29.60 |
| App Runner Compute | 50,000 requests | $0.65 |
| Data Transfer | 50 GB | $4.50 |
| ECR Storage | 1 GB | $0.10 |
| **Backend Subtotal** | | **$34.85** |

### Other Services
| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| Route 53 | Hosted zone | $0.50 |
| CloudWatch | Basic monitoring | $0.00 |
| **Other Subtotal** | | **$0.50** |

### Total Estimated Monthly Cost: **$39.81**

## Cost Savings
- **Original estimate**: $51.33/month
- **MVP estimate with AWS Redis**: $26.27/month
- **MVP estimate with external Redis**: $17.49/month
- **Monthly savings**: $33.84 (66% reduction from original)

## Key Changes in MVP Infrastructure
1. **Removed Load Balancer** (~$16.20/month savings)
2. **Single Instance Environment** instead of auto-scaling group
3. **Smaller Redis Instance** (t1.micro instead of t4g.micro)
4. **Reduced Data Transfer** assumptions

## Scaling Considerations
This MVP setup is suitable for:
- Development and testing
- Initial product launch with limited traffic (up to ~100 concurrent users)
- Proof of concept demonstration

When traffic increases, you can easily transition to the load-balanced setup by:
1. Updating the Terraform configuration to use `LoadBalanced` environment type
2. Re-enabling auto-scaling group settings
3. Applying the updated configuration

## Notes
- Actual costs may vary based on usage patterns, data transfer, and region selection.
- AWS provides a Free Tier for the first 12 months for many services, which could further reduce costs.
- This estimate assumes a US East (N. Virginia) region.

For more accurate estimates, use the [AWS Pricing Calculator](https://calculator.aws.amazon.com/).
