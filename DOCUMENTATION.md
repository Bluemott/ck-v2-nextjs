# Cowboy Kimono v2 - Comprehensive Documentation

**Version:** 2.5.1  
**Status:** Production Ready with Enhanced Caching & ISR  
**Last Updated:** 2025-01-26  
**Architecture:** Next.js 15.3.4 + WordPress REST API + AWS Serverless + Redis + SWR  
**Business:** Handpainted Denim Apparel & Custom Jackets  
**Email Service:** AWS WorkMail (migrated from SES-based email processing)

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
11. [Downloads System](#downloads-system)
12. [ISR & Caching System](#isr--caching-system)

## 📚 **Additional Documentation**

- **Project History & Fixes:** See `HISTORY.md` for consolidated documentation of major fixes, deployments, and optimizations
- **AWS Configuration Files:** Located in `infrastructure/config/` directory
- **Testing Guide:** See `TESTING_GUIDE.md` for comprehensive testing procedures
- **SEO Audit & Optimization:** See SEO Audit section below for comprehensive search engine optimization

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
User Request → CloudFront → Amplify → Next.js → WordPress REST API (Direct) → MySQL
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
  MAX_POSTS: 100, // Optimized for WordPress API limits
  MAX_CATEGORIES: 100,
  MAX_TAGS: 100,
  CACHE_TTL: 3600000, // 1 hour cache
  PRIORITY_DECAY: 0.1, // How much priority decreases for older posts
};

// Force canonical URL (non-www) regardless of environment variable
const baseUrl = 'https://cowboykimono.com';

// Ensure canonical URL (non-www) for all generated URLs
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

### **WordPress API Architecture** ✅ **OPTIMIZED**

**Status:** Direct Access - CloudFront Removed from WordPress API

**Key Changes:**

- **Removed CloudFront** from in front of WordPress API due to CORS and caching issues
- **Direct API Access** to `api.cowboykimono.com` (Lightsail)
- **WordPress Redis Caching** provides better performance than CloudFront
- **REST API Caching** handles API response optimization
- **Simplified Architecture** reduces complexity and potential failure points

**Current Architecture:**

```
Frontend (Amplify + CloudFront) → WordPress API (Direct) → MySQL
Lambda Functions → WordPress API (Direct) → MySQL
```

**Infrastructure Status:**

- **Main Stack:** `WordPressBlogStack` - Updated to remove CloudFront from WordPress API
- **Stack ARN:** `arn:aws:cloudformation:us-east-1:925242451851:stack/WordPressBlogStack/341fa750-7282-11f0-9f49-0e2ac79fa5f5`
- **CloudFront:** Frontend only (WordPress API routes removed)
- **WordPress API:** Direct access via `api.cowboykimono.com`

### **CloudFront Distribution** ✅ **FRONTEND ONLY**

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
- **SNS Notifications:** Alerts for critical issues (email handled by AWS WorkMail)
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

# Basic test hook (used by CI/hooks that call `npm test`)
npm test

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

#### **WordPress Admin Access Issues** ✅ **RESOLVED**

**Problem:** Cookie errors when accessing admin.cowboykimono.com/wp-admin

**Root Cause:** Multiple issues combined:

1. CloudFront was sending `X-Forwarded-Host: admin.cowboykimono.com` causing redirect loops
2. Corrupted WordPress configuration files with syntax errors
3. Redis cache plugin causing connection errors

**Complete Solution Applied:**

1. **CloudFront Configuration Fixed:**
   - Manually removed `X-Forwarded-Host` headers from distribution `ESC0JXOXVWX4J`
   - Kept only `X-Forwarded-Proto: https` header

2. **WordPress Configuration Rebuilt:**
   - Created clean, complete wp-config.php file
   - Dynamic URL handling for admin.cowboykimono.com and wp-origin.cowboykimono.com
   - Disabled problematic Redis cache temporarily
   - Proper SSL and security settings

3. **Manual CloudFront Update Completed:**
   - Distribution ID: `ESC0JXOXVWX4J`
   - Removed X-Forwarded-Host header from origin configuration
   - CloudFront changes propagated successfully

**Current Status:** ✅ **WORKING**

- admin.cowboykimono.com/wp-admin → Redirects to login page correctly
- admin.cowboykimono.com/wp-login.php → Loads successfully through CloudFront
- wp-origin.cowboykimono.com/wp-admin → Works for direct access
- No more cookie errors or redirect loops

**Test Results:**

- CloudFront admin access: ✅ Working
- WordPress login page: ✅ Working
- Cookie handling: ✅ Working
- Security headers: ✅ Properly configured

#### **Redis Object Cache Drop-in Issues** ✅ **RESOLVED**

**Problem:** "The Redis object cache drop-in is outdated. Please update the drop-in." error in WordPress admin

**Root Cause:** Outdated `object-cache.php` drop-in file in WordPress wp-content directory

**Complete Solution Applied:**

1. **Updated Redis Object Cache Drop-in:**
   - Created latest version (v2.4.3) of `object-cache.php` drop-in file
   - Enhanced error handling and Redis connection management
   - Improved performance monitoring and logging
   - Added comprehensive configuration options

2. **Automated Deployment Scripts:**
   - Created `scripts/update-redis-dropin.sh` for Linux/macOS deployment
   - Created `scripts/update-redis-dropin.ps1` for Windows PowerShell deployment
   - Automatic backup system before updates
   - Comprehensive error handling and rollback capabilities

3. **Testing and Verification:**
   - Created `scripts/test-redis-cache.sh` for comprehensive Redis cache testing
   - Tests Redis connection, API performance, and cache functionality
   - Monitors error logs and performance metrics
   - Validates WordPress integration

**Current Status:** ✅ **WORKING**

- Redis object cache drop-in: ✅ Updated to latest version (v2.4.3)
- Redis connection: ✅ Stable and optimized
- Cache performance: ✅ Enhanced with better error handling
- WordPress integration: ✅ Seamless with proper fallbacks

**Deployment Instructions:**

```bash
# Linux/macOS
sudo ./scripts/update-redis-dropin.sh

# Windows PowerShell (Run as Administrator)
.\scripts\update-redis-dropin.ps1

# Test Redis cache functionality
./scripts/test-redis-cache.sh
```

**Key Features of Updated Drop-in:**

- **Enhanced Error Handling:** Graceful fallbacks when Redis is unavailable
- **Performance Monitoring:** Built-in metrics and logging
- **Configuration Options:** Comprehensive Redis configuration support
- **Multisite Support:** Full WordPress multisite compatibility
- **Memory Management:** Optimized memory usage and cleanup
- **Security:** Proper authentication and connection security

#### **WordPress CORS and CloudFront Cleanup** ✅ **COMPLETED**

**Problem:** CORS errors with images and Chrome link truncation due to CloudFront remnants

**Root Cause:**

1. Global CORS rule causing conflicts in HTTP Headers plugin
2. CloudFront remnants in WordPress configuration files
3. Improper CORS header configuration for media files

**Solution Applied:**

1. **HTTP Headers Plugin Configuration:**
   - Removed global rule that was causing critical errors
   - Added 3 specific rules for different URL patterns
   - Configured proper origin restriction to `https://cowboykimono.com`

2. **WordPress Configuration Cleanup:**
   - Removed CloudFront-related configurations from wp-config.php
   - Cleaned up .htaccess files to remove CloudFront redirect rules
   - Updated functions.php to remove CloudFront remnants

3. **CORS Headers Configuration:**
   - Media files: `/wp-content/uploads/` with proper CORS headers
   - REST API: `/wp-json/` with API-specific headers
   - Preflight requests: Proper OPTIONS handling

**Current Status:** ✅ **COMPLETED**

**Results Achieved:**

- No more "CORS origins not allowed" errors
- Images load properly on https://cowboykimono.com
- Links work correctly in Chrome
- REST API responds with proper CORS headers

#### **Health Check WordPress API Connectivity** ✅ **FIXED**

**Problem:** Health check script showing WordPress API connectivity issue (404) despite API working correctly

**Root Cause:** Health check script was using incorrect endpoint `/wp/v2/posts` instead of `/wp-json/wp/v2/posts`

**Solution Applied:**

1. **Fixed Health Check Script:**
   - Updated `scripts/health-check.js` to use correct WordPress REST API endpoint
   - Changed from `${API_URL}/wp/v2/posts?per_page=1` to `${API_URL}/wp-json/wp/v2/posts?per_page=1`
   - Added missing `/wp-json` prefix to match WordPress REST API standard

**Current Status:** ✅ **WORKING**

**Test Results:**

- Health check score improved from 75/100 to 83/100
- WordPress API connectivity: ✅ API status: 200
- No more WordPress API connectivity issues in health reports
- API endpoint confirmed working with curl test

#### **Lightsail Firewall & Connectivity Issues** ✅ **ENHANCED RECOVERY PROCEDURES** (2025-01-26)

**Problem:** SSH connection timeouts and API 500/501 errors despite server showing as online

**Root Cause:** Lightsail firewall rules became out of sync with instance network configuration

**Symptoms:**

- SSH connections timing out (port 22 blocked)
- WordPress API returning 500/501 errors (port 443 blocked)
- All network ports blocked despite firewall rules showing as "active" in console
- Instance shows green/online status but not responding to requests
- AWS Systems Manager also not accessible

**Complete Solution Applied:**

1. Re-applied firewall rules in Lightsail console (removed and re-added SSH and HTTPS rules)
2. Restarted instance to refresh network state
3. Verified connectivity restored

**Root Cause Analysis:**

- Firewall rule sync failure between Lightsail platform and instance network configuration
- Instance network state became stale after extended uptime
- Platform updates or network state changes can cause firewall rules to stop working despite appearing active
- Recurring issue suggests underlying instability requiring enhanced monitoring

**Enhanced Recovery Procedures:**

1. **Comprehensive Recovery Runbook:**
   - See `LIGHTSAIL_RECOVERY_RUNBOOK.md` for complete step-by-step recovery procedures
   - Includes diagnosis, recovery, verification, and prevention phases
   - Provides command reference and escalation procedures

2. **Enhanced Monitoring:**
   - `scripts/monitor-lightsail-connectivity.ps1` - Enhanced with email/SNS notifications
   - Supports automatic alerting via email or AWS SNS
   - Optional auto-fix firewall rules (requires AWS CLI)
   - Continuous monitoring every 5 minutes with configurable intervals

3. **CloudWatch Integration:**
   - `scripts/setup-cloudwatch-alarms.ps1` - Automated CloudWatch alarm setup
   - Monitors instance status, network metrics, and API health
   - SNS topic integration for notifications
   - CloudWatch dashboard creation

4. **Enhanced Health Check:**
   - `app/api/health/route.ts` - Enhanced WordPress API connectivity diagnostics
   - Detailed error messages for 500/501 errors
   - Connectivity status reporting
   - Response time monitoring

5. **Regular Health Checks:**
   - Run `scripts/test-ssh-connection.ps1` weekly for connectivity verification
   - Run `scripts/diagnose-api-errors.js` to test API endpoints
   - Monitor health check endpoint: `https://cowboykimono.com/api/health`

6. **Best Practices:**
   - Use static IP for more stable networking
   - Schedule monthly maintenance restarts to refresh network state
   - Document all firewall rule changes
   - Verify connectivity immediately after any instance changes
   - Set up automated monitoring with alerts

**Diagnostic Tools:**

- `scripts/test-ssh-connection.ps1` - Test SSH/HTTPS connectivity
- `scripts/diagnose-api-errors.js` - Test WordPress API endpoints
- `scripts/monitor-lightsail-connectivity.ps1` - Continuous monitoring with email/SNS alerts
- `scripts/setup-cloudwatch-alarms.ps1` - CloudWatch alarm setup
- `app/api/health/route.ts` - Enhanced health check endpoint

**Recovery Documentation:**

- `LIGHTSAIL_RECOVERY_RUNBOOK.md` - Complete recovery procedures and runbook
- `LIGHTSAIL_FIREWALL_PREVENTION.md` - Prevention strategies and root cause analysis

**Usage Examples:**

```powershell
# Enhanced monitoring with email alerts
powershell -ExecutionPolicy Bypass -File scripts/monitor-lightsail-connectivity.ps1 `
    -InstanceIP "34.194.14.49" `
    -APIUrl "https://api.cowboykimono.com" `
    -EmailTo "your-email@example.com" `
    -SMTPServer "smtp.gmail.com" `
    -SMTPPort "587" `
    -SMTPUser "your-email@gmail.com" `
    -SMTPPassword "your-app-password"

# Setup CloudWatch alarms
powershell -ExecutionPolicy Bypass -File scripts/setup-cloudwatch-alarms.ps1 `
    -InstanceName "WordPressInstance" `
    -SNSTopicArn "arn:aws:sns:us-east-1:123456789012:Alerts" `
    -Region "us-east-1"
```

#### **Lightsail Firewall & Connectivity Issues** ✅ **RESOLVED**

**Problem:** SSH connection timeouts and API 500/501 errors despite server showing as online

**Root Cause:** Lightsail firewall rules became out of sync with instance network configuration

**Symptoms:**

- SSH connections timing out (port 22 blocked)
- WordPress API returning 500/501 errors (port 443 blocked)
- All network ports blocked despite firewall rules showing as "active" in console
- Instance shows green/online status but not responding to requests

**Complete Solution Applied:**

1. Re-applied firewall rules in Lightsail console
2. Restarted instance to refresh network state
3. Verified connectivity restored

**Prevention:**

- Use automated monitoring: `scripts/monitor-lightsail-connectivity.ps1`
- Run periodic health checks: `scripts/test-ssh-connection.ps1`
- Use static IP for more stable networking
- Schedule monthly maintenance restarts
- Document all firewall rule changes

**Diagnostic Tools:**

- `scripts/test-ssh-connection.ps1` - Test SSH/HTTPS connectivity
- `scripts/diagnose-api-errors.js` - Test WordPress API endpoints
- `scripts/monitor-lightsail-connectivity.ps1` - Continuous monitoring

**See:** `LIGHTSAIL_FIREWALL_PREVENTION.md` for complete prevention guide

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

### **Next.js 15 Best Practices** ✅ **IMPLEMENTED**

#### **Server vs Client Components**

- **Server Components by Default:** All page components (`page.tsx`) are server components, fetching data directly without client-side hooks
- **Client Components for Interactivity:** Components using hooks, browser APIs, or event handlers are properly marked with `'use client'`
- **Proper Component Composition:** Server components can import and render client components correctly
- **No Unnecessary Client Boundaries:** Client components are only used where needed (interactivity, SWR hooks, browser APIs)

**Files Reviewed:**
- `app/layout.tsx` - Server component ✅
- `app/page.tsx` - Server component ✅
- `app/blog/[slug]/page.tsx` - Server component ✅
- `app/blog/page.tsx` - Server component ✅
- All `*Client.tsx` files - Properly marked with `'use client'` ✅

#### **Data Fetching Patterns**

- **Server-Side Data Fetching:** Server components fetch data directly using async/await
- **ISR Configuration:** Proper `revalidate` exports for incremental static regeneration
  - Blog posts: 60 seconds
  - Blog index: 60 seconds
  - Tag/Category pages: 300 seconds
  - Downloads: 600 seconds
- **Static Generation:** `generateStaticParams` implemented for dynamic routes
- **Error Handling:** Proper error handling with `notFound()` for missing content
- **SWR for Client-Side:** Client components use SWR hooks for client-side data fetching with caching

#### **Async Params (Next.js 15)**

- **Proper Type Definitions:** All dynamic route params typed as `Promise<{ ... }>`
- **Correct Usage:** All components properly await params before use
- **Metadata Generation:** `generateMetadata` functions properly await params

**Files Verified:**
- `app/blog/[slug]/page.tsx` - ✅ `Promise<{ slug: string }>`
- `app/blog/tag/[slug]/page.tsx` - ✅ `Promise<{ slug: string }>`
- `app/blog/category/[slug]/page.tsx` - ✅ `Promise<{ slug: string }>`
- `app/downloads/[category]/[slug]/page.tsx` - ✅ `Promise<{ category: string; slug: string }>`

#### **Loading States**

- **Loading UI Files:** Created `loading.tsx` files for all route segments that fetch data
- **Suspense Boundaries:** Loading states work automatically with Next.js Suspense
- **Skeleton Components:** Proper skeleton UI matching page layouts

**Loading Files Created:**
- `app/blog/loading.tsx` - Blog index loading state ✅
- `app/blog/[slug]/loading.tsx` - Blog post loading state ✅
- `app/downloads/loading.tsx` - Downloads index loading state ✅
- `app/downloads/[category]/[slug]/loading.tsx` - Download page loading state ✅
- `app/shop/loading.tsx` - Shop page loading state ✅

#### **Error Handling**

- **Error Boundaries:** Root error boundary at `app/error.tsx`
- **404 Handling:** Comprehensive `not-found.tsx` with navigation options
- **Proper `notFound()` Usage:** All pages use `notFound()` for missing content (fixed download page)
- **Error Metadata:** Error pages have proper metadata (noindex, follow)

#### **Metadata API**

- **Dynamic Metadata:** All pages use `generateMetadata` for SEO
- **Comprehensive SEO:** Open Graph, Twitter Cards, canonical URLs
- **Structured Data:** JSON-LD schema markup for all page types
- **Centralized Generation:** SEO metadata generated via `app/lib/seo.ts`

#### **Route Handlers (API Routes)**

- **Proper Runtime:** API routes use `runtime = 'nodejs'` where needed
- **HTTP Methods:** Proper GET, POST handlers with method validation
- **Error Responses:** Appropriate status codes and error messages
- **Request Validation:** Zod schemas for request validation
- **Rate Limiting:** Implemented in middleware and route handlers
- **CORS Headers:** Proper CORS configuration for API endpoints

#### **Performance Optimizations**

- **ISR Configuration:** Appropriate revalidation times for different content types
- **Static Generation:** `generateStaticParams` for pre-rendering dynamic routes
- **Image Optimization:** Next.js Image component with proper configuration
- **Bundle Optimization:** Code splitting, tree shaking, and vendor chunk separation
- **Caching Strategies:** Multi-level caching (ISR, Redis, SWR, CDN)

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

### **AWS Best Practices Audit** ✅ **COMPLETED** (December 9, 2025)

**Status:** Comprehensive audit completed using AWS MCP tools

**Audit Report:** See `AWS_BEST_PRACTICES_AUDIT_REPORT.md` for complete findings

#### **Key Findings**

**Strengths:**
- ✅ Excellent security headers (CSP, HSTS, XSS protection)
- ✅ Good CloudWatch monitoring (dashboards and alarms)
- ✅ Cost optimizations (logging/tracing disabled appropriately)
- ✅ Proper error handling (custom error pages, Lambda error handling)

**Critical Issues:**
- ❌ **No WAF protection** on CloudFront or API Gateway (vulnerable to attacks)
- ❌ **IAM least privilege violations** (wildcard resources in policies)

**High Priority Recommendations:**
- ⚠️ Fix IAM least privilege (replace wildcard resources with specific ARNs)
- ⚠️ Encrypt Lambda environment variables with KMS
- ⚠️ Attach AWS WAF to CloudFront and API Gateway

**Medium Priority Recommendations:**
- ⚠️ Add dead letter queue (DLQ) to Lambda function
- ⚠️ Use AWS Secrets Manager for sensitive data

**Low Priority Recommendations:**
- ⚠️ Optimize Lambda memory allocation (test with 256-512 MB)
- ⚠️ Enable S3 versioning (optional, for compliance)

#### **Implementation Status**

**Completed:**
- ✅ AWS MCP connectivity test passed
- ✅ Comprehensive resource discovery completed
- ✅ Full audit report generated with prioritized recommendations

**Pending Implementation:**
- ⏳ WAF implementation for CloudFront and API Gateway
- ⏳ IAM least privilege fixes
- ⏳ Lambda environment variable encryption
- ⏳ Dead letter queue configuration

#### **Audit Summary**

**Overall Assessment:** Infrastructure follows many AWS best practices but needs security improvements, particularly WAF protection and IAM least privilege compliance.

**Estimated Implementation Time:** 8-10 hours  
**Estimated Monthly Cost Increase:** ~$15-20 (WAF + KMS)

**Next Review:** March 9, 2026 (Quarterly)

**Full Report:** See `AWS_BEST_PRACTICES_AUDIT_REPORT.md` for detailed findings, code examples, and implementation guides.

---

## 🎯 **Enhanced Sitemap & SEO**

### **SEO Audit Status: 95/100** ✅ **EXCELLENT**

**Last Audit:** September 19, 2025  
**Overall SEO Score:** 95/100 🌟  
**Status:** Production Ready with Comprehensive SEO Implementation

### **Sitemap Implementation**

#### **Key Features**

- **Priority-Based Generation:** Dynamic priority calculation based on post recency and importance
- **Canonical URL Handling:** Fixed to ensure all URLs are non-www to prevent redirect loops
- **Enhanced Content Types:** Blog posts, categories, tags, and download pages
- **Performance Optimized:** Increased post limit to 1000 with intelligent caching
- **SEO Optimized:** Proper change frequency and priority values

#### **Recent SEO Fixes Applied:**

1. **Sitemap WWW URLs Fixed** - All 66 URLs now use canonical non-www format (https://cowboykimono.com)
2. **Sitemap Canonicalization Enhanced** - Hardcoded base URL to prevent environment variable conflicts
3. **Robots.txt Enhanced** - Added missing pages (/about/, /custom-kimonos/) to allowed paths
4. **Customize Page SEO Enhanced** - Upgraded to use centralized SEO metadata generation
5. **Meta Tag Coverage** - 100% coverage across all pages with enhanced descriptions

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

### **WordPress Redirect Cleanup** ✅ **DOCUMENTED**

**Status:** Manual cleanup required in WordPress  
**Last Updated:** January 2025  
**Investigation Date:** January 2025

#### **Problem Overview**

Ahrefs SEO audit identified 73 broken redirects where tag/category/download pages redirect to non-existent blog posts (308 → 404). These redirects are **NOT** in AWS Amplify (only catch-all rewrite exists) and **NOT** in Next.js code. They are likely configured in WordPress.

#### **Confirmed Redirect Issues (Live Site Testing)**

**Test Date:** January 2025

The following redirects have been confirmed on the live site:

1. **Tag URL Redirect:**
   - Source: `https://cowboykimono.com/blog/tag/memorial-day`
   - Redirects to: `https://cowboykimono.com/blog/memorial-day`
   - Result: **404 Error** (Post Not Found)
   - Status Code: 308 (Permanent Redirect) → 404

2. **Category URL Redirect:**
   - Source: `https://cowboykimono.com/blog/category/uncategorized`
   - Redirects to: `https://cowboykimono.com/blog/uncategorized`
   - Result: **404 Error** (Post Not Found)
   - Status Code: 308 (Permanent Redirect) → 404

**Pattern Confirmed:**

- WordPress is redirecting `/blog/tag/[slug]` → `/blog/[slug]`
- WordPress is redirecting `/blog/category/[slug]` → `/blog/[slug]`
- These redirects assume the slug is a blog post, but tags/categories are not blog posts
- Next.js correctly handles tag/category pages at `/blog/tag/[slug]` and `/blog/category/[slug]` routes
- The WordPress redirects are interfering with Next.js routing

#### **Investigation Summary (January 2025)**

**Root Cause (Updated):** After checking WordPress and finding no redirect rules, the redirects are likely happening at the AWS Amplify/CloudFront level or due to Next.js routing priority. The `/blog/[slug]` route may be matching `/blog/tag/*` and `/blog/category/*` URLs before the more specific routes can handle them.

**Code Fix Applied:** Added guards in `/app/blog/[slug]/page.tsx` to prevent the blog post route from matching tag/category paths. This ensures tag/category URLs are handled by their dedicated routes.

**Impact:**

- 73 broken redirects identified by Ahrefs SEO audit
- Tag and category pages cannot be accessed directly
- SEO penalty from broken redirect chains (308 → 404)
- Poor user experience when accessing tag/category URLs

**Resolution:**

1. ✅ **Root Cause Found:** WordPress legacy redirect patterns in `redirect-mappings.ts` were too broad
2. ✅ **Fix Applied:** Changed redirect patterns to use regex constraints for numeric year/month
3. ✅ **Route Guards Added:** Added guards in `/app/blog/[slug]/page.tsx` as additional safety

**Investigation Findings:**

- ✅ Only one rewrite rule in AWS Amplify (correct for Next.js SSR)
- ✅ No redirect rules in AWS Amplify Console
- ✅ No redirect plugins in WordPress
- ⚠️ Redirect still happening: `/blog/tag/memorial-day` → `/blog/memorial-day`
- ⚠️ Network headers show request reaches Next.js as `/blog/memorial-day` (redirect happens before Next.js)
- ⚠️ No `Location` header in response (not a redirect response, but a 404 for the redirected URL)

**Root Cause Identified (SOLVED):**

The redirect was caused by **Next.js redirect configuration** in `app/lib/redirect-mappings.ts`. The WordPress legacy redirect pattern:

```typescript
source: '/:year/:month/:slug',
destination: '/blog/:slug',
```

This pattern matched ANY three-segment path, including:

- `/blog/tag/memorial-day` where `:year`="blog", `:month`="tag", `:slug`="memorial-day"
- Result: Redirected to `/blog/memorial-day` (404)

**Fix Applied:**

Changed the redirect patterns to use regex constraints for numeric year/month:

```typescript
source: '/:year(\\d{4})/:month(\\d{2})/:slug',
destination: '/blog/:slug',
```

This ensures only actual WordPress date-based URLs are redirected (e.g., `/2024/01/post-slug`), not `/blog/tag/*` or `/blog/category/*` URLs.

**Lesson Learned:**

When creating catch-all redirect patterns for WordPress legacy URLs, always use regex constraints to ensure patterns only match the intended URLs. Generic patterns like `/:year/:month/:slug` can match unintended paths like `/blog/tag/memorial-day`.

**After Deployment:**

1. **Test URLs:**
   - `https://cowboykimono.com/blog/tag/memorial-day` should return 200 (tag page)
   - `https://cowboykimono.com/blog/category/uncategorized` should return 200 (category page)
   - Use curl to verify: `curl -I https://cowboykimono.com/blog/tag/memorial-day`
   - No `Location` header should appear (no redirect)

2. **Clear Browser Cache:**
   - 308 redirects are cached by browsers
   - Test in incognito mode or clear cache to see updated behavior

#### **Broken Redirect Patterns**

The following redirect patterns are causing 308 → 404 redirect chains:

1. **Tag URLs redirecting to non-existent blog posts:**
   - `/blog/tag/[slug]` → `/blog/[slug]` (when blog post doesn't exist)
   - Examples: `/blog/tag/memorial-day` → `/blog/memorial-day` (404)

2. **Category URLs redirecting to non-existent blog posts:**
   - `/blog/category/[slug]` → `/blog/[slug]` (when blog post doesn't exist)
   - Examples: `/blog/category/uncategorized` → `/blog/uncategorized` (404)

3. **Download URLs redirecting to non-existent blog posts:**
   - `/downloads/[category]/[slug]` → `/blog/[slug]` (when blog post doesn't exist)
   - Examples: `/downloads/diy-tutorials/jackalope-display` → `/blog/jackalope-display` (404)

#### **Where to Find These Redirects**

Since AWS Amplify only has a catch-all rewrite rule, these redirects are likely configured in:

1. **WordPress Redirect Plugins** (most likely):
   - Redirection plugin
   - Yoast SEO redirects
   - Rank Math redirects
   - Other redirect plugins

2. **WordPress .htaccess File**:
   - Check `wp-content/.htaccess` or root `.htaccess`
   - Look for redirect rules matching the patterns above

3. **WordPress Permalink Settings**:
   - Settings → Permalinks
   - Check if custom permalink structure is causing redirects

4. **WordPress Functions/Theme Code**:
   - Check `functions.php` for redirect hooks
   - Look for `wp_redirect()` or `wp_safe_redirect()` calls

#### **Step-by-Step Cleanup Instructions**

1. **Access WordPress Admin**
   - Navigate to `https://admin.cowboykimono.com/wp-admin`
   - Log in with admin credentials

2. **Check Redirect Plugins**
   - Go to Plugins → Installed Plugins
   - Look for redirect plugins (Redirection, Yoast, etc.)
   - Access the redirect plugin's settings
   - Search for redirects matching the broken patterns:
     - Source: `/blog/tag/*` → Destination: `/blog/*`
     - Source: `/blog/category/*` → Destination: `/blog/*`
     - Source: `/downloads/*/*` → Destination: `/blog/*`
   - **Specific Redirects to Remove:**
     - `/blog/tag/memorial-day` → `/blog/memorial-day` (confirmed broken)
     - `/blog/category/uncategorized` → `/blog/uncategorized` (confirmed broken)
     - Any redirect matching pattern: `/blog/tag/:tag` → `/blog/:tag`
     - Any redirect matching pattern: `/blog/category/:category` → `/blog/:category`
   - Delete or disable these redirect rules

3. **Check WordPress .htaccess**
   - Access WordPress files via SSH or FTP
   - Check `.htaccess` file in WordPress root
   - Look for `Redirect` or `RewriteRule` directives matching broken patterns
   - Remove or comment out broken redirect rules

4. **Check Permalink Settings**
   - Go to Settings → Permalinks
   - Ensure permalink structure doesn't conflict with Next.js routes
   - Save permalink settings to regenerate `.htaccess` if needed

5. **Check Functions/Theme Code**
   - Review `wp-content/themes/*/functions.php`
   - Look for redirect hooks or functions
   - Check for `template_redirect` or `init` hooks with redirects

6. **Verify Redirect Removal**
   - Use the validation script: `node scripts/validate-redirects.js`
   - Test URLs directly: `curl -I https://cowboykimono.com/blog/tag/memorial-day`
   - **Expected Results After Fix:**
     - `/blog/tag/memorial-day` should return **200 OK** (tag page renders)
     - `/blog/category/uncategorized` should return **200 OK** (category page renders)
     - No redirect to `/blog/[slug]` for tag/category URLs
   - Check Ahrefs audit after cleanup to confirm issues are resolved

#### **Prevention**

The following code changes prevent these issues from recurring:

1. **Sitemap Filtering** (`app/sitemap.ts`)
   - Automatically excludes URLs that would redirect to 404s
   - Validates tag/category/download URLs before adding to sitemap
   - Prevents broken redirect URLs from appearing in sitemap

2. **Redirect Validation** (`scripts/validate-redirects.js`)
   - Validates all redirects don't point to non-existent pages
   - Checks known broken redirect patterns
   - Can be run periodically to catch new broken redirects

3. **Canonical Tag Fixes** (`app/blog/[slug]/page.tsx`)
   - Removes canonical tags from 404 pages
   - Prevents self-referencing canonical URLs on error pages

4. **WordPress Best Practices**
   - Avoid creating redirects from tag/category pages to blog posts
   - Use Next.js routing for tag/category pages (already implemented)
   - Only create redirects when content actually moves or is deleted
   - Regularly audit redirect plugins for broken redirects

#### **Validation Script**

Run the validation script to check for broken redirects:

```bash
node scripts/validate-redirects.js
```

The script will:

- Validate redirect mappings from `redirect-mappings.ts`
- Check known broken redirect patterns from Ahrefs audit
- Report which redirects are still broken and need AWS cleanup

#### **Expected Results After Cleanup**

- ✅ No broken redirects (308 → 404 chains)
- ✅ Tag/category/download pages render correctly (200 status)
- ✅ All sitemap URLs return 200 status codes
- ✅ No canonical tags on 404 pages
- ✅ Improved SEO score in Ahrefs audit

#### **Troubleshooting**

If redirects persist after WordPress cleanup:

1. **Check CloudFront Behaviors** (if using CloudFront directly):
   - AWS Console → CloudFront → Your Distribution
   - Check "Behaviors" tab for redirect rules
   - Remove any redirects matching broken patterns

2. **Check WordPress REST API**:
   - Verify WordPress isn't handling these routes
   - Check if WordPress permalink structure conflicts with Next.js

3. **Test Direct Access**:
   - Test URLs directly: `curl -I https://cowboykimono.com/blog/tag/memorial-day`
   - Check response headers for `Location` header
   - Verify final destination doesn't return 404

### **SEO Benefits**

#### **Improved Search Rankings**

- Consistent canonical URLs prevent duplicate content issues
- Proper priority values help search engines understand content importance
- Enhanced sitemap structure improves crawl efficiency
- No broken redirects improve crawl budget utilization

#### **Performance Improvements**

- Eliminates redirect chains and reduces page load time
- Direct access to canonical URLs improves user experience
- Reduced server load from unnecessary redirects
- Faster page indexing with valid sitemap URLs

#### **User Experience**

- Clear signal to search engines about preferred domain
- Consistent URL structure across all pages
- Improved page load times with proper canonicalization
- No 404 errors from broken redirects

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

**Implemented Schemas:**

- **Organization Schema** - Company information, contact details, social media links
- **WebSite Schema** - Site-wide search functionality and site information
- **Blog Schema** - Blog index page with publisher information
- **BlogPosting Schema** - Individual blog posts with author, date, and content
- **Product Schema** - Enhanced product information with reviews, ratings, shipping details
- **FAQPage Schema** - Comprehensive FAQ section for shop pages
- **BreadcrumbList Schema** - Navigation breadcrumbs for better UX

**Schema Features:**

- **Server-side rendering** for optimal SEO performance
- **Comprehensive product data** including reviews, ratings, shipping information
- **Enhanced FAQ content** with 10 relevant questions and answers
- **Proper JSON-LD formatting** following schema.org standards
- **Rich snippets support** for improved search engine visibility

**Testing & Validation:**

- **Comprehensive test script** (`scripts/test-structured-data-comprehensive.js`)
- **Schema validation** for all implemented structured data types
- **Production testing** with automated validation
- **SEO compliance** following Google's structured data guidelines

#### **Redis Cache Integration** ✅ **COMPLETED**

- **Files:** `app/lib/cache.ts`, `scripts/test-redis-cache.js`, `wordpress/object-cache.php`
- **Features:** Distributed caching, session management, performance monitoring, updated WordPress drop-in
- **Status:** Production ready with comprehensive monitoring and latest Redis object cache drop-in

#### **Redis Object Cache Drop-in Update** ✅ **COMPLETED**

- **Files:** `wordpress/object-cache.php`, `scripts/update-redis-dropin.sh`, `scripts/update-redis-dropin.ps1`, `scripts/test-redis-cache.sh`
- **Features:** Latest Redis object cache drop-in (v2.4.3), automated deployment scripts, comprehensive testing
- **Status:** Production ready with updated drop-in and deployment automation

**Key Features:**

- **Latest Drop-in Version:** Updated to Redis Object Cache v2.4.3 with enhanced error handling
- **Automated Deployment:** Bash and PowerShell scripts for seamless updates
- **Comprehensive Testing:** Full test suite for Redis cache functionality
- **Backup System:** Automatic backup of existing drop-in before updates
- **Error Handling:** Enhanced error handling and logging for Redis operations
- **Performance Monitoring:** Built-in performance metrics and monitoring

### **AWS Infrastructure Enhancements**

#### **WordPress API Direct Access** ✅ **OPTIMIZED**

**Status:** Production Ready with Direct API Access

**Key Features:**

- **api.cowboykimono.com** - WordPress REST API (Direct Access - No CloudFront)
- **admin.cowboykimono.com** - WordPress admin interface (Direct Access)
- **cowboykimono.com** - Main Next.js application with CloudFront CDN
- **WordPress Redis Caching** - Better performance than CloudFront for API
- **REST API Caching** - Built-in WordPress caching optimization
- **Simplified Architecture** - Reduced complexity and failure points

**Implementation Details:**

```typescript
// Direct API access configuration
const WORDPRESS_API_CONFIG = {
  BASE_URL: 'https://api.cowboykimono.com',
  ADMIN_URL: 'https://admin.cowboykimono.com',
  CACHE_STRATEGY: 'WordPress Redis + REST API Caching',
  CORS_ENABLED: true,
  DIRECT_ACCESS: true,
};
```

#### **WordPress Caching Optimization**

- **Redis caching for database queries**
- **REST API response caching**
- **Image optimization via WordPress**
- **Built-in performance optimization**

#### **Lambda Function Improvements** ✅ **FIXED**

- **Enhanced error handling** - Fixed ZodError validation issues
- **Performance monitoring** - Improved response validation
- **Cost optimization** - Better caching strategies
- **Scalability improvements** - Direct API access reduces latency

**Recent Fixes:**

- **Fixed Lambda validation errors** - Updated response schema to match WordPress API format
- **Resolved CORS issues** - Removed CloudFront from WordPress API path
- **Improved image loading** - Direct access to WordPress media files
- **Enhanced link functionality** - Fixed Chrome-specific link truncation issues

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

- **WordPress Redis caching**
- **REST API response caching**
- **Intelligent cache invalidation**
- **Direct API optimization**

#### **SEO Enhancements** ✅ **COMPREHENSIVE IMPLEMENTATION**

- **Enhanced sitemap generation** with priority-based URLs (95/100 score)
- **Comprehensive structured data** (6 schema types: Organization, Website, BlogPosting, BreadcrumbList, FAQ, Product)
- **Canonical URL handling** fixed for non-www consistency
- **Meta tag optimization** with 100% page coverage
- **Advanced SEO features:** Yoast SEO integration, Open Graph, Twitter Cards
- **Technical SEO:** Robots.txt, RSS feeds, security headers, performance optimization
- **Content SEO:** Semantic HTML, internal linking, breadcrumbs, image optimization

### **Security Implementations**

#### **Content Security Policy**

- **Comprehensive CSP headers**
- **Script source restrictions**
- **Style source controls**
- **Frame security policies**

#### **CORS Configuration** ✅ **CONFIGURED**

**Status:** Production Ready with WordPress CORS Headers Plugin

**Issues Resolved:**

- **WordPress API CORS issues** - Removed CloudFront, configured specific CORS headers
- **Image loading problems** - Proper CORS headers for media files
- **Cross-origin request failures** - Specific origin configuration (https://cowboykimono.com)
- **Chrome link truncation** - Fixed by removing CloudFront interference
- **Lambda validation errors** - Fixed response schema format
- **Global rule conflicts** - Replaced with specific URL pattern rules

**Implementation:**

```typescript
// WordPress CORS Headers Plugin Configuration
const WORDPRESS_CORS_CONFIG = {
  BASE_URL: 'https://api.cowboykimono.com',
  CORS_STRATEGY: 'Specific Headers Plugin',
  ALLOWED_ORIGIN: 'https://cowboykimono.com',
  MEDIA_PATTERN: '/wp-content/uploads/',
  API_PATTERN: '/wp-json/',
  CACHE_STRATEGY: 'WordPress Redis + REST API Caching',
};
```

**Plugin Rules:**

1. **Media Files** (`/wp-content/uploads/`) - GET, HEAD, OPTIONS
2. **REST API** (`/wp-json/`) - GET, POST, PUT, DELETE, OPTIONS
3. **Preflight** (OPTIONS) - Proper preflight handling

**Implementation:**

```typescript
// Web Vitals API CORS headers
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// WordPress REST API CORS headers
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-WP-Nonce',
  'Access-Control-Expose-Headers': 'X-WP-Total, X-WP-TotalPages',
}
```

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

## 📥 **Downloads System**

### **Overview**

The downloads system provides a comprehensive solution for managing and delivering downloadable content with individual pages, analytics tracking, and enhanced SEO. Built on WordPress ACF fields for easy content management by non-technical users.

### **Architecture**

```
WordPress ACF Fields
├── Enhanced Download Fields (10 new fields)
├── REST API Integration
└── Content Management

Next.js Frontend
├── Individual Download Pages (/downloads/[category]/[slug])
├── Enhanced Main Downloads Page
├── Download Components (Card, Skeleton, States)
└── Analytics Integration

Analytics & Tracking
├── Download Count Tracking
├── User Analytics (Anonymized)
├── Popular Downloads
└── CloudWatch Integration
```

### **WordPress ACF Configuration**

**Enhanced Fields Added:**

- `download_slug` - URL-friendly slug for individual pages
- `download_file_size` - Display file size (e.g., "2.5 MB")
- `download_format` - File format (PDF, DOC, ZIP, etc.)
- `download_difficulty` - Easy, Intermediate, Advanced
- `download_time_estimate` - Estimated completion time
- `download_materials_needed` - Materials list for crafts
- `download_seo_title` - Custom SEO title override
- `download_seo_description` - Custom meta description
- `download_featured` - Feature this download
- `download_order` - Custom sorting order

**Configuration File:** `wordpress-downloads-setup.php`

### **Individual Download Pages**

**Route:** `/downloads/[category]/[slug]`

**Features:**

- Full SEO metadata with custom titles/descriptions
- Structured data (DigitalDocument schema)
- Breadcrumb navigation
- File information display (size, format, difficulty)
- Materials needed section
- Related downloads
- Social sharing buttons
- Download tracking integration

**Static Generation:** Uses `generateStaticParams` for optimal SEO and performance.

### **Enhanced Downloads Index Page**

**Improvements:**

- Featured downloads carousel
- Quick stats display (total downloads, monthly stats)
- Improved card hover states
- Better mobile responsiveness
- Enhanced visual feedback
- Download count display
- File format badges
- Difficulty indicators

### **Download Components**

**Reusable Components:**

- `DownloadCard.tsx` - Enhanced download card with file info
- `DownloadSkeleton.tsx` - Loading state component
- `EmptyState.tsx` - No downloads state
- `ErrorState.tsx` - Error handling state
- `FeaturedDownloads.tsx` - Featured downloads section
- `DownloadTracker.tsx` - Download tracking component

### **Analytics & Tracking**

**API Endpoints:**

- `/api/downloads/track` - Track download events
- `/api/downloads/analytics` - Get overall statistics
- `/api/downloads/analytics/[downloadId]` - Individual download analytics

**Tracking Data:**

- Download count per item
- User analytics (anonymized via IP hash)
- Timestamp tracking
- Referrer tracking
- Device/browser information
- Geographic distribution

**Analytics Features:**

- Most popular downloads
- Downloads by category
- Download trends over time
- Real-time download counts
- CloudWatch integration

### **SEO Implementation**

**Metadata Generation:**

- Custom SEO titles and descriptions
- Open Graph and Twitter Cards
- Canonical URLs
- Structured data (DigitalDocument schema)
- Breadcrumb structured data

**Sitemap Integration:**

- Individual download pages in sitemap
- Proper priority configuration

---

## 🔍 **SEO Audit & Optimization**

### **Current SEO Status (October 2025)**

**Google Search Console Issues Resolved:**

- ✅ Sitemap expanded from 100 to 500 posts for better indexation
- ✅ Static generation increased from 50 to 500 posts
- ✅ Comprehensive redirect system implemented
- ✅ Enhanced 404 page with popular pages and search suggestions
- ✅ Canonical URLs implemented across all page types
- ✅ SEO audit and validation scripts created

**Key Metrics Improvements:**

- **Sitemap Coverage:** Increased from 100 to 500 posts (5x improvement)
- **Static Generation:** Increased from 50 to 500 posts (10x improvement)
- **Redirect Coverage:** Comprehensive redirect mapping for 404 resolution
- **User Experience:** Enhanced 404 page with navigation options

### **SEO Audit Tools**

**Automated SEO Validation:**

```bash
# Run comprehensive SEO audit
node scripts/audit-seo.js

# Test redirect functionality
node scripts/validate-redirects.js

# Test with custom URL
node scripts/audit-seo.js --url=https://staging.cowboykimono.com
```

**Audit Coverage:**

- Sitemap accessibility and structure validation
- Robots.txt compliance checking
- Canonical URL verification
- Meta tag validation (title, description, Open Graph)
- Image alt tag checking
- Redirect testing (301, 302, 308 status codes)
- Response time monitoring
- Internal link validation

### **Redirect Management System**

**File:** `app/lib/redirect-mappings.ts`

**Features:**

- Centralized redirect configuration
- WordPress legacy URL patterns
- WWW to non-WWW canonicalization
- Old URL pattern redirects
- Dynamic redirect management
- Redirect validation and testing

**Redirect Categories:**

- **Canonical:** WWW to non-WWW redirects
- **WordPress Legacy:** Date-based URLs, category/tag redirects
- **Old Patterns:** Deprecated URLs (shop-1, contact-2, kimono-builder)
- **Blog:** Post slug changes and updates
- **Downloads:** URL structure optimization

### **Sitemap Optimization**

**Enhanced Configuration:**

```typescript
const SITEMAP_CONFIG = {
  MAX_POSTS: 500, // Increased from 100
  MAX_CATEGORIES: 200, // Increased from 100
  MAX_TAGS: 200, // Increased from 100
  CACHE_TTL: 3600000, // 1 hour cache
  PRIORITY_DECAY: 0.1, // Priority calculation
};
```

**Content Types Included:**

1. **Core Pages** (Priority 1.0 - 0.7)
2. **Blog Posts** (Priority 0.9 - 0.3) - Dynamic based on recency
3. **Categories** (Priority 0.8 - 0.4) - Based on post count
4. **Tags** (Priority 0.7 - 0.3) - Based on post count
5. **Download Pages** (Priority 0.7 - 0.6) - Individual download pages

### **Static Generation Optimization**

**Blog Posts:** `app/blog/[slug]/page.tsx`

```typescript
// Increased from 50 to 500 posts
const posts = await fetchPosts({ per_page: 500 });
```

**Download Pages:** `app/downloads/[category]/[slug]/page.tsx`

```typescript
// Already optimized at 100 downloads
const downloads = await restAPIClient.getDownloads({
  per_page: 100,
  _embed: true,
  status: 'publish',
});
```

### **Enhanced 404 Page**

**File:** `app/not-found.tsx`

**Improvements:**

- Popular pages navigation grid
- Search suggestions
- Contact information
- Proper meta tags (noindex, follow)
- Enhanced user experience
- Internal linking strategy

### **SEO Best Practices Implementation**

**Canonical URLs:**

- All pages have proper canonical tags
- Non-WWW canonicalization enforced
- Consistent URL structure

**Meta Tags:**

- Unique title tags for all pages
- Meta descriptions (160 characters)
- Open Graph tags for social sharing
- Twitter Card optimization
- Structured data implementation

**Technical SEO:**

- Proper heading hierarchy (H1→H2→H3)
- Image alt tags for accessibility
- Internal linking strategy
- Breadcrumb navigation
- Mobile-friendly responsive design

### **Monitoring & Validation**

**Automated Testing:**

```bash
# Weekly SEO audit
npm run audit:seo

# Redirect validation
npm run validate:redirects

# Performance check
npm run audit:performance
```

**Key Metrics to Monitor:**

- Google Search Console indexation status
- 404 error reduction
- Redirect chain optimization
- Page load speed
- Core Web Vitals
- Ahrefs site health score

### **Google Search Console Integration**

**Recommended Actions:**

1. Submit updated sitemap.xml
2. Request re-indexing of fixed pages
3. Remove outdated URLs via URL Removal Tool
4. Monitor indexation status weekly
5. Track 404 error reduction

**Expected Results:**

- **Week 1-2:** 404 errors reduced from 97 to <20
- **Week 3-4:** Indexed pages increase from 78 to >150
- **Week 5-8:** "Crawled not indexed" drops from 737 to <200
- **Long-term:** Ahrefs site health score >90

### **Troubleshooting SEO Issues**

**Common Issues & Solutions:**

1. **404 Errors:**
   - Check redirect-mappings.ts for missing patterns
   - Verify Next.js redirect configuration
   - Test with validate-redirects.js script

2. **Indexation Problems:**
   - Verify sitemap.xml accessibility
   - Check robots.txt blocking rules
   - Ensure proper canonical URLs

3. **Duplicate Content:**
   - Verify canonical tag implementation
   - Check for www vs non-www issues
   - Review pagination canonical tags

4. **Slow Indexing:**
   - Increase static generation limits
   - Optimize sitemap priority values
   - Improve internal linking

**Debug Commands:**

```bash
# Test sitemap
curl https://cowboykimono.com/sitemap.xml

# Test robots.txt
curl https://cowboykimono.com/robots.txt

# Test redirects
node scripts/validate-redirects.js

# Full SEO audit
node scripts/audit-seo.js
```

- Monthly update frequency
- Canonical URL handling

**Performance:**

- Static generation for all download pages
- Image optimization with Next.js Image
- Lazy loading for thumbnails
- CDN caching headers

### **REST API Enhancements**

**New Methods:**

- `getDownloadBySlug(category, slug)` - Fetch single download
- `getFeaturedDownloads(limit)` - Get featured downloads
- `getPopularDownloads(limit)` - Get most downloaded items
- `getRelatedDownloads(downloadId, limit)` - Get similar downloads
- `getDownloadById(id)` - Get download by ID

**Enhanced Fields Support:**

- All new ACF fields integrated
- Proper type definitions
- Validation schemas
- Error handling

### **Mobile Optimization**

**Responsive Design:**

- Mobile-first approach
- Touch-friendly buttons (44x44px minimum)
- Optimized images for mobile
- Swipeable navigation
- Bottom sheet for mobile details
- Simplified mobile layout

### **Testing & Validation**

**Test Scripts:**

- `scripts/test-downloads-pages.js` - Verify page generation
- `scripts/test-download-tracking.js` - Validate analytics
- `scripts/validate-downloads-seo.js` - Check SEO implementation

**Validation Areas:**

- Individual page generation
- Download tracking functionality
- Analytics accuracy
- SEO metadata validation
- Mobile responsiveness
- Performance optimization

### **Content Management**

**WordPress Admin:**

- Easy ACF field management
- Non-technical user friendly
- Bulk operations support
- Featured download management
- Custom sorting options

**Field Configuration:**

- Required fields: `download_slug`, `download_category`
- Optional fields: All other enhanced fields
- Default values for better UX
- Validation rules
- Help text for each field

### **Deployment & Migration**

**Migration Steps:**

1. Update WordPress ACF fields (non-breaking)
2. Deploy enhanced REST API endpoints
3. Deploy individual download pages
4. Update main downloads page
5. Enable download tracking
6. Verify sitemap regeneration

**Rollback Plan:**

- New features are additive
- Existing functionality preserved
- Feature flags available
- Gradual rollout possible

### **Success Metrics**

- All individual download pages generate successfully
- Download tracking captures 100% of clicks
- Page load time < 2 seconds for download pages
- Mobile usability score > 95
- All pages indexed by Google within 1 week
- Download analytics dashboard shows accurate data
- Non-technical users can successfully add/edit downloads

---

## 🔄 **ISR & Caching System**

### **Overview**

The site now uses a robust multi-layer caching and revalidation system for optimal performance and content freshness:

1. **ISR (Incremental Static Regeneration)** - Pages revalidate automatically
2. **Redis Caching** - Distributed cache shared with WordPress
3. **SWR (Stale-While-Revalidate)** - Client-side data fetching with background refresh
4. **Circuit Breaker** - Automatic fallbacks when WordPress is unavailable

### **ISR Configuration**

| Page Type      | Revalidation Time | Webhook Trigger |
| -------------- | ----------------- | --------------- |
| Blog Posts     | 5 minutes         | Yes             |
| Blog Index     | 5 minutes         | Yes             |
| Downloads      | 10 minutes        | Yes             |
| Download Index | 10 minutes        | Yes             |

**Files:**

- `app/blog/[slug]/page.tsx` - `export const revalidate = 300`
- `app/downloads/[category]/[slug]/page.tsx` - `export const revalidate = 600`

### **WordPress Webhook Integration**

When content is created/updated in WordPress, a webhook triggers instant revalidation:

**Endpoint:** `https://cowboykimono.com/api/wordpress-webhook`

**WordPress Plugin:** `wordpress/nextjs-webhook-plugin.php`

**Installation:**

1. Copy `wordpress/nextjs-webhook-plugin.php` to `wp-content/plugins/nextjs-webhook/nextjs-webhook.php`
2. Activate in WordPress admin
3. Configure webhook URL in Settings > Next.js Webhook

### **SWR Hooks**

Client-side data fetching with automatic caching:

```typescript
// Usage examples
import { usePosts, useCategories, useTags } from '@/app/lib/hooks';

// Fetch posts with pagination
const { posts, isLoading, hasNextPage } = usePosts({ page: 1, perPage: 10 });

// Search posts
const { results, isSearching } = useSearchPosts(searchTerm);

// Fetch categories/tags
const { categories } = useCategories();
const { tags } = useTags();
```

**Features:**

- Automatic request deduplication
- Background revalidation on focus/reconnect
- Built-in error retry
- Stale-while-revalidate pattern

### **Circuit Breaker**

Protects against cascading failures when WordPress is down:

```typescript
import { getCircuitStatus, SERVICES } from '@/app/lib/circuit-breaker';

// Check WordPress API status
const status = getCircuitStatus(SERVICES.WORDPRESS_API);
// { state: 'CLOSED' | 'OPEN' | 'HALF_OPEN', failures: number, ... }
```

**States:**

- **CLOSED** - Normal operation, requests pass through
- **OPEN** - Too many failures, requests return fallback data
- **HALF_OPEN** - Testing if service recovered

**Configuration:**

- Failure threshold: 5 failures
- Reset timeout: 30 seconds
- Success threshold: 2 successes to close

### **Redis Configuration**

Redis is used for distributed caching (shared with WordPress Lightsail):

**Environment Variable:**

```env
REDIS_URL=redis://127.0.0.1:6379
```

**Key Prefix:** `nextjs:` (to avoid conflicts with WordPress Redis cache)

### **Cache Invalidation**

```typescript
import { invalidatePostCache, invalidateDownloadsCache } from '@/app/lib/cache';

// Clear specific post cache
invalidatePostCache('post-slug');

// Clear all downloads cache
invalidateDownloadsCache();
```

---

**Documentation Version:** 2.10.0  
**Last Updated:** 2025-12-09  
**Status:** Production Ready with Enhanced ISR, Redis Caching, SWR, and Circuit Breaker

**Recent Updates:**
- AWS Best Practices Audit completed (December 9, 2025)
- Comprehensive security and compliance review
- See `AWS_BEST_PRACTICES_AUDIT_REPORT.md` for full audit findings

**Implementation Status:** All major features implemented and tested. ISR enabled for blog and downloads with webhook-triggered revalidation. SWR hooks provide client-side caching with background refresh. Circuit breaker protects against WordPress API failures with automatic fallbacks. Redis integration ready for distributed caching.
