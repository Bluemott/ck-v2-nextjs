# Fix .htaccess Error: <LocationMatch not allowed here

## Problem
The error log shows:
```
/opt/bitnami/wordpress/.htaccess: <LocationMatch not allowed here
```

**`<LocationMatch>` cannot be used in `.htaccess` files** - it only works in Apache's main configuration files.

## Solution

Remove the `<LocationMatch>` block from `.htaccess` and use `RewriteRule` instead.

## Step-by-Step Fix

### Step 1: View Current .htaccess
```bash
cd /opt/bitnami/wordpress
sudo cat .htaccess
```

### Step 2: Remove the Problematic Block

Look for and **REMOVE** this block (it's causing the error):

```apache
# REMOVE THIS ENTIRE BLOCK:
<IfModule mod_headers.c>
<LocationMatch "/(wp-json|feed|wp-admin|wp-includes)">
Header set X-Robots-Tag "noindex, nofollow"
</LocationMatch>
</IfModule>
```

### Step 3: Use This Corrected .htaccess Code

Replace the problematic block with this working version that uses RewriteRule:

```apache
# Block WordPress REST API and feeds from search engines
<IfModule mod_rewrite.c>
RewriteEngine On

# Block wp-json endpoints (except for API subdomain)
RewriteCond %{HTTP_HOST} !^api\.cowboykimono\.com$ [NC]
RewriteCond %{HTTP_HOST} !^admin\.cowboykimono\.com$ [NC]
RewriteCond %{HTTP_HOST} !^wp-origin\.cowboykimono\.com$ [NC]
RewriteRule ^wp-json/ - [F,L]

# Block feed URLs (except for API subdomain)
RewriteCond %{HTTP_HOST} !^api\.cowboykimono\.com$ [NC]
RewriteCond %{HTTP_HOST} !^admin\.cowboykimono\.com$ [NC]
RewriteCond %{HTTP_HOST} !^wp-origin\.cowboykimono\.com$ [NC]
RewriteRule ^feed/?$ - [F,L]
RewriteRule ^.*/feed/?$ - [F,L]

# Redirect old WordPress date-based URLs to new blog structure
RewriteRule ^([0-9]{4})/([0-9]{2})/([0-9]{2})/(.+)$ https://cowboykimono.com/blog/$4 [R=301,L]

# Redirect old category URLs
RewriteRule ^category/(.+)$ https://cowboykimono.com/blog/category/$1 [R=301,L]

# Redirect old tag URLs
RewriteRule ^tag/(.+)$ https://cowboykimono.com/blog/tag/$1 [R=301,L]

# Redirect old author URLs
RewriteRule ^author/(.+)$ https://cowboykimono.com/blog [R=301,L]

# Redirect www to non-www
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
</IfModule>

# Add X-Robots-Tag header for blocked paths (using RewriteRule instead of LocationMatch)
<IfModule mod_headers.c>
# Set header for wp-json (blocked paths)
RewriteCond %{REQUEST_URI} ^/wp-json/
RewriteRule .* - [E=NOINDEX:1]
Header set X-Robots-Tag "noindex, nofollow" env=NOINDEX

# Set header for feeds (blocked paths)
RewriteCond %{REQUEST_URI} feed/?$
RewriteRule .* - [E=NOINDEX:1]
Header set X-Robots-Tag "noindex, nofollow" env=NOINDEX
</IfModule>
```

## Quick Fix Command

Run this to edit and fix:

```bash
cd /opt/bitnami/wordpress

# Backup first
sudo cp .htaccess .htaccess.backup-$(date +%Y%m%d_%H%M%S)

# Edit the file
sudo nano .htaccess
```

**In nano:**
1. Find the `<LocationMatch>` block (use Ctrl+W to search)
2. Delete the entire `<LocationMatch>...</LocationMatch>` block
3. Save: Ctrl+X, then Y, then Enter

## Alternative: Simplified Version (Recommended)

For headless WordPress, you can use this simpler version that doesn't try to set headers (robots.txt already handles blocking):

```apache
# Block WordPress REST API and feeds from search engines
<IfModule mod_rewrite.c>
RewriteEngine On

# Block wp-json endpoints on main domain only (allow on subdomains)
RewriteCond %{HTTP_HOST} ^(www\.)?cowboykimono\.com$ [NC]
RewriteRule ^wp-json/ - [F,L]

# Block feed URLs on main domain only
RewriteCond %{HTTP_HOST} ^(www\.)?cowboykimono\.com$ [NC]
RewriteRule ^feed/?$ - [F,L]
RewriteRule ^.*/feed/?$ - [F,L]

# Redirect old WordPress date-based URLs to new blog structure
RewriteRule ^([0-9]{4})/([0-9]{2})/([0-9]{2})/(.+)$ https://cowboykimono.com/blog/$4 [R=301,L]

# Redirect old category URLs
RewriteRule ^category/(.+)$ https://cowboykimono.com/blog/category/$1 [R=301,L]

# Redirect old tag URLs
RewriteRule ^tag/(.+)$ https://cowboykimono.com/blog/tag/$1 [R=301,L]

# Redirect old author URLs
RewriteRule ^author/(.+)$ https://cowboykimono.com/blog [R=301,L]

# Redirect www to non-www
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
</IfModule>
```

This simpler version just blocks the URLs with 403 responses - robots.txt already tells search engines not to crawl them, so we don't need the X-Robots-Tag header in .htaccess.

