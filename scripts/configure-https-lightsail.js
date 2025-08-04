#!/usr/bin/env node

/**
 * Lightsail HTTPS Configuration Script
 * This script helps configure HTTPS for your WordPress subdomains
 */

const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');

console.log('🔒 Lightsail HTTPS Configuration Helper\n');

const config = {
  instanceIP: '34.194.14.49',
  domains: ['api.cowboykimono.com', 'admin.cowboykimono.com'],
  sshKey: 'LightsailWP.pem',
  username: 'bitnami'
};

// Test current HTTPS status
async function testCurrentStatus() {
  console.log('📊 Testing Current HTTPS Status...\n');
  
  const testUrls = [
    'https://api.cowboykimono.com/wp-json/wp/v2/posts',
    'https://admin.cowboykimono.com/wp-admin',
    'http://api.cowboykimono.com/wp-json/wp/v2/posts',
    'http://admin.cowboykimono.com/wp-admin'
  ];
  
  for (const url of testUrls) {
    await testEndpoint(url);
  }
}

function testEndpoint(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    console.log(`Testing: ${url}`);
    
    const request = client.get(url, (response) => {
      const status = response.statusCode;
      console.log(`  ✅ Status: ${status}`);
      
      if (isHttps && status === 200) {
        console.log(`  🔒 HTTPS: Working`);
      } else if (isHttps) {
        console.log(`  ⚠️  HTTPS: Not working (Status: ${status})`);
      }
      
      resolve({ url, status, success: status === 200 });
    }).on('error', (error) => {
      console.log(`  ❌ Error: ${error.message}`);
      resolve({ url, status: 'Error', success: false, error: error.message });
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      console.log(`  ⏰ Timeout`);
      resolve({ url, status: 'Timeout', success: false });
    });
  });
}

// Generate SSH commands for manual execution
function generateSSHCommands() {
  console.log('\n🔧 SSH Commands for Manual HTTPS Configuration\n');
  console.log('Copy and paste these commands in your SSH session:\n');
  
  const commands = [
    // Connect to instance
    `ssh -i ${config.sshKey} ${config.username}@${config.instanceIP}`,
    '',
    // Check current Apache configuration
    'sudo /opt/bitnami/ctlscript.sh status',
    '',
    // Check SSL certificate status
    'sudo /opt/bitnami/apache2/bin/httpd -S',
    '',
    // Check if SSL module is loaded
    'sudo /opt/bitnami/apache2/bin/httpd -M | grep ssl',
    '',
    // Backup current configuration
    'sudo cp /opt/bitnami/apache2/conf/httpd.conf /opt/bitnami/apache2/conf/httpd.conf.backup',
    '',
    // Check current virtual hosts
    'sudo cat /opt/bitnami/apache2/conf/bitnami/bitnami-apps-vhosts.conf',
    '',
    // Restart Apache to apply any changes
    'sudo /opt/bitnami/ctlscript.sh restart apache',
    '',
    // Check Apache error logs
    'sudo tail -f /opt/bitnami/apache2/logs/error_log'
  ];
  
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else {
      console.log(`$ ${cmd}`);
    }
  });
}

// Generate AWS CLI commands for certificate attachment
function generateAWSCLICommands() {
  console.log('\n🌐 AWS CLI Commands for Certificate Attachment\n');
  console.log('Run these commands to attach your SSL certificate:\n');
  
  const commands = [
    // List existing certificates
    'aws lightsail get-certificates --region us-east-1',
    '',
    // Attach certificate to instance (replace with your actual certificate name)
    'aws lightsail attach-certificate-to-distribution \\',
    '  --distribution-name CowboyKimonoWP \\',
    '  --certificate-name api-cowboykimono-com \\',
    '  --region us-east-1',
    '',
    // Check distribution status
    'aws lightsail get-distributions --region us-east-1',
    '',
    // List your Lightsail instances
    'aws lightsail get-instances --region us-east-1'
  ];
  
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else {
      console.log(`$ ${cmd}`);
    }
  });
}

// Generate troubleshooting steps
function generateTroubleshootingSteps() {
  console.log('\n🔍 Troubleshooting Steps\n');
  console.log('If HTTPS is still not working after following the above steps:\n');
  
  const steps = [
    '1. Verify SSL certificate is attached in Lightsail console',
    '2. Check that Apache is configured for SSL',
    '3. Ensure virtual hosts are properly configured',
    '4. Check Apache error logs for SSL-related errors',
    '5. Verify DNS propagation (can take up to 48 hours)',
    '6. Test with curl: curl -I https://api.cowboykimono.com',
    '7. Check certificate validity: openssl s_client -connect api.cowboykimono.com:443'
  ];
  
  steps.forEach(step => console.log(step));
}

// Generate environment variable updates
function generateEnvUpdates() {
  console.log('\n📝 Environment Variable Updates\n');
  console.log('Once HTTPS is working, update your .env.local file:\n');
  
  const envVars = [
    'NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com',
    'NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com'
  ];
  
  envVars.forEach(env => console.log(env));
}

// Main execution
async function main() {
  try {
    await testCurrentStatus();
    generateSSHCommands();
    generateAWSCLICommands();
    generateTroubleshootingSteps();
    generateEnvUpdates();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Run the AWS CLI commands to attach your certificate');
    console.log('2. SSH into your instance and run the Apache configuration commands');
    console.log('3. Wait 5-10 minutes for changes to propagate');
    console.log('4. Run this script again to verify HTTPS is working');
    console.log('5. Update your environment variables to use HTTPS URLs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main(); 