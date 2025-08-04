#!/usr/bin/env node

/**
 * Start Apache and Configure SSL Script
 * Starts Apache and configures it with Let's Encrypt certificates
 */

console.log('🚀 Apache Start and SSL Configuration Helper\n');

// Generate commands to start Apache and configure SSL
function generateStartCommands() {
  console.log('🔧 Start Apache and Configure SSL\n');
  console.log('SSH into your instance and run these commands:\n');
  
  const commands = [
    // Connect to instance
    'ssh -i LightsailWP.pem bitnami@34.194.14.49',
    '',
    // Check current status
    'sudo /opt/bitnami/ctlscript.sh status',
    '',
    // Start Apache if not running
    'sudo /opt/bitnami/ctlscript.sh start apache',
    '',
    // Check if Apache started successfully
    'sudo /opt/bitnami/ctlscript.sh status',
    '',
    // Check Apache error logs if it didn't start
    'sudo tail -f /opt/bitnami/apache2/logs/error_log',
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
    // Test configuration
    'sudo /opt/bitnami/apache2/bin/httpd -t',
    '',
    // Restart Apache
    'sudo /opt/bitnami/ctlscript.sh restart apache',
    '',
    // Check final status
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

// Generate troubleshooting commands
function generateTroubleshootingCommands() {
  console.log('\n🔍 Troubleshooting Commands\n');
  console.log('If Apache won\'t start, try these:\n');
  
  const commands = [
    // Check what's using port 80/443
    'sudo netstat -tlnp | grep :80',
    'sudo netstat -tlnp | grep :443',
    '',
    // Check Apache configuration
    'sudo /opt/bitnami/apache2/bin/httpd -t',
    '',
    // Check Apache error logs
    'sudo tail -f /opt/bitnami/apache2/logs/error_log',
    '',
    // Check if SSL module is loaded
    'sudo /opt/bitnami/apache2/bin/httpd -M | grep ssl',
    '',
    // Check certificate permissions
    'sudo ls -la /etc/letsencrypt/live/',
    '',
    // Check if certificates are readable
    'sudo /opt/bitnami/apache2/bin/httpd -t -D DUMP_VHOSTS',
    '',
    // Force start Apache in debug mode
    'sudo /opt/bitnami/apache2/bin/httpd -X'
  ];
  
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else {
      console.log(`$ ${cmd}`);
    }
  });
}

// Generate test commands
function generateTestCommands() {
  console.log('\n🧪 Test Commands\n');
  console.log('After Apache is running, test with:\n');
  
  const commands = [
    // Test HTTP endpoints
    'curl -I http://api.cowboykimono.com/wp-json/wp/v2/posts',
    'curl -I http://admin.cowboykimono.com/wp-admin',
    '',
    // Test HTTPS endpoints
    'curl -I https://api.cowboykimono.com/wp-json/wp/v2/posts',
    'curl -I https://admin.cowboykimono.com/wp-admin',
    '',
    // Test SSL certificates
    'openssl s_client -connect api.cowboykimono.com:443 -servername api.cowboykimono.com',
    'openssl s_client -connect admin.cowboykimono.com:443 -servername admin.cowboykimono.com',
    '',
    // Test from server itself
    'curl -I http://localhost/wp-json/wp/v2/posts',
    'curl -I https://localhost/wp-json/wp/v2/posts'
  ];
  
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else {
      console.log(`$ ${cmd}`);
    }
  });
}

// Generate emergency commands
function generateEmergencyCommands() {
  console.log('\n🚨 Emergency Commands\n');
  console.log('If Apache still won\'t start:\n');
  
  const commands = [
    // Stop all services
    'sudo /opt/bitnami/ctlscript.sh stop',
    '',
    // Start services one by one
    'sudo /opt/bitnami/ctlscript.sh start apache',
    'sudo /opt/bitnami/ctlscript.sh start php-fpm',
    'sudo /opt/bitnami/ctlscript.sh start mysql',
    '',
    // Check all services
    'sudo /opt/bitnami/ctlscript.sh status',
    '',
    // Alternative: restart everything
    'sudo /opt/bitnami/ctlscript.sh restart',
    '',
    // Check system resources
    'free -h',
    'df -h',
    'ps aux | grep apache'
  ];
  
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else {
      console.log(`$ ${cmd}`);
    }
  });
}

// Main execution
function main() {
  generateStartCommands();
  generateTroubleshootingCommands();
  generateTestCommands();
  generateEmergencyCommands();
  
  console.log('\n🎯 Priority Actions:');
  console.log('1. SSH into your instance');
  console.log('2. Start Apache: sudo /opt/bitnami/ctlscript.sh start apache');
  console.log('3. Configure SSL virtual hosts with Let\'s Encrypt certificates');
  console.log('4. Test both HTTP and HTTPS endpoints');
  console.log('5. Update your environment variables to use HTTPS URLs');
  console.log('');
  console.log('⚠️  If Apache won\'t start, check the error logs first!');
}

main(); 