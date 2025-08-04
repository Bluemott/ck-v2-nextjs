#!/usr/bin/env node

/**
 * Let's Encrypt Apache Configuration Script
 * Configures Apache to use existing Let's Encrypt certificates
 */

console.log('🔒 Let\'s Encrypt Apache Configuration Helper\n');

// Generate Apache configuration for Let's Encrypt certificates
function generateApacheConfig() {
  console.log('🔧 Apache Configuration for Let\'s Encrypt Certificates\n');
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
    // Add this configuration for Let\'s Encrypt certificates:
    '',
    '# API subdomain configuration',
    '<VirtualHost *:443>',
    '    ServerName api.cowboykimono.com',
    '    DocumentRoot /opt/bitnami/wordpress',
    '    SSLEngine on',
    '    SSLCertificateFile /etc/letsencrypt/live/api.cowboykimono.com/fullchain.pem',
    '    SSLCertificateKeyFile /etc/letsencrypt/live/api.cowboykimono.com/privkey.pem',
    '    <Directory "/opt/bitnami/wordpress">',
    '        Options Indexes FollowSymLinks',
    '        AllowOverride All',
    '        Require all granted',
    '    </Directory>',
    '    # WordPress rewrite rules',
    '    <IfModule mod_rewrite.c>',
    '        RewriteEngine On',
    '        RewriteBase /',
    '        RewriteRule ^index\\.php$ - [L]',
    '        RewriteCond %{REQUEST_FILENAME} !-f',
    '        RewriteCond %{REQUEST_FILENAME} !-d',
    '        RewriteRule . /index.php [L]',
    '    </IfModule>',
    '</VirtualHost>',
    '',
    '# Admin subdomain configuration',
    '<VirtualHost *:443>',
    '    ServerName admin.cowboykimono.com',
    '    DocumentRoot /opt/bitnami/wordpress',
    '    SSLEngine on',
    '    SSLCertificateFile /etc/letsencrypt/live/admin.cowboykimono.com/fullchain.pem',
    '    SSLCertificateKeyFile /etc/letsencrypt/live/admin.cowboykimono.com/privkey.pem',
    '    <Directory "/opt/bitnami/wordpress">',
    '        Options Indexes FollowSymLinks',
    '        AllowOverride All',
    '        Require all granted',
    '    </Directory>',
    '    # WordPress rewrite rules',
    '    <IfModule mod_rewrite.c>',
    '        RewriteEngine On',
    '        RewriteBase /',
    '        RewriteRule ^index\\.php$ - [L]',
    '        RewriteCond %{REQUEST_FILENAME} !-f',
    '        RewriteCond %{REQUEST_FILENAME} !-d',
    '        RewriteRule . /index.php [L]',
    '    </IfModule>',
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

// Generate verification commands
function generateVerificationCommands() {
  console.log('\n🧪 Verification Commands\n');
  console.log('After configuration, verify with:\n');
  
  const commands = [
    // Test HTTPS endpoints
    'curl -I https://api.cowboykimono.com/wp-json/wp/v2/posts',
    'curl -I https://admin.cowboykimono.com/wp-admin',
    '',
    // Test SSL certificates
    'openssl s_client -connect api.cowboykimono.com:443 -servername api.cowboykimono.com',
    'openssl s_client -connect admin.cowboykimono.com:443 -servername admin.cowboykimono.com',
    '',
    // Check Apache configuration
    'sudo /opt/bitnami/apache2/bin/httpd -S',
    'sudo /opt/bitnami/apache2/bin/httpd -t',
    '',
    // Check Apache logs
    'sudo tail -f /opt/bitnami/apache2/logs/error_log',
    'sudo tail -f /opt/bitnami/apache2/logs/access_log'
  ];
  
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else {
      console.log(`$ ${cmd}`);
    }
  });
}

// Generate certificate renewal setup
function generateRenewalSetup() {
  console.log('\n🔄 Certificate Renewal Setup\n');
  console.log('Set up automatic renewal:\n');
  
  const commands = [
    // Test renewal
    'sudo certbot renew --dry-run',
    '',
    // Add to crontab for automatic renewal
    'sudo crontab -e',
    '',
    // Add this line to crontab:
    '0 12 * * * /usr/bin/certbot renew --quiet',
    '',
    // Check renewal status
    'sudo certbot certificates'
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
  console.log('If HTTPS still doesn\'t work:\n');
  
  const steps = [
    '1. Check certificate permissions: sudo ls -la /etc/letsencrypt/live/',
    '2. Verify Apache SSL module: sudo /opt/bitnami/apache2/bin/httpd -M | grep ssl',
    '3. Check Apache error logs: sudo tail -f /opt/bitnami/apache2/logs/error_log',
    '4. Test certificate validity: sudo openssl x509 -in /etc/letsencrypt/live/api.cowboykimono.com/fullchain.pem -text -noout',
    '5. Verify virtual host syntax: sudo /opt/bitnami/apache2/bin/httpd -t',
    '6. Check if ports are open: sudo netstat -tlnp | grep :443',
    '7. Test from server: curl -I https://api.cowboykimono.com/wp-json/wp/v2/posts'
  ];
  
  steps.forEach(step => console.log(step));
}

// Main execution
function main() {
  generateApacheConfig();
  generateVerificationCommands();
  generateRenewalSetup();
  generateTroubleshootingSteps();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. SSH into your instance and configure Apache virtual hosts');
  console.log('2. Use the Let\'s Encrypt certificate paths shown above');
  console.log('3. Test both subdomains with HTTPS');
  console.log('4. Set up automatic certificate renewal');
  console.log('5. Update your environment variables to use HTTPS URLs');
  console.log('');
  console.log('✅ Your Let\'s Encrypt certificates are already valid and ready to use!');
}

main(); 