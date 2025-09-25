#!/usr/bin/env node

/**
 * Comprehensive Health Check Script for Cowboy Kimono
 * Identifies issues that could affect Ahrefs health score
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimono.com';
const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com';

class HealthChecker {
  constructor() {
    this.results = {
      score: 0,
      issues: [],
      warnings: [],
      recommendations: [],
      checks: {},
    };
  }

  async runAllChecks() {
    console.log('🔍 Running comprehensive health checks...\n');

    await Promise.all([
      this.checkHTTPS(),
      this.checkSecurityHeaders(),
      this.checkPerformance(),
      this.checkSEO(),
      this.checkAccessibility(),
      this.checkMobileOptimization(),
      this.checkAPIConnectivity(),
      this.checkCaching(),
      this.checkRobotsAndSitemap(),
      this.checkStructuredData(),
      this.checkImageOptimization(),
      this.checkCoreWebVitals(),
    ]);

    this.calculateScore();
    this.generateReport();
  }

  async checkHTTPS() {
    try {
      const url = new URL(SITE_URL);
      const isHTTPS = url.protocol === 'https:';

      this.results.checks.https = {
        status: isHTTPS ? 'pass' : 'fail',
        details: isHTTPS
          ? 'Site is served over HTTPS'
          : 'Site is not served over HTTPS',
      };

      if (!isHTTPS) {
        this.results.issues.push('Site not served over HTTPS');
      }
    } catch (error) {
      this.results.checks.https = { status: 'error', details: error.message };
    }
  }

  async checkSecurityHeaders() {
    try {
      const response = await this.makeRequest(SITE_URL);
      const headers = response.headers;

      const securityHeaders = {
        'Strict-Transport-Security': headers['strict-transport-security'],
        'X-Content-Type-Options': headers['x-content-type-options'],
        'X-Frame-Options': headers['x-frame-options'],
        'X-XSS-Protection': headers['x-xss-protection'],
        'Referrer-Policy': headers['referrer-policy'],
        'Content-Security-Policy': headers['content-security-policy'],
        'Permissions-Policy': headers['permissions-policy'],
      };

      const missingHeaders = Object.entries(securityHeaders)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      this.results.checks.securityHeaders = {
        status: missingHeaders.length === 0 ? 'pass' : 'fail',
        details:
          missingHeaders.length === 0
            ? 'All security headers present'
            : `Missing headers: ${missingHeaders.join(', ')}`,
      };

      if (missingHeaders.length > 0) {
        this.results.issues.push(
          `Missing security headers: ${missingHeaders.join(', ')}`
        );
      }
    } catch (error) {
      this.results.checks.securityHeaders = {
        status: 'error',
        details: error.message,
      };
    }
  }

  async checkPerformance() {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest(SITE_URL);
      const responseTime = Date.now() - startTime;

      this.results.checks.performance = {
        status: responseTime < 2000 ? 'pass' : 'warn',
        details: `Response time: ${responseTime}ms`,
      };

      if (responseTime > 2000) {
        this.results.warnings.push(`Slow response time: ${responseTime}ms`);
      }
    } catch (error) {
      this.results.checks.performance = {
        status: 'error',
        details: error.message,
      };
    }
  }

  async checkSEO() {
    try {
      const response = await this.makeRequest(SITE_URL);
      const html = response.data;

      const seoChecks = {
        hasTitle: /<title[^>]*>.*<\/title>/i.test(html),
        hasMetaDescription: /<meta[^>]*name=["']description["'][^>]*>/i.test(
          html
        ),
        hasCanonical: /<link[^>]*rel=["']canonical["'][^>]*>/i.test(html),
        hasOpenGraph: /<meta[^>]*property=["']og:/i.test(html),
        hasTwitterCard: /<meta[^>]*name=["']twitter:/i.test(html),
        hasStructuredData:
          /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html),
      };

      const missingSEO = Object.entries(seoChecks)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      this.results.checks.seo = {
        status: missingSEO.length === 0 ? 'pass' : 'fail',
        details:
          missingSEO.length === 0
            ? 'All SEO elements present'
            : `Missing SEO elements: ${missingSEO.join(', ')}`,
      };

      if (missingSEO.length > 0) {
        this.results.issues.push(
          `Missing SEO elements: ${missingSEO.join(', ')}`
        );
      }
    } catch (error) {
      this.results.checks.seo = { status: 'error', details: error.message };
    }
  }

  async checkAccessibility() {
    try {
      const response = await this.makeRequest(SITE_URL);
      const html = response.data;

      const a11yChecks = {
        hasLangAttribute: /<html[^>]*lang=/i.test(html),
        hasAltText: /<img[^>]*alt=/i.test(html),
        hasSkipLink: /<a[^>]*href=["']#main-content["'][^>]*>/i.test(html),
        hasARIALabels:
          /aria-label=/i.test(html) || /aria-labelledby=/i.test(html),
      };

      const missingA11y = Object.entries(a11yChecks)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      this.results.checks.accessibility = {
        status: missingA11y.length === 0 ? 'pass' : 'warn',
        details:
          missingA11y.length === 0
            ? 'All accessibility elements present'
            : `Missing accessibility elements: ${missingA11y.join(', ')}`,
      };

      if (missingA11y.length > 0) {
        this.results.warnings.push(
          `Missing accessibility elements: ${missingA11y.join(', ')}`
        );
      }
    } catch (error) {
      this.results.checks.accessibility = {
        status: 'error',
        details: error.message,
      };
    }
  }

  async checkMobileOptimization() {
    try {
      const response = await this.makeRequest(SITE_URL);
      const html = response.data;

      const mobileChecks = {
        hasViewport: /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html),
        hasTouchIcons: /<link[^>]*rel=["']apple-touch-icon["'][^>]*>/i.test(
          html
        ),
        hasMobileMeta:
          /<meta[^>]*name=["']mobile-web-app-capable["'][^>]*>/i.test(html),
      };

      const missingMobile = Object.entries(mobileChecks)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      this.results.checks.mobileOptimization = {
        status: missingMobile.length === 0 ? 'pass' : 'warn',
        details:
          missingMobile.length === 0
            ? 'All mobile optimization elements present'
            : `Missing mobile elements: ${missingMobile.join(', ')}`,
      };

      if (missingMobile.length > 0) {
        this.results.warnings.push(
          `Missing mobile optimization elements: ${missingMobile.join(', ')}`
        );
      }
    } catch (error) {
      this.results.checks.mobileOptimization = {
        status: 'error',
        details: error.message,
      };
    }
  }

  async checkAPIConnectivity() {
    try {
      const response = await this.makeRequest(
        `${API_URL}/wp-json/wp/v2/posts?per_page=1`
      );

      this.results.checks.apiConnectivity = {
        status: response.status === 200 ? 'pass' : 'fail',
        details: `API status: ${response.status}`,
      };

      if (response.status !== 200) {
        this.results.issues.push(
          `WordPress API connectivity issue: ${response.status}`
        );
      }
    } catch (error) {
      this.results.checks.apiConnectivity = {
        status: 'error',
        details: error.message,
      };
      this.results.issues.push(
        `WordPress API connection failed: ${error.message}`
      );
    }
  }

  async checkCaching() {
    try {
      // Check HTTP cache headers
      const response = await this.makeRequest(
        `${SITE_URL}/images/CK_Logo_Blog.webp`
      );
      const cacheControl = response.headers['cache-control'];

      let cacheStatus =
        cacheControl && cacheControl.includes('max-age') ? 'pass' : 'warn';
      let cacheDetails = cacheControl
        ? `Cache headers: ${cacheControl}`
        : 'No cache headers found';

      // Check Redis cache if available
      try {
        const { checkCacheHealthWithRedis } = require('../app/lib/cache');
        const redisHealth = await checkCacheHealthWithRedis();

        if (redisHealth.redisStatus === 'connected') {
          cacheStatus = 'pass';
          cacheDetails += ` | Redis: Connected (${redisHealth.stats.hitRate} hit rate)`;
        } else {
          cacheDetails += ` | Redis: ${redisHealth.redisStatus}`;
        }
      } catch (redisError) {
        cacheDetails += ' | Redis: Not available';
      }

      this.results.checks.caching = {
        status: cacheStatus,
        details: cacheDetails,
      };

      if (!cacheControl || !cacheControl.includes('max-age')) {
        this.results.warnings.push('Missing or insufficient cache headers');
      }
    } catch (error) {
      this.results.checks.caching = { status: 'error', details: error.message };
    }
  }

  async checkRobotsAndSitemap() {
    try {
      const robotsResponse = await this.makeRequest(`${SITE_URL}/robots.txt`);
      const sitemapResponse = await this.makeRequest(`${SITE_URL}/sitemap.xml`);

      this.results.checks.robotsAndSitemap = {
        status:
          robotsResponse.status === 200 && sitemapResponse.status === 200
            ? 'pass'
            : 'fail',
        details: `Robots: ${robotsResponse.status}, Sitemap: ${sitemapResponse.status}`,
      };

      if (robotsResponse.status !== 200) {
        this.results.issues.push('Robots.txt not accessible');
      }
      if (sitemapResponse.status !== 200) {
        this.results.issues.push('Sitemap.xml not accessible');
      }
    } catch (error) {
      this.results.checks.robotsAndSitemap = {
        status: 'error',
        details: error.message,
      };
    }
  }

  async checkStructuredData() {
    try {
      const response = await this.makeRequest(SITE_URL);
      const html = response.data;

      const hasOrganizationSchema = /"@type":\s*"Organization"/i.test(html);
      const hasWebSiteSchema = /"@type":\s*"WebSite"/i.test(html);
      const hasBreadcrumbSchema = /"@type":\s*"BreadcrumbList"/i.test(html);

      const schemaChecks = [
        hasOrganizationSchema,
        hasWebSiteSchema,
        hasBreadcrumbSchema,
      ];
      const presentSchemas = schemaChecks.filter(Boolean).length;

      this.results.checks.structuredData = {
        status: presentSchemas >= 2 ? 'pass' : 'warn',
        details: `${presentSchemas}/3 schema types present`,
      };

      if (presentSchemas < 2) {
        this.results.warnings.push(
          `Limited structured data: ${presentSchemas}/3 schema types`
        );
      }
    } catch (error) {
      this.results.checks.structuredData = {
        status: 'error',
        details: error.message,
      };
    }
  }

  async checkImageOptimization() {
    try {
      const response = await this.makeRequest(
        `${SITE_URL}/images/CK_Logo_Blog.webp`
      );
      const contentType = response.headers['content-type'];

      this.results.checks.imageOptimization = {
        status:
          contentType && contentType.includes('image/webp') ? 'pass' : 'warn',
        details: `Image format: ${contentType || 'unknown'}`,
      };

      if (!contentType || !contentType.includes('image/webp')) {
        this.results.warnings.push(
          'Images not optimized (WebP format recommended)'
        );
      }
    } catch (error) {
      this.results.checks.imageOptimization = {
        status: 'error',
        details: error.message,
      };
    }
  }

  async checkCoreWebVitals() {
    // This would require actual browser testing
    // For now, we'll provide recommendations
    this.results.checks.coreWebVitals = {
      status: 'info',
      details: 'Core Web Vitals require browser testing',
    };

    this.results.recommendations.push(
      'Test Core Web Vitals using Lighthouse or PageSpeed Insights'
    );
  }

  calculateScore() {
    const checks = Object.values(this.results.checks);
    const passed = checks.filter((check) => check.status === 'pass').length;
    const total = checks.length;

    this.results.score = Math.round((passed / total) * 100);
  }

  generateReport() {
    console.log('📊 Health Check Report\n');
    console.log(`Overall Score: ${this.results.score}/100\n`);

    console.log('✅ Passed Checks:');
    Object.entries(this.results.checks)
      .filter(([key, check]) => check.status === 'pass')
      .forEach(([key, check]) => {
        console.log(`  ✓ ${key}: ${check.details}`);
      });

    console.log('\n⚠️  Warnings:');
    if (this.results.warnings.length === 0) {
      console.log('  None');
    } else {
      this.results.warnings.forEach((warning) =>
        console.log(`  ⚠ ${warning}`)
      );
    }

    console.log('\n❌ Issues:');
    if (this.results.issues.length === 0) {
      console.log('  None');
    } else {
      this.results.issues.forEach((issue) => console.log(`  ✗ ${issue}`));
    }

    console.log('\n💡 Recommendations:');
    this.results.recommendations.forEach((rec) => console.log(`  💡 ${rec}`));

    console.log('\n🎯 Priority Actions:');
    if (this.results.score < 80) {
      console.log('  🔴 High Priority: Address security and SEO issues');
    } else if (this.results.score < 90) {
      console.log(
        '  🟡 Medium Priority: Optimize performance and accessibility'
      );
    } else {
      console.log('  🟢 Low Priority: Fine-tune for excellence');
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'HealthChecker/1.0',
        },
      };

      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy());
      req.end();
    });
  }
}

// Run the health check
const checker = new HealthChecker();
checker.runAllChecks().catch(console.error);
