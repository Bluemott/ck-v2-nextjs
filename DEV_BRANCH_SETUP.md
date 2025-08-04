# Dev Branch Setup Guide - Cowboy Kimono REST API

## 🚀 **Current Status**

✅ **REST API Implementation Complete**
- All endpoints working: `/api/posts`, `/api/categories`, `/api/tags`, `/api/search`, `/api/health`, `/api/docs`
- WordPress integration: `https://api.cowboykimono.com`
- Development URL: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/`

## 🔧 **Fixed Issues**

### Buildspec YAML Error
**Problem**: Malformed YAML with unescaped `:` characters in export commands
**Solution**: Wrapped export commands in quotes in `amplify.yml`

```yaml
# Before (causing error)
- export NODE_ENV="production"

# After (fixed)
- 'export NODE_ENV="production"'
```

## 📋 **Dev Branch Workflow**

### 1. **Git Branch Management**
```bash
# Create and switch to dev branch
git checkout -b dev

# Push dev branch to remote
git push -u origin dev

# For future updates
git add .
git commit -m "Your commit message"
git push origin dev
```

### 2. **AWS Amplify Configuration**

#### **Production Branch (main)**
- Uses: `amplify.yml`
- URL: `https://cowboykimono.com`
- Environment: Production

#### **Development Branch (dev)**
- Uses: `amplify.yml` (same as production)
- URL: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/`
- Environment: Development

### 3. **Environment Variables**

#### **Required for Build**
```bash
NODE_ENV=production
NEXT_PUBLIC_USE_REST_API=true
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com
NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com
```

#### **Development Overrides**
```bash
NEXT_PUBLIC_SITE_URL=https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com
```

## 🧪 **Testing Your Dev Deployment**

### **REST API Endpoints**
1. **Health Check**: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/api/health`
2. **API Docs**: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/api/docs`
3. **Posts**: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/api/posts`
4. **Categories**: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/api/categories`
5. **Search**: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/api/search?q=cowboy`

### **Test Page**
- **URL**: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/test-rest-api`
- **Purpose**: Interactive testing interface for all API endpoints

## 🔄 **Development Workflow**

### **1. Local Development**
```bash
# Start local development server
npm run dev

# Test locally
http://localhost:3000/api/health
http://localhost:3000/test-rest-api
```

### **2. Dev Branch Deployment**
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin dev

# AWS Amplify automatically builds and deploys
# Check: https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/
```

### **3. Production Deployment**
```bash
# Merge dev to main when ready
git checkout main
git merge dev
git push origin main

# AWS Amplify automatically builds and deploys to production
# Check: https://cowboykimono.com
```

## 🏗️ **AWS Architecture**

### **Current Setup**
- **Frontend**: Next.js 15.3.4 on AWS Amplify
- **Backend**: WordPress on EC2 (headless CMS via REST API)
- **API**: `https://api.cowboykimono.com`
- **CDN**: CloudFront for optimization
- **Database**: Aurora Serverless (enhanced features)

### **REST API Features**
- ✅ TypeScript with Zod validation
- ✅ Comprehensive error handling
- ✅ Strategic caching headers
- ✅ WordPress REST API integration
- ✅ Health monitoring
- ✅ Self-documenting API

## 🚨 **Troubleshooting**

### **Build Failures**
1. **YAML Syntax**: Ensure all export commands are quoted
2. **Environment Variables**: Verify all required vars are set
3. **Dependencies**: Check `package.json` and `npm ci` output

### **API Issues**
1. **WordPress Connectivity**: Check `https://api.cowboykimono.com/wp-json/wp/v2/posts`
2. **CORS**: Verify WordPress CORS settings
3. **Rate Limiting**: Monitor API response times

### **Local Development**
1. **Port Conflicts**: Use `npm run dev` (auto-finds available port)
2. **Environment**: Check `.env.local` for local overrides
3. **Cache**: Clear browser cache for API testing

## 📊 **Monitoring**

### **Health Check Endpoints**
- **Local**: `http://localhost:3000/api/health`
- **Dev**: `https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/api/health`
- **Production**: `https://cowboykimono.com/api/health`

### **Expected Response**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "wordpress": {
      "status": "healthy",
      "responseTime": 401
    },
    "api": {
      "status": "healthy"
    }
  }
}
```

## 🎯 **Next Steps**

1. **Test Dev Deployment**: Verify all endpoints work on dev URL
2. **Monitor Builds**: Check AWS Amplify build logs
3. **Update Documentation**: Keep this guide current
4. **Production Ready**: Test thoroughly before merging to main

## 📞 **Support**

- **Build Issues**: Check AWS Amplify console logs
- **API Issues**: Test health endpoint first
- **Local Issues**: Verify Node.js version and dependencies

---

**Last Updated**: January 25, 2025  
**Status**: ✅ REST API Complete, Dev Branch Ready 