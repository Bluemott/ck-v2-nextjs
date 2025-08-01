#!/usr/bin/env node

/**
 * Script to check for potential YAML issues in environment variables
 * Run this locally to identify problematic environment variables
 */

console.log('🔍 Checking for potential YAML issues in environment variables...\n');

// Check for common problematic characters in env vars
const problematicChars = [':', '|', '>', '[', ']', '{', '}', '&', '*', '#', '?', '-', '!', '%', '@', '`'];

console.log('Environment variables that might cause YAML issues:');
console.log('================================================');

const envVars = process.env;
let foundIssues = false;

for (const [key, value] of Object.entries(envVars)) {
  if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('AMPLIFY_')) {
    const hasProblematicChars = problematicChars.some(char => value && value.includes(char));
    
    if (hasProblematicChars) {
      console.log(`⚠️  ${key}: "${value}"`);
      console.log(`   Contains problematic characters: ${problematicChars.filter(char => value.includes(char)).join(', ')}`);
      console.log('');
      foundIssues = true;
    }
  }
}

if (!foundIssues) {
  console.log('✅ No obvious YAML issues found in environment variables');
}

console.log('\n📋 Recommendations:');
console.log('1. Check your Amplify Console environment variables');
console.log('2. Ensure all URLs and values are properly quoted');
console.log('3. Avoid special characters in environment variable values');
console.log('4. Use simple alphanumeric characters when possible');

console.log('\n🔧 To fix in Amplify Console:');
console.log('1. Go to your Amplify app settings');
console.log('2. Navigate to Environment Variables');
console.log('3. Check each variable for special characters');
console.log('4. Wrap values in quotes if needed');
console.log('5. Consider using base64 encoding for complex values'); 