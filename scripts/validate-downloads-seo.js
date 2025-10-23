#!/usr/bin/env node

/**
 * Test script to validate downloads SEO implementation
 * Tests metadata, structured data, sitemap, and SEO best practices
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: []
};

// Helper function to log results
function logResult(test, passed, message = '') {
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${test}`);
  } else {
    testResults.failed++;
    testResults.errors.push(`${test}: ${message}`);
    console.log(`❌ ${test}: ${message}`);
  }
}

// Helper function to log warnings
function logWarning(message) {
  testResults.warnings.push(message);
  console.log(`⚠️  ${message}`);
}

// Test 1: Check download page metadata generation
function testDownloadPageMetadata() {
  const downloadPagePath = path.join(__dirname, '..', 'app', 'downloads', '[category]', '[slug]', 'page.tsx');
  
  if (fs.existsSync(downloadPagePath)) {
    const pageContent = fs.readFileSync(downloadPagePath, 'utf8');
    
    // Check for metadata generation
    if (pageContent.includes('generateMetadata')) {
      logResult('Download page metadata generation', true);
    } else {
      logResult('Download page metadata generation', false, 'generateMetadata not found');
    }
    
    // Check for SEO metadata helper
    if (pageContent.includes('generateSEOMetadata')) {
      logResult('SEO metadata helper usage', true);
    } else {
      logResult('SEO metadata helper usage', false, 'generateSEOMetadata not found');
    }
    
    // Check for canonical URL
    if (pageContent.includes('canonical')) {
      logResult('Canonical URL configuration', true);
    } else {
      logResult('Canonical URL configuration', false, 'canonical not found');
    }
    
    // Check for Open Graph
    if (pageContent.includes('ogImage')) {
      logResult('Open Graph configuration', true);
    } else {
      logResult('Open Graph configuration', false, 'ogImage not found');
    }
  } else {
    logResult('Download page metadata generation', false, 'Download page not found');
  }
}

// Test 2: Check structured data implementation
function testStructuredDataImplementation() {
  const downloadPagePath = path.join(__dirname, '..', 'app', 'downloads', '[category]', '[slug]', 'page.tsx');
  
  if (fs.existsSync(downloadPagePath)) {
    const pageContent = fs.readFileSync(downloadPagePath, 'utf8');
    
    // Check for structured data imports
    if (pageContent.includes('generateDownloadStructuredData')) {
      logResult('Download structured data import', true);
    } else {
      logResult('Download structured data import', false, 'generateDownloadStructuredData not found');
    }
    
    if (pageContent.includes('generateBreadcrumbStructuredData')) {
      logResult('Breadcrumb structured data import', true);
    } else {
      logResult('Breadcrumb structured data import', false, 'generateBreadcrumbStructuredData not found');
    }
    
    // Check for structured data usage
    if (pageContent.includes('generateDownloadStructuredData(')) {
      logResult('Download structured data usage', true);
    } else {
      logResult('Download structured data usage', false, 'generateDownloadStructuredData not called');
    }
  } else {
    logResult('Download structured data implementation', false, 'Download page not found');
  }
}

// Test 3: Check structured data component
function testStructuredDataComponent() {
  const structuredDataPath = path.join(__dirname, '..', 'app', 'components', 'StructuredData.tsx');
  
  if (fs.existsSync(structuredDataPath)) {
    const structuredDataContent = fs.readFileSync(structuredDataPath, 'utf8');
    
    // Check for DigitalDocument schema
    if (structuredDataContent.includes('DigitalDocument')) {
      logResult('DigitalDocument schema', true);
    } else {
      logResult('DigitalDocument schema', false, 'DigitalDocument not found');
    }
    
    // Check for required fields
    const requiredFields = [
      'fileFormat',
      'fileSize',
      'downloadUrl',
      'category',
      'difficulty',
      'timeRequired',
      'materials',
      'license',
      'isAccessibleForFree'
    ];
    
    requiredFields.forEach(field => {
      if (structuredDataContent.includes(field)) {
        logResult(`Structured data field ${field}`, true);
      } else {
        logResult(`Structured data field ${field}`, false, 'Field not found');
      }
    });
  } else {
    logResult('Structured data component', false, 'File not found');
  }
}

// Test 4: Check sitemap integration
function testSitemapIntegration() {
  const sitemapPath = path.join(__dirname, '..', 'app', 'sitemap.ts');
  
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    
    // Check for individual download URLs
    if (sitemapContent.includes('individualDownloadUrls')) {
      logResult('Individual download URLs in sitemap', true);
    } else {
      logResult('Individual download URLs in sitemap', false, 'individualDownloadUrls not found');
    }
    
    // Check for downloads section
    if (sitemapContent.includes('downloadUrls')) {
      logResult('Downloads section in sitemap', true);
    } else {
      logResult('Downloads section in sitemap', false, 'downloadUrls not found');
    }
    
    // Check for priority configuration
    if (sitemapContent.includes('priority: 0.8') || sitemapContent.includes('priority: 0.7') || sitemapContent.includes('priority: 0.6')) {
      logResult('Sitemap priority configuration', true);
    } else {
      logResult('Sitemap priority configuration', false, 'Priority values not found');
    }
  } else {
    logResult('Sitemap integration', false, 'Sitemap file not found');
  }
}

// Test 5: Check main downloads page SEO
function testMainDownloadsPageSEO() {
  const downloadsPagePath = path.join(__dirname, '..', 'app', 'downloads', 'page.tsx');
  
  if (fs.existsSync(downloadsPagePath)) {
    const pageContent = fs.readFileSync(downloadsPagePath, 'utf8');
    
    // Check for metadata export
    if (pageContent.includes('export const metadata')) {
      logResult('Main downloads page metadata', true);
    } else {
      logResult('Main downloads page metadata', false, 'metadata export not found');
    }
    
    // Check for SEO helper usage
    if (pageContent.includes('generateSEOMetadata')) {
      logResult('Main downloads page SEO helper', true);
    } else {
      logResult('Main downloads page SEO helper', false, 'generateSEOMetadata not found');
    }
  } else {
    logResult('Main downloads page SEO', false, 'Downloads page not found');
  }
}

// Test 6: Check breadcrumb implementation
function testBreadcrumbImplementation() {
  const downloadPagePath = path.join(__dirname, '..', 'app', 'downloads', '[category]', '[slug]', 'page.tsx');
  
  if (fs.existsSync(downloadPagePath)) {
    const pageContent = fs.readFileSync(downloadPagePath, 'utf8');
    
    // Check for breadcrumb navigation
    if (pageContent.includes('breadcrumb') || pageContent.includes('Breadcrumb')) {
      logResult('Breadcrumb navigation', true);
    } else {
      logResult('Breadcrumb navigation', false, 'Breadcrumb not found');
    }
    
    // Check for breadcrumb structured data
    if (pageContent.includes('generateBreadcrumbStructuredData(')) {
      logResult('Breadcrumb structured data', true);
    } else {
      logResult('Breadcrumb structured data', false, 'generateBreadcrumbStructuredData not called');
    }
  } else {
    logResult('Breadcrumb implementation', false, 'Download page not found');
  }
}

// Test 7: Check social sharing implementation
function testSocialSharingImplementation() {
  const downloadPagePath = path.join(__dirname, '..', 'app', 'downloads', '[category]', '[slug]', 'page.tsx');
  
  if (fs.existsSync(downloadPagePath)) {
    const pageContent = fs.readFileSync(downloadPagePath, 'utf8');
    
    // Check for social sharing buttons
    if (pageContent.includes('twitter.com/intent/tweet') || pageContent.includes('facebook.com/sharer')) {
      logResult('Social sharing buttons', true);
    } else {
      logResult('Social sharing buttons', false, 'Social sharing not found');
    }
    
    // Check for proper URL encoding
    if (pageContent.includes('encodeURIComponent')) {
      logResult('URL encoding for sharing', true);
    } else {
      logResult('URL encoding for sharing', false, 'encodeURIComponent not found');
    }
  } else {
    logResult('Social sharing implementation', false, 'Download page not found');
  }
}

// Test 8: Check mobile optimization
function testMobileOptimization() {
  const downloadPagePath = path.join(__dirname, '..', 'app', 'downloads', '[category]', '[slug]', 'page.tsx');
  
  if (fs.existsSync(downloadPagePath)) {
    const pageContent = fs.readFileSync(downloadPagePath, 'utf8');
    
    // Check for responsive classes
    if (pageContent.includes('sm:') || pageContent.includes('md:') || pageContent.includes('lg:')) {
      logResult('Responsive design classes', true);
    } else {
      logResult('Responsive design classes', false, 'Responsive classes not found');
    }
    
    // Check for mobile-friendly image sizing
    if (pageContent.includes('sizes=')) {
      logResult('Mobile-friendly image sizing', true);
    } else {
      logResult('Mobile-friendly image sizing', false, 'Image sizes not configured');
    }
  } else {
    logResult('Mobile optimization', false, 'Download page not found');
  }
}

// Test 9: Check performance optimization
function testPerformanceOptimization() {
  const downloadPagePath = path.join(__dirname, '..', 'app', 'downloads', '[category]', '[slug]', 'page.tsx');
  
  if (fs.existsSync(downloadPagePath)) {
    const pageContent = fs.readFileSync(downloadPagePath, 'utf8');
    
    // Check for static generation
    if (pageContent.includes('generateStaticParams')) {
      logResult('Static generation', true);
    } else {
      logResult('Static generation', false, 'generateStaticParams not found');
    }
    
    // Check for image optimization
    if (pageContent.includes('priority') || pageContent.includes('fill')) {
      logResult('Image optimization', true);
    } else {
      logResult('Image optimization', false, 'Image optimization not found');
    }
  } else {
    logResult('Performance optimization', false, 'Download page not found');
  }
}

// Test 10: Check accessibility
function testAccessibility() {
  const downloadPagePath = path.join(__dirname, '..', 'app', 'downloads', '[category]', '[slug]', 'page.tsx');
  
  if (fs.existsSync(downloadPagePath)) {
    const pageContent = fs.readFileSync(downloadPagePath, 'utf8');
    
    // Check for alt text
    if (pageContent.includes('alt=')) {
      logResult('Image alt text', true);
    } else {
      logResult('Image alt text', false, 'Alt text not found');
    }
    
    // Check for semantic HTML
    if (pageContent.includes('<nav') || pageContent.includes('<main') || pageContent.includes('<section')) {
      logResult('Semantic HTML', true);
    } else {
      logResult('Semantic HTML', false, 'Semantic HTML not found');
    }
  } else {
    logResult('Accessibility', false, 'Download page not found');
  }
}

// Main test runner
function runTests() {
  console.log('🧪 Testing Downloads SEO Implementation\n');
  
  // Run all tests
  testDownloadPageMetadata();
  testStructuredDataImplementation();
  testStructuredDataComponent();
  testSitemapIntegration();
  testMainDownloadsPageSEO();
  testBreadcrumbImplementation();
  testSocialSharingImplementation();
  testMobileOptimization();
  testPerformanceOptimization();
  testAccessibility();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    testResults.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Downloads SEO is properly implemented.');
    process.exit(0);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testResults };
