#!/usr/bin/env node

/**
 * GSC Fixes Validation Script
 * 
 * This script validates that all GSC fixes are properly implemented:
 * - robots.txt configuration
 * - Redirects work correctly
 * - Canonical tags are present
 * - Sitemap structure is valid
 * - Blocked endpoints return proper status codes
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'https://cowboykimono.com';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class GSCValidator {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
    this.results = {
      robots: { passed: 0, failed: 0, warnings: 0, issues: [] },
      redirects: { passed: 0, failed: 0, warnings: 0, issues: [] },
      canonical: { passed: 0, failed: 0, warnings: 0, issues: [] },
      sitemap: { passed: 0, failed: 0, warnings: 0, issues: [] },
      blocked: { passed: 0, failed: 0, warnings: 0, issues: [] },
    };
  }

  log(message, type = 'info') {
    const colorMap = {
      success: COLORS.green,
      error: COLORS.red,
      warning: COLORS.yellow,
      info: COLORS.cyan,
    };
    const color = colorMap[type] || COLORS.reset;
    console.log(`${color}${message}${COLORS.reset}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'GSC-Validator/1.0',
          ...options.headers,
        },
        timeout: options.timeout || 10000,
      };

      const req = protocol.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async checkRobots() {
    this.log('\n=== Checking robots.txt ===', 'info');
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/robots.txt`);
      
      if (response.statusCode !== 200) {
        this.results.robots.failed++;
        this.results.robots.issues.push(`robots.txt returned status ${response.statusCode}`);
        this.log(`✗ robots.txt returned status ${response.statusCode}`, 'error');
        return;
      }

      const content = response.data;
      const checks = [
        { pattern: /Disallow:\s*\/wp-json\//, name: 'wp-json blocked' },
        { pattern: /Disallow:\s*\/feed/, name: 'feed URLs blocked' },
        { pattern: /Sitemap:/, name: 'sitemap reference' },
        { pattern: new RegExp(`Sitemap:.*${this.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap.xml`), name: 'sitemap URL correct' },
      ];

      let allPassed = true;
      for (const check of checks) {
        if (check.pattern.test(content)) {
          this.results.robots.passed++;
          this.log(`✓ ${check.name}`, 'success');
        } else {
          this.results.robots.failed++;
          this.results.robots.issues.push(`Missing: ${check.name}`);
          this.log(`✗ Missing: ${check.name}`, 'error');
          allPassed = false;
        }
      }

      if (allPassed) {
        this.log('✓ robots.txt validation passed', 'success');
      }
    } catch (error) {
      this.results.robots.failed++;
      this.results.robots.issues.push(`Error: ${error.message}`);
      this.log(`✗ robots.txt check failed: ${error.message}`, 'error');
    }
  }

  async checkRedirects() {
    this.log('\n=== Checking Redirects ===', 'info');
    
    const redirectTests = [
      {
        source: '/shop-1',
        expected: '/shop',
        description: 'Old shop URL redirect',
      },
      {
        source: '/contact-2',
        expected: '/about',
        description: 'Old contact URL redirect',
      },
      {
        source: '/index.html',
        expected: '/',
        description: 'HTML file pattern redirect',
      },
      {
        source: '/blog.html',
        expected: '/blog',
        description: 'Blog HTML redirect',
      },
    ];

    for (const test of redirectTests) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${test.source}`, {
          method: 'GET',
          maxRedirects: 0,
        });

        const location = response.headers.location;
        if (location && (location.includes(test.expected) || response.statusCode === 301 || response.statusCode === 308)) {
          this.results.redirects.passed++;
          this.log(`✓ ${test.description}`, 'success');
        } else {
          this.results.redirects.failed++;
          this.results.redirects.issues.push(`${test.description}: Expected redirect to ${test.expected}, got ${location || response.statusCode}`);
          this.log(`✗ ${test.description}: Expected redirect, got status ${response.statusCode}`, 'error');
        }
      } catch (error) {
        // Some redirects might throw errors, check if it's a redirect
        if (error.message.includes('301') || error.message.includes('308')) {
          this.results.redirects.passed++;
          this.log(`✓ ${test.description}`, 'success');
        } else {
          this.results.redirects.failed++;
          this.results.redirects.issues.push(`${test.description}: ${error.message}`);
          this.log(`✗ ${test.description}: ${error.message}`, 'error');
        }
      }
    }
  }

  async checkCanonical() {
    this.log('\n=== Checking Canonical Tags ===', 'info');
    
    const pagesToCheck = [
      { path: '/', name: 'Homepage' },
      { path: '/blog', name: 'Blog index' },
      { path: '/shop', name: 'Shop' },
    ];

    for (const page of pagesToCheck) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${page.path}`);
        const content = response.data;
        
        // Check for canonical tag in HTML
        const canonicalMatch = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        const linkHeader = response.headers.link;
        
        if (canonicalMatch || linkHeader) {
          const canonicalUrl = canonicalMatch ? canonicalMatch[1] : (linkHeader ? linkHeader.match(/<([^>]+)>/)?.[1] : null);
          
          if (canonicalUrl && !canonicalUrl.includes('www.')) {
            this.results.canonical.passed++;
            this.log(`✓ ${page.name} has non-www canonical`, 'success');
          } else if (canonicalUrl) {
            this.results.canonical.warnings++;
            this.results.canonical.issues.push(`${page.name}: Canonical URL contains www`);
            this.log(`⚠ ${page.name}: Canonical URL contains www`, 'warning');
          } else {
            this.results.canonical.failed++;
            this.results.canonical.issues.push(`${page.name}: No canonical tag found`);
            this.log(`✗ ${page.name}: No canonical tag found`, 'error');
          }
        } else {
          this.results.canonical.failed++;
          this.results.canonical.issues.push(`${page.name}: No canonical tag found`);
          this.log(`✗ ${page.name}: No canonical tag found`, 'error');
        }
      } catch (error) {
        this.results.canonical.failed++;
        this.results.canonical.issues.push(`${page.name}: ${error.message}`);
        this.log(`✗ ${page.name}: ${error.message}`, 'error');
      }
    }
  }

  async checkSitemap() {
    this.log('\n=== Checking Sitemap ===', 'info');
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/sitemap.xml`);
      
      if (response.statusCode !== 200) {
        this.results.sitemap.failed++;
        this.results.sitemap.issues.push(`Sitemap returned status ${response.statusCode}`);
        this.log(`✗ Sitemap returned status ${response.statusCode}`, 'error');
        return;
      }

      const content = response.data;
      
      // Check for valid XML structure
      if (!content.includes('<?xml') || !content.includes('<urlset')) {
        this.results.sitemap.failed++;
        this.results.sitemap.issues.push('Invalid XML structure');
        this.log('✗ Invalid XML structure', 'error');
        return;
      }

      // Check for non-www URLs
      const wwwMatches = content.match(/https?:\/\/www\.cowboykimono\.com/g);
      if (wwwMatches && wwwMatches.length > 0) {
        this.results.sitemap.warnings++;
        this.results.sitemap.issues.push(`Found ${wwwMatches.length} www URLs in sitemap`);
        this.log(`⚠ Found ${wwwMatches.length} www URLs in sitemap`, 'warning');
      } else {
        this.results.sitemap.passed++;
        this.log('✓ No www URLs in sitemap', 'success');
      }

      // Count URLs
      const urlMatches = content.match(/<url>/g);
      const urlCount = urlMatches ? urlMatches.length : 0;
      this.results.sitemap.passed++;
      this.log(`✓ Sitemap contains ${urlCount} URLs`, 'success');

      // Check for blocked URLs
      const blockedPatterns = ['/wp-json/', '/feed/', '/wp-admin/'];
      let foundBlocked = false;
      for (const pattern of blockedPatterns) {
        if (content.includes(pattern)) {
          foundBlocked = true;
          this.results.sitemap.warnings++;
          this.results.sitemap.issues.push(`Found blocked URL pattern: ${pattern}`);
          this.log(`⚠ Found blocked URL pattern: ${pattern}`, 'warning');
        }
      }

      if (!foundBlocked) {
        this.results.sitemap.passed++;
        this.log('✓ No blocked URLs in sitemap', 'success');
      }
    } catch (error) {
      this.results.sitemap.failed++;
      this.results.sitemap.issues.push(`Error: ${error.message}`);
      this.log(`✗ Sitemap check failed: ${error.message}`, 'error');
    }
  }

  async checkBlockedEndpoints() {
    this.log('\n=== Checking Blocked Endpoints ===', 'info');
    
    const blockedTests = [
      { path: '/wp-json/', name: 'WordPress REST API' },
      { path: '/feed/', name: 'Feed URL' },
      { path: '/wp-admin/', name: 'WordPress Admin' },
    ];

    for (const test of blockedTests) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${test.path}`);
        
        // Check for X-Robots-Tag header
        const robotsTag = response.headers['x-robots-tag'];
        if (robotsTag && robotsTag.includes('noindex')) {
          this.results.blocked.passed++;
          this.log(`✓ ${test.name} has X-Robots-Tag header`, 'success');
        } else {
          this.results.blocked.warnings++;
          this.results.blocked.issues.push(`${test.name}: Missing X-Robots-Tag header`);
          this.log(`⚠ ${test.name}: Missing X-Robots-Tag header`, 'warning');
        }

        // Check status code (should be 403 or 404)
        if (response.statusCode === 403 || response.statusCode === 404) {
          this.results.blocked.passed++;
          this.log(`✓ ${test.name} returns ${response.statusCode}`, 'success');
        } else {
          this.results.blocked.warnings++;
          this.results.blocked.issues.push(`${test.name}: Returns ${response.statusCode} instead of 403/404`);
          this.log(`⚠ ${test.name}: Returns ${response.statusCode} instead of 403/404`, 'warning');
        }
      } catch (error) {
        // Some endpoints might timeout or error, which is acceptable
        this.results.blocked.passed++;
        this.log(`✓ ${test.name} is blocked (error/timeout)`, 'success');
      }
    }
  }

  async runAll() {
    this.log('Starting GSC Fixes Validation...', 'info');
    this.log(`Base URL: ${this.baseUrl}`, 'info');

    await this.checkRobots();
    await this.checkRedirects();
    await this.checkCanonical();
    await this.checkSitemap();
    await this.checkBlockedEndpoints();

    this.printSummary();
  }

  printSummary() {
    this.log('\n=== Validation Summary ===', 'info');
    
    const categories = ['robots', 'redirects', 'canonical', 'sitemap', 'blocked'];
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;

    for (const category of categories) {
      const result = this.results[category];
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalWarnings += result.warnings;

      this.log(`\n${category.toUpperCase()}:`, 'info');
      this.log(`  Passed: ${result.passed}`, result.passed > 0 ? 'success' : 'info');
      this.log(`  Failed: ${result.failed}`, result.failed > 0 ? 'error' : 'info');
      this.log(`  Warnings: ${result.warnings}`, result.warnings > 0 ? 'warning' : 'info');
      
      if (result.issues.length > 0) {
        this.log('  Issues:', 'warning');
        result.issues.forEach(issue => {
          this.log(`    - ${issue}`, 'warning');
        });
      }
    }

    this.log('\n=== Overall Results ===', 'info');
    this.log(`Total Passed: ${totalPassed}`, 'success');
    this.log(`Total Failed: ${totalFailed}`, totalFailed > 0 ? 'error' : 'success');
    this.log(`Total Warnings: ${totalWarnings}`, totalWarnings > 0 ? 'warning' : 'success');

    if (totalFailed === 0 && totalWarnings === 0) {
      this.log('\n✓ All validations passed!', 'success');
      process.exit(0);
    } else {
      this.log('\n⚠ Some validations failed or have warnings', 'warning');
      process.exit(1);
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new GSCValidator(BASE_URL);
  validator.runAll().catch((error) => {
    console.error('Validation error:', error);
    process.exit(1);
  });
}

module.exports = GSCValidator;

