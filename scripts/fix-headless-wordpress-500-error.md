# Fix 500 Error - Headless WordPress (No Active Theme)

## Problem
Since this is a headless WordPress setup (API-only), there's no active theme, so Phase 5.3 (functions.php) doesn't apply. However, you're getting 500 errors, which means code was added somewhere that's causing issues.

## Step 1: Find Where the Problematic Code Was Added

SSH to your WordPress server and check these locations:

```bash
# SSH to server
ssh -i /path/to/key.pem bitnami@<your-lightsail-ip>

# Navigate to WordPress root
cd /opt/bitnami/wordpress
```

### Check Location 1: Must-Use Plugins (mu-plugins)
```bash
# Check if there's a mu-plugins directory with custom code
ls -la wp-content/mu-plugins/
cat wp-content/mu-plugins/*.php  # Check any files here
```

### Check Location 2: Custom Plugin
```bash
# Check if a custom plugin was created
ls -la wp-content/plugins/
# Look for any custom plugin folders you might have created
```

### Check Location 3: wp-config.php
```bash
# Check wp-config.php for any custom code at the end
sudo tail -50 wp-config.php
```

### Check Location 4: .htaccess (might have syntax errors)
```bash
# Check .htaccess for syntax errors
sudo cat .htaccess
# Look for any new blocks you added in Phase 5.2
```

### Check Location 5: Error Logs (tells you where the error is)
```bash
# Check Apache error logs
sudo tail -50 /opt/bitnami/apache/logs/error_log

# Check PHP error logs
sudo tail -50 /opt/bitnami/php/logs/error_log

# Check WordPress debug log (if enabled)
tail -50 wp-content/debug.log
```

## Step 2: Remove the Problematic Code

### If Code Was Added to mu-plugins:
```bash
# Backup first
sudo cp -r wp-content/mu-plugins wp-content/mu-plugins.backup-$(date +%Y%m%d_%H%M%S)

# Remove custom plugin file
sudo rm wp-content/mu-plugins/<filename>.php
```

### If Code Was Added to a Custom Plugin:
```bash
# Backup first
sudo cp -r wp-content/plugins/<plugin-name> wp-content/plugins/<plugin-name>.backup-$(date +%Y%m%d_%H%M%S)

# Deactivate or remove the plugin folder
sudo rm -r wp-content/plugins/<plugin-name>
```

### If Code Was Added to wp-config.php:
```bash
# Backup first
sudo cp wp-config.php wp-config.php.backup-$(date +%Y%m%d_%H%M%S)

# Edit and remove the custom code
sudo nano wp-config.php
# Remove any custom PHP code you added at the end
# Keep only WordPress core configuration
```

### If .htaccess Has Syntax Errors:
```bash
# Backup first
sudo cp .htaccess .htaccess.backup-$(date +%Y%M%d_%H%M%S)

# Check syntax
sudo apachectl configtest
# Or for Nginx:
sudo nginx -t

# If syntax errors, restore a clean version
# You can regenerate WordPress .htaccess by going to Settings > Permalinks in admin
```

## Step 3: For Headless WordPress - Skip Phase 5.3 Entirely

Since this is headless WordPress:
- ✅ **Phase 5.1 (robots.txt)** - Still needed ✓
- ✅ **Phase 5.2 (.htaccess redirects)** - Still needed ✓
- ❌ **Phase 5.3 (functions.php)** - SKIP - Not applicable for headless
- ✅ **Phase 5.4 (Permalinks)** - Still needed ✓
- ✅ **Phase 5.5 (Yoast SEO)** - Still needed ✓

## Step 4: Use Server-Level Blocking Instead

The blocking you wanted from functions.php is already handled by:

1. **robots.txt** (Phase 5.1) - Tells search engines not to crawl
2. **.htaccess** (Phase 5.2) - Server-level blocking with 403 responses

These are actually BETTER for headless WordPress than functions.php because:
- They work before PHP even loads
- They're more performant
- They don't interfere with WordPress core

## Step 5: Verify Everything Works

After removing problematic code:

```bash
# Restart Apache/Nginx to clear any cached errors
sudo /opt/bitnami/ctlscript.sh restart apache
# Or for Nginx:
sudo /opt/bitnami/ctlscript.sh restart nginx

# Test admin access
curl -I https://admin.cowboykimono.com/wp-admin
# Should return 200 or redirect, not 500
```

## Quick Recovery: Restore from Backup

If you made backups before adding code:

```bash
# Restore .htaccess (if you backed it up)
sudo cp .htaccess.backup-* .htaccess

# Or regenerate clean WordPress .htaccess
# (WordPress will regenerate it if you go to Settings > Permalinks)
```

## Recommended: Skip Custom PHP Code Entirely

For headless WordPress, the best approach is:

1. **robots.txt** - Blocks search engines ✓ (Phase 5.1)
2. **.htaccess redirects** - Handles old URLs ✓ (Phase 5.2)
3. **CloudFront/Server config** - Blocks subdomains at infrastructure level

You don't need custom PHP code for blocking - server-level configuration is cleaner and more reliable.

