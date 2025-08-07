const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Bundle Optimization...\n');

// Check if .next directory exists (build output)
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.error('❌ Build output not found. Run "npm run build" first.');
  process.exit(1);
}

// Check for static files
const staticDir = path.join(nextDir, 'static');
if (fs.existsSync(staticDir)) {
  console.log('✅ Static files directory found');
  
  // Check for chunk files
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = fs.readdirSync(chunksDir).filter(file => file.endsWith('.js'));
    console.log(`✅ Found ${chunkFiles.length} chunk files`);
    
    // Check for vendor chunks (bundle splitting)
    const vendorChunks = chunkFiles.filter(file => file.includes('vendors') || file.includes('aws-sdk') || file.includes('common'));
    if (vendorChunks.length > 0) {
      console.log('✅ Bundle splitting detected:', vendorChunks);
    } else {
      console.log('⚠️  No vendor chunks found - bundle splitting may not be working');
    }
  }
}

// Check for image optimization
const imagesDir = path.join(nextDir, 'static', 'images');
if (fs.existsSync(imagesDir)) {
  console.log('✅ Image optimization directory found');
}

// Check next.config.ts for optimization settings
const configPath = path.join(process.cwd(), 'next.config.ts');
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Check for webpack optimizations
  if (configContent.includes('splitChunks')) {
    console.log('✅ Webpack splitChunks configuration found');
  }
  
  if (configContent.includes('usedExports')) {
    console.log('✅ Tree shaking optimization enabled');
  }
  
  if (configContent.includes('TerserPlugin')) {
    console.log('✅ Terser minification configured');
  }
  
  if (configContent.includes('formats: [\'image/webp\', \'image/avif\']')) {
    console.log('✅ Advanced image formats configured');
  }
  
  if (configContent.includes('placeholder: \'blur\'')) {
    console.log('✅ Blur placeholder optimization enabled');
  }
}

// Check for OptimizedImage component
const optimizedImagePath = path.join(process.cwd(), 'app', 'components', 'OptimizedImage.tsx');
if (fs.existsSync(optimizedImagePath)) {
  console.log('✅ OptimizedImage component created');
}

// Check for RSS feed
const rssFeedPath = path.join(process.cwd(), 'app', 'feed.xml', 'route.ts');
if (fs.existsSync(rssFeedPath)) {
  console.log('✅ RSS feed implementation created');
}

// Check package.json for terser dependency
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (packageContent.devDependencies && packageContent.devDependencies.terser) {
    console.log('✅ Terser dependency added');
  }
}

console.log('\n🎉 Bundle optimization test completed!');
console.log('\n📊 Expected improvements:');
console.log('- Reduced bundle sizes through code splitting');
console.log('- Faster loading with tree shaking');
console.log('- Optimized images with blur placeholders');
console.log('- RSS feed for better SEO');
console.log('- Minified production builds');

console.log('\n🔧 To test the optimizations:');
console.log('1. Run "npm run build" to generate optimized bundles');
console.log('2. Check the .next/static/chunks directory for split chunks');
console.log('3. Test image loading with the OptimizedImage component');
console.log('4. Visit /feed.xml to test the RSS feed');
