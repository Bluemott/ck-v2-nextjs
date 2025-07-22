#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image optimization analysis script
const analyzeImages = () => {
  const imagesDir = path.join(__dirname, 'public', 'images');
  const files = fs.readdirSync(imagesDir);
  
  console.log('🔍 Analyzing images for optimization...\n');
  
  const imageAnalysis = files
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .map(file => {
      const filePath = path.join(imagesDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      return {
        name: file,
        size: stats.size,
        sizeKB,
        sizeMB,
        extension: path.extname(file).toLowerCase(),
        needsOptimization: stats.size > 200 * 1024 // > 200KB
      };
    })
    .sort((a, b) => b.size - a.size);
  
  console.log('📊 Image Analysis Results:\n');
  
  const largeImages = imageAnalysis.filter(img => img.size > 500 * 1024);
  const mediumImages = imageAnalysis.filter(img => img.size > 100 * 1024 && img.size <= 500 * 1024);
  const smallImages = imageAnalysis.filter(img => img.size <= 100 * 1024);
  
  if (largeImages.length > 0) {
    console.log('🚨 LARGE IMAGES (>500KB) - High Priority:');
    largeImages.forEach(img => {
      console.log(`  • ${img.name} - ${img.sizeMB}MB (${img.sizeKB}KB)`);
    });
    console.log('');
  }
  
  if (mediumImages.length > 0) {
    console.log('⚠️  MEDIUM IMAGES (100KB-500KB) - Medium Priority:');
    mediumImages.forEach(img => {
      console.log(`  • ${img.name} - ${img.sizeMB}MB (${img.sizeKB}KB)`);
    });
    console.log('');
  }
  
  if (smallImages.length > 0) {
    console.log('✅ SMALL IMAGES (<100KB) - Already Optimized:');
    smallImages.forEach(img => {
      console.log(`  • ${img.name} - ${img.sizeKB}KB`);
    });
    console.log('');
  }
  
  const totalSize = imageAnalysis.reduce((sum, img) => sum + img.size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`📈 Summary:`);
  console.log(`  • Total images: ${imageAnalysis.length}`);
  console.log(`  • Total size: ${totalSizeMB}MB`);
  console.log(`  • Large images (>500KB): ${largeImages.length}`);
  console.log(`  • Medium images (100KB-500KB): ${mediumImages.length}`);
  console.log(`  • Small images (<100KB): ${smallImages.length}`);
  
  // Generate optimization recommendations
  console.log('\n🎯 Optimization Recommendations:\n');
  
  if (largeImages.length > 0) {
    console.log('1. CRITICAL - Optimize these large images first:');
    largeImages.forEach(img => {
      const targetSize = img.size > 1024 * 1024 ? '200KB' : '100KB';
      console.log(`   • ${img.name}: ${img.sizeMB}MB → target ${targetSize}`);
      if (img.extension === '.png') {
        console.log(`     → Convert to WebP format`);
      }
      console.log(`     → Resize if larger than 1200px width`);
    });
    console.log('');
  }
  
  console.log('2. Use these tools for optimization:');
  console.log('   • Online: Squoosh.app (Google) - Best for batch processing');
  console.log('   • Desktop: ImageOptim (Mac) or FileOptimizer (Windows)');
  console.log('   • Command line: ImageMagick with WebP conversion');
  console.log('');
  
  console.log('3. Target file sizes:');
  console.log('   • Hero images: <200KB');
  console.log('   • Product images: <150KB');
  console.log('   • Thumbnail images: <100KB');
  console.log('   • Logo images: <50KB');
  console.log('');
  
  console.log('4. After optimization, update image references in:');
  console.log('   • app/page.tsx');
  console.log('   • app/components/Navbar.tsx');
  console.log('   • app/shop/page.tsx');
  console.log('   • app/downloads/page.tsx');
  console.log('');
  
  console.log('5. Expected performance improvements:');
  console.log('   • Lighthouse score: +10-20 points');
  console.log('   • Page load time: -2-3 seconds on mobile');
  console.log('   • Total blocking time: Significant reduction');
  console.log('   • Largest Contentful Paint: -1-2 seconds');
};

// Run the analysis
try {
  analyzeImages();
} catch (error) {
  console.error('❌ Error analyzing images:', error.message);
  process.exit(1);
}

export { analyzeImages }; 