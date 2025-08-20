# Fix WordPress CORS Headers for Images and Media Files
# This script configures WordPress to send proper CORS headers for media files

Write-Host "🔧 Fixing WordPress CORS Headers for Images..." -ForegroundColor Green

# WordPress server configuration
$WORDPRESS_SERVER = "api.cowboykimono.com"
$WORDPRESS_PATH = "/var/www/html"

Write-Host "📋 Target Server: $WORDPRESS_SERVER" -ForegroundColor Cyan
Write-Host "📁 WordPress Path: $WORDPRESS_PATH" -ForegroundColor Cyan

# Step 1: Create .htaccess file for wp-content/uploads with CORS headers
Write-Host "📝 Creating .htaccess for wp-content/uploads..." -ForegroundColor Yellow

$htaccessContent = @"
# CORS Headers for WordPress Media Files
<IfModule mod_headers.c>
    # Allow cross-origin requests for images
    <FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|ico|pdf)$">
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, HEAD, OPTIONS"
        Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept"
        Header always set Cross-Origin-Resource-Policy "cross-origin"
        Header always set Cross-Origin-Embedder-Policy "credentialless"
    </FilesMatch>
    
    # Handle preflight requests
    <If "%{REQUEST_METHOD} == 'OPTIONS'">
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, HEAD, OPTIONS"
        Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept"
        Header always set Access-Control-Max-Age "86400"
        Header always set Content-Length "0"
        Header always set Content-Type "text/plain; charset=utf-8"
    </If>
</IfModule>

# Cache headers for media files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType application/pdf "access plus 1 year"
</IfModule>

# Compression for media files
<IfModule mod_deflate.c>
    <FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|ico|pdf)$">
        SetOutputFilter DEFLATE
    </FilesMatch>
</IfModule>
"@

Write-Host "📄 .htaccess content created for media files" -ForegroundColor Green

# Step 2: Create WordPress functions.php addition for CORS headers
Write-Host "📝 Creating WordPress CORS functions..." -ForegroundColor Yellow

$functionsContent = @"
<?php
/**
 * Add CORS headers for WordPress media files
 * This ensures proper cross-origin access to images and media
 */

// Add CORS headers for media files
function add_cors_headers_for_media() {
    // Check if this is a media file request
    if (strpos($_SERVER['REQUEST_URI'], '/wp-content/uploads/') !== false) {
        // Set CORS headers for media files
        header('Access-Control-Allow-Origin: *');
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
    header('Access-Control-Allow-Origin: *');
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

// Ensure proper headers for all requests
function ensure_cors_headers() {
    // Add CORS headers for all requests
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WP-Nonce');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Max-Age: 86400');
        header('Content-Length: 0');
        header('Content-Type: text/plain; charset=utf-8');
        exit(0);
    }
}
add_action('init', 'ensure_cors_headers', 1);
?>
"@

Write-Host "📄 WordPress CORS functions created" -ForegroundColor Green

# Step 3: Instructions for manual application
Write-Host "🔧 Manual Steps Required:" -ForegroundColor Yellow
Write-Host "   1. SSH into your WordPress server (Lightsail)" -ForegroundColor White
Write-Host "   2. Navigate to: $WORDPRESS_PATH/wp-content/uploads/" -ForegroundColor White
Write-Host "   3. Create .htaccess file with the content above" -ForegroundColor White
Write-Host "   4. Add the PHP functions to your theme's functions.php" -ForegroundColor White
Write-Host "   5. Test image loading from: https://cowboykimono.com" -ForegroundColor White

Write-Host ""
Write-Host "📋 Alternative: Use WordPress Plugin" -ForegroundColor Cyan
Write-Host "   Install 'WP CORS' plugin from WordPress admin" -ForegroundColor White
Write-Host "   Configure it to allow all origins for media files" -ForegroundColor White

Write-Host ""
Write-Host "🔍 Test Commands:" -ForegroundColor Cyan
Write-Host "   curl -I https://api.cowboykimono.com/wp-content/uploads/2025/08/Starfish_Ornaments_Long.webp" -ForegroundColor White
Write-Host "   curl -H 'Origin: https://cowboykimono.com' -H 'Access-Control-Request-Method: GET' -X OPTIONS https://api.cowboykimono.com/wp-content/uploads/2025/08/Starfish_Ornaments_Long.webp" -ForegroundColor White

Write-Host ""
Write-Host "✅ CORS configuration instructions completed!" -ForegroundColor Green
Write-Host "🎯 This should resolve the image loading and Chrome link truncation issues." -ForegroundColor Green
