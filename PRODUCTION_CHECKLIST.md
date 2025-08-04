# Production Deployment Checklist

## Pre-Deployment Tasks

### ✅ Code Cleanup
- [x] Removed duplicate API files (`api-rest.ts` → `api.ts`)
- [x] Removed test directories (`test-*`)
- [x] Updated all API route imports to use consolidated `api.ts`
- [x] Removed GraphQL references from infrastructure
- [x] Added recommendations Lambda to infrastructure

### ✅ Environment Configuration
- [x] Updated `env.ts` with production-ready validation
- [x] Added proper environment variable schemas
- [x] Added environment validation helpers
- [x] Configured security and performance settings
- [x] Updated for Lightsail-based WordPress architecture

### ✅ Infrastructure Updates
- [x] Updated AWS CDK stack to remove Aurora/S3 dependencies
- [x] Simplified for Lightsail-based architecture
- [x] Updated API Gateway configuration
- [x] Added proper security groups and IAM policies

## Production Environment Setup

### Environment Variables Required
```bash
# WordPress Configuration (Lightsail-based)
NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com

# Application Configuration
NEXT_PUBLIC_APP_URL=https://cowboykimono.com
NODE_ENV=production

# WordPress URLs (Lightsail-based)
WORDPRESS_URL=https://cowboykimono.com
WORDPRESS_API_URL=https://api.cowboykimono.com

# CloudFront Configuration (for media delivery)
NEXT_PUBLIC_CLOUDFRONT_URL=https://d36tlab2rh5hc6.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=d36tlab2rh5hc6

# AWS Configuration (for Lambda functions only)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id
NEXT_PUBLIC_GTM_ID=your-gtm-id

# Security
NEXT_PUBLIC_SITE_VERIFICATION=your-verification-code

# API Configuration
API_RATE_LIMIT=100
API_TIMEOUT=10000
```

## Architecture Overview

### Current Architecture (Lightsail-based)
- **Frontend**: Next.js 15.3.4 on AWS Amplify
- **Backend**: WordPress on AWS Lightsail (headless CMS via REST API)
- **Database**: MySQL on Lightsail (managed by WordPress)
- **Media**: WordPress media files on Lightsail
- **CDN**: CloudFront for media delivery
- **Serverless**: Lambda functions for recommendations
- **Storage**: No S3 buckets (media stored on Lightsail)

### Legacy Architecture (Deprecated)
- ~~Aurora Serverless for database~~
- ~~S3 buckets for media storage~~
- ~~Complex VPC setup~~

## Testing Checklist

### API Endpoint Testing
Run the production API test script:
```bash
node scripts/test-production-apis.js
```

Expected results:
- [ ] All Next.js API routes return 200 status
- [ ] All WordPress REST API endpoints return 200 status
- [ ] Response times under 3 seconds
- [ ] Valid JSON responses
- [ ] Proper CORS headers

### Manual Testing
- [ ] Homepage loads correctly
- [ ] Blog posts display properly
- [ ] Search functionality works
- [ ] Categories and tags work
- [ ] Media/images load correctly (from Lightsail)
- [ ] Admin redirect works
- [ ] Downloads page works
- [ ] Shop page works

### Performance Testing
- [ ] Page load times under 3 seconds
- [ ] Image optimization working
- [ ] CloudFront caching working
- [ ] API response times acceptable

## Security Checklist

### Environment Security
- [ ] All sensitive data in environment variables
- [ ] No hardcoded passwords in code
- [ ] Lightsail credentials secured
- [ ] AWS credentials properly configured

### API Security
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation working
- [ ] Error messages don't expose sensitive data

### Infrastructure Security
- [ ] Lightsail instance properly secured
- [ ] CloudFront distribution secure
- [ ] IAM roles minimal permissions
- [ ] SSL/TLS enabled everywhere

## Monitoring Setup

### AWS CloudWatch
- [ ] Lambda function logs enabled
- [ ] API Gateway metrics enabled
- [ ] CloudFront metrics enabled

### Application Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Health checks implemented
- [ ] Log aggregation working

## Deployment Steps

### 1. Environment Setup
```bash
# Set production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_APP_URL=https://cowboykimono.com
export NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com
export WORDPRESS_URL=https://cowboykimono.com
export WORDPRESS_API_URL=https://api.cowboykimono.com
```

### 2. Infrastructure Deployment
```bash
cd infrastructure
npm install
npm run build
cdk deploy --require-approval never
```

### 3. Application Deployment
```bash
# Build the application
npm run build

# Deploy to AWS Amplify
# (Configure Amplify console for automatic deployments)
```

### 4. Verification
```bash
# Run production tests
node scripts/test-production-apis.js

# Check all endpoints
curl https://cowboykimono.com/api/health
curl https://cowboykimono.com/api/posts
```

## Post-Deployment Tasks

### Monitoring
- [ ] Set up CloudWatch alarms
- [ ] Configure error notifications
- [ ] Monitor performance metrics
- [ ] Set up log analysis

### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Update README with production info

### Backup Strategy
- [ ] Configure Lightsail snapshots
- [ ] Set up WordPress database backups
- [ ] Test restore procedures
- [ ] Document disaster recovery

## Rollback Plan

### Quick Rollback
1. Revert to previous Amplify deployment
2. Rollback infrastructure changes if needed
3. Restore Lightsail snapshot if necessary

### Emergency Contacts
- AWS Support: [Contact Info]
- WordPress Admin: [Contact Info]
- Development Team: [Contact Info]

## Performance Optimization

### CDN Configuration
- [ ] CloudFront distribution optimized
- [ ] Cache policies configured
- [ ] Origin failover configured
- [ ] Edge locations selected

### Lightsail Optimization
- [ ] WordPress performance optimized
- [ ] Database queries optimized
- [ ] Media compression enabled
- [ ] Caching strategies implemented

### Application Optimization
- [ ] Image optimization enabled
- [ ] Code splitting implemented
- [ ] Bundle size optimized
- [ ] Caching strategies implemented

## Final Verification

### Before Going Live
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested
- [ ] Rollback plan documented
- [ ] Team notified of deployment

### Post-Launch Monitoring
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Watch for security issues
- [ ] Monitor user feedback
- [ ] Check analytics data

## Success Criteria

### Technical Success
- [ ] All API endpoints return 200 status
- [ ] Page load times under 3 seconds
- [ ] Zero critical errors in logs
- [ ] All functionality working correctly

### Business Success
- [ ] Site accessible to users
- [ ] Content displaying correctly
- [ ] Search functionality working
- [ ] Admin access working
- [ ] Downloads accessible

### Operational Success
- [ ] Monitoring alerts configured
- [ ] Backup procedures working
- [ ] Team can manage the system
- [ ] Documentation complete
- [ ] Support processes in place 