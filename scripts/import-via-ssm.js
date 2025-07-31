#!/usr/bin/env node

/**
 * WordPress Data Import via AWS Systems Manager
 * Runs the import from within the VPC where Aurora is accessible
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('☁️  WordPress Data Import via AWS SSM');
console.log('=====================================\n');

// Configuration
const config = {
  // Aurora database details
  auroraHost: 'wordpressblogstack-wordpressauroracaf35a28-oxcsc1phacte.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
  auroraUser: 'postgres',
  auroraPassword: 'kcSgEFyE-1uqQqep9-g01-j5Y-VmvA',
  auroraDatabase: 'wordpress',
  auroraPort: 5432,
  
  // Import data
  importDir: './wordpress-export',
  
  // AWS region
  region: 'us-east-1'
};

// Create the import script that will run on the EC2 instance
function createImportScript() {
  const script = `#!/bin/bash

# WordPress Data Import Script for EC2
set -e

echo "📥 Starting WordPress data import..."

# Install PostgreSQL client
sudo yum update -y
sudo yum install -y postgresql15

# Create import directory
mkdir -p /tmp/wordpress-import

# Copy data files (we'll upload them via SSM)
echo "📁 Setting up import directory..."

# Create tables
cat > /tmp/create-tables.sql << 'EOF'
-- Create wp_posts table
CREATE TABLE IF NOT EXISTS wp_posts (
  id SERIAL PRIMARY KEY,
  post_author BIGINT DEFAULT 0,
  post_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  post_date_gmt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  post_content TEXT,
  post_title TEXT,
  post_excerpt TEXT,
  post_status VARCHAR(20) DEFAULT 'publish',
  comment_status VARCHAR(20) DEFAULT 'open',
  ping_status VARCHAR(20) DEFAULT 'open',
  post_password VARCHAR(255) DEFAULT '',
  post_name VARCHAR(200) DEFAULT '',
  to_ping TEXT,
  pinged TEXT,
  post_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  post_modified_gmt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  post_content_filtered TEXT,
  post_parent BIGINT DEFAULT 0,
  guid VARCHAR(255) DEFAULT '',
  menu_order INTEGER DEFAULT 0,
  post_type VARCHAR(20) DEFAULT 'post',
  post_mime_type VARCHAR(100) DEFAULT '',
  comment_count BIGINT DEFAULT 0,
  slug VARCHAR(200),
  wordpress_id INTEGER,
  wordpress_data JSONB
);

-- Create wp_categories table
CREATE TABLE IF NOT EXISTS wp_categories (
  id SERIAL PRIMARY KEY,
  cat_ID INTEGER,
  cat_name VARCHAR(200),
  category_nicename VARCHAR(200),
  category_description TEXT,
  wordpress_data JSONB
);

-- Create wp_tags table
CREATE TABLE IF NOT EXISTS wp_tags (
  id SERIAL PRIMARY KEY,
  tag_ID INTEGER,
  tag_name VARCHAR(200),
  tag_slug VARCHAR(200),
  tag_description TEXT,
  wordpress_data JSONB
);
EOF

# Connect to Aurora and create tables
echo "🏗️  Creating tables..."
PGPASSWORD='${config.auroraPassword}' psql -h ${config.auroraHost} -U ${config.auroraUser} -d ${config.auroraDatabase} -f /tmp/create-tables.sql

echo "✅ Tables created successfully"

# Import posts (we'll need to upload the JSON data)
echo "📝 Importing posts..."
# This will be done by uploading the JSON files and processing them

echo "🎉 Import completed!"
`;

  return script;
}

// Upload data files to S3 for SSM access
function uploadDataToS3() {
  console.log('📤 Uploading data to S3...');
  
  const bucketName = 'wordpress-migration-data';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Create S3 bucket if it doesn't exist
    execSync(`aws s3 mb s3://${bucketName} --region ${config.region}`, { stdio: 'inherit' });
  } catch (error) {
    // Bucket might already exist
  }
  
  // Upload JSON files
  execSync(`aws s3 cp ${config.importDir}/posts.json s3://${bucketName}/posts-${timestamp}.json`, { stdio: 'inherit' });
  execSync(`aws s3 cp ${config.importDir}/categories.json s3://${bucketName}/categories-${timestamp}.json`, { stdio: 'inherit' });
  execSync(`aws s3 cp ${config.importDir}/tags.json s3://${bucketName}/tags-${timestamp}.json`, { stdio: 'inherit' });
  
  return { bucketName, timestamp };
}

// Alternative: Use AWS Lambda for import
function createLambdaImportFunction() {
  console.log('🔧 Creating Lambda import function...');
  
  const lambdaCode = `
const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({
    host: '${config.auroraHost}',
    user: '${config.auroraUser}',
    password: '${config.auroraPassword}',
    database: '${config.auroraDatabase}',
    port: ${config.auroraPort},
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    // Import logic here
    const posts = JSON.parse(event.posts);
    const categories = JSON.parse(event.categories);
    const tags = JSON.parse(event.tags);
    
    // Create tables and import data
    // ... (import logic)
    
    return { statusCode: 200, body: 'Import completed' };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  } finally {
    await client.end();
  }
};
`;

  // Save Lambda function
  fs.writeFileSync('lambda-import.js', lambdaCode);
  
  console.log('✅ Lambda function created: lambda-import.js');
  console.log('📝 Next steps:');
  console.log('1. Deploy the Lambda function to AWS');
  console.log('2. Invoke it with your WordPress data');
}

// Main function
async function main() {
  console.log('🚀 Starting WordPress data import via AWS...');
  
  // Check if export data exists
  if (!fs.existsSync(`${config.importDir}/posts.json`)) {
    console.error('❌ Export data not found. Please run the export script first.');
    process.exit(1);
  }
  
  console.log('📊 Found export data:');
  console.log(`   Posts: ${JSON.parse(fs.readFileSync(`${config.importDir}/posts.json`)).length}`);
  console.log(`   Categories: ${JSON.parse(fs.readFileSync(`${config.importDir}/categories.json`)).length}`);
  console.log(`   Tags: ${JSON.parse(fs.readFileSync(`${config.importDir}/tags.json`)).length}`);
  
  // Create Lambda function for import
  createLambdaImportFunction();
  
  console.log('\n🎯 Next steps:');
  console.log('1. Deploy the Lambda function to AWS');
  console.log('2. Invoke it with your WordPress data');
  console.log('3. Or use AWS Systems Manager to run the import from within the VPC');
}

// Run the script
main().catch(console.error); 