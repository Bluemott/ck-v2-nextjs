# 🚀 AWS Amplify Deployment Guide

## 🚨 Quick Fix for Current Issues

Your build is failing due to:
1. Invalid backend environment name (`dev-amplify-deployment`)
2. SSM secrets configuration issues
3. Over-complex build process

## ✅ Immediate Solutions Applied

### 1. Simplified Build Configuration
- **Updated**: `amplify.yml` with streamlined commands
- **Removed**: Complex workspace builds and error-prone steps
- **Added**: Graceful environment variable handling
- **Fixed**: TypeScript and dependency installation issues

### 2. Environment Variable Fixes
- **Updated**: `app/lib/env.ts` with comprehensive fallbacks
- **Added**: Build-time safety checks
- **Fixed**: Missing AWS GraphQL environment handling

### 3. GraphQL Adapter Improvements
- **Updated**: Build-time fallback to WordPress endpoint
- **Added**: Runtime environment detection
- **Fixed**: Missing environment variable handling

## 🔧 Deployment Steps

### Option A: Use Current Simplified Config
1. **Commit and push** the updated `amplify.yml`
2. **Set environment variables** in Amplify Console:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   NEXT_PUBLIC_WPGRAPHQL_URL=https://api.cowboykimono.com/graphql
   NEXT_PUBLIC_USE_AWS_GRAPHQL=false
   ```
3. **Redeploy** - should now build successfully

### Option B: Use Production-Ready Config (Recommended)
1. **Replace** `amplify.yml` with `amplify-production-ready.yml`:
   ```bash
   mv amplify-production-ready.yml amplify.yml
   ```
2. **Set required environment variables** in Amplify Console
3. **Deploy**

## 🛠️ Environment Variables Setup

### Required Variables (Set in Amplify Console)
```bash
# Core Settings
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_WPGRAPHQL_URL=https://api.cowboykimono.com/graphql

# Feature Flags
NEXT_PUBLIC_USE_AWS_GRAPHQL=false  # Start with WordPress

# Analytics (Optional)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### AWS Integration Variables (Add Later)
```bash
# AWS Services
NEXT_PUBLIC_AWS_GRAPHQL_URL=https://your-api-gateway-url
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# Database (for AWS GraphQL)
DB_HOST=your-rds-endpoint
DB_NAME=wordpress
DB_USER=admin
DB_PASSWORD=your-password
```

## 🚀 Migration Strategy

### Phase 1: Basic Deployment (Immediate)
- ✅ Deploy with WordPress GraphQL only
- ✅ Verify site functionality
- ✅ Test all pages and features

### Phase 2: AWS Integration (Later)
- 🔄 Set up AWS infrastructure
- 🔄 Configure Lambda functions
- 🔄 Test AWS GraphQL endpoint
- 🔄 Switch `NEXT_PUBLIC_USE_AWS_GRAPHQL=true`

## 🔍 Troubleshooting

### Build Failures
1. **Check Node version**: Ensure Node.js 18+ in Amplify
2. **Review logs**: Focus on dependency installation
3. **Environment variables**: Verify all required vars are set
4. **Clear cache**: Delete build cache in Amplify console

### Runtime Issues
1. **GraphQL errors**: Check endpoint URLs and CORS
2. **Image loading**: Verify image optimization settings
3. **404 errors**: Check Next.js routing configuration

## 📋 Checklist

### Before Deployment
- [ ] Update `amplify.yml` with simplified configuration
- [ ] Set required environment variables in Amplify Console
- [ ] Test build locally with `npm run build`
- [ ] Verify GraphQL endpoints are accessible

### After Deployment
- [ ] Test homepage loading
- [ ] Verify blog posts display correctly
- [ ] Check image optimization
- [ ] Test navigation and routing
- [ ] Verify analytics integration

### AWS Integration (Phase 2)
- [ ] Deploy CDK infrastructure
- [ ] Configure Lambda functions
- [ ] Set up database connections
- [ ] Test AWS GraphQL endpoint
- [ ] Switch to AWS GraphQL gradually

## 🎯 Next Steps

1. **Immediate**: Deploy with current fixes
2. **Short-term**: Monitor performance and errors
3. **Long-term**: Gradually migrate to AWS services

This approach minimizes risk while ensuring a working deployment.