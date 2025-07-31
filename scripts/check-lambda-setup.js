#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Lambda GraphQL setup...\n');

const lambdaDir = path.join(__dirname, '..', 'lambda', 'graphql');

// Check if the directory exists
if (!fs.existsSync(lambdaDir)) {
  console.error('❌ lambda/graphql directory not found');
  process.exit(1);
}

console.log('✅ lambda/graphql directory exists');

// Check for required files
const requiredFiles = [
  'index.ts',
  'package.json',
  'tsconfig.lambda.json'
];

requiredFiles.forEach(file => {
  const filePath = path.join(lambdaDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check if index.ts has content
const indexPath = path.join(lambdaDir, 'index.ts');
if (fs.existsSync(indexPath)) {
  const stats = fs.statSync(indexPath);
  if (stats.size > 0) {
    console.log('✅ index.ts has content');
  } else {
    console.log('⚠️ index.ts is empty');
  }
}

// Check TypeScript configuration
const tsConfigPath = path.join(lambdaDir, 'tsconfig.lambda.json');
if (fs.existsSync(tsConfigPath)) {
  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    console.log('✅ tsconfig.lambda.json is valid JSON');
    
    if (tsConfig.include && tsConfig.include.length > 0) {
      console.log(`✅ TypeScript includes: ${tsConfig.include.join(', ')}`);
    } else {
      console.log('⚠️ TypeScript includes not configured');
    }
  } catch (error) {
    console.log('❌ tsconfig.lambda.json is invalid JSON');
  }
}

console.log('\n🎉 Lambda setup check completed!'); 