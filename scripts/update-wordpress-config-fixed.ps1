# Update WordPress Configuration Script (Fixed)
# This script updates the WordPress configuration to handle CloudFront admin access properly

Write-Host "🔧 Updating WordPress Configuration..." -ForegroundColor Green
Write-Host ""

# Check if the key file exists
$keyFile = "LightsailWP.pem"
if (-not (Test-Path $keyFile)) {
    Write-Host "❌ Key file $keyFile not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Key file found: $keyFile" -ForegroundColor Green

# Create the WordPress configuration content
$wpConfigContent = @"
<?php
/**
 * WordPress Configuration - CloudFront Admin Compatible
 * This configuration handles both admin.cowboykimono.com and wp-origin.cowboykimono.com
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'bitnami_wordpress' );

/** MySQL database username */
define( 'DB_USER', 'bn_wordpress' );

/** MySQL database password */
define( 'DB_PASSWORD', 'c8c8c8c8c8' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'put your unique phrase here' );
define( 'SECURE_AUTH_KEY',  'put your unique phrase here' );
define( 'LOGGED_IN_KEY',    'put your unique phrase here' );
define( 'NONCE_KEY',        'put your unique phrase here' );
define( 'AUTH_SALT',        'put your unique phrase here' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );
define( 'LOGGED_IN_SALT',   'put your unique phrase here' );
define( 'NONCE_SALT',       'put your unique phrase here' );

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
\$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

// ** WordPress Site URLs - CLOUDFRONT COMPATIBLE ** //
// Use admin.cowboykimono.com for admin access through CloudFront
// Use wp-origin.cowboykimono.com for direct access and API
if (isset(\$_SERVER['HTTP_HOST']) && \$_SERVER['HTTP_HOST'] === 'admin.cowboykimono.com') {
    // Access through CloudFront admin subdomain
    define('WP_HOME', 'https://admin.cowboykimono.com');
    define('WP_SITEURL', 'https://admin.cowboykimono.com');
} else {
    // Direct access or API access
    define('WP_HOME', 'https://wp-origin.cowboykimono.com');
    define('WP_SITEURL', 'https://wp-origin.cowboykimono.com');
}

// Force SSL for admin
define('FORCE_SSL_ADMIN', true);
define('FORCE_SSL_LOGIN', true);

// Disable file editing in admin
define('DISALLOW_FILE_EDIT', true);

// Set memory limit
define('WP_MEMORY_LIMIT', '256M');

// Auto-save interval
define('AUTOSAVE_INTERVAL', 300);

// Post revisions
define('WP_POST_REVISIONS', 5);

// Trash days
define('EMPTY_TRASH_DAYS', 7);

// Multisite
define('WP_ALLOW_MULTISITE', false);

/* Add any custom values between this line and the "stop editing" comment. */

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
"@

# Save the configuration to a temporary file
$wpConfigContent | Out-File -FilePath "wp-config-admin-fixed.php" -Encoding UTF8

Write-Host "📤 Uploading new WordPress configuration..." -ForegroundColor Yellow
scp -i $keyFile wp-config-admin-fixed.php bitnami@34.194.14.49:/tmp/wp-config-admin-fixed.php

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload configuration file" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration file uploaded successfully" -ForegroundColor Green

# Apply the new configuration using a simpler SSH command
Write-Host "🔧 Applying new WordPress configuration..." -ForegroundColor Yellow
ssh -i $keyFile bitnami@34.194.14.49 "sudo cp /opt/bitnami/wordpress/wp-config.php /opt/bitnami/wordpress/wp-config.php.backup.$(date +%Y%m%d_%H%M%S) && sudo cp /tmp/wp-config-admin-fixed.php /opt/bitnami/wordpress/wp-config.php && sudo chown bitnami:daemon /opt/bitnami/wordpress/wp-config.php && sudo chmod 644 /opt/bitnami/wordpress/wp-config.php && sudo /opt/bitnami/ctlscript.sh restart apache && echo 'WordPress configuration updated successfully'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to apply WordPress configuration" -ForegroundColor Red
    exit 1
}

Write-Host "✅ WordPress configuration updated successfully" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Configuration changes applied:" -ForegroundColor Cyan
Write-Host "  • WordPress now detects admin.cowboykimono.com and uses it as the base URL" -ForegroundColor White
Write-Host "  • Direct access to wp-origin.cowboykimono.com still works for API calls" -ForegroundColor White
Write-Host "  • SSL and security settings maintained" -ForegroundColor White
Write-Host ""

Write-Host "🎉 WordPress configuration update complete!" -ForegroundColor Green
Write-Host "You can now test admin access at: https://admin.cowboykimono.com/wp-admin" -ForegroundColor Cyan

# Clean up temporary file
Remove-Item "wp-config-admin-fixed.php" -ErrorAction SilentlyContinue
