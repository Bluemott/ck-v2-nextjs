#!/usr/bin/env node

/**
 * SSL Certificate Verification Script
 * Verifies existing certificates and helps configure them properly
 */

const https = require('https');
const http = require('http');

console.log('🔒 SSL Certificate Verification Helper\n');

// Test current certificate status
async function testCertificates() {
  console.log('📊 Testing Current Certificate Status...\n');
  
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
      
      if (isHttps) {
        if (status === 200) {
          console.log(`  🔒 HTTPS: Working`);
        } else {
          console.log(`  ⚠️  HTTPS: Not working (Status: ${status})`);
        }
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

// Generate AWS CLI commands to check certificate status
function generateCertificateCheckCommands() {
  console.log('\n🌐 AWS CLI Commands to Check Certificates\n');
  console.log('Run these commands to verify your certificates:\n');
  
  const commands = [
    // List all certificates
    'aws lightsail get-certificates --region us-east-1',
    '',
    // Check specific certificates (replace with your actual certificate names)
    'aws lightsail get-certificate --certificate-name api-cowboykimono-com --region us-east-1',
    'aws lightsail get-certificate --certificate-name admin-cowboykimono-com --region us-east-1',
    '',
    // Check distributions
    'aws lightsail get-distributions --region us-east-1',
    '',
    // List instances
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

// Generate Apache configuration for separate certificates
function generateApacheConfig() {
  console.log('\n🔧 Apache Configuration for Separate Certificates\n');
  console.log('SSH into your instance and configure Apache:\n');
  
  const commands = [
    // Connect to instance
    'ssh -i LightsailWP.pem bitnami@34.194.14.49',
    '',
    // Check current SSL configuration
    'sudo cat /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf',
    '',
    // Backup current configuration
    'sudo cp /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf.backup',
    '',
    // Edit SSL virtual hosts configuration
    'sudo nano /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf',
    '',
    // Add this configuration for separate certificates:
    '',
    '# API subdomain configuration',
    '<VirtualHost *:443>',
    '    ServerName api.cowboykimono.com',
    '    DocumentRoot /opt/bitnami/wordpress',
    '    SSLEngine on',
    '    SSLCertificateFile /opt/bitnami/apache2/conf/api.crt',
    '    SSLCertificateKeyFile /opt/bitnami/apache2/conf/api.key',
    '    <Directory "/opt/bitnami/wordpress">',
    '        Options Indexes FollowSymLinks',
    '        AllowOverride All',
    '        Require all granted',
    '    </Directory>',
    '</VirtualHost>',
    '',
    '# Admin subdomain configuration',
    '<VirtualHost *:443>',
    '    ServerName admin.cowboykimono.com',
    '    DocumentRoot /opt/bitnami/wordpress',
    '    SSLEngine on',
    '    SSLCertificateFile /opt/bitnami/apache2/conf/admin.crt',
    '    SSLCertificateKeyFile /opt/bitnami/apache2/conf/admin.key',
    '    <Directory "/opt/bitnami/wordpress">',
    '        Options Indexes FollowSymLinks',
    '        AllowOverride All',
    '        Require all granted',
    '    </Directory>',
    '</VirtualHost>',
    '',
    // Test and restart Apache
    'sudo /opt/bitnami/apache2/bin/httpd -t',
    'sudo /opt/bitnami/ctlscript.sh restart apache',
    'sudo /opt/bitnami/ctlscript.sh status'
  ];
  
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else {
      console.log(`$ ${cmd}`);
    }
  });
}

// Generate certificate download commands
function generateCertificateDownloadCommands() {
  console.log('\n📥 Certificate Download Commands\n');
  console.log('You may need to download your certificates to the server:\n');
  
  const commands = [
    // Download certificates (replace with your actual certificate names)
    'aws lightsail download-default-key-pair --region us-east-1',
    '',
    // Or manually download from Lightsail console and upload via SCP:
    'scp -i LightsailWP.pem api-certificate.crt bitnami@34.194.14.49:/tmp/',
    'scp -i LightsailWP.pem api-private-key.key bitnami@34.194.14.49:/tmp/',
    'scp -i LightsailWP.pem admin-certificate.crt bitnami@34.194.14.49:/tmp/',
    'scp -i LightsailWP.pem admin-private-key.key bitnami@34.194.14.49:/tmp/',
    '',
    // Move certificates to Apache directory
    'sudo mv /tmp/api-certificate.crt /opt/bitnami/apache2/conf/api.crt',
    'sudo mv /tmp/api-private-key.key /opt/bitnami/apache2/conf/api.key',
    'sudo mv /tmp/admin-certificate.crt /opt/bitnami/apache2/conf/admin.crt',
    'sudo mv /tmp/admin-private-key.key /opt/bitnami/apache2/conf/admin.key',
    '',
    // Set proper permissions
    'sudo chmod 644 /opt/bitnami/apache2/conf/api.crt',
    'sudo chmod 600 /opt/bitnami/apache2/conf/api.key',
    'sudo chmod 644 /opt/bitnami/apache2/conf/admin.crt',
    'sudo chmod 600 /opt/bitnami/apache2/conf/admin.key'
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
  console.log('If certificates are still not working:\n');
  
  const steps = [
    '1. Verify certificates are attached to your Lightsail instance',
    '2. Check that certificate files exist in Apache conf directory',
    '3. Verify certificate permissions (644 for .crt, 600 for .key)',
    '4. Check Apache error logs for SSL-related errors',
    '5. Test certificate validity with openssl',
    '6. Ensure Apache SSL module is loaded',
    '7. Verify virtual host configuration syntax'
  ];
  
  steps.forEach(step => console.log(step));
}

// Generate test commands
function generateTestCommands() {
  console.log('\n🧪 Testing Commands\n');
  console.log('After configuration, test with:\n');
  
  const tests = [
    'curl -I https://api.cowboykimono.com/wp-json/wp/v2/posts',
    'curl -I https://admin.cowboykimono.com/wp-admin',
    'openssl s_client -connect api.cowboykimono.com:443 -servername api.cowboykimono.com',
    'openssl s_client -connect admin.cowboykimono.com:443 -servername admin.cowboykimono.com',
    'sudo /opt/bitnami/apache2/bin/httpd -S',
    'sudo tail -f /opt/bitnami/apache2/logs/error_log'
  ];
  
  tests.forEach(test => console.log(`$ ${test}`));
}

// Main execution
async function main() {
  try {
    await testCertificates();
    generateCertificateCheckCommands();
    generateCertificateDownloadCommands();
    generateApacheConfig();
    generateTroubleshootingSteps();
    generateTestCommands();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Check your certificate status with AWS CLI commands');
    console.log('2. Download certificates to your Lightsail instance');
    console.log('3. Configure Apache virtual hosts for separate certificates');
    console.log('4. Test both subdomains with HTTPS');
    console.log('5. Update your environment variables');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main(); 