#!/usr/bin/env node

/**
 * Structured Data Validation Script
 * Tests enhanced structured data implementation
 * 
 * Usage: node scripts/test-structured-data.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class StructuredDataTester {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimono.com';
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async run() {
    console.log('🔍 Testing Enhanced Structured Data Implementation...\n');

    // Test different page types
    await this.testHomePage();
    await this.testBlogPage();
    await this.testShopPage();
    await this.testBlogPostPage();
    await this.testStructuredDataValidation();

    this.printResults();
  }

  async testHomePage() {
    console.log('📄 Testing Home Page Structured Data...');
    
    try {
      const html = await this.fetchPage('/');
      const structuredData = this.extractStructuredData(html);
      
      // Check for Organization schema
      const orgSchema = structuredData.find(sd => sd['@type'] === 'Organization');
      if (orgSchema) {
        this.addResult('Home Page - Organization Schema', true, 'Organization schema found');
        this.validateOrganizationSchema(orgSchema);
      } else {
        this.addResult('Home Page - Organization Schema', false, 'Organization schema missing');
      }

      // Check for WebSite schema
      const websiteSchema = structuredData.find(sd => sd['@type'] === 'WebSite');
      if (websiteSchema) {
        this.addResult('Home Page - WebSite Schema', true, 'WebSite schema found');
        this.validateWebsiteSchema(websiteSchema);
      } else {
        this.addResult('Home Page - WebSite Schema', false, 'WebSite schema missing');
      }

    } catch (error) {
      this.addResult('Home Page - Fetch Error', false, error.message);
    }
  }

  async testBlogPage() {
    console.log('📝 Testing Blog Page Structured Data...');
    
    try {
      const html = await this.fetchPage('/blog');
      const structuredData = this.extractStructuredData(html);
      
      // Check for Blog schema
      const blogSchema = structuredData.find(sd => sd['@type'] === 'Blog');
      if (blogSchema) {
        this.addResult('Blog Page - Blog Schema', true, 'Blog schema found');
      } else {
        this.addResult('Blog Page - Blog Schema', false, 'Blog schema missing');
      }

    } catch (error) {
      this.addResult('Blog Page - Fetch Error', false, error.message);
    }
  }

  async testShopPage() {
    console.log('🛍️ Testing Shop Page Structured Data...');
    
    try {
      const html = await this.fetchPage('/shop');
      const structuredData = this.extractStructuredData(html);
      
      // Check for Product schema
      const productSchema = structuredData.find(sd => sd['@type'] === 'Product');
      if (productSchema) {
        this.addResult('Shop Page - Product Schema', true, 'Product schema found');
        this.validateProductSchema(productSchema);
      } else {
        this.addResult('Shop Page - Product Schema', false, 'Product schema missing');
      }

      // Check for FAQ schema
      const faqSchema = structuredData.find(sd => sd['@type'] === 'FAQPage');
      if (faqSchema) {
        this.addResult('Shop Page - FAQ Schema', true, 'FAQ schema found');
        this.validateFAQSchema(faqSchema);
      } else {
        this.addResult('Shop Page - FAQ Schema', false, 'FAQ schema missing');
      }

    } catch (error) {
      this.addResult('Shop Page - Fetch Error', false, error.message);
    }
  }

  async testBlogPostPage() {
    console.log('📰 Testing Blog Post Page Structured Data...');
    
    try {
      // Get a sample blog post
      const postsResponse = await this.fetchPage('/api/posts?per_page=1');
      const posts = JSON.parse(postsResponse);
      
      if (posts && posts.length > 0) {
        const post = posts[0];
        const html = await this.fetchPage(`/blog/${post.slug}`);
        const structuredData = this.extractStructuredData(html);
        
        // Check for BlogPosting schema
        const blogPostSchema = structuredData.find(sd => sd['@type'] === 'BlogPosting');
        if (blogPostSchema) {
          this.addResult('Blog Post - BlogPosting Schema', true, 'BlogPosting schema found');
          this.validateBlogPostSchema(blogPostSchema);
        } else {
          this.addResult('Blog Post - BlogPosting Schema', false, 'BlogPosting schema missing');
        }

        // Check for BreadcrumbList schema
        const breadcrumbSchema = structuredData.find(sd => sd['@type'] === 'BreadcrumbList');
        if (breadcrumbSchema) {
          this.addResult('Blog Post - Breadcrumb Schema', true, 'BreadcrumbList schema found');
          this.validateBreadcrumbSchema(breadcrumbSchema);
        } else {
          this.addResult('Blog Post - Breadcrumb Schema', false, 'BreadcrumbList schema missing');
        }

      } else {
        this.addResult('Blog Post - No Posts Available', false, 'No blog posts found for testing');
      }

    } catch (error) {
      this.addResult('Blog Post - Fetch Error', false, error.message);
    }
  }

  async testStructuredDataValidation() {
    console.log('✅ Testing Structured Data Validation...');
    
    try {
      // Test with Google's Rich Results Test API (simulated)
      const testUrl = `${this.baseUrl}/shop`;
      this.addResult('Structured Data - Validation Ready', true, `Ready for validation at: ${testUrl}`);
      
      console.log(`\n📋 Manual Validation Steps:`);
      console.log(`1. Visit: https://search.google.com/test/rich-results`);
      console.log(`2. Test URL: ${testUrl}`);
      console.log(`3. Check for rich results in search`);
      console.log(`4. Validate schema.org compliance`);
      
    } catch (error) {
      this.addResult('Structured Data - Validation Error', false, error.message);
    }
  }

  validateOrganizationSchema(schema) {
    const required = ['name', 'url', 'logo'];
    const missing = required.filter(field => !schema[field]);
    
    if (missing.length > 0) {
      this.addResult('Organization Schema - Required Fields', false, `Missing: ${missing.join(', ')}`);
    } else {
      this.addResult('Organization Schema - Required Fields', true, 'All required fields present');
    }

    if (schema.sameAs && Array.isArray(schema.sameAs)) {
      this.addResult('Organization Schema - Social Links', true, `${schema.sameAs.length} social links found`);
    } else {
      this.addResult('Organization Schema - Social Links', false, 'Social links missing or invalid');
    }
  }

  validateWebsiteSchema(schema) {
    const required = ['name', 'url'];
    const missing = required.filter(field => !schema[field]);
    
    if (missing.length > 0) {
      this.addResult('Website Schema - Required Fields', false, `Missing: ${missing.join(', ')}`);
    } else {
      this.addResult('Website Schema - Required Fields', true, 'All required fields present');
    }

    if (schema.potentialAction && schema.potentialAction['@type'] === 'SearchAction') {
      this.addResult('Website Schema - Search Action', true, 'Search action configured');
    } else {
      this.addResult('Website Schema - Search Action', false, 'Search action missing');
    }
  }

  validateProductSchema(schema) {
    const required = ['name', 'description', 'offers'];
    const missing = required.filter(field => !schema[field]);
    
    if (missing.length > 0) {
      this.addResult('Product Schema - Required Fields', false, `Missing: ${missing.join(', ')}`);
    } else {
      this.addResult('Product Schema - Required Fields', true, 'All required fields present');
    }

    if (schema.offers && schema.offers.price && schema.offers.priceCurrency) {
      this.addResult('Product Schema - Pricing', true, 'Pricing information present');
    } else {
      this.addResult('Product Schema - Pricing', false, 'Pricing information missing');
    }
  }

  validateFAQSchema(schema) {
    if (schema.mainEntity && Array.isArray(schema.mainEntity) && schema.mainEntity.length > 0) {
      this.addResult('FAQ Schema - Questions', true, `${schema.mainEntity.length} questions found`);
      
      // Validate first question structure
      const firstQuestion = schema.mainEntity[0];
      if (firstQuestion['@type'] === 'Question' && firstQuestion.name && firstQuestion.acceptedAnswer) {
        this.addResult('FAQ Schema - Question Structure', true, 'Question structure valid');
      } else {
        this.addResult('FAQ Schema - Question Structure', false, 'Question structure invalid');
      }
    } else {
      this.addResult('FAQ Schema - Questions', false, 'No questions found');
    }
  }

  validateBlogPostSchema(schema) {
    const required = ['headline', 'author', 'publisher', 'datePublished'];
    const missing = required.filter(field => !schema[field]);
    
    if (missing.length > 0) {
      this.addResult('BlogPost Schema - Required Fields', false, `Missing: ${missing.join(', ')}`);
    } else {
      this.addResult('BlogPost Schema - Required Fields', true, 'All required fields present');
    }

    if (schema.author && schema.author['@type'] === 'Organization') {
      this.addResult('BlogPost Schema - Author', true, 'Author information present');
    } else {
      this.addResult('BlogPost Schema - Author', false, 'Author information missing');
    }
  }

  validateBreadcrumbSchema(schema) {
    if (schema.itemListElement && Array.isArray(schema.itemListElement) && schema.itemListElement.length > 0) {
      this.addResult('Breadcrumb Schema - Items', true, `${schema.itemListElement.length} breadcrumb items found`);
      
      // Validate first item structure
      const firstItem = schema.itemListElement[0];
      if (firstItem['@type'] === 'ListItem' && firstItem.position && firstItem.name && firstItem.item) {
        this.addResult('Breadcrumb Schema - Item Structure', true, 'Breadcrumb item structure valid');
      } else {
        this.addResult('Breadcrumb Schema - Item Structure', false, 'Breadcrumb item structure invalid');
      }
    } else {
      this.addResult('Breadcrumb Schema - Items', false, 'No breadcrumb items found');
    }
  }

  async fetchPage(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  extractStructuredData(html) {
    const structuredData = [];
    const scriptRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    
    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData['@context'] === 'https://schema.org') {
          structuredData.push(jsonData);
        }
      } catch (error) {
        console.warn('Failed to parse structured data:', error.message);
      }
    }
    
    return structuredData;
  }

  addResult(test, passed, message) {
    this.results.tests.push({
      test,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
    
    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }

  printResults() {
    console.log('\n📊 Structured Data Test Results\n');
    console.log('='.repeat(60));
    
    this.results.tests.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      console.log(`   ${result.message}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log(`📈 Summary:`);
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
    
    if (this.results.summary.failed === 0) {
      console.log('\n🎉 All structured data tests passed!');
      console.log('✅ Enhanced structured data implementation is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Test with Google Rich Results Test tool');
    console.log('2. Monitor search console for rich results');
    console.log('3. Validate schema.org compliance');
  }
}

// Run the test
if (require.main === module) {
  const tester = new StructuredDataTester();
  tester.run().catch(console.error);
}

module.exports = StructuredDataTester;
