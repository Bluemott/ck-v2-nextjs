# Fix WordPress functions.php - Admin 500 Error Resolution

## Problem
The PHP code added to functions.php in Phase 5.3 is causing 500 errors when accessing the WordPress admin panel.

## Solution

### Step 1: Remove or Comment Out the Problematic Code

SSH to your WordPress server and edit functions.php:

```bash
# Navigate to active theme directory
cd /opt/bitnami/wordpress/wp-content/themes/<your-theme-name>

# List themes to find active one
ls -la

# Edit functions.php (replace <your-theme-name> with actual theme)
sudo nano functions.php
```

### Step 2: Use This Corrected Code

Remove the previously added code and replace it with this corrected version that won't block admin access:

```php
// Block WordPress REST API and feeds from search engines (CORRECTED VERSION)
add_action('template_redirect', function() {
    // Skip if this is an admin request
    if (is_admin()) {
        return;
    }
    
    // Skip if this is a WordPress REST API request from the API subdomain
    // Allow wp-json on api.cowboykimono.com and admin.cowboykimono.com
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $request_uri = $_SERVER['REQUEST_URI'] ?? '';
    
    // Only block on main domain (cowboykimono.com) - not on admin or api subdomains
    if (strpos($host, 'cowboykimono.com') !== false && 
        strpos($host, 'admin.') === false && 
        strpos($host, 'api.') === false &&
        strpos($host, 'wp-origin.') === false) {
        
        // Block wp-json on main domain only
        if (strpos($request_uri, '/wp-json/') !== false) {
            header('X-Robots-Tag: noindex, nofollow');
            http_response_code(403);
            exit;
        }
        
        // Block feed URLs on main domain only
        if (preg_match('#/feed/?$#', $request_uri)) {
            header('X-Robots-Tag: noindex, nofollow');
            http_response_code(403);
            exit;
        }
    }
}, 1); // Priority 1 to run early, but after WordPress core

// Ensure canonical URLs are non-www (only if Yoast SEO is installed)
if (function_exists('wpseo_canonical')) {
    add_filter('wpseo_canonical', function($canonical) {
        if ($canonical) {
            return str_replace('www.cowboykimono.com', 'cowboykimono.com', $canonical);
        }
        return $canonical;
    });
}

// Add X-Robots-Tag headers for admin areas (won't break admin access)
add_action('admin_head', function() {
    // Only add header, don't block or exit
    header('X-Robots-Tag: noindex, nofollow', false); // false = don't replace existing headers
});
```

### Step 3: Alternative - Simpler Version (Recommended)

If you're still having issues, use this even simpler version that's less likely to cause problems:

```php
// Simplified version - only blocks on main domain, allows everything else
add_action('template_redirect', function() {
    // Skip admin, API, and wp-origin subdomains completely
    $host = $_SERVER['HTTP_HOST'] ?? '';
    
    // Only process requests to main domain
    if ($host === 'cowboykimono.com' || $host === 'www.cowboykimono.com') {
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        
        // Block wp-json on main domain
        if (strpos($request_uri, '/wp-json/') === 0) {
            header('X-Robots-Tag: noindex, nofollow');
            http_response_code(403);
            exit;
        }
        
        // Block feed URLs on main domain
        if (preg_match('#^/feed/?$#', $request_uri)) {
            header('X-Robots-Tag: noindex, nofollow');
            http_response_code(403);
            exit;
        }
    }
}, 999); // Low priority to run after WordPress core
```

### Step 4: If Admin Still Doesn't Work - Remove All Custom Code Temporarily

If admin still doesn't work after the fix, temporarily remove ALL the custom code:

```bash
# Backup functions.php
sudo cp functions.php functions.php.backup-$(date +%Y%m%d_%H%M%S)

# Remove the custom code you added (lines with template_redirect, wpseo_canonical, admin_init)
sudo nano functions.php
# Delete the lines you added
```

### Step 5: Verify Admin Works

After making changes:

1. Clear any caching (if you have caching plugins)
2. Try accessing admin: https://admin.cowboykimono.com/wp-admin
3. Check error logs if it still doesn't work:

```bash
# Check Apache error logs
sudo tail -f /opt/bitnami/apache/logs/error_log

# Or if using Nginx
sudo tail -f /opt/bitnami/nginx/logs/error.log

# Check PHP error logs
sudo tail -f /opt/bitnami/php/logs/error_log
```

## Why the Original Code Failed

1. The `template_redirect` hook runs on ALL requests, including admin requests
2. The code wasn't checking if the request was for admin areas
3. The header() calls might have been interfering with WordPress admin headers
4. The code might have been blocking wp-json on admin.cowboykimono.com which WordPress admin needs

## Recommended Approach

**For now, skip the functions.php changes** and rely on:
1. robots.txt (already configured)
2. .htaccess redirects (Phase 5.2) 
3. Server-level blocking (can be done later)

The functions.php changes are optional and mainly provide additional defense-in-depth. The robots.txt and .htaccess changes should be sufficient.

## Next Steps After Fixing

1. Test admin access: https://admin.cowboykimono.com/wp-admin
2. If it works, you can skip the functions.php changes or use the simplified version
3. Continue with Phase 5.4 (Permalink Structure) and 5.5 (Yoast SEO Configuration)
4. The robots.txt and .htaccess changes from Phase 5.1 and 5.2 should be sufficient for blocking search engines

