# WordPress Blog Migration to AWS
## Cost-Optimized Serverless Architecture

This project implements a cost-optimized migration from your current WordPress blog setup to a serverless AWS architecture, reducing hosting costs by 60-70% while improving performance and scalability.

## 🎯 Target Architecture

```
Frontend (Next.js) → CloudFront → API Gateway → Lambda (GraphQL) → Aurora Serverless
Static Content → S3 + CloudFront
WordPress Admin → Lightsail (admin only, can be stopped when not updating)
```

## 📊 Cost Optimization Benefits

| Component | Current Cost | Target Cost | Savings |
|-----------|-------------|-------------|---------|
| WordPress Hosting | $50-100/month | $10-20/month (Lightsail) | 70-80% |
| Database | $50-100/month | $20-40/month (Aurora Serverless) | 50-60% |
| CDN/Static | $20-50/month | $5-15/month (CloudFront) | 60-70% |
| **Total** | **$120-250/month** | **$35-75/month** | **60-70%** |

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Install AWS CDK globally
npm install -g aws-cdk

# Install project dependencies
npm install

# Configure AWS credentials
aws configure
```

### 2. Deploy Infrastructure
```bash
# Deploy AWS infrastructure
npm run deploy:infrastructure

# Deploy Lambda function
npm run deploy:lambda
```

### 3. Test the Setup
```bash
# Test GraphQL endpoint
npm run test:aws-graphql
```

## 📁 Project Structure

```
ck-v2-nextjs/
├── infrastructure/           # AWS CDK infrastructure
│   ├── bin/                 # CDK app entry point
│   ├── lib/                 # CDK stack definitions
│   └── package.json         # Infrastructure dependencies
├── lambda/                  # Lambda functions
│   └── graphql/            # GraphQL Lambda function
│       ├── index.ts        # Main Lambda handler
│       └── package.json    # Lambda dependencies
├── lambda-layers/          # Lambda layers
│   └── database/          # Database connection pooling
├── app/lib/               # Frontend libraries
│   ├── wpgraphql.ts       # Current WordPress integration
│   └── aws-graphql.ts     # New AWS GraphQL client
├── scripts/               # Migration scripts
│   └── migrate-to-aws.js  # Migration automation
└── deployment/            # Documentation
    └── migration-guide.md # Detailed migration guide
```

## 🔧 Implementation Details

### AWS Infrastructure (CDK)

The infrastructure is defined using AWS CDK with TypeScript:

- **API Gateway**: REST API with GraphQL endpoint
- **Lambda**: Serverless GraphQL function with connection pooling
- **Aurora Serverless v2**: PostgreSQL database with auto-scaling
- **CloudFront**: Global CDN for static content and API caching
- **S3**: Static content storage with lifecycle policies
- **VPC**: Isolated network with minimal NAT gateways

### Lambda Function

The GraphQL Lambda function provides:

- **Connection Pooling**: Reuses database connections across invocations
- **Cost Optimization**: 512MB memory, 30s timeout, 10 concurrent executions
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript implementation

### Frontend Integration

The frontend uses a feature flag approach for gradual migration:

```typescript
// Feature flag for gradual migration
const USE_AWS_GRAPHQL = process.env.NEXT_PUBLIC_USE_AWS_GRAPHQL === 'true';

// Conditional import based on environment
const { fetchPosts, fetchPostBySlug } = USE_AWS_GRAPHQL 
  ? await import('../lib/aws-graphql')
  : await import('../lib/wpgraphql');
```

## 🛠️ Migration Process

### Phase 1: Infrastructure Setup (Week 1)

1. **Deploy AWS Infrastructure**
   ```bash
   cd infrastructure
   npm install
   cdk deploy
   ```

2. **Database Migration**
   ```bash
   # Export current WordPress database
   mysqldump -u username -p wordpress_db > wordpress_backup.sql
   
   # Convert to PostgreSQL and import to Aurora
   pgloader mysql://user:pass@host/db postgresql://user:pass@host/db
   ```

3. **Static Content Migration**
   ```bash
   # Sync WordPress uploads to S3
   aws s3 sync /path/to/wordpress/uploads s3://your-static-bucket/uploads
   ```

### Phase 2: Lambda Deployment (Week 2)

1. **Build and Deploy Lambda**
   ```bash
   cd lambda/graphql
   npm install
   npm run build
   npm run package
   ```

2. **Test GraphQL Endpoint**
   ```bash
   curl -X POST https://your-api-gateway-url.amazonaws.com/prod/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ posts { nodes { title } } }"}'
   ```

### Phase 3: Frontend Integration (Week 3)

1. **Update Environment Variables**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_AWS_GRAPHQL_URL=https://your-api-gateway-url.amazonaws.com/prod/graphql
   NEXT_PUBLIC_USE_AWS_GRAPHQL=true
   ```

2. **Test with Feature Flags**
   - Enable AWS GraphQL in development
   - Test all blog functionality
   - Monitor performance and errors

### Phase 4: Production Deployment (Week 4)

1. **Gradual Rollout**
   - Deploy with feature flags
   - Monitor error rates and performance
   - Switch traffic gradually

2. **Validation**
   - Test all blog functionality
   - Verify SEO metadata
   - Check image loading
   - Monitor costs

## 📈 Monitoring and Optimization

### CloudWatch Dashboards

The infrastructure includes CloudWatch dashboards for:

- **Lambda Performance**: Duration, errors, concurrent executions
- **Database Metrics**: Connections, CPU, memory usage
- **API Gateway**: Request count, latency, error rates
- **Cost Monitoring**: Monthly spending alerts

### Cost Optimization Strategies

#### Lambda Optimization
- **Memory**: 512MB (balanced cost/performance)
- **Timeout**: 30 seconds maximum
- **Concurrency**: 10 concurrent executions
- **Log Retention**: 7 days

#### Aurora Serverless Optimization
- **Min Capacity**: 0.5 ACU (cost optimization)
- **Max Capacity**: 2 ACU (performance balance)
- **Backup Retention**: 7 days
- **Auto-pause**: Enabled for development

#### CloudFront Optimization
- **Price Class**: North America and Europe only
- **Cache Policy**: Optimized for content types
- **Log Retention**: 30 days

## 🔍 Troubleshooting

### Common Issues

#### 1. Lambda Cold Starts
**Solution**: Connection pooling and provisioned concurrency
```typescript
const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 2. Database Connection Limits
**Solution**: Monitor and adjust Aurora capacity
```typescript
const auroraCluster = new rds.DatabaseCluster(this, 'WordPressAurora', {
  serverlessV2MinCapacity: 0.5,
  serverlessV2MaxCapacity: 2,
});
```

#### 3. CORS Issues
**Solution**: Proper CORS configuration in API Gateway
```typescript
const api = new apigateway.RestApi(this, 'WordPressAPI', {
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'Authorization'],
  },
});
```

## 🚨 Rollback Plan

### Emergency Rollback Steps

1. **Immediate**: Switch feature flag back to WordPress API
2. **Database**: Restore from backup if needed
3. **Infrastructure**: Keep old WordPress instance running for 1 week
4. **Monitoring**: Watch error rates and performance metrics

### Rollback Triggers
- Error rate > 5%
- Response time > 3 seconds
- Cost increase > 20% above target
- User complaints about functionality

## 📋 Migration Checklist

### Pre-Migration
- [ ] AWS CDK installed and configured
- [ ] Aurora PostgreSQL cluster created
- [ ] Lambda function deployed and tested
- [ ] API Gateway configured with CORS
- [ ] CloudFront distribution set up
- [ ] S3 bucket for static content created
- [ ] WordPress database exported
- [ ] MySQL to PostgreSQL conversion completed
- [ ] Data imported to Aurora
- [ ] Database connections tested

### Post-Migration
- [ ] All blog functionality working
- [ ] Performance metrics within targets
- [ ] Cost monitoring active
- [ ] Error rates acceptable
- [ ] User feedback positive
- [ ] Lambda memory/timeout optimized
- [ ] Database capacity tuned
- [ ] CloudFront cache hit ratio > 90%
- [ ] Log retention policies applied
- [ ] Cost alerts configured

## 💰 Cost Monitoring

### Monthly Cost Targets
- **Lambda**: $10-20/month
- **Aurora Serverless**: $20-40/month
- **CloudFront**: $5-15/month
- **API Gateway**: $5-10/month
- **S3**: $2-5/month
- **Total Target**: $42-90/month

### Cost Alerts
```bash
# Set up billing alerts
aws cloudwatch put-metric-alarm \
  --alarm-name "Monthly-Cost-Alert" \
  --alarm-description "Alert when monthly costs exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold
```

## 🚀 Automation

### Migration Script

Use the automated migration script:

```bash
# Run full migration
node scripts/migrate-to-aws.js

# Dry run (preview only)
node scripts/migrate-to-aws.js --dry-run

# Run specific step
node scripts/migrate-to-aws.js --step infrastructure-setup
```

### CI/CD Integration

Add to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Deploy Infrastructure
  run: |
    cd infrastructure
    npm install
    cdk deploy --require-approval never

- name: Deploy Lambda
  run: |
    cd lambda/graphql
    npm install
    npm run build
    npm run package
```

## 📚 Additional Resources

- [Migration Guide](./deployment/migration-guide.md) - Detailed step-by-step guide
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/) - Infrastructure as code
- [Aurora Serverless v2](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html) - Database scaling
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html) - Performance optimization

## 🤝 Support

For questions or issues during migration:

1. Check the troubleshooting section above
2. Review CloudWatch logs for errors
3. Test individual components in isolation
4. Use the rollback plan if needed

This migration will significantly reduce your hosting costs while improving performance and scalability. The serverless architecture will automatically scale based on demand, and you'll only pay for what you use. 