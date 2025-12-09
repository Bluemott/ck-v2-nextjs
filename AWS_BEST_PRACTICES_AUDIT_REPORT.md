# AWS Best Practices Audit Report

**Project:** Cowboy Kimono v2 - Next.js Website  
**Audit Date:** December 9, 2025  
**Auditor:** AWS MCP Automated Audit  
**AWS Account:** 925242451851  
**Region:** us-east-1

---

## Executive Summary

This audit evaluated the AWS infrastructure for the Cowboy Kimono v2 project against AWS Well-Architected Framework best practices. The audit covered IAM, Lambda, API Gateway, CloudFront, S3, CloudWatch, security, and cost optimization.

**Overall Assessment:** The infrastructure follows many AWS best practices but has several areas for improvement, particularly in security (WAF, encryption) and IAM least privilege.

**Key Findings:**

- ✅ **Good:** Security headers, CloudWatch monitoring, cost optimizations
- ⚠️ **Needs Improvement:** IAM least privilege, WAF protection, Lambda environment variable encryption
- ❌ **Critical:** No WAF protection on CloudFront or API Gateway

---

## 1. AWS MCP Connectivity Test Results

### ✅ Test Results: PASSED

**Connectivity Tests:**

- ✅ Successfully listed 35 AWS regions
- ✅ Verified service availability in us-east-1:
  - AWS Lambda: ✅ Available
  - Amazon API Gateway: ✅ Available
  - Amazon CloudFront: ✅ Available
  - Amazon S3: ✅ Available
  - Amazon CloudWatch: ✅ Available

**Resource Discovery:**

- ✅ Lambda Functions: 4 discovered (1 primary: WordPressRecommendations)
- ✅ API Gateway: 1 REST API (WordPress REST API)
- ✅ CloudFront: 2 distributions
- ✅ S3 Buckets: 1 bucket (CloudFront logs)
- ✅ CloudWatch: 3 alarms configured

---

## 2. IAM Roles and Permissions Audit

### Current State

**Lambda Execution Role:** `WordPressBlogStack-WordPressRecommendationsServiceR-uXGPW6jHocQu`

**Attached Policies:**

- `AWSLambdaBasicExecutionRole` (AWS managed policy)

**Inline Policy:** `WordPressRecommendationsServiceRoleDefaultPolicyED5B1094`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "xray:PutTelemetryRecords",
        "xray:PutTraceSegments"
      ],
      "Resource": "*",
      "Effect": "Allow"
    }
  ]
}
```

### Findings

| Issue                                      | Severity      | Status                                 |
| ------------------------------------------ | ------------- | -------------------------------------- |
| Wildcard resource (`*`) in IAM policy      | ⚠️ **HIGH**   | ❌ Violates least privilege            |
| No resource-specific ARNs                  | ⚠️ **MEDIUM** | ❌ Should scope to specific log groups |
| Policy allows creating log groups anywhere | ⚠️ **MEDIUM** | ❌ Should restrict to specific prefix  |

### Recommendations

**Priority: HIGH**

1. **Replace wildcard resources with specific ARNs:**

   ```typescript
   // Current (BAD):
   resources: ['*'];

   // Recommended (GOOD):
   resources: [
     `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/${recommendationsLambda.functionName}:*`,
     `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/${recommendationsLambda.functionName}`,
     `arn:aws:xray:${this.region}:${this.account}:*`,
   ];
   ```

2. **Remove unnecessary permissions:**
   - `logs:CreateLogGroup` is handled automatically by Lambda
   - Consider removing if not needed for custom log groups

3. **Use IAM Access Analyzer** to generate least-privilege policies based on actual usage

**File to Update:** `infrastructure/lib/aws-cdk-stack.ts` (lines 44-55)

---

## 3. Lambda Function Best Practices Audit

### Current Configuration

**Function Name:** `WordPressBlogStack-WordPressRecommendations4FAF177-5H0U3w15juaB`

| Setting               | Value          | Status              |
| --------------------- | -------------- | ------------------- |
| Runtime               | nodejs18.x     | ✅ Latest LTS       |
| Memory                | 1024 MB        | ⚠️ May be excessive |
| Timeout               | 30 seconds     | ✅ Appropriate      |
| Tracing               | Active (X-Ray) | ✅ Enabled          |
| Log Retention         | 1 week         | ✅ Reasonable       |
| Reserved Concurrency  | 10             | ✅ Configured       |
| Environment Variables | 5 variables    | ❌ Not encrypted    |

### Findings

| Issue                               | Severity      | Status                     |
| ----------------------------------- | ------------- | -------------------------- |
| Environment variables not encrypted | ⚠️ **MEDIUM** | ❌ No KMS encryption       |
| Memory allocation may be excessive  | ⚠️ **LOW**    | ⚠️ Should be optimized     |
| No dead letter queue (DLQ)          | ⚠️ **MEDIUM** | ❌ Missing error handling  |
| No VPC configuration                | ✅ **OK**     | ✅ Not needed (public API) |

### Recommendations

**Priority: MEDIUM**

1. **Encrypt environment variables with KMS:**

   ```typescript
   const kmsKey = new kms.Key(this, 'LambdaEnvKey', {
     description: 'KMS key for Lambda environment variables',
     enableKeyRotation: true,
   });

   const recommendationsLambda = new lambda.Function(
     this,
     'WordPressRecommendations',
     {
       // ... existing config
       environmentEncryption: kmsKey,
     }
   );
   ```

2. **Optimize memory allocation:**
   - Test with lower memory (512 MB, 256 MB)
   - Use Lambda Power Tuning to find optimal memory
   - Current 1024 MB may be over-provisioned

3. **Add dead letter queue:**

   ```typescript
   const dlq = new sqs.Queue(this, 'LambdaDLQ', {
     queueName: 'wordpress-recommendations-dlq',
   });

   recommendationsLambda.configureDeadLetterQueue(dlq);
   ```

**Files to Update:**

- `infrastructure/lib/aws-cdk-stack.ts` (lines 19-41)

---

## 4. API Gateway Best Practices Audit

### Current Configuration

**API Name:** WordPress REST API  
**API ID:** 0xde6p9ls2  
**Stage:** prod

| Setting                | Value        | Status               |
| ---------------------- | ------------ | -------------------- |
| Throttling Burst Limit | 100          | ✅ Configured        |
| Throttling Rate Limit  | 50 req/sec   | ✅ Configured        |
| Logging Level          | OFF          | ✅ Cost optimization |
| Data Tracing           | Disabled     | ✅ Cost optimization |
| Metrics                | Enabled      | ✅ Good              |
| Caching                | Disabled     | ⚠️ Could be enabled  |
| WAF                    | Not attached | ❌ **CRITICAL**      |

### Findings

| Issue                 | Severity        | Status                       |
| --------------------- | --------------- | ---------------------------- |
| No WAF protection     | ❌ **CRITICAL** | ❌ Vulnerable to attacks     |
| Caching disabled      | ⚠️ **LOW**      | ⚠️ Could improve performance |
| No request validation | ⚠️ **MEDIUM**   | ❌ Missing input validation  |
| No custom authorizers | ✅ **OK**       | ✅ Not needed for public API |

### Recommendations

**Priority: CRITICAL**

1. **Attach AWS WAF to API Gateway:**

   ```typescript
   const webAcl = new wafv2.CfnWebACL(this, 'ApiGatewayWAF', {
     scope: 'REGIONAL',
     defaultAction: { allow: {} },
     rules: [
       {
         name: 'AWSManagedRulesCommonRuleSet',
         priority: 1,
         statement: {
           managedRuleGroupStatement: {
             vendorName: 'AWS',
             name: 'AWSManagedRulesCommonRuleSet',
           },
         },
         overrideAction: { none: {} },
         visibilityConfig: {
           sampledRequestsEnabled: true,
           cloudWatchMetricsEnabled: true,
           metricName: 'CommonRuleSetMetric',
         },
       },
       {
         name: 'AWSManagedRulesKnownBadInputsRuleSet',
         priority: 2,
         statement: {
           managedRuleGroupStatement: {
             vendorName: 'AWS',
             name: 'AWSManagedRulesKnownBadInputsRuleSet',
           },
         },
         overrideAction: { none: {} },
         visibilityConfig: {
           sampledRequestsEnabled: true,
           cloudWatchMetricsEnabled: true,
           metricName: 'KnownBadInputsMetric',
         },
       },
     ],
     visibilityConfig: {
       sampledRequestsEnabled: true,
       cloudWatchMetricsEnabled: true,
       metricName: 'ApiGatewayWAF',
     },
   });

   // Associate WAF with API Gateway
   new wafv2.CfnWebACLAssociation(this, 'ApiGatewayWAFAssociation', {
     resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`,
     webAclArn: webAcl.attrArn,
   });
   ```

2. **Enable caching for GET requests:**
   ```typescript
   recommendationsResource.addMethod('GET', integration, {
     methodResponses: [{ statusCode: '200' }],
     requestParameters: {
       'method.request.querystring.postId': true,
     },
   });
   ```

**Files to Update:**

- `infrastructure/lib/aws-cdk-stack.ts` (lines 58-89)

---

## 5. CloudFront Best Practices Audit

### Current Configuration

**Distribution ID:** E124STFCH09I2M  
**Status:** Deployed  
**Comment:** "Cowboy Kimono WordPress Distribution with Enhanced Security"

| Setting          | Value           | Status            |
| ---------------- | --------------- | ----------------- |
| WAF              | Not attached    | ❌ **CRITICAL**   |
| Security Headers | Configured      | ✅ Excellent      |
| Error Pages      | Configured      | ✅ Good           |
| Logging          | Enabled         | ✅ Good           |
| Price Class      | PRICE_CLASS_100 | ✅ Cost optimized |
| Origin Shield    | Configured      | ✅ Good           |

### Findings

| Issue                      | Severity        | Status                           |
| -------------------------- | --------------- | -------------------------------- |
| No WAF protection          | ❌ **CRITICAL** | ❌ Vulnerable to DDoS/attacks    |
| Security headers excellent | ✅ **GOOD**     | ✅ Comprehensive CSP, HSTS, etc. |
| Error handling configured  | ✅ **GOOD**     | ✅ Custom error pages            |

### Recommendations

**Priority: CRITICAL**

1. **Attach AWS WAF to CloudFront:**

   ```typescript
   const cloudfrontWebAcl = new wafv2.CfnWebACL(this, 'CloudFrontWAF', {
     scope: 'CLOUDFRONT',
     defaultAction: { allow: {} },
     rules: [
       {
         name: 'AWSManagedRulesCommonRuleSet',
         priority: 1,
         statement: {
           managedRuleGroupStatement: {
             vendorName: 'AWS',
             name: 'AWSManagedRulesCommonRuleSet',
           },
         },
         overrideAction: { none: {} },
         visibilityConfig: {
           sampledRequestsEnabled: true,
           cloudWatchMetricsEnabled: true,
           metricName: 'CommonRuleSetMetric',
         },
       },
       {
         name: 'AWSManagedRulesKnownBadInputsRuleSet',
         priority: 2,
         statement: {
           managedRuleGroupStatement: {
             vendorName: 'AWS',
             name: 'AWSManagedRulesKnownBadInputsRuleSet',
           },
         },
         overrideAction: { none: {} },
         visibilityConfig: {
           sampledRequestsEnabled: true,
           cloudWatchMetricsEnabled: true,
           metricName: 'KnownBadInputsMetric',
         },
       },
       {
         name: 'RateLimitRule',
         priority: 3,
         statement: {
           rateBasedStatement: {
             limit: 2000,
             aggregateKeyType: 'IP',
           },
         },
         action: { block: {} },
         visibilityConfig: {
           sampledRequestsEnabled: true,
           cloudWatchMetricsEnabled: true,
           metricName: 'RateLimitMetric',
         },
       },
     ],
     visibilityConfig: {
       sampledRequestsEnabled: true,
       cloudWatchMetricsEnabled: true,
       metricName: 'CloudFrontWAF',
     },
   });

   // Update CloudFront distribution
   cloudfrontDistribution.addPropertyOverride(
     'WebACLId',
     cloudfrontWebAcl.attrArn
   );
   ```

2. **Enable AWS Shield Advanced** (optional, for enhanced DDoS protection):
   - Provides automatic DDoS mitigation
   - Cost: ~$3,000/month
   - Recommended for production workloads with high traffic

**Files to Update:**

- `infrastructure/lib/aws-cdk-stack.ts` (lines 92-381)

---

## 6. S3 Bucket Best Practices Audit

### Current Configuration

**Bucket Name:** `wordpressblogstack-cloudfrontlogs13cb081e-ouqsysu32wx8`  
**Purpose:** CloudFront access logs

| Setting         | Value               | Status           |
| --------------- | ------------------- | ---------------- |
| Encryption      | AES256 (S3-managed) | ✅ Enabled       |
| Versioning      | Disabled            | ⚠️ Should enable |
| Public Access   | Blocked             | ✅ Excellent     |
| Lifecycle Rules | Configured          | ✅ Good          |
| Auto-delete     | Enabled             | ✅ Good          |
| MFA Delete      | Not configured      | ⚠️ Optional      |

### Findings

| Issue                           | Severity   | Status                           |
| ------------------------------- | ---------- | -------------------------------- |
| Versioning disabled             | ⚠️ **LOW** | ⚠️ Recommended for compliance    |
| S3-managed encryption (not KMS) | ⚠️ **LOW** | ⚠️ KMS provides better control   |
| No MFA delete                   | ⚠️ **LOW** | ⚠️ Optional security enhancement |

### Recommendations

**Priority: LOW**

1. **Enable versioning (optional for log buckets):**

   ```typescript
   versioned: true, // Enable if compliance requires it
   ```

2. **Use KMS encryption (optional):**
   ```typescript
   encryption: s3.BucketEncryption.KMS,
   encryptionKey: kmsKey,
   ```

**Note:** For CloudFront log buckets, S3-managed encryption is typically sufficient. Versioning is usually not needed for log buckets due to lifecycle rules.

**Files to Update:**

- `infrastructure/lib/aws-cdk-stack.ts` (lines 359-379)

---

## 7. CloudWatch Best Practices Audit

### Current Configuration

**Dashboards:**

- `CowboyKimono-production-application-metrics`
- `CowboyKimono-production-infrastructure-health`

**Alarms:**

- `WordPressBlogStack-lambda-errors` (Threshold: 1)
- `WordPressBlogStack-lambda-duration` (Threshold: 25000ms)
- `WordPressBlogStack-lambda-throttles` (Threshold: 1)

**SNS Topic:** `WordPressBlogStack-alerts`

| Setting           | Value             | Status                   |
| ----------------- | ----------------- | ------------------------ |
| Alarms Configured | 3 alarms          | ✅ Good                  |
| Dashboards        | 2 dashboards      | ✅ Good                  |
| Log Retention     | 1 week            | ✅ Reasonable            |
| SNS Notifications | Configured        | ✅ Good                  |
| Alarm States      | INSUFFICIENT_DATA | ⚠️ Normal for new alarms |

### Findings

| Issue                             | Severity    | Status                             |
| --------------------------------- | ----------- | ---------------------------------- |
| Alarms in INSUFFICIENT_DATA state | ✅ **OK**   | ✅ Normal for new/unused resources |
| Comprehensive monitoring          | ✅ **GOOD** | ✅ Good coverage                   |
| Log retention appropriate         | ✅ **GOOD** | ✅ Cost optimized                  |

### Recommendations

**Priority: LOW**

1. **Monitor alarm states** - INSUFFICIENT_DATA is normal until resources are used
2. **Consider adding API Gateway alarms:**
   ```typescript
   const apiGateway4xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
     metric: new cloudwatch.Metric({
       namespace: 'AWS/ApiGateway',
       metricName: '4XXError',
       dimensionsMap: { ApiName: api.restApiId },
     }),
     threshold: 10,
     evaluationPeriods: 2,
   });
   ```

**Files to Update:**

- `infrastructure/lib/aws-cdk-stack.ts` (lines 398-685)

---

## 8. Security Best Practices Audit

### Current State

| Security Feature              | Status         | Notes                                |
| ----------------------------- | -------------- | ------------------------------------ |
| Security Headers (CloudFront) | ✅ Excellent   | Comprehensive CSP, HSTS, etc.        |
| Input Validation (Lambda)     | ✅ Good        | Validates postId, limit              |
| CORS Configuration            | ✅ Good        | Properly configured                  |
| X-Ray Tracing                 | ✅ Enabled     | Active tracing                       |
| Encryption at Rest (S3)       | ✅ Enabled     | AES256                               |
| Encryption at Rest (Lambda)   | ⚠️ Partial     | Environment variables not encrypted  |
| WAF Protection                | ❌ Missing     | No WAF on CloudFront or API Gateway  |
| AWS Shield                    | ❌ Not enabled | Standard included, Advanced optional |
| AWS GuardDuty                 | ❓ Unknown     | Not audited                          |
| AWS Config                    | ❓ Unknown     | Not audited                          |
| Secrets Manager               | ❌ Not used    | Environment variables in plain text  |

### Findings

| Issue                               | Severity        | Status                                        |
| ----------------------------------- | --------------- | --------------------------------------------- |
| No WAF protection                   | ❌ **CRITICAL** | Vulnerable to web attacks                     |
| Environment variables not encrypted | ⚠️ **MEDIUM**   | Sensitive data exposure risk                  |
| No AWS Shield Advanced              | ⚠️ **LOW**      | Optional DDoS protection                      |
| Secrets not in Secrets Manager      | ⚠️ **MEDIUM**   | Should use Secrets Manager for sensitive data |

### Recommendations

**Priority: CRITICAL**

1. **Implement WAF** (see sections 4 and 5)
2. **Encrypt Lambda environment variables** (see section 3)
3. **Use AWS Secrets Manager for sensitive data:**

   ```typescript
   const apiKeySecret = secretsmanager.Secret.fromSecretNameV2(
     this,
     'ApiKeySecret',
     'wordpress-api-key'
   );

   recommendationsLambda.addEnvironment(
     'WORDPRESS_API_KEY',
     apiKeySecret.secretValue.unsafeUnwrap()
   );
   ```

**Priority: MEDIUM**

4. **Enable AWS GuardDuty** for threat detection
5. **Enable AWS Config** for compliance monitoring

---

## 9. Cost Optimization Audit

### Current State

| Optimization                      | Status    | Notes                     |
| --------------------------------- | --------- | ------------------------- |
| API Gateway logging disabled      | ✅ Good   | Cost savings              |
| API Gateway data tracing disabled | ✅ Good   | Cost savings              |
| CloudFront price class optimized  | ✅ Good   | PRICE_CLASS_100           |
| S3 lifecycle rules                | ✅ Good   | Auto-delete after 60 days |
| Lambda memory allocation          | ⚠️ Review | 1024 MB may be excessive  |
| CloudWatch log retention          | ✅ Good   | 1 week retention          |

### Findings

| Issue                          | Severity    | Status                                 |
| ------------------------------ | ----------- | -------------------------------------- |
| Lambda memory may be excessive | ⚠️ **LOW**  | Could reduce to 512 MB or less         |
| Good cost optimizations        | ✅ **GOOD** | Logging/tracing disabled appropriately |

### Recommendations

**Priority: LOW**

1. **Optimize Lambda memory:**
   - Use [Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning) to find optimal memory
   - Test with 256 MB, 512 MB, 768 MB
   - Current 1024 MB may be over-provisioned

2. **Monitor costs:**
   - Set up AWS Cost Explorer alerts
   - Review monthly costs for unexpected spikes

---

## 10. Prioritized Action Items

### Critical Priority (Security)

1. **Attach AWS WAF to CloudFront Distribution**
   - **Impact:** Protects against DDoS, SQL injection, XSS, and other web attacks
   - **Effort:** Medium (2-3 hours)
   - **Cost:** ~$5-10/month for WAF
   - **Files:** `infrastructure/lib/aws-cdk-stack.ts`

2. **Attach AWS WAF to API Gateway**
   - **Impact:** Protects API endpoints from attacks
   - **Effort:** Medium (2-3 hours)
   - **Cost:** ~$5-10/month for WAF
   - **Files:** `infrastructure/lib/aws-cdk-stack.ts`

### High Priority (Security & Compliance)

3. **Fix IAM Least Privilege Violations**
   - **Impact:** Reduces attack surface, improves security posture
   - **Effort:** Low (1 hour)
   - **Cost:** None
   - **Files:** `infrastructure/lib/aws-cdk-stack.ts` (lines 44-55)

4. **Encrypt Lambda Environment Variables**
   - **Impact:** Protects sensitive configuration data
   - **Effort:** Medium (2 hours)
   - **Cost:** ~$1/month for KMS key
   - **Files:** `infrastructure/lib/aws-cdk-stack.ts`

### Medium Priority (Reliability)

5. **Add Dead Letter Queue to Lambda**
   - **Impact:** Better error handling and debugging
   - **Effort:** Low (30 minutes)
   - **Cost:** Minimal (SQS charges)
   - **Files:** `infrastructure/lib/aws-cdk-stack.ts`

6. **Use AWS Secrets Manager for Sensitive Data**
   - **Impact:** Better secret management and rotation
   - **Effort:** Medium (2 hours)
   - **Cost:** ~$0.40/month per secret
   - **Files:** `infrastructure/lib/aws-cdk-stack.ts`, `lambda/recommendations/index.js`

### Low Priority (Optimization)

7. **Optimize Lambda Memory Allocation**
   - **Impact:** Cost savings (~$5-10/month)
   - **Effort:** Low (1 hour testing)
   - **Cost:** Savings
   - **Files:** `infrastructure/lib/aws-cdk-stack.ts`

8. **Enable S3 Versioning** (optional)
   - **Impact:** Compliance requirement (if applicable)
   - **Effort:** Low (5 minutes)
   - **Cost:** Storage costs for versions
   - **Files:** `infrastructure/lib/aws-cdk-stack.ts`

---

## 11. Implementation Guide

### Step 1: Add WAF Dependencies

Update `infrastructure/package.json`:

```json
{
  "dependencies": {
    "@aws-cdk/aws-wafv2": "^2.0.0"
  }
}
```

### Step 2: Update CDK Stack

Add WAF imports and configurations to `infrastructure/lib/aws-cdk-stack.ts`:

```typescript
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sqs from 'aws-cdk-lib/aws-sqs';
```

### Step 3: Deploy Changes

```bash
cd infrastructure
npm install
cdk deploy WordPressBlogStack
```

### Step 4: Verify

- Check CloudFront distribution has WAF attached
- Check API Gateway has WAF attached
- Verify Lambda environment variables are encrypted
- Test IAM permissions are scoped correctly

---

## 12. References

### AWS Documentation

- [AWS Lambda Security Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/security-dataprotection.html)
- [IAM Least Privilege Best Practices](https://docs.aws.amazon.com/wellarchitected/2023-10-03/framework/sec_permissions_least_privileges.html)
- [AWS WAF Best Practices](https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-best-practices.html)
- [CloudFront Security Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/security-best-practices.html)

### AWS Well-Architected Framework

- [Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [Cost Optimization Pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)
- [Operational Excellence Pillar](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html)

---

## 13. Summary

### Strengths ✅

1. **Excellent security headers** - Comprehensive CSP, HSTS, XSS protection
2. **Good monitoring** - CloudWatch dashboards and alarms configured
3. **Cost optimizations** - Logging/tracing disabled appropriately
4. **Proper error handling** - Custom error pages and Lambda error handling

### Critical Issues ❌

1. **No WAF protection** - CloudFront and API Gateway vulnerable to attacks
2. **IAM least privilege violations** - Wildcard resources in policies

### Recommendations Summary

- **Critical:** Implement WAF on CloudFront and API Gateway
- **High:** Fix IAM least privilege, encrypt Lambda environment variables
- **Medium:** Add DLQ, use Secrets Manager
- **Low:** Optimize Lambda memory, enable S3 versioning (optional)

**Estimated Total Implementation Time:** 8-10 hours  
**Estimated Monthly Cost Increase:** ~$15-20 (WAF + KMS)

---

**Report Generated:** December 9, 2025  
**Next Review:** March 9, 2026 (Quarterly)
