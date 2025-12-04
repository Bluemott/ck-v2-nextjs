<?php
/**
 * CORRECTED WordPress functions.php code
 * 
 * This code safely blocks wp-json and feeds on the main domain only,
 * without interfering with admin panel access.
 * 
 * Copy this code to your theme's functions.php file
 */

// Block WordPress REST API and feeds from search engines (SAFE VERSION)
add_action('template_redirect', function() {
    // CRITICAL: Skip if this is an admin request or AJAX request
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
        return;
    }
    
    // Get host and request URI
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    
    // Only block on main domain (cowboykimono.com) - NEVER block on admin/api/wp-origin subdomains
    $is_main_domain = ($host === 'cowboykimono.com' || $host === 'www.cowboykimono.com');
    $is_subdomain = (
        strpos($host, 'admin.') !== false || 
        strpos($host, 'api.') !== false || 
        strpos($host, 'wp-origin.') !== false
    );
    
    // Only process main domain requests, skip all subdomains
    if ($is_main_domain && !$is_subdomain) {
        // Block wp-json on main domain only
        if (strpos($request_uri, '/wp-json/') === 0) {
            header('X-Robots-Tag: noindex, nofollow');
            http_response_code(403);
            exit;
        }
        
        // Block feed URLs on main domain only
        if (preg_match('#^/feed/?$#', $request_uri)) {
            header('X-Robots-Tag: noindex, nofollow');
            http_response_code(403);
            exit;
        }
    }
}, 999); // Low priority - run after WordPress core initializes

// Ensure canonical URLs are non-www (only if Yoast SEO is installed)
if (function_exists('wpseo_canonical')) {
    add_filter('wpseo_canonical', function($canonical) {
        if ($canonical && is_string($canonical)) {
            return str_replace('www.cowboykimono.com', 'cowboykimono.com', $canonical);
        }
        return $canonical;
    });
}

// Add X-Robots-Tag for admin (non-blocking, just adds header)
add_action('admin_head', function() {
    if (!headers_sent()) {
        header('X-Robots-Tag: noindex, nofollow', false);
    }
});

