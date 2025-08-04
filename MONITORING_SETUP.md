# Monitoring & Logging Architecture Setup Guide

## Overview

This guide covers the implementation of a comprehensive monitoring and logging architecture for your Next.js + WordPress REST API setup, following AWS best practices.

## Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING & LOGGING LAYER                   │
├─────────────────────────────────────────────────────────────────┤
│  CloudWatch Dashboard │ X-Ray Tracing │ Cost Explorer │ Alarms  │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│ Next.js (Amplify) → CloudFront → API Gateway → WordPress (Lightsail) │
│        ↓                ↓            ↓              ↓           │
│    RUM Monitoring   Edge Logs   Lambda Logs    Server Logs     │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js 18+** and npm/yarn installed
3. **AWS CDK** installed globally: `npm install -g aws-cdk`
4. **Existing WordPress stack** deployed

## Installation Steps

### 1. Install Dependencies

```bash
# Install AWS SDK packages
npm install @aws-sdk/client-cloudwatch @aws-sdk/client-xray @aws-sdk/client-cloudwatch-logs

# Install monitoring utilities
npm install --save-dev @types/node
```

### 2. Environment Configuration

Add these environment variables to your `.env.local`:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring Configuration
NEXT_PUBLIC_ENABLE_MONITORING=true
NEXT_PUBLIC_ENABLE_XRAY=true
NEXT_PUBLIC_LOG_GROUP_NAME=/aws/wordpress/application

# WordPress API
NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com

# CloudFront Distribution ID (replace with your actual ID)
NEXT_PUBLIC_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC

# Aurora Cluster Name (replace with your actual cluster name)
NEXT_PUBLIC_AURORA_CLUSTER_NAME=WordPressAurora
```

### 3. Deploy Monitoring Infrastructure

```bash
# Navigate to infrastructure directory
cd infrastructure

# Install CDK dependencies
npm install

# Bootstrap CDK (if not already done)
cdk bootstrap

# Deploy monitoring stack
cdk deploy WordPressMonitoringStack
```

### 4. Configure CloudWatch Alarms

The monitoring stack creates several alarms automatically:

- **High Error Rate**: Triggers when 5XX errors exceed 10 in 5 minutes
- **High Latency**: Triggers when API latency exceeds 5 seconds
- **Database CPU**: Triggers when Aurora CPU exceeds 80%
- **Lambda Errors**: Triggers when Lambda errors exceed 5 in 5 minutes

To configure email notifications:

```typescript
// In infrastructure/lib/monitoring-stack.ts
// Uncomment and update the email subscription
alarmTopic.addSubscription(new subscriptions.EmailSubscription('your-email@example.com'));
```

### 5. Set Up X-Ray Tracing

X-Ray tracing is automatically enabled for production environments. To view traces:

1. Go to AWS X-Ray console
2. Navigate to "Service map" or "Traces"
3. Filter by service name "WordPress-Application"

### 6. Configure Cost Monitoring

The monitoring stack includes cost metrics. To enable detailed cost tracking:

1. Go to AWS Cost Explorer
2. Enable cost allocation tags
3. Tag your resources with:
   - `Project=CowboyKimono`
   - `Environment=production`
   - `Component=Monitoring`

## Usage Examples

### 1. Basic Monitoring

```typescript
import { monitoring } from '@/lib/monitoring';

// Log application events
await monitoring.info('User logged in', { userId: '123', timestamp: new Date() });

// Record custom metrics
await monitoring.putMetric({
  namespace: 'WordPress/Custom',
  metricName: 'UserAction',
  value: 1,
  unit: 'Count',
  dimensions: { Action: 'login', Environment: 'production' }
});
```

### 2. Performance Monitoring

```typescript
import { monitoring } from '@/lib/monitoring';

// Monitor function performance
const result = await monitoring.measurePerformance('database-query', async () => {
  return await database.query('SELECT * FROM posts');
});
```

### 3. Cache Integration

```typescript
import { WordPressCache } from '@/lib/cache';

// Get cached posts
const posts = await WordPressCache.getPosts(1, 10);

// Invalidate cache when content changes
await WordPressCache.invalidatePostCache('my-post-slug');
```

### 4. API Route Monitoring

```typescript
// In your API routes
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Your API logic here
    const result = await fetchData();
    
    // Record metrics
    await monitoring.recordAPICall('/api/posts', Date.now() - startTime, 200);
    
    return NextResponse.json(result);
  } catch (error) {
    await monitoring.recordAPICall('/api/posts', Date.now() - startTime, 500);
    throw error;
  }
}
```

## Dashboard Configuration

The monitoring stack creates a comprehensive CloudWatch dashboard with:

### Application Performance
- Response time metrics
- Request count
- Error rates

### API Gateway Metrics
- 4XX and 5XX errors
- Latency
- Request count

### CloudFront Metrics
- Request count
- Cache hit rate
- Data transfer

### Database Metrics
- CPU utilization
- Connection count
- Memory usage

### Lambda Metrics
- Duration
- Error count
- Invocation count

### Cost Metrics
- Estimated charges
- Service costs breakdown

## Alerts and Notifications

### Email Alerts
Configure email notifications for critical alerts:

```typescript
// Add to monitoring stack
const emailSubscription = new subscriptions.EmailSubscription('alerts@cowboykimono.com');
alarmTopic.addSubscription(emailSubscription);
```

### Slack Integration
For Slack notifications, create a webhook and add:

```typescript
const slackSubscription = new subscriptions.UrlSubscription('https://hooks.slack.com/services/YOUR/WEBHOOK/URL');
alarmTopic.addSubscription(slackSubscription);
```

## Caching Strategy

### Memory Cache
- **Posts**: 5 minutes TTL, 1000 items max
- **Categories**: 1 hour TTL, 100 items max
- **Tags**: 1 hour TTL, 500 items max
- **Media**: 30 minutes TTL, 2000 items max
- **Search**: 10 minutes TTL, 500 items max

### Cache Invalidation
```typescript
// Invalidate specific post
await WordPressCache.invalidatePostCache('post-slug');

// Invalidate all posts
await WordPressCache.invalidatePostCache();

// Invalidate categories
await WordPressCache.invalidateCategoryCache();
```

## Performance Optimization

### 1. Reduce API Calls
- Use caching for frequently accessed data
- Implement batch requests where possible
- Use CloudFront for static content

### 2. Optimize Database Queries
- Monitor query performance with X-Ray
- Use connection pooling
- Implement query caching

### 3. CDN Optimization
- Configure proper cache headers
- Use CloudFront edge locations
- Optimize image delivery

## Troubleshooting

### Common Issues

1. **CloudWatch Logs Not Appearing**
   - Check IAM permissions
   - Verify log group exists
   - Check sequence token

2. **X-Ray Traces Missing**
   - Ensure X-Ray daemon is running
   - Check service permissions
   - Verify trace sampling

3. **Alarms Not Triggering**
   - Check alarm configuration
   - Verify metric data exists
   - Check SNS topic permissions

4. **Cache Not Working**
   - Check cache configuration
   - Verify memory usage
   - Check TTL settings

### Debug Commands

```bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /aws/wordpress

# Check X-Ray traces
aws xray get-trace-summaries --start-time $(date -d '1 hour ago' +%s) --end-time $(date +%s)

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace WordPress/API --metric-name APICallCount --start-time $(date -d '1 hour ago' --iso-8601) --end-time $(date --iso-8601) --period 300 --statistics Sum
```

## Security Considerations

1. **IAM Permissions**: Use least privilege principle
2. **Log Encryption**: Enable CloudWatch log encryption
3. **Access Control**: Restrict dashboard access
4. **Data Retention**: Configure appropriate log retention

## Cost Optimization

1. **Log Retention**: Use shorter retention for development
2. **Metric Resolution**: Use 5-minute resolution for non-critical metrics
3. **Alarm Frequency**: Avoid excessive alarm notifications
4. **X-Ray Sampling**: Use sampling for high-traffic applications

## Maintenance

### Regular Tasks
1. **Review Alarms**: Monthly review of alarm thresholds
2. **Clean Logs**: Quarterly log cleanup
3. **Update Dashboards**: Monthly dashboard updates
4. **Cost Review**: Monthly cost analysis

### Monitoring Health Checks
```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Check cache stats
curl https://your-domain.com/api/cache/stats
```

## Support

For issues or questions:
1. Check CloudWatch logs first
2. Review X-Ray traces for performance issues
3. Check alarm history in CloudWatch
4. Review cost analysis in Cost Explorer

---

**Last Updated**: January 25, 2025  
**Version**: 1.0.0  
**Status**: Production Ready 