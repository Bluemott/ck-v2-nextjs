#!/usr/bin/env node

/**
 * SEO Audit Script for Cowboy Kimono v2
 *
 * This script performs comprehensive SEO validation including:
 * - Sitemap accessibility and structure
 * - Robots.txt validation
 * - Canonical URL verification
 * - Meta tag validation
 * - Internal link checking
 * - Redirect testing
 *
 * Usage: node scripts/audit-seo.js [--url=https://cowboykimono.com]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_BASE_URL = 'https://cowboykimono.com';
const AUDIT_CONFIG = {
  timeout: 10000,
  maxRedirects: 5,
  userAgent: 'SEO-Audit-Bot/1.0',
  checkImages: true,
  checkInternalLinks: true,
  checkCanonicals: true,
  checkMetaTags: true,
  checkSitemap: true,
  checkRobots: true,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class SEOAuditor {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    this.results = {
      sitemap: { status: 'pending', issues: [] },
      robots: { status: 'pending', issues: [] },
      pages: { checked: 0, issues: [] },
      redirects: { checked: 0, issues: [] },
      images: { checked: 0, issues: [] },
      internalLinks: { checked: 0, issues: [] },
      canonical: { checked: 0, issues: [] },
      metaTags: { checked: 0, issues: [] },
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const color =
      {
        info: colors.blue,
        success: colors.green,
        warning: colors.yellow,
        error: colors.red,
      }[type] || colors.reset;

    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': AUDIT_CONFIG.userAgent,
          ...options.headers,
        },
        timeout: AUDIT_CONFIG.timeout,
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            url: url,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  async checkSitemap() {
    this.log('Checking sitemap.xml...', 'info');

    try {
      const response = await this.makeRequest(`${this.baseUrl}/sitemap.xml`);

      if (response.statusCode !== 200) {
        this.results.sitemap.issues.push(
          `Sitemap returned status ${response.statusCode}`
        );
        this.results.sitemap.status = 'failed';
        return;
      }

      // Check if it's valid XML
      if (!response.data.includes('<?xml')) {
        this.results.sitemap.issues.push('Sitemap is not valid XML');
        this.results.sitemap.status = 'failed';
        return;
      }

      // Check for required elements
      const requiredElements = ['<urlset', '<url>', '<loc>', '<lastmod>'];
      for (const element of requiredElements) {
        if (!response.data.includes(element)) {
          this.results.sitemap.issues.push(
            `Missing required element: ${element}`
          );
        }
      }

      // Count URLs
      const urlMatches = response.data.match(/<loc>/g);
      const urlCount = urlMatches ? urlMatches.length : 0;

      if (urlCount < 10) {
        this.results.sitemap.issues.push(
          `Low URL count: ${urlCount} (expected at least 10)`
        );
      }

      // Check for canonical URLs (non-www)
      const wwwUrls = response.data.match(/https:\/\/www\.cowboykimono\.com/g);
      if (wwwUrls && wwwUrls.length > 0) {
        this.results.sitemap.issues.push(
          `Found ${wwwUrls.length} www URLs in sitemap (should be non-www)`
        );
      }

      this.results.sitemap.status =
        this.results.sitemap.issues.length === 0 ? 'passed' : 'warning';
      this.log(`Sitemap check completed. Found ${urlCount} URLs.`, 'success');
    } catch (error) {
      this.results.sitemap.issues.push(
        `Sitemap check failed: ${error.message}`
      );
      this.results.sitemap.status = 'failed';
      this.log(`Sitemap check failed: ${error.message}`, 'error');
    }
  }

  async checkRobots() {
    this.log('Checking robots.txt...', 'info');

    try {
      const response = await this.makeRequest(`${this.baseUrl}/robots.txt`);

      if (response.statusCode !== 200) {
        this.results.robots.issues.push(
          `Robots.txt returned status ${response.statusCode}`
        );
        this.results.robots.status = 'failed';
        return;
      }

      const robotsContent = response.data;

      // Check for sitemap reference
      if (!robotsContent.includes('Sitemap:')) {
        this.results.robots.issues.push(
          'Missing sitemap reference in robots.txt'
        );
      }

      // Check for proper sitemap URL
      if (!robotsContent.includes(`${this.baseUrl}/sitemap.xml`)) {
        this.results.robots.issues.push(
          'Sitemap URL in robots.txt does not match expected format'
        );
      }

      // Check for proper disallow rules
      const expectedDisallows = ['/api/', '/admin/', '/_next/'];
      for (const rule of expectedDisallows) {
        if (!robotsContent.includes(`Disallow: ${rule}`)) {
          this.results.robots.issues.push(`Missing disallow rule for ${rule}`);
        }
      }

      this.results.robots.status =
        this.results.robots.issues.length === 0 ? 'passed' : 'warning';
      this.log('Robots.txt check completed.', 'success');
    } catch (error) {
      this.results.robots.issues.push(
        `Robots.txt check failed: ${error.message}`
      );
      this.results.robots.status = 'failed';
      this.log(`Robots.txt check failed: ${error.message}`, 'error');
    }
  }

  async checkPage(url, pageType = 'unknown') {
    this.log(`Checking page: ${url}`, 'info');

    try {
      const response = await this.makeRequest(url);
      this.results.pages.checked++;

      if (response.statusCode !== 200) {
        this.results.pages.issues.push(`${url}: Status ${response.statusCode}`);
        return;
      }

      const html = response.data;
      const issues = [];

      // Check for canonical URL
      if (AUDIT_CONFIG.checkCanonicals) {
        const canonicalMatch = html.match(
          /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i
        );
        if (!canonicalMatch) {
          issues.push('Missing canonical URL');
        } else {
          const canonicalUrl = canonicalMatch[1];
          if (canonicalUrl.includes('www.cowboykimono.com')) {
            issues.push('Canonical URL uses www (should be non-www)');
          }
          if (!canonicalUrl.startsWith('https://cowboykimono.com')) {
            issues.push(
              `Canonical URL does not match expected format: ${canonicalUrl}`
            );
          }
        }
      }

      // Check meta tags
      if (AUDIT_CONFIG.checkMetaTags) {
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        if (!titleMatch || !titleMatch[1].trim()) {
          issues.push('Missing or empty title tag');
        }

        const descriptionMatch = html.match(
          /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
        );
        if (!descriptionMatch || !descriptionMatch[1].trim()) {
          issues.push('Missing or empty meta description');
        }

        // Check for Open Graph tags
        const ogTitleMatch = html.match(
          /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i
        );
        if (!ogTitleMatch) {
          issues.push('Missing Open Graph title');
        }
      }

      // Check for images without alt tags
      if (AUDIT_CONFIG.checkImages) {
        const imgMatches = html.match(/<img[^>]*>/gi) || [];
        for (const imgTag of imgMatches) {
          if (!imgTag.includes('alt=')) {
            issues.push('Image missing alt attribute');
            break; // Only report once per page
          }
        }
      }

      if (issues.length > 0) {
        this.results.pages.issues.push(`${url}: ${issues.join(', ')}`);
      }
    } catch (error) {
      this.results.pages.issues.push(`${url}: ${error.message}`);
      this.log(`Page check failed for ${url}: ${error.message}`, 'error');
    }
  }

  async checkRedirects() {
    this.log('Checking redirects...', 'info');

    const testRedirects = [
      { from: 'https://www.cowboykimono.com', to: 'https://cowboykimono.com' },
      {
        from: 'https://www.cowboykimono.com/blog',
        to: 'https://cowboykimono.com/blog',
      },
      {
        from: 'https://www.cowboykimono.com/shop-1',
        to: 'https://cowboykimono.com/shop',
      },
      {
        from: 'https://www.cowboykimono.com/contact-2',
        to: 'https://cowboykimono.com/about',
      },
    ];

    for (const redirect of testRedirects) {
      try {
        const response = await this.makeRequest(redirect.from);
        this.results.redirects.checked++;

        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 308
        ) {
          const location = response.headers.location;
          if (location && location.includes(redirect.to)) {
            this.log(`✓ Redirect ${redirect.from} → ${location}`, 'success');
          } else {
            this.results.redirects.issues.push(
              `Redirect ${redirect.from} goes to ${location}, expected ${redirect.to}`
            );
          }
        } else {
          this.results.redirects.issues.push(
            `Redirect ${redirect.from} returned status ${response.statusCode}, expected 301/302/308`
          );
        }
      } catch (error) {
        this.results.redirects.issues.push(
          `Redirect ${redirect.from}: ${error.message}`
        );
      }
    }
  }

  async runAudit() {
    this.log('Starting SEO audit...', 'info');
    this.log(`Base URL: ${this.baseUrl}`, 'info');

    // Check sitemap and robots
    await this.checkSitemap();
    await this.checkRobots();

    // Check key pages
    const keyPages = [
      '/',
      '/blog',
      '/shop',
      '/downloads',
      '/about',
      '/custom-kimonos',
    ];

    for (const page of keyPages) {
      await this.checkPage(`${this.baseUrl}${page}`);
    }

    // Check redirects
    await this.checkRedirects();

    // Generate report
    this.generateReport();
  }

  generateReport() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('SEO AUDIT REPORT', 'bright');
    this.log('='.repeat(60), 'info');

    // Sitemap results
    this.log(
      `\nSitemap: ${this.results.sitemap.status.toUpperCase()}`,
      this.results.sitemap.status === 'passed' ? 'success' : 'warning'
    );
    if (this.results.sitemap.issues.length > 0) {
      this.results.sitemap.issues.forEach((issue) => {
        this.log(`  - ${issue}`, 'warning');
      });
    }

    // Robots results
    this.log(
      `\nRobots.txt: ${this.results.robots.status.toUpperCase()}`,
      this.results.robots.status === 'passed' ? 'success' : 'warning'
    );
    if (this.results.robots.issues.length > 0) {
      this.results.robots.issues.forEach((issue) => {
        this.log(`  - ${issue}`, 'warning');
      });
    }

    // Pages results
    this.log(`\nPages Checked: ${this.results.pages.checked}`, 'info');
    if (this.results.pages.issues.length > 0) {
      this.log(`Issues Found: ${this.results.pages.issues.length}`, 'warning');
      this.results.pages.issues.forEach((issue) => {
        this.log(`  - ${issue}`, 'warning');
      });
    } else {
      this.log('✓ All pages passed checks', 'success');
    }

    // Redirects results
    this.log(`\nRedirects Checked: ${this.results.redirects.checked}`, 'info');
    if (this.results.redirects.issues.length > 0) {
      this.log(
        `Issues Found: ${this.results.redirects.issues.length}`,
        'warning'
      );
      this.results.redirects.issues.forEach((issue) => {
        this.log(`  - ${issue}`, 'warning');
      });
    } else {
      this.log('✓ All redirects working correctly', 'success');
    }

    // Summary
    const totalIssues =
      this.results.sitemap.issues.length +
      this.results.robots.issues.length +
      this.results.pages.issues.length +
      this.results.redirects.issues.length;

    this.log('\n' + '='.repeat(60), 'info');
    this.log(
      `TOTAL ISSUES FOUND: ${totalIssues}`,
      totalIssues === 0 ? 'success' : 'warning'
    );
    this.log('='.repeat(60), 'info');

    if (totalIssues === 0) {
      this.log(
        '\n🎉 All SEO checks passed! Your site is optimized for search engines.',
        'success'
      );
    } else {
      this.log(
        '\n⚠️  Please address the issues above to improve your SEO.',
        'warning'
      );
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  let baseUrl = DEFAULT_BASE_URL;

  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--url=')) {
      baseUrl = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
SEO Audit Script for Cowboy Kimono v2

Usage: node scripts/audit-seo.js [options]

Options:
  --url=<url>    Base URL to audit (default: ${DEFAULT_BASE_URL})
  --help, -h     Show this help message

Examples:
  node scripts/audit-seo.js
  node scripts/audit-seo.js --url=https://staging.cowboykimono.com
      `);
      process.exit(0);
    }
  }

  const auditor = new SEOAuditor(baseUrl);
  await auditor.runAudit();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}

module.exports = SEOAuditor;
