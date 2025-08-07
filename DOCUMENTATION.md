# Cowboy Kimono v2 - Comprehensive Documentation

**Version:** 2.4.0  
**Status:** Production Ready with Enhanced Performance Optimizations  
**Last Updated:** 2025-01-25  
**Architecture:** Next.js 15.3.4 + WordPress REST API + AWS Serverless

---

## 📋 **Table of Contents**

1. [System Architecture](#system-architecture)
2. [Core Features & Implementation](#core-features--implementation)
3. [Performance Optimizations](#performance-optimizations)
4. [AWS Infrastructure](#aws-infrastructure)
5. [Security Implementation](#security-implementation)
6. [Monitoring & Observability](#monitoring--observability)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Best Practices](#best-practices)
10. [Enhanced Sitemap & SEO](#enhanced-sitemap--seo)

---

## 🏗️ **System Architecture**

### **Frontend Architecture**

```
Next.js 15.3.4 (App Router)
├── TypeScript 5 (Strict Mode)
├── Tailwind CSS 4.0
├── Enhanced Caching System
├── Real User Monitoring (RUM)
└── Performance Optimizations
```

### **Backend Architecture**

```
WordPress REST API (Lightsail)
├── MySQL Database
├── Headless CMS Configuration
├── Custom REST Endpoints
└── Media Optimization
```

### **AWS Infrastructure**

```
AWS Amplify (Hosting)
├── CloudFront CDN
├── Lambda Functions
├── API Gateway
├── CloudWatch Monitoring
└── S3 Storage
```

### **Data Flow**

```
User Request → CloudFront → Amplify → Next.js → WordPress REST API → MySQL
                ↓
            Lambda Functions (Recommendations)
                ↓
            Enhanced Caching System
                ↓
            Performance Monitoring
```

---

## 🚀 **Core Features & Implementation**

### **Enhanced Sitemap Generation** ✅ **IMPLEMENTED**

**File:** `app/sitemap.ts`  
**Status:** Production Ready with Canonicalization Fixes

#### **Key Features:**

- **Priority-Based Generation:** Dynamic priority calculation based on post recency and importance
- **Canonical URL Handling:** Ensures all URLs are non-www to prevent redirect loops
- **Enhanced Content Types:** Blog posts, categories, tags, and download pages
- **Performance Optimized:** Increased post limit to 1000 with intelligent caching
- **SEO Optimized:** Proper change frequency and priority values

#### **Implementation Details:**

```typescript
// Enhanced sitemap configuration
const SITEMAP_CONFIG = {
  MAX_POSTS: 1000, // Increased from 100 to include more posts
  MAX_CATEGORIES: 100,
  MAX_TAGS: 100,
  CACHE_TTL: 3600000, // 1 hour cache
  PRIORITY_DECAY: 0.1, // How much priority decreases for older posts
};

// Ensure canonical URL (non-www)
function getCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Force non-www domain
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    return parsed.toString();
  } catch {
    return url;
  }
}
```

#### **Priority Calculation:**

```typescript
// Calculate priority based on recency and importance
const basePriority = 0.9;
const recencyBonus = Math.max(0, 0.1 - index * 0.01); // Newer posts get higher priority
const finalPriority = Math.max(
  0.3,
  basePriority - index * SITEMAP_CONFIG.PRIORITY_DECAY + recencyBonus
);
```

#### **Content Types Included:**

1. **Core Pages** (Priority 1.0 - 0.7)
   - Homepage (1.0)
   - Blog index (0.9)
   - Shop (0.9)
   - Downloads (0.8)
   - About (0.7)

2. **Blog Posts** (Priority 0.9 - 0.3)
   - Dynamic priority based on recency
   - Sorted by publication date
   - Only published posts included

3. **Categories** (Priority 0.8 - 0.4)
   - Priority based on post count
   - Sorted by popularity
   - Only categories with posts included

4. **Tags** (Priority 0.7 - 0.3)
   - Priority based on post count
   - Sorted by popularity
   - Only tags with posts included

5. **Download Pages** (Priority 0.7 - 0.6)
   - Main downloads page
   - Specific download categories

#### **Testing & Validation:**

```bash
# Test enhanced sitemap implementation
npm run test:sitemap
```

**Test Features:**

- Sitemap accessibility and structure validation
- WWW to non-WWW redirect testing
- Canonical header verification
- XML structure validation
- URL count and priority verification

### **Canonicalization & Redirect Management** ✅ **IMPLEMENTED**

**File:** `app/lib/redirect-manager.ts`  
**Status:** Production Ready

#### **WWW to Non-WWW Redirect:**

```typescript
// Canonical redirects (www to non-www)
{
  source: '/:path*',
  destination: 'https://cowboykimono.com/:path*',
  permanent: true,
  has: [
    {
      type: 'host',
      value: 'www.cowboykimono.com',
    },
  ],
}
```

#### **Middleware Canonical Headers:**

```typescript
// Enhanced canonical URL handling
const host = request.headers.get('host') || '';
const isWWW = host.startsWith('www.');
const canonicalUrl = isWWW
  ? `https://cowboykimono.com${pathname}`
  : `https://cowboykimono.com${pathname}`;

// Set canonical URL header
response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
```

#### **Benefits:**

- **SEO Improvement:** Consistent canonical URLs prevent duplicate content issues
- **Performance:** Eliminates redirect chains and reduces page load time
- **User Experience:** Direct access to canonical URLs
- **Search Engine Optimization:** Clear signal to search engines about preferred domain

### **RSS Feed Implementation** ✅ **IMPLEMENTED**

**File:** `app/feed.xml/route.ts`  
**Status:** Production Ready

#### **Features:**

- **Comprehensive RSS 2.0 structure** with proper XML namespaces
- **Enhanced caching** with Redis integration and 1-hour TTL
- **Security headers** and proper content sanitization
- **Error handling** with graceful fallback RSS feed
- **Monitoring integration** with request tracking and performance metrics
- **Content sanitization** to prevent XSS in RSS content
- **Author and category information** from WordPress embedded data
- **Featured image support** with proper enclosure tags
- **Request ID tracking** for debugging and monitoring

#### **Testing:**

```bash
npm run test:rss-feed
```

### **API Integration**

#### **WordPress REST API**

- **Base URL:** `https://api.cowboykimono.com`
- **Authentication:** Bearer token for webhooks
- **Rate Limiting:** 100 requests per minute
- **Caching:** 5-minute client, 10-minute CDN cache

#### **Lambda Functions**

- **Recommendations:** `https://0xde6p9ls2.execute-api.us-east-1.amazonaws.com/prod/recommendations`
- **Caching:** 3-minute client, 5-minute CDN cache
- **Error Handling:** Comprehensive error responses with retry logic

### **Enhanced Caching System**

#### **Cache Configuration**

```typescript
// Cache TTL by content type
const CACHE_CONFIG = {
  posts: 300000, // 5 minutes
  categories: 600000, // 10 minutes
  tags: 600000, // 10 minutes
  search: 180000, // 3 minutes
  recommendations: 180000, // 3 minutes
  health: 0, // No cache
};
```

#### **Cache Features**

- **LRU Eviction:** Automatic cleanup of least recently used items
- **Memory Monitoring:** Tracks cache size and performance
- **Pattern Invalidation:** Smart cache invalidation based on content patterns
- **Redis Integration:** Distributed caching for production environments

---

## ⚡ **Performance Optimizations**

### **Bundle Optimization**

#### **Webpack Configuration**

```typescript
// Optimize bundle size
config.optimization = {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      aws: {
        test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
        name: 'aws-sdk',
        chunks: 'all',
        priority: 20,
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5,
      },
    },
  },
  usedExports: true,
  sideEffects: false,
};
```

#### **Image Optimization**

```typescript
// Advanced image configuration
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
}
```

### **Core Web Vitals Tracking**

#### **Real User Monitoring**

```typescript
// Track Core Web Vitals
const trackCoreWebVitals = () => {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'LCP',
            value: lastEntry.startTime,
            page: pathname,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }
};
```

#### **Performance Metrics**

- **LCP (Largest Contentful Paint):** Target < 2.5s
- **FID (First Input Delay):** Target < 100ms
- **CLS (Cumulative Layout Shift):** Target < 0.1
- **FCP (First Contentful Paint):** Target < 1.8s
- **TTFB (Time to First Byte):** Target < 600ms

### **Performance Targets Achieved**

| Metric             | Target      | Status      |
| ------------------ | ----------- | ----------- |
| Page Load Time     | < 3 seconds | ✅ Achieved |
| API Response Time  | < 2 seconds | ✅ Achieved |
| Cache Hit Rate     | > 80%       | ✅ Achieved |
| Bundle Size        | < 2MB       | ✅ Achieved |
| Image Optimization | WebP/AVIF   | ✅ Achieved |
| CDN Hit Rate       | > 90%       | ✅ Achieved |

---

## ☁️ **AWS Infrastructure**

### **CloudFront Distribution** ✅ **ENHANCED**

#### **Security Headers**

```typescript
// Comprehensive security headers
securityHeadersBehavior: {
  contentSecurityPolicy: {
    override: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https:; connect-src 'self' https://api.cowboykimono.com https://www.google-analytics.com https://*.execute-api.us-east-1.amazonaws.com",
  },
  strictTransportSecurity: {
    override: true,
    accessControlMaxAge: cdk.Duration.days(2 * 365),
    includeSubdomains: true,
    preload: true,
  },
  contentTypeOptions: { override: true },
  frameOptions: {
    override: true,
    frameOption: cloudfront.HeadersFrameOption.DENY,
  },
  referrerPolicy: {
    override: true,
    referrerPolicy:
      cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
  },
  xssProtection: {
    override: true,
    protection: true,
    modeBlock: true,
  },
}
```

#### **Error Page Handling**

```typescript
// Add error pages
errorResponses: [
  {
    httpStatus: 403,
    responseHttpStatus: 200,
    responsePagePath: '/404',
    ttl: cdk.Duration.minutes(5),
  },
  {
    httpStatus: 404,
    responseHttpStatus: 200,
    responsePagePath: '/404',
    ttl: cdk.Duration.minutes(5),
  },
  {
    httpStatus: 500,
    responseHttpStatus: 200,
    responsePagePath: '/500',
    ttl: cdk.Duration.minutes(5),
  },
];
```

### **Lambda Functions**

#### **Recommendations Lambda**

```javascript
// Enhanced Lambda with caching
const cache = new Map();
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300000; // 5 minutes

function getCachedRecommendations(postId) {
  const cached = cache.get(postId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedRecommendations(postId, data) {
  cache.set(postId, {
    data,
    timestamp: Date.now(),
  });
}
```

#### **Lambda Configuration**

```typescript
const recommendationsLambda = new lambda.Function(
  this,
  'WordPressRecommendations',
  {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('../lambda/recommendations'),
    environment: {
      NODE_ENV: 'production',
      WORDPRESS_API_URL: 'https://api.cowboykimono.com',
      WORDPRESS_ADMIN_URL: 'https://admin.cowboykimono.com',
      CACHE_TTL: '300',
      MAX_RECOMMENDATIONS: '5',
    },
    timeout: cdk.Duration.seconds(30),
    memorySize: 1024, // Increased for better performance
    logRetention: logs.RetentionDays.ONE_WEEK,
    description: 'WordPress recommendations Lambda function using REST API',
    reservedConcurrentExecutions: 10,
    tracing: lambda.Tracing.ACTIVE,
  }
);
```

### **Monitoring & Logging**

#### **CloudWatch Dashboards**

- **Application Metrics:** `CowboyKimono-production-application-metrics`
- **Infrastructure Health:** `CowboyKimono-production-infrastructure-health`

#### **Key Alerts**

- Lambda function errors, duration, and throttles
- API Gateway 4XX/5XX errors and latency
- CloudFront error rate and cache performance
- Custom application metrics

---

## 🔒 **Security Implementation**

### **Enhanced Security Headers**

#### **Comprehensive CSP**

```typescript
response.headers.set(
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "connect-src 'self' https://api.cowboykimono.com https://www.google-analytics.com https://*.execute-api.us-east-1.amazonaws.com",
    "frame-src 'self' https://www.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
);
```

#### **Additional Security Headers**

```typescript
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set(
  'Permissions-Policy',
  'camera=(), microphone=(), geolocation=(), payment=()'
);
response.headers.set(
  'Strict-Transport-Security',
  'max-age=63072000; includeSubDomains; preload'
);
response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
```

### **Rate Limiting**

#### **Implementation**

```typescript
// Enhanced rate limiting for API routes
if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
  const clientIP =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimitResult = await rateLimiter.check(clientIP, 100, 60000); // 100 requests per minute

  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil(
            (rateLimitResult.reset - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }
}
```

### **Input Sanitization**

#### **HTML Sanitization**

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}
```

#### **Text Sanitization**

```typescript
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}
```

---

## 📊 **Monitoring & Observability**

### **CloudWatch Monitoring**

#### **Deployment**

```bash
# Linux/macOS
./scripts/deploy-monitoring.sh

# Windows
.\scripts\deploy-monitoring.ps1

# Or deploy main stack (includes monitoring)
cd infrastructure && cdk deploy WordPressBlogStack --require-approval never
```

#### **Monitoring Components**

- **CloudWatch Dashboards:** Application metrics and infrastructure health
- **CloudWatch Alarms:** Automated alerts for errors, performance, and availability
- **SNS Notifications:** Email alerts for critical issues
- **Custom Metrics:** Application-specific performance tracking

#### **Current Deployed Resources**

- **SNS Topic ARN:** `arn:aws:sns:us-east-1:925242451851:WordPressBlogStack-alerts`
- **Application Dashboard:** `CowboyKimono-production-application-metrics`
- **Infrastructure Dashboard:** `CowboyKimono-production-infrastructure-health`

### **Performance Monitoring**

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

---

## 🛠️ **Development Workflow**

### **Environment Setup**

#### **Required Environment Variables**

```env
# WordPress Configuration (Lightsail-based)
NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com

# Application Configuration
NEXT_PUBLIC_APP_URL=https://cowboykimono.com
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com
NODE_ENV=development

# AWS Configuration (for Lambda functions)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

#### **Development Commands**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:sitemap
npm run test:rss-feed
npm run test:web-vitals

# Performance checks
npm run performance-check
npm run health-check

# Deploy infrastructure
npm run deploy:infrastructure
```

### **Code Quality**

#### **Validation Commands**

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Comprehensive validation
npm run validate
npm run validate:comprehensive
```

#### **Pre-commit Hooks**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "tsc --noEmit --skipLibCheck",
      "eslint --max-warnings 0",
      "prettier --write"
    ],
    "*.{js,jsx}": ["eslint --max-warnings 0", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 🔧 **Troubleshooting Guide**

### **Common Issues**

#### **Windows-Specific Issues**

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

#### **Performance Issues**

**Problem:** Slow page loads

```bash
# Check performance
npm run performance-check

# Check bundle size
npm run test:bundle-optimization

# Check Core Web Vitals
npm run test:web-vitals
```

**Problem:** API timeouts

```bash
# Check API health
npm run health-check

# Check Lambda function logs
aws logs tail /aws/lambda/WordPressRecommendations --follow
```

#### **SEO Issues**

**Problem:** Sitemap redirects

```bash
# Test sitemap implementation
npm run test:sitemap

# Check canonical URLs
curl -I https://cowboykimono.com/blog
```

**Problem:** RSS feed issues

```bash
# Test RSS feed
npm run test:rss-feed

# Check feed accessibility
curl https://cowboykimono.com/feed.xml
```

### **Debugging Tools**

#### **Development Tools**

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check environment variables
npm run test:env

# Validate configuration
npm run validate:comprehensive
```

#### **Production Monitoring**

```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/WordPressRecommendations --follow

# Check CloudFront distribution
aws cloudfront get-distribution --id E1234567890123

# Check API Gateway metrics
aws cloudwatch get-metric-statistics --namespace AWS/ApiGateway
```

---

## 📚 **Best Practices**

### **Frontend Best Practices**

#### **Performance**

- Use Next.js Image component for optimized images
- Implement proper caching strategies
- Minimize bundle size with code splitting
- Use React.memo for expensive components
- Implement proper error boundaries

#### **SEO**

- Use proper meta tags and structured data
- Implement canonical URLs
- Ensure proper heading hierarchy
- Optimize for Core Web Vitals
- Use semantic HTML elements

#### **Security**

- Sanitize all user inputs
- Implement proper CSP headers
- Use HTTPS for all requests
- Validate data on both client and server
- Implement proper authentication

### **Backend Best Practices**

#### **API Design**

- Use RESTful conventions
- Implement proper error handling
- Add rate limiting
- Use caching strategies
- Implement proper logging

#### **WordPress Integration**

- Use WordPress REST API
- Implement proper authentication
- Cache API responses
- Handle errors gracefully
- Monitor API performance

### **AWS Best Practices**

#### **Lambda Functions**

- Use appropriate memory allocation
- Implement proper error handling
- Add comprehensive logging
- Use environment variables
- Implement proper timeouts

#### **CloudFront**

- Use proper cache behaviors
- Implement security headers
- Monitor cache hit rates
- Use proper error pages
- Implement logging

#### **Monitoring**

- Set up comprehensive alerts
- Monitor performance metrics
- Track error rates
- Monitor costs
- Implement proper logging

---

## 🎯 **Enhanced Sitemap & SEO**

### **Sitemap Implementation**

#### **Key Features**

- **Priority-Based Generation:** Dynamic priority calculation based on post recency and importance
- **Canonical URL Handling:** Ensures all URLs are non-www to prevent redirect loops
- **Enhanced Content Types:** Blog posts, categories, tags, and download pages
- **Performance Optimized:** Increased post limit to 1000 with intelligent caching
- **SEO Optimized:** Proper change frequency and priority values

#### **Testing & Validation**

```bash
# Test enhanced sitemap implementation
npm run test:sitemap
```

**Test Features:**

- Sitemap accessibility and structure validation
- WWW to non-WWW redirect testing
- Canonical header verification
- XML structure validation
- URL count and priority verification

### **Canonicalization & Redirect Management**

#### **WWW to Non-WWW Redirect**

```typescript
// Canonical redirects (www to non-www)
{
  source: '/:path*',
  destination: 'https://cowboykimono.com/:path*',
  permanent: true,
  has: [
    {
      type: 'host',
      value: 'www.cowboykimono.com',
    },
  ],
}
```

#### **Middleware Canonical Headers**

```typescript
// Enhanced canonical URL handling
const host = request.headers.get('host') || '';
const isWWW = host.startsWith('www.');
const canonicalUrl = isWWW
  ? `https://cowboykimono.com${pathname}`
  : `https://cowboykimono.com${pathname}`;

// Set canonical URL header
response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
```

### **SEO Benefits**

#### **Improved Search Rankings**

- Consistent canonical URLs prevent duplicate content issues
- Proper priority values help search engines understand content importance
- Enhanced sitemap structure improves crawl efficiency

#### **Performance Improvements**

- Eliminates redirect chains and reduces page load time
- Direct access to canonical URLs improves user experience
- Reduced server load from unnecessary redirects

#### **User Experience**

- Clear signal to search engines about preferred domain
- Consistent URL structure across all pages
- Improved page load times with proper canonicalization

---

## 📋 **Implementation History & Key Features**

### **Recent Major Implementations (v2.3.0 → v2.4.0)**

#### **Enhanced Security Headers** ✅ **COMPLETED**

- **File:** `middleware.ts`
- **Features:** Comprehensive CSP, HSTS, XSS protection, frame options
- **Status:** Production ready with full security implementation

#### **Rate Limiting System** ✅ **COMPLETED**

- **File:** `app/lib/rate-limiter.ts`
- **Features:** LRU cache-based rate limiting, configurable limits
- **Status:** Successfully implemented and tested

#### **Enhanced Caching System** ✅ **COMPLETED**

- **Files:** `app/lib/cache.ts`, `app/lib/api.ts`
- **Features:** Multi-level caching, Redis integration, intelligent cache invalidation
- **Status:** Production ready with performance optimizations

#### **Lambda Function Enhancements** ✅ **COMPLETED**

- **Files:** `lambda/recommendations/`, `lambda/setup-database/`
- **Features:** Enhanced error handling, monitoring, performance optimizations
- **Status:** Deployed and tested in production

#### **Structured Data Implementation** ✅ **COMPLETED**

- **File:** `app/components/StructuredData.tsx`
- **Features:** JSON-LD schema markup, enhanced SEO, rich snippets
- **Status:** Production ready with comprehensive schema implementation

#### **Redis Cache Integration** ✅ **COMPLETED**

- **Files:** `app/lib/cache.ts`, `scripts/test-redis-cache.js`
- **Features:** Distributed caching, session management, performance monitoring
- **Status:** Production ready with comprehensive monitoring

### **AWS Infrastructure Enhancements**

#### **CloudFront Optimization**

- **Enhanced caching policies**
- **Image optimization via CloudFront**
- **Geographic distribution**
- **Security headers implementation**

#### **Lambda Function Improvements**

- **Enhanced error handling**
- **Performance monitoring**
- **Cost optimization**
- **Scalability improvements**

#### **Monitoring & Observability**

- **CloudWatch integration**
- **X-Ray tracing**
- **Custom metrics**
- **Alert configuration**

### **Performance Optimizations**

#### **Bundle Optimization**

- **Tree shaking implementation**
- **Code splitting optimization**
- **Lazy loading components**
- **Image optimization**

#### **Caching Strategy**

- **Multi-level caching system**
- **Intelligent cache invalidation**
- **Redis integration**
- **CDN optimization**

#### **SEO Enhancements**

- **Enhanced sitemap generation**
- **Structured data implementation**
- **Canonical URL handling**
- **Meta tag optimization**

### **Security Implementations**

#### **Content Security Policy**

- **Comprehensive CSP headers**
- **Script source restrictions**
- **Style source controls**
- **Frame security policies**

#### **Rate Limiting**

- **API endpoint protection**
- **DDoS mitigation**
- **Resource protection**
- **Configurable limits**

#### **AWS Security**

- **IAM role optimization**
- **VPC configuration**
- **Security group policies**
- **Encryption implementation**

### **Development Workflow Improvements**

#### **Code Quality**

- **ESLint configuration**
- **TypeScript strict mode**
- **Prettier formatting**
- **Husky git hooks**

#### **Testing Strategy**

- **Performance testing**
- **Health check monitoring**
- **API endpoint testing**
- **Security validation**

#### **Deployment Pipeline**

- **AWS Amplify integration**
- **Automated testing**
- **Rollback procedures**
- **Environment management**

---

**Documentation Version:** 2.4.0  
**Last Updated:** 2025-01-25  
**Status:** Production Ready with Enhanced Performance Optimizations

**Implementation Status:** All major features implemented and tested in production environment.
