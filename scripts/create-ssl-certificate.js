#!/usr/bin/env node

/**
 * SSL Certificate Creation Script
 * Creates a new SSL certificate that covers both subdomains
 */

const { exec } = require('child_process');

console.log('🔒 SSL Certificate Creation Helper\n');

const domains = [
  'api.cowboykimono.com',
  'admin.cowboykimono.com'
];

console.log('📋 Domains to be covered:');
domains.forEach(domain => console.log(`  - ${domain}`));
console.log('');

// AWS CLI commands for certificate creation
function generateCertificateCommands() {
  console.log('🌐 AWS CLI Commands for Certificate Creation\n');
  console.log('Run these commands to create a new certificate:\n');
  
  const commands = [
    // Delete the old certificate (if needed)
    'aws lightsail delete-certificate --certificate-name api-cowboykimono-com --region us-east-1',
    '',
    // Create new certificate with both domains
    'aws lightsail create-certificate \\',
    '  --certificate-name cowboykimono-subdomains \\',
    '  --domain-name api.cowboykimono.com \\',
    '  --subject-alternative-names admin.cowboykimono.com \\',
    '  --region us-east-1',
    '',
    // Verify certificate creation
    'aws lightsail get-certificates --region us-east-1',
    '',
    // Attach to your instance
    'aws lightsail attach-certificate-to-distribution \\',
    '  --distribution-name CowboyKimonoWP \\',
    '  --certificate-name cowboykimono-subdomains \\',
    '  --region us-east-1'
  ];
  
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else {
      console.log(`$ ${cmd}`);
    }
  });
}

// Alternative: Manual certificate creation via Lightsail console
function generateConsoleSteps() {
  console.log('\n🖥️  Manual Steps via Lightsail Console\n');
  console.log('1. Go to AWS Lightsail Console');
  console.log('2. Navigate to "Certificates" section');
  console.log('3. Click "Create certificate"');
  console.log('4. Enter domain name: api.cowboykimono.com');
  console.log('5. Add alternative names: admin.cowboykimono.com');
  console.log('6. Complete the certificate creation');
  console.log('7. Attach the certificate to your instance');
  console.log('');
}

// Apache configuration for SSL
function generateApacheConfig() {
  console.log('🔧 Apache SSL Configuration\n');
  console.log('After creating the certificate, SSH into your instance and run:\n');
  
  const commands = [
    // Connect to instance
    'ssh -i LightsailWP.pem bitnami@34.194.14.49',
    '',
    // Check current SSL configuration
    'sudo cat /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf',
    '',
    // Create SSL virtual host configuration
    'sudo nano /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf',
    '',
    // Add this configuration to the file:
    '',
    '<VirtualHost *:443>',
    '    ServerName api.cowboykimono.com',
    '    ServerAlias admin.cowboykimono.com',
    '    DocumentRoot /opt/bitnami/wordpress',
    '    SSLEngine on',
    '    SSLCertificateFile /opt/bitnami/apache2/conf/server.crt',
    '    SSLCertificateKeyFile /opt/bitnami/apache2/conf/server.key',
    '    <Directory "/opt/bitnami/wordpress">',
    '        Options Indexes FollowSymLinks',
    '        AllowOverride All',
    '        Require all granted',
    '    </Directory>',
    '</VirtualHost>',
    '',
    // Restart Apache
    'sudo /opt/bitnami/ctlscript.sh restart apache',
    '',
    // Check Apache status
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

// Test the new configuration
function generateTestCommands() {
  console.log('\n🧪 Testing Commands\n');
  console.log('After configuration, test with:\n');
  
  const tests = [
    'curl -I https://api.cowboykimono.com/wp-json/wp/v2/posts',
    'curl -I https://admin.cowboykimono.com/wp-admin',
    'openssl s_client -connect api.cowboykimono.com:443 -servername api.cowboykimono.com',
    'openssl s_client -connect admin.cowboykimono.com:443 -servername admin.cowboykimono.com'
  ];
  
  tests.forEach(test => console.log(`$ ${test}`));
}

// Main execution
function main() {
  generateCertificateCommands();
  generateConsoleSteps();
  generateApacheConfig();
  generateTestCommands();
  
  console.log('\n🎯 Priority Actions:');
  console.log('1. Create new SSL certificate covering both subdomains');
  console.log('2. Attach certificate to your Lightsail instance');
  console.log('3. Configure Apache virtual hosts for SSL');
  console.log('4. Test both subdomains with HTTPS');
  console.log('5. Update your environment variables');
}

main(); 