#!/usr/bin/env node

/**
 * Image Optimization Performance Test
 * Tests the enhanced image optimization implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️  Testing Enhanced Image Optimization...\n');

// Test configuration
const tests = [
  {
    name: 'Next.js Image Configuration',
    test: () => {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      if (!fs.existsSync(nextConfigPath)) {
        return { passed: false, message: 'next.config.ts not found' };
      }

      const config = fs.readFileSync(nextConfigPath, 'utf8');
      
      const checks = [
        { name: 'WebP format support', pattern: /formats.*webp/i },
        { name: 'AVIF format support', pattern: /formats.*avif/i },
        { name: 'Device sizes', pattern: /deviceSizes/i },
        { name: 'Image sizes', pattern: /imageSizes/i },
        { name: 'Cache TTL', pattern: /minimumCacheTTL/i },
        { name: 'SVG support', pattern: /dangerouslyAllowSVG.*true/i },
        { name: 'Remote patterns', pattern: /remotePatterns/i },
        { name: 'Content security policy', pattern: /contentSecurityPolicy/i },
      ];

      const results = checks.map(check => ({
        ...check,
        passed: check.pattern.test(config)
      }));

      const passed = results.filter(r => r.passed).length;
      const total = results.length;

      return {
        passed: passed >= 6, // At least 6 features should be present
        message: `${passed}/${total} image optimization features found`,
        details: results
      };
    }
  },
  {
    name: 'OptimizedImage Component',
    test: () => {
      const componentPath = path.join(process.cwd(), 'app', 'components', 'OptimizedImage.tsx');
      if (!fs.existsSync(componentPath)) {
        return { passed: false, message: 'OptimizedImage.tsx not found' };
      }

      const component = fs.readFileSync(componentPath, 'utf8');
      
      const checks = [
        { name: 'Blur placeholder support', pattern: /placeholder.*blur/i },
        { name: 'Error handling', pattern: /hasError.*useState/i },
        { name: 'Loading states', pattern: /isLoading.*useState/i },
        { name: 'Quality prop', pattern: /quality.*number/i },
        { name: 'Fill prop support', pattern: /fill.*boolean/i },
        { name: 'Sizes prop', pattern: /sizes.*string/i },
        { name: 'Object fit', pattern: /objectFit/i },
        { name: 'OnLoad callback', pattern: /onLoad.*\(\).*void/i },
        { name: 'OnError callback', pattern: /onError.*\(\).*void/i },
        { name: 'Loading animation', pattern: /animate-spin/i },
        { name: 'Transition effects', pattern: /transition-all.*duration/i },
      ];

      const results = checks.map(check => ({
        ...check,
        passed: check.pattern.test(component)
      }));

      const passed = results.filter(r => r.passed).length;
      const total = results.length;

      return {
        passed: passed >= 8, // At least 8 features should be present
        message: `${passed}/${total} optimization features found`,
        details: results
      };
    }
  },
  {
    name: 'WordPressImage Component Enhancement',
    test: () => {
      const componentPath = path.join(process.cwd(), 'app', 'components', 'WordPressImage.tsx');
      if (!fs.existsSync(componentPath)) {
        return { passed: false, message: 'WordPressImage.tsx not found' };
      }

      const component = fs.readFileSync(componentPath, 'utf8');
      
      const checks = [
        { name: 'Uses OptimizedImage', pattern: /import.*OptimizedImage/i },
        { name: 'Quality prop', pattern: /quality.*number/i },
        { name: 'Placeholder prop', pattern: /placeholder.*blur/i },
        { name: 'Blur data URL', pattern: /blurDataURL/i },
        { name: 'OnLoad callback', pattern: /onLoad.*\(\).*void/i },
        { name: 'OnError callback', pattern: /onError.*\(\).*void/i },
      ];

      const results = checks.map(check => ({
        ...check,
        passed: check.pattern.test(component)
      }));

      const passed = results.filter(r => r.passed).length;
      const total = results.length;

      return {
        passed: passed >= 4, // At least 4 features should be present
        message: `${passed}/${total} enhancement features found`,
        details: results
      };
    }
  },
  {
    name: 'ResponsiveImage Component',
    test: () => {
      const componentPath = path.join(process.cwd(), 'app', 'components', 'ResponsiveImage.tsx');
      if (!fs.existsSync(componentPath)) {
        return { passed: false, message: 'ResponsiveImage.tsx not found' };
      }

      const component = fs.readFileSync(componentPath, 'utf8');
      
      const checks = [
        { name: 'Mobile breakpoint', pattern: /mobile.*width.*height/i },
        { name: 'Tablet breakpoint', pattern: /tablet.*width.*height/i },
        { name: 'Desktop breakpoint', pattern: /desktop.*width.*height/i },
        { name: 'Responsive sizes', pattern: /sizes.*max-width/i },
        { name: 'Uses OptimizedImage', pattern: /import.*OptimizedImage/i },
        { name: 'Default dimensions', pattern: /defaultWidth.*defaultHeight/i },
      ];

      const results = checks.map(check => ({
        ...check,
        passed: check.pattern.test(component)
      }));

      const passed = results.filter(r => r.passed).length;
      const total = results.length;

      return {
        passed: passed >= 4, // At least 4 features should be present
        message: `${passed}/${total} responsive features found`,
        details: results
      };
    }
  },
  {
    name: 'Bundle Optimization',
    test: () => {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      if (!fs.existsSync(nextConfigPath)) {
        return { passed: false, message: 'next.config.ts not found' };
      }

      const config = fs.readFileSync(nextConfigPath, 'utf8');
      
      const checks = [
        { name: 'Code splitting', pattern: /splitChunks/i },
        { name: 'Tree shaking', pattern: /usedExports.*true/i },
        { name: 'Side effects', pattern: /sideEffects.*false/i },
        { name: 'Vendor chunk', pattern: /vendor.*chunks/i },
        { name: 'AWS SDK chunk', pattern: /aws-sdk.*chunks/i },
        { name: 'Compression', pattern: /minimize.*true/i },
      ];

      const results = checks.map(check => ({
        ...check,
        passed: check.pattern.test(config)
      }));

      const passed = results.filter(r => r.passed).length;
      const total = results.length;

      return {
        passed: passed >= 4, // At least 4 features should be present
        message: `${passed}/${total} bundle optimization features found`,
        details: results
      };
    }
  }
];

// Run tests
let totalTests = 0;
let passedTests = 0;

tests.forEach((test, index) => {
  console.log(`📋 Test ${index + 1}: ${test.name}`);
  
  try {
    const result = test.test();
    totalTests++;
    
    if (result.passed) {
      passedTests++;
      console.log(`✅ PASSED: ${result.message}`);
    } else {
      console.log(`❌ FAILED: ${result.message}`);
    }
    
    if (result.details) {
      result.details.forEach(detail => {
        const status = detail.passed ? '✅' : '❌';
        console.log(`   ${status} ${detail.name}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log('');
});

// Summary
console.log('📊 Test Summary:');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All image optimization tests passed!');
  console.log('✅ Enhanced image optimization is properly implemented');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}
