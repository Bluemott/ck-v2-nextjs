#!/usr/bin/env node

/**
 * Batch WordPress Data Import Script
 * This script handles large WordPress payload files by splitting them into smaller chunks
 * that fit within Lambda payload limits
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🚀 WordPress Batch Import Script');
console.log('=================================\n');

// Configuration
const config = {
  lambdaEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data',
  payloadFile: './lambda-payload.json',
  batchSize: 50, // Number of posts per batch
  maxPayloadSize: 5 * 1024 * 1024, // 5MB limit for Lambda payload
  retryAttempts: 3,
  retryDelay: 1000, // ms
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// Read and parse the large payload file
function readPayloadFile() {
  try {
    log('📖 Reading WordPress payload file...');
    
    if (!fs.existsSync(config.payloadFile)) {
      throw new Error(`Payload file not found: ${config.payloadFile}`);
    }
    
    const fileSize = fs.statSync(config.payloadFile).size;
    log(`📊 Payload file size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    
    if (fileSize > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('Payload file too large to process in memory');
    }
    
    const data = fs.readFileSync(config.payloadFile, 'utf8');
    const payload = JSON.parse(data);
    
    log(`📊 Loaded data:`);
    log(`   Posts: ${payload.posts?.length || 0}`);
    log(`   Categories: ${payload.categories?.length || 0}`);
    log(`   Tags: ${payload.tags?.length || 0}`);
    
    return payload;
    
  } catch (error) {
    log(`Failed to read payload file: ${error.message}`, 'error');
    throw error;
  }
}

// Split data into batches that fit within Lambda limits
function createBatches(data) {
  log('📦 Creating data batches...');
  
  const batches = [];
  const posts = data.posts || [];
  const categories = data.categories || [];
  const tags = data.tags || [];
  
  // First batch: categories and tags (these are usually small)
  if (categories.length > 0 || tags.length > 0) {
    const metaBatch = {
      posts: [],
      categories,
      tags,
      batchType: 'metadata',
      batchNumber: 0
    };
    
    // Check if this batch is within size limits
    const batchSize = JSON.stringify(metaBatch).length;
    if (batchSize < config.maxPayloadSize) {
      batches.push(metaBatch);
      log(`📦 Created metadata batch: ${categories.length} categories, ${tags.length} tags`);
    } else {
      log('⚠️  Categories and tags too large, will need to batch separately', 'warning');
      // TODO: Handle large categories/tags separately
    }
  }
  
  // Create post batches
  if (posts.length > 0) {
    let batchNumber = 1;
    
    for (let i = 0; i < posts.length; i += config.batchSize) {
      const postBatch = posts.slice(i, i + config.batchSize);
      
      const batch = {
        posts: postBatch,
        categories: categories.length > 0 ? categories : [],
        tags: tags.length > 0 ? tags : [],
        batchType: 'posts',
        batchNumber,
        totalBatches: Math.ceil(posts.length / config.batchSize),
        startIndex: i,
        endIndex: Math.min(i + config.batchSize - 1, posts.length - 1)
      };
      
      // Check batch size
      const batchSize = JSON.stringify(batch).length;
      if (batchSize >= config.maxPayloadSize) {
        log(`⚠️  Batch ${batchNumber} is too large (${(batchSize / 1024 / 1024).toFixed(2)}MB), reducing batch size`, 'warning');
        // Recursively reduce batch size
        const reducedBatchSize = Math.floor(config.batchSize / 2);
        if (reducedBatchSize < 1) {
          throw new Error('Cannot create batch small enough for Lambda payload limits');
        }
        config.batchSize = reducedBatchSize;
        return createBatches(data); // Restart with smaller batch size
      }
      
      batches.push(batch);
      batchNumber++;
    }
    
    log(`📦 Created ${batches.length - (categories.length > 0 || tags.length > 0 ? 1 : 0)} post batches`);
  }
  
  log(`📊 Total batches created: ${batches.length}`);
  return batches;
}

// Send a batch to Lambda with retry logic
async function sendBatch(batch, batchIndex) {
  const payload = JSON.stringify(batch);
  
  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      log(`📤 Sending batch ${batchIndex + 1}/${batch.totalBatches || 'N/A'} (attempt ${attempt}/${config.retryAttempts})...`);
      
      const result = await makeLambdaRequest(payload);
      
      if (result.statusCode === 200) {
        const response = JSON.parse(result.body);
        log(`✅ Batch ${batchIndex + 1} completed: ${response.summary?.posts || 0} posts imported`, 'success');
        return result;
      } else {
        throw new Error(`Lambda returned ${result.statusCode}: ${result.body}`);
      }
      
    } catch (error) {
      log(`❌ Batch ${batchIndex + 1} attempt ${attempt} failed: ${error.message}`, 'error');
      
      if (attempt === config.retryAttempts) {
        throw new Error(`Batch ${batchIndex + 1} failed after ${config.retryAttempts} attempts: ${error.message}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
    }
  }
}

// Make HTTPS request to Lambda
function makeLambdaRequest(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.lambdaEndpoint);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload, 'utf8')
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
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
    
    req.setTimeout(300000); // 5 minutes timeout
    req.write(payload);
    req.end();
  });
}

// Main import function
async function runBatchImport() {
  try {
    log('🚀 Starting batch WordPress import...');
    const startTime = Date.now();
    
    // Read payload
    const data = readPayloadFile();
    
    // Create batches
    const batches = createBatches(data);
    
    if (batches.length === 0) {
      log('⚠️  No data to import', 'warning');
      return;
    }
    
    // Process batches sequentially to avoid overwhelming the database
    const results = [];
    
    for (let i = 0; i < batches.length; i++) {
      try {
        const result = await sendBatch(batches[i], i);
        results.push({
          batchIndex: i,
          batchType: batches[i].batchType,
          success: true,
          result
        });
        
        // Small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        log(`❌ Batch ${i + 1} failed permanently: ${error.message}`, 'error');
        results.push({
          batchIndex: i,
          batchType: batches[i].batchType,
          success: false,
          error: error.message
        });
      }
    }
    
    // Generate summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const duration = Date.now() - startTime;
    
    console.log('\n🎉 Batch import completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total batches: ${batches.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    
    if (failCount > 0) {
      console.log('\n❌ Failed batches:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   Batch ${r.batchIndex + 1} (${r.batchType}): ${r.error}`);
      });
    }
    
    // Save results log
    const logFile = `./import-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(logFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      totalBatches: batches.length,
      successCount,
      failCount,
      results
    }, null, 2));
    
    log(`📋 Results saved to: ${logFile}`, 'success');
    
  } catch (error) {
    log(`💥 Batch import failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
WordPress Batch Import Script

Usage: node scripts/batch-import-wordpress.js [options]

Options:
  --help, -h          Show this help message
  --dry-run           Show what would be imported without sending
  --batch-size <n>    Number of posts per batch (default: ${config.batchSize})
  --endpoint <url>    Lambda endpoint URL (default: from config)

Example:
  node scripts/batch-import-wordpress.js --batch-size 25
`);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 Dry run mode - no data will be imported');
  try {
    const data = readPayloadFile();
    const batches = createBatches(data);
    console.log(`\nWould create ${batches.length} batches:`);
    batches.forEach((batch, i) => {
      console.log(`  Batch ${i + 1}: ${batch.posts.length} posts, ${batch.categories.length} categories, ${batch.tags.length} tags`);
    });
  } catch (error) {
    console.error('❌ Dry run failed:', error.message);
  }
  process.exit(0);
}

// Handle batch size option
const batchSizeIndex = args.indexOf('--batch-size');
if (batchSizeIndex !== -1 && args[batchSizeIndex + 1]) {
  config.batchSize = parseInt(args[batchSizeIndex + 1]);
  if (isNaN(config.batchSize) || config.batchSize < 1) {
    console.error('❌ Invalid batch size');
    process.exit(1);
  }
}

// Handle endpoint option
const endpointIndex = args.indexOf('--endpoint');
if (endpointIndex !== -1 && args[endpointIndex + 1]) {
  config.lambdaEndpoint = args[endpointIndex + 1];
}

// Run the batch import
runBatchImport();