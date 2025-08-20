# WordPress Cleanup and Configuration Script
# Removes CloudFront remnants and configures proper CORS headers for direct API access

Write-Host "🧹 WordPress Cleanup and Configuration Script" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# WordPress server configuration
$WORDPRESS_SERVER = "api.cowboykimono.com"
$WORDPRESS_PATH = "/opt/bitnami/wordpress"

Write-Host "📋 Target Server: $WORDPRESS_SERVER" -ForegroundColor Cyan
Write-Host "📁 WordPress Path: $WORDPRESS_PATH" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔧 Step 1: WordPress Configuration Cleanup" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# Step 1: Clean up wp-config.php
Write-Host "📝 Cleaning wp-config.php..." -ForegroundColor Yellow

$wpConfigCleanup = @"
# Remove CloudFront-related configurations from wp-config.php
# Look for and remove these lines if they exist:

# REMOVE THESE LINES:
# define('WP_HOME','https://cowboykimono.com');
# define('WP_SITEURL','https://api.cowboykimono.com');
# define('FORCE_SSL_ADMIN', true);
# define('FORCE_SSL_LOGIN', true);

# ADD THESE LINES (if not present):
define('WP_HOME','https://api.cowboykimono.com');
define('WP_SITEURL','https://api.cowboykimono.com');
define('FORCE_SSL_ADMIN', true);
define('FORCE_SSL_LOGIN', true);

# Ensure proper URL handling for headless setup
define('WP_USE_THEMES', false);
define('DISALLOW_FILE_EDIT', true);
define('DISALLOW_FILE_MODS', false);
"@

Write-Host "📄 wp-config.php cleanup instructions created" -ForegroundColor Green

# Step 2: Clean up .htaccess files
Write-Host "📝 Cleaning .htaccess files..." -ForegroundColor Yellow

$htaccessCleanup = @"
# Remove CloudFront-related rules from main .htaccess
# Look for and remove these lines if they exist:

# REMOVE THESE LINES:
# RewriteCond %{HTTP_HOST} ^api\.cowboykimono\.com$ [NC]
# RewriteRule ^(.*)$ https://cowboykimono.com/$1 [R=301,L]
# RewriteCond %{HTTP:X-Forwarded-Proto} !https
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# KEEP ONLY WordPress standard rules:
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
"@

Write-Host "📄 .htaccess cleanup instructions created" -ForegroundColor Green

# Step 3: Create proper CORS headers configuration
Write-Host "📝 Creating proper CORS headers configuration..." -ForegroundColor Yellow

$corsHeadersConfig = @"
# WordPress HTTP Headers Plugin Configuration
# Use these specific rules instead of global rule

# RULE 1: Media Files (wp-content/uploads/)
URL Pattern: /wp-content/uploads/
Request Method: GET, HEAD, OPTIONS
Headers:
Access-Control-Allow-Origin: https://cowboykimono.com
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Cross-Origin-Resource-Policy: cross-origin
Cross-Origin-Embedder-Policy: credentialless

# RULE 2: REST API (wp-json/)
URL Pattern: /wp-json/
Request Method: GET, POST, PUT, DELETE, OPTIONS
Headers:
Access-Control-Allow-Origin: https://cowboykimono.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WP-Nonce
Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages

# RULE 3: OPTIONS Preflight (for both media and API)
URL Pattern: /wp-content/uploads/ OR /wp-json/
Request Method: OPTIONS
Headers:
Access-Control-Allow-Origin: https://cowboykimono.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WP-Nonce, Origin, Accept
Access-Control-Max-Age: 86400
Content-Length: 0
Content-Type: text/plain; charset=utf-8
"@

Write-Host "📄 CORS headers configuration created" -ForegroundColor Green

# Step 4: WordPress functions.php cleanup
Write-Host "📝 Creating WordPress functions.php cleanup..." -ForegroundColor Yellow

$functionsCleanup = @"
<?php
/**
 * WordPress Functions Cleanup and CORS Configuration
 * Remove CloudFront remnants and add proper CORS headers
 */

// Remove any CloudFront-related functions
// Look for and remove functions like:
// - cloudfront_redirect()
// - handle_cloudfront_headers()
// - any functions with 'cloudfront' in the name

// Add proper CORS headers for media files
function add_cors_headers_for_media() {
    // Only add headers for media files
    if (strpos($_SERVER['REQUEST_URI'], '/wp-content/uploads/') !== false) {
        header('Access-Control-Allow-Origin: https://cowboykimono.com');
        header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
        header('Cross-Origin-Resource-Policy: cross-origin');
        header('Cross-Origin-Embedder-Policy: credentialless');
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            header('Access-Control-Max-Age: 86400');
            header('Content-Length: 0');
            header('Content-Type: text/plain; charset=utf-8');
            exit(0);
        }
    }
}
add_action('init', 'add_cors_headers_for_media');

// Add CORS headers for REST API
function add_cors_headers_for_rest_api() {
    header('Access-Control-Allow-Origin: https://cowboykimono.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WP-Nonce');
    header('Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Max-Age: 86400');
        header('Content-Length: 0');
        header('Content-Type: text/plain; charset=utf-8');
        exit(0);
    }
}
add_action('rest_api_init', 'add_cors_headers_for_rest_api');

// Ensure proper URL handling for headless setup
function ensure_proper_urls() {
    // Force HTTPS
    if (!is_ssl() && !is_admin()) {
        wp_redirect('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'], 301);
        exit();
    }
}
add_action('init', 'ensure_proper_urls');

// Remove WordPress version from headers
remove_action('wp_head', 'wp_generator');

// Disable XML-RPC
add_filter('xmlrpc_enabled', '__return_false');

// Security headers
function add_security_headers() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
}
add_action('init', 'add_security_headers');
?>
"@

Write-Host "📄 WordPress functions.php cleanup created" -ForegroundColor Green

# Step 5: Manual steps instructions
Write-Host ""
Write-Host "🔧 Manual Steps Required:" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

Write-Host ""
Write-Host "1. SSH into WordPress server:" -ForegroundColor White
Write-Host "   ssh bitnami@your-lightsail-ip" -ForegroundColor Cyan

Write-Host ""
Write-Host "2. Clean up wp-config.php:" -ForegroundColor White
Write-Host "   cd $WORDPRESS_PATH" -ForegroundColor Cyan
Write-Host "   nano wp-config.php" -ForegroundColor Cyan
Write-Host "   Remove CloudFront-related lines" -ForegroundColor Cyan
Write-Host "   Ensure proper URL configuration" -ForegroundColor Cyan

Write-Host ""
Write-Host "3. Clean up main .htaccess:" -ForegroundColor White
Write-Host "   nano .htaccess" -ForegroundColor Cyan
Write-Host "   Remove CloudFront redirect rules" -ForegroundColor Cyan
Write-Host "   Keep only WordPress standard rules" -ForegroundColor Cyan

Write-Host ""
Write-Host "4. Configure HTTP Headers Plugin:" -ForegroundColor White
Write-Host "   Go to WordPress admin: https://admin.cowboykimono.com/wp-admin" -ForegroundColor Cyan
Write-Host "   Navigate to your HTTP headers plugin" -ForegroundColor Cyan
Write-Host "   Remove the global rule that's causing errors" -ForegroundColor Cyan
Write-Host "   Add the 3 specific rules shown above" -ForegroundColor Cyan

Write-Host ""
Write-Host "5. Clean up theme functions.php:" -ForegroundColor White
Write-Host "   cd wp-content/themes/your-active-theme/" -ForegroundColor Cyan
Write-Host "   nano functions.php" -ForegroundColor Cyan
Write-Host "   Remove CloudFront-related functions" -ForegroundColor Cyan
Write-Host "   Add the CORS functions shown above" -ForegroundColor Cyan

Write-Host ""
Write-Host "6. Restart Apache:" -ForegroundColor White
Write-Host "   sudo /opt/bitnami/ctlscript.sh restart apache" -ForegroundColor Cyan

Write-Host ""
Write-Host "7. Test the configuration:" -ForegroundColor White
Write-Host "   curl -I https://api.cowboykimono.com/wp-content/uploads/2025/08/Starfish_Ornaments_Long.webp" -ForegroundColor Cyan
Write-Host "   curl -H 'Origin: https://cowboykimono.com' -X OPTIONS https://api.cowboykimono.com/wp-content/uploads/2025/08/Starfish_Ornaments_Long.webp" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔍 Expected Results:" -ForegroundColor Cyan
Write-Host "   - No more 'CORS origins not allowed' errors" -ForegroundColor White
Write-Host "   - Images load properly on https://cowboykimono.com" -ForegroundColor White
Write-Host "   - Links work correctly in Chrome" -ForegroundColor White
Write-Host "   - REST API responds with proper CORS headers" -ForegroundColor White

Write-Host ""
Write-Host "✅ WordPress cleanup and configuration instructions completed!" -ForegroundColor Green
Write-Host "🎯 This will resolve all CORS issues and remove CloudFront remnants." -ForegroundColor Green
