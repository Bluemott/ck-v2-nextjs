#!/usr/bin/env node

/**
 * Redirect Validation Script for Cowboy Kimono v2
 *
 * This script tests all redirects to ensure they:
 * - Return proper 301/302 status codes
 * - Redirect to correct destinations
 * - Don't create redirect chains
 * - Have reasonable response times
 *
 * Usage: node scripts/validate-redirects.js [--url=https://cowboykimono.com]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_BASE_URL = 'https://cowboykimono.com';
const VALIDATION_CONFIG = {
  timeout: 10000,
  maxRedirects: 5,
  userAgent: 'Redirect-Validator/1.0',
  followRedirects: true,
  checkResponseTime: true,
  maxResponseTime: 3000, // 3 seconds
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

class RedirectValidator {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      redirects: [],
      chains: [],
      slowRedirects: [],
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
      const startTime = Date.now();
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': VALIDATION_CONFIG.userAgent,
          ...options.headers,
        },
        timeout: VALIDATION_CONFIG.timeout,
      };

      const req = client.request(requestOptions, (res) => {
        const responseTime = Date.now() - startTime;
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            url: url,
            responseTime: responseTime,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  async testRedirect(sourceUrl, expectedDestination, expectedStatus = 301) {
    this.log(`Testing redirect: ${sourceUrl} → ${expectedDestination}`, 'info');
    this.results.total++;

    try {
      const response = await this.makeRequest(sourceUrl);

      // Check status code (accept 301, 302, and 308 as valid redirects)
      if (
        response.statusCode !== expectedStatus &&
        response.statusCode !== 302 &&
        response.statusCode !== 308
      ) {
        this.results.failed++;
        this.results.redirects.push({
          source: sourceUrl,
          expected: expectedDestination,
          actual: response.headers.location || 'No location header',
          status: response.statusCode,
          expectedStatus: expectedStatus,
          result: 'FAILED',
          issue: `Expected status ${expectedStatus}, got ${response.statusCode}`,
          responseTime: response.responseTime,
        });
        this.log(
          `✗ FAILED: ${sourceUrl} - Status ${response.statusCode} (expected ${expectedStatus})`,
          'error'
        );
        return;
      }

      // Check location header
      const location = response.headers.location;
      if (!location) {
        this.results.failed++;
        this.results.redirects.push({
          source: sourceUrl,
          expected: expectedDestination,
          actual: 'No location header',
          status: response.statusCode,
          expectedStatus: expectedStatus,
          result: 'FAILED',
          issue: 'Missing location header',
          responseTime: response.responseTime,
        });
        this.log(`✗ FAILED: ${sourceUrl} - No location header`, 'error');
        return;
      }

      // Check if destination matches (allowing for protocol differences)
      const normalizedExpected = expectedDestination.replace(
        /^https?:\/\//,
        ''
      );
      const normalizedActual = location.replace(/^https?:\/\//, '');

      if (!normalizedActual.includes(normalizedExpected)) {
        this.results.failed++;
        this.results.redirects.push({
          source: sourceUrl,
          expected: expectedDestination,
          actual: location,
          status: response.statusCode,
          expectedStatus: expectedStatus,
          result: 'FAILED',
          issue: `Expected destination ${expectedDestination}, got ${location}`,
          responseTime: response.responseTime,
        });
        this.log(
          `✗ FAILED: ${sourceUrl} - Wrong destination (${location})`,
          'error'
        );
        return;
      }

      // Check response time
      if (
        VALIDATION_CONFIG.checkResponseTime &&
        response.responseTime > VALIDATION_CONFIG.maxResponseTime
      ) {
        this.results.warnings++;
        this.results.slowRedirects.push({
          source: sourceUrl,
          responseTime: response.responseTime,
          maxTime: VALIDATION_CONFIG.maxResponseTime,
        });
        this.log(
          `⚠ WARNING: ${sourceUrl} - Slow response (${response.responseTime}ms)`,
          'warning'
        );
      }

      this.results.passed++;
      this.results.redirects.push({
        source: sourceUrl,
        expected: expectedDestination,
        actual: location,
        status: response.statusCode,
        expectedStatus: expectedStatus,
        result: 'PASSED',
        responseTime: response.responseTime,
      });
      this.log(
        `✓ PASSED: ${sourceUrl} → ${location} (${response.responseTime}ms)`,
        'success'
      );
    } catch (error) {
      this.results.failed++;
      this.results.redirects.push({
        source: sourceUrl,
        expected: expectedDestination,
        actual: 'Error',
        status: 'ERROR',
        expectedStatus: expectedStatus,
        result: 'FAILED',
        issue: error.message,
        responseTime: 0,
      });
      this.log(`✗ ERROR: ${sourceUrl} - ${error.message}`, 'error');
    }
  }

  async testRedirectChain(sourceUrl, maxDepth = 5) {
    this.log(`Testing redirect chain for: ${sourceUrl}`, 'info');

    let currentUrl = sourceUrl;
    const chain = [currentUrl];
    let depth = 0;

    while (depth < maxDepth) {
      try {
        const response = await this.makeRequest(currentUrl);

        if (response.statusCode < 300 || response.statusCode >= 400) {
          // Not a redirect, chain ends
          break;
        }

        const location = response.headers.location;
        if (!location) {
          break;
        }

        // Check if we're back to a URL we've already seen (loop detection)
        if (chain.includes(location)) {
          this.results.chains.push({
            source: sourceUrl,
            chain: chain,
            issue: 'Redirect loop detected',
            depth: depth + 1,
          });
          this.log(
            `⚠ WARNING: Redirect loop detected for ${sourceUrl}`,
            'warning'
          );
          return;
        }

        chain.push(location);
        currentUrl = location;
        depth++;

        if (depth >= maxDepth) {
          this.results.chains.push({
            source: sourceUrl,
            chain: chain,
            issue: 'Redirect chain too long',
            depth: depth,
          });
          this.log(
            `⚠ WARNING: Redirect chain too long for ${sourceUrl} (${depth} redirects)`,
            'warning'
          );
          return;
        }
      } catch (error) {
        this.log(
          `✗ ERROR: Chain test failed for ${sourceUrl} - ${error.message}`,
          'error'
        );
        return;
      }
    }

    if (chain.length > 1) {
      this.log(
        `✓ Chain test passed for ${sourceUrl} (${chain.length} redirects)`,
        'success'
      );
    }
  }

  getTestRedirects() {
    return [
      // WWW to non-WWW redirects
      {
        source: 'https://www.cowboykimono.com',
        destination: 'https://cowboykimono.com',
        status: 301,
      },
      {
        source: 'https://www.cowboykimono.com/',
        destination: 'https://cowboykimono.com/',
        status: 301,
      },
      {
        source: 'https://www.cowboykimono.com/blog',
        destination: 'https://cowboykimono.com/blog',
        status: 301,
      },
      {
        source: 'https://www.cowboykimono.com/shop',
        destination: 'https://cowboykimono.com/shop',
        status: 301,
      },

      // Old URL redirects
      {
        source: 'https://cowboykimono.com/shop-1',
        destination: 'https://cowboykimono.com/shop',
        status: 301,
      },
      {
        source: 'https://cowboykimono.com/contact-2',
        destination: 'https://cowboykimono.com/about',
        status: 301,
      },
      {
        source: 'https://cowboykimono.com/kimono-builder',
        destination: 'https://cowboykimono.com/custom-kimonos',
        status: 301,
      },

      // Blog post redirects
      {
        source:
          'https://cowboykimono.com/blog/how-to-create-a-hip-jackalope-display',
        destination:
          'https://cowboykimono.com/blog/jackalope-garden-display-diy',
        status: 301,
      },

      // WordPress legacy redirects (if they exist)
      {
        source: 'https://cowboykimono.com/feed',
        destination: 'https://cowboykimono.com/feed.xml',
        status: 301,
      },
    ];
  }

  async runValidation() {
    this.log('Starting redirect validation...', 'info');
    this.log(`Base URL: ${this.baseUrl}`, 'info');

    const testRedirects = this.getTestRedirects();

    // Test individual redirects
    for (const redirect of testRedirects) {
      await this.testRedirect(
        redirect.source,
        redirect.destination,
        redirect.status
      );
    }

    // Test redirect chains for key URLs
    const chainTestUrls = [
      'https://www.cowboykimono.com',
      'https://www.cowboykimono.com/blog',
      'https://cowboykimono.com/shop-1',
    ];

    for (const url of chainTestUrls) {
      await this.testRedirectChain(url);
    }

    // Generate report
    this.generateReport();
  }

  generateReport() {
    this.log('\n' + '='.repeat(80), 'info');
    this.log('REDIRECT VALIDATION REPORT', 'bright');
    this.log('='.repeat(80), 'info');

    // Summary
    this.log(`\nSUMMARY:`, 'bright');
    this.log(`Total Tests: ${this.results.total}`, 'info');
    this.log(
      `Passed: ${this.results.passed}`,
      this.results.passed > 0 ? 'success' : 'info'
    );
    this.log(
      `Failed: ${this.results.failed}`,
      this.results.failed > 0 ? 'error' : 'info'
    );
    this.log(
      `Warnings: ${this.results.warnings}`,
      this.results.warnings > 0 ? 'warning' : 'info'
    );

    // Failed redirects
    if (this.results.failed > 0) {
      this.log(`\nFAILED REDIRECTS:`, 'error');
      this.results.redirects
        .filter((r) => r.result === 'FAILED')
        .forEach((redirect) => {
          this.log(`  ✗ ${redirect.source}`, 'error');
          this.log(`    Expected: ${redirect.expected}`, 'error');
          this.log(`    Actual: ${redirect.actual}`, 'error');
          this.log(`    Issue: ${redirect.issue}`, 'error');
        });
    }

    // Slow redirects
    if (this.results.slowRedirects.length > 0) {
      this.log(`\nSLOW REDIRECTS:`, 'warning');
      this.results.slowRedirects.forEach((redirect) => {
        this.log(
          `  ⚠ ${redirect.source} - ${redirect.responseTime}ms (max: ${redirect.maxTime}ms)`,
          'warning'
        );
      });
    }

    // Redirect chains
    if (this.results.chains.length > 0) {
      this.log(`\nREDIRECT CHAINS:`, 'warning');
      this.results.chains.forEach((chain) => {
        this.log(`  ⚠ ${chain.source} - ${chain.issue}`, 'warning');
        this.log(`    Chain: ${chain.chain.join(' → ')}`, 'warning');
      });
    }

    // Passed redirects (summary)
    const passedRedirects = this.results.redirects.filter(
      (r) => r.result === 'PASSED'
    );
    if (passedRedirects.length > 0) {
      this.log(`\nPASSED REDIRECTS:`, 'success');
      passedRedirects.forEach((redirect) => {
        this.log(
          `  ✓ ${redirect.source} → ${redirect.actual} (${redirect.responseTime}ms)`,
          'success'
        );
      });
    }

    // Final result
    this.log('\n' + '='.repeat(80), 'info');
    if (this.results.failed === 0) {
      this.log('🎉 ALL REDIRECTS WORKING CORRECTLY!', 'success');
    } else {
      this.log(
        `⚠️  ${this.results.failed} REDIRECT(S) NEED ATTENTION`,
        'warning'
      );
    }
    this.log('='.repeat(80), 'info');
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
Redirect Validation Script for Cowboy Kimono v2

Usage: node scripts/validate-redirects.js [options]

Options:
  --url=<url>    Base URL to test (default: ${DEFAULT_BASE_URL})
  --help, -h     Show this help message

Examples:
  node scripts/validate-redirects.js
  node scripts/validate-redirects.js --url=https://staging.cowboykimono.com
      `);
      process.exit(0);
    }
  }

  const validator = new RedirectValidator(baseUrl);
  await validator.runValidation();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = RedirectValidator;
