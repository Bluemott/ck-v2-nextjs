# Cowboy Kimono v2 - Next.js Website

A modern, headless WordPress-powered website for Cowboy Kimono, featuring a blog, shop, and downloads section with advanced SEO optimization, social media integration, and AWS serverless infrastructure with comprehensive performance optimizations.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Check performance optimizations
npm run performance-check
```

## 📋 Project Overview

- **Framework:** Next.js 15.3.4 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **CMS:** WordPress on AWS Lightsail (headless)
- **Deployment:** AWS Amplify with CloudFront CDN
- **Infrastructure:** AWS Lambda, API Gateway, CloudWatch
- **Performance:** Enhanced caching, bundle optimization, CDN

## 🏗️ Architecture

```
Frontend (Next.js) ←→ WordPress REST API ←→ MySQL Database
       ↓
   AWS Lambda (Recommendations)
       ↓
   Enhanced Caching System
       ↓
   Performance Monitoring
```

## 📁 Key Directories

- `app/` - Next.js App Router pages and components
- `app/api/` - API routes for blog functionality
- `app/lib/` - Utility functions and API clients
- `infrastructure/` - AWS CDK infrastructure code
- `lambda/` - AWS Lambda functions
- `public/` - Static assets and downloads
- `scripts/` - Performance and health check scripts

## 🔧 Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```env
# WordPress REST API
NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com

# Site Configuration
NEXT_PUBLIC_APP_URL=https://cowboykimono.com
NODE_ENV=development

# AWS Configuration (for Lambda functions)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 📚 Documentation

For comprehensive documentation covering:

- **System Architecture** - Complete frontend to backend architecture
- **Performance Optimizations** - Enhanced caching, bundle optimization, CDN
- **API Documentation** - WordPress REST API integration
- **AWS Infrastructure** - Lambda functions and CDK setup
- **Security Implementation** - CSP, validation, AWS security
- **Monitoring & Observability** - CloudWatch, X-Ray, metrics
- **Development Workflow** - Local setup, code quality, deployment
- **Troubleshooting Guide** - Common issues and solutions
- **Best Practices** - Frontend, backend, and AWS best practices

📖 **See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete project documentation**

## 🛠️ Available Scripts

```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run lint:fix              # Fix ESLint errors
npm run type-check            # Run TypeScript type checking
npm run performance-check      # Run performance analysis
npm run health-check          # Check application health
npm run test:web-vitals       # Test Core Web Vitals implementation
npm run test:rss-feed         # Test RSS feed implementation
npm run deploy:infrastructure # Deploy AWS infrastructure
```

## 🔗 Key URLs

- **Production Site:** https://cowboykimono.com
- **WordPress REST API:** https://api.cowboykimono.com
- **WordPress Admin:** https://admin.cowboykimono.com
- **Documentation:** [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🚀 Performance Optimizations

### ✅ Implemented Optimizations

#### **Enhanced Caching System**

- LRU eviction with access count tracking
- Periodic cleanup every 5 minutes
- Memory usage monitoring
- Cache warming for critical data
- Pattern-based invalidation

#### **Bundle Optimization**

- Code splitting for vendor and AWS SDK chunks
- Tree shaking for unused code elimination
- Gzip compression enabled
- Image optimization with WebP/AVIF
- SVG optimization with SVGR

#### **Middleware Performance**

- Enhanced security headers
- Optimized caching headers for different content types
- Rate limiting infrastructure (ready for Redis)
- Performance monitoring with request timing
- CDN optimization headers

#### **API Performance**

- Response caching with different TTL per endpoint
- Comprehensive error handling
- Input validation with Zod schemas
- CloudWatch metrics integration
- Request tracking with unique IDs

#### **AWS Infrastructure**

- CloudFront distribution optimized for media delivery
- Lambda functions with proper memory allocation
- API Gateway with rate limiting and caching
- CloudWatch monitoring with dashboards and alarms
- SNS notifications for critical alerts

#### **Input Sanitization**

- HTML sanitization with DOMPurify
- Text sanitization for plain text
- URL validation and sanitization
- Email sanitization and normalization
- Filename sanitization for safe storage
- Blog post content sanitization
- Search query sanitization
- Form data sanitization
- WordPress webhook sanitization
- XSS prevention measures
- Directory traversal prevention

#### **RSS Feed Implementation**

- Comprehensive RSS 2.0 structure with proper XML namespaces
- Enhanced caching with Redis integration and 1-hour TTL
- Security headers and proper content sanitization
- Error handling with graceful fallback RSS feed
- Monitoring integration with request tracking and performance metrics
- Content sanitization to prevent XSS in RSS content
- Author and category information from WordPress embedded data
- Featured image support with proper enclosure tags
- Request ID tracking for debugging and monitoring

### Performance Monitoring

#### **Performance Check Script**

```bash
npm run performance-check
```

**Features:**

- Bundle size analysis
- Cache performance verification
- API optimization checks
- Build optimization validation
- AWS infrastructure verification
- Dependency analysis

#### **Health Check Script**

```bash
npm run health-check
```

**Features:**

- Application health verification
- API endpoint testing
- Cache health monitoring
- AWS service connectivity
- Performance metrics collection

### Performance Targets Achieved

| Metric             | Target      | Status      |
| ------------------ | ----------- | ----------- |
| Page Load Time     | < 3 seconds | ✅ Achieved |
| API Response Time  | < 2 seconds | ✅ Achieved |
| Cache Hit Rate     | > 80%       | ✅ Achieved |
| Bundle Size        | < 2MB       | ✅ Achieved |
| Image Optimization | WebP/AVIF   | ✅ Achieved |
| CDN Hit Rate       | > 90%       | ✅ Achieved |

## 📊 Monitoring

### CloudWatch Monitoring Setup

**Quick Deployment:**

```bash
# Linux/macOS
./scripts/deploy-monitoring.sh

# Windows
.\scripts\deploy-monitoring.ps1

# Or deploy main stack (includes monitoring)
cd infrastructure && cdk deploy WordPressBlogStack --require-approval never
```

**Monitoring Components:**

- **CloudWatch Dashboards:** Application metrics and infrastructure health
- **CloudWatch Alarms:** Automated alerts for errors, performance, and availability
- **SNS Notifications:** Email alerts for critical issues
- **Custom Metrics:** Application-specific performance tracking

**Current Deployed Resources:**

- **SNS Topic ARN:** `arn:aws:sns:us-east-1:925242451851:WordPressBlogStack-alerts`
- **Application Dashboard:** `CowboyKimono-production-application-metrics`
- **Infrastructure Dashboard:** `CowboyKimono-production-infrastructure-health`

**Key Alerts:**

- Lambda function errors, duration, and throttles
- API Gateway 4XX/5XX errors and latency
- CloudFront error rate and cache performance
- Custom application metrics

**Dashboard URLs:**

- Application Metrics: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=CowboyKimono-production-application-metrics`
- Infrastructure Health: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=CowboyKimono-production-infrastructure-health`

## 🤝 Contributing

1. Follow the development workflow in [DOCUMENTATION.md](./DOCUMENTATION.md)
2. Ensure code quality with TypeScript and ESLint
3. Test thoroughly before deployment
4. Run performance checks before merging
5. Update documentation as needed

## 🔧 Windows-Specific Troubleshooting

### Common Windows Issues

**Problem:** EINVAL error with .next/diagnostics directory

```powershell
# Solution: Remove .next directory and rebuild
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm install
npm run build

# Or use the automated fix script
.\scripts\fix-nextjs-windows.ps1
```

**Problem:** PowerShell execution policy blocking scripts

```powershell
# Solution: Set execution policy (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Problem:** Path length limitations

- Use shorter project paths
- Consider using WSL2 for development
- Enable long path support in Windows

## 📞 Support

- **Documentation:** [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Issues:** GitHub Issues
- **Monitoring:** CloudWatch console
- **Deployment:** AWS Amplify console
- **Performance:** Run `npm run performance-check`

---

**Version:** 2.3.0  
**Status:** Production Ready with Enhanced Performance Optimizations  
**Last Updated:** 2025-01-25
