#!/usr/bin/env node

/**
 * Fix Apache SSL Issues Script
 * Resolves Apache startup issues and SSL configuration problems
 */

console.log('🔧 Apache SSL Issues Fix Helper\n');

// Generate commands to fix Apache issues
function generateFixCommands() {
  console.log('🔧 Fix Apache SSL Issues\n');
  console.log('SSH into your instance and run these commands:\n');
  
  const commands = [
    // Connect to instance
    'ssh -i LightsailWP.pem bitnami@34.194.14.49',
    '',
    // Kill any stuck Apache processes
    'sudo pkill -f apache',
    'sudo pkill -f httpd',
    '',
    // Wait a moment
    'sleep 5',
    '',
    // Check for any remaining processes
    'ps aux | grep apache',
    'ps aux | grep httpd',
    '',
    // Check current SSL configuration
    'sudo cat /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf',
    '',
    // Backup current configuration
    'sudo cp /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf.backup',
    '',
    // Create a minimal SSL configuration first
    'sudo nano /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf',
    '',
    // Add this minimal configuration:
    '',
    '# Minimal SSL configuration to get Apache running',
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
    '</VirtualHost>',
    '',
    // Test configuration
    'sudo /opt/bitnami/apache2/bin/httpd -t',
    '',
    // Start Apache with minimal config
    'sudo /opt/bitnami/ctlscript.sh start apache',
    '',
    // Check status
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

// Generate commands to add admin subdomain after Apache is running
function generateAdminSubdomainCommands() {
  console.log('\n🔧 Add Admin Subdomain After Apache is Running\n');
  console.log('Once Apache is running with the API subdomain, add the admin subdomain:\n');
  
  const commands = [
    // Edit SSL configuration again
    'sudo nano /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf',
    '',
    // Replace with full configuration:
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
    '</VirtualHost>',
    '',
    // Test and restart
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

// Generate troubleshooting commands
function generateTroubleshootingCommands() {
  console.log('\n🔍 Troubleshooting Commands\n');
  console.log('If Apache still won\'t start:\n');
  
  const commands = [
    // Check certificate permissions
    'sudo ls -la /etc/letsencrypt/live/api.cowboykimono.com/',
    'sudo ls -la /etc/letsencrypt/live/admin.cowboykimono.com/',
    '',
    // Check certificate validity
    'sudo openssl x509 -in /etc/letsencrypt/live/api.cowboykimono.com/fullchain.pem -text -noout | grep "Subject Alternative Name"',
    'sudo openssl x509 -in /etc/letsencrypt/live/admin.cowboykimono.com/fullchain.pem -text -noout | grep "Subject Alternative Name"',
    '',
    // Check Apache error logs
    'sudo tail -f /opt/bitnami/apache2/logs/error_log',
    '',
    // Test Apache configuration
    'sudo /opt/bitnami/apache2/bin/httpd -t -D DUMP_VHOSTS',
    '',
    // Check if SSL module is loaded
    'sudo /opt/bitnami/apache2/bin/httpd -M | grep ssl',
    '',
    // Check ports
    'sudo netstat -tlnp | grep :443',
    'sudo netstat -tlnp | grep :80'
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
    // Test from server
    'curl -I http://localhost/wp-json/wp/v2/posts',
    'curl -I https://localhost/wp-json/wp/v2/posts',
    '',
    // Test subdomains
    'curl -I http://api.cowboykimono.com/wp-json/wp/v2/posts',
    'curl -I https://api.cowboykimono.com/wp-json/wp/v2/posts',
    'curl -I http://admin.cowboykimono.com/wp-admin',
    'curl -I https://admin.cowboykimono.com/wp-admin',
    '',
    // Test SSL certificates
    'openssl s_client -connect api.cowboykimono.com:443 -servername api.cowboykimono.com < /dev/null',
    'openssl s_client -connect admin.cowboykimono.com:443 -servername admin.cowboykimono.com < /dev/null'
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
  console.log('If nothing else works:\n');
  
  const commands = [
    // Stop everything
    'sudo /opt/bitnami/ctlscript.sh stop',
    '',
    // Wait
    'sleep 10',
    '',
    // Kill any remaining processes
    'sudo pkill -f apache',
    'sudo pkill -f httpd',
    '',
    // Start fresh
    'sudo /opt/bitnami/ctlscript.sh start',
    '',
    // Check status
    'sudo /opt/bitnami/ctlscript.sh status',
    '',
    // If still not working, check system resources
    'free -h',
    'df -h',
    'ps aux | grep -E "(apache|httpd)"'
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
  generateFixCommands();
  generateAdminSubdomainCommands();
  generateTroubleshootingCommands();
  generateTestCommands();
  generateEmergencyCommands();
  
  console.log('\n🎯 Priority Actions:');
  console.log('1. Kill stuck Apache processes');
  console.log('2. Start with minimal SSL configuration (API subdomain only)');
  console.log('3. Once working, add admin subdomain');
  console.log('4. Test both subdomains');
  console.log('5. Update your environment variables');
  console.log('');
  console.log('⚠️  The key is to start with a minimal configuration first!');
}

main(); 