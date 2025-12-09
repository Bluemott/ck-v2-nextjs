# Manual AWS Console Steps for Security & Cost Optimization

## ✅ DEPLOYMENT COMPLETED SUCCESSFULLY (2025-12-09)

All security and cost optimization changes have been successfully deployed via CDK.

### Verified Changes:

| Change                | Status      | Details                                             |
| --------------------- | ----------- | --------------------------------------------------- |
| WAF Protection        | ✅ Complete | `wordpress-api-gateway-waf` attached to API Gateway |
| Lambda KMS Encryption | ✅ Complete | Key ID: `76f2bce6-e8ad-4b77-93ae-2fa9288c4c8a`      |
| Dead Letter Queue     | ✅ Complete | `wordpress-recommendations-dlq`                     |
| Lambda Memory         | ✅ Complete | Reduced from 1024 MB → 512 MB                       |
| IAM Least Privilege   | ✅ Complete | Specific ARNs instead of wildcards                  |
| CloudFront Cleanup    | ✅ Complete | CDK distribution removed                            |
| Explicit Log Group    | ✅ Complete | `/aws/lambda/WordPressBlogStack-Recommendations`    |

---

## Remaining Manual Steps (If Applicable)

### Step 1: Delete Orphaned CloudFront Distributions (User confirmed done)

**Status:** ✅ User confirmed deletion completed

**Distributions that were deleted:**

1. `E124STFCH09I2M` (`d3bf281640bw2h.cloudfront.net`) - CDK-managed
2. `ESC0JXOXVWX4J` (`de50aw3pomaxw.cloudfront.net`) - Admin distribution

---

### Step 2: Verify WAF is Attached to API Gateway

**Status:** ✅ VERIFIED via AWS CLI

1. Go to **AWS Console** → **WAF & Shield** → **Web ACLs** (Region: us-east-1)
2. Verify `wordpress-api-gateway-waf` exists
3. Click on it → **Associated AWS resources** tab
4. Should show the API Gateway stage

---

### Step 3: Verify Lambda Environment Encryption

**Status:** ✅ VERIFIED via AWS CLI

1. Go to **AWS Console** → **Lambda** → **Functions**
2. Find function: `WordPressBlogStack-WordPressRecommendations4FAF177-5H0U3w15juaB`
3. Click **Configuration** tab → **Environment variables**
4. Verify **Encryption configuration** shows KMS key

---

### Step 4: Verify Dead Letter Queue

**Status:** ✅ VERIFIED via AWS CLI

1. Go to **AWS Console** → **Lambda** → **Functions**
2. Find function: `WordPressBlogStack-WordPressRecommendations4FAF177-5H0U3w15juaB`
3. Click **Configuration** tab → **Asynchronous invocation**
4. Verify DLQ shows: `wordpress-recommendations-dlq`

---

### Step 5: Test Recommendations API

**Status:** ✅ VERIFIED - API is responding correctly

Test command:

```bash
curl -X POST https://0xde6p9ls2.execute-api.us-east-1.amazonaws.com/prod/recommendations \
  -H "Content-Type: application/json" \
  -H "Origin: https://cowboykimono.com" \
  -d '{"postId": 1}'
```

---

### Step 6: Monitor CloudWatch Alarms

1. Go to **AWS Console** → **CloudWatch** → **Alarms**
2. Verify these alarms exist:
   - `WordPressBlogStack-lambda-errors`
   - `WordPressBlogStack-lambda-duration`
   - `WordPressBlogStack-lambda-throttles`
   - `WordPressBlogStack-lambda-dlq` (new)

---

## Summary Checklist

- [x] Both CloudFront distributions deleted
- [x] CDK-managed CloudFront removed from stack
- [x] WAF attached to API Gateway
- [x] Lambda environment variables encrypted with KMS
- [x] DLQ configured for Lambda
- [x] Lambda memory optimized (512 MB)
- [x] IAM policies use specific ARNs (least privilege)
- [x] Recommendations API tested and working
- [x] CloudWatch alarms configured

---

## Cost & Security Summary

### Security Improvements:

- ✅ WAF protection against common web attacks (SQL injection, XSS, etc.)
- ✅ KMS encryption for Lambda environment variables
- ✅ Dead Letter Queue for error tracking
- ✅ IAM least privilege (no wildcard resources)
- ✅ Explicit log group with retention policy

### Cost Impact:

| Item                                  | Monthly Change               |
| ------------------------------------- | ---------------------------- |
| CloudFront distributions (2) removed  | -$1-2 savings                |
| Lambda memory optimization (1024→512) | -$5-10 savings               |
| WAF (API Gateway)                     | +$5-10 cost                  |
| KMS Key                               | +$1 cost                     |
| DLQ (SQS)                             | +$0.40 cost                  |
| **Net Change**                        | **Approximately break-even** |

**Result:** Significantly improved security posture with minimal cost impact.

---

## Technical Notes

### Circular Dependency Fix

The original deployment failed due to a circular dependency caused by the deprecated `logRetention` property on Lambda. The fix was to:

1. Create an explicit `logs.LogGroup` before the Lambda function
2. Use the `logGroup` property instead of `logRetention`
3. Reference the log group ARN directly in IAM policies

This is documented in AWS CDK best practices: https://constructs.dev/packages/aws-cdk-lib/v/2.232.1/api/FunctionOptions?lang=typescript&submodule=aws_lambda
