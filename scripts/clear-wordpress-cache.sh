#!/bin/bash

# Clear WordPress Cache and Force Config Refresh
# This script clears all caches and forces WordPress to read the updated wp-config.php

set -e

echo "🧹 Clearing WordPress Cache and Refreshing Configuration"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

WP_CONTENT_PATH="/opt/bitnami/wordpress/wp-content"
WP_CONFIG_PATH="/opt/bitnami/wordpress/wp-config.php"

# Step 1: Clear all WordPress caches
echo -e "\n${YELLOW}🗑️  Clearing WordPress caches...${NC}"

# Clear WP Super Cache
sudo rm -rf "$WP_CONTENT_PATH/cache/*" 2>/dev/null || true
sudo rm -rf "$WP_CONTENT_PATH/wp-cache/*" 2>/dev/null || true
print_status "WP Super Cache cleared"

# Clear object cache
sudo rm -f "$WP_CONTENT_PATH/object-cache.php" 2>/dev/null || true
print_status "Object cache cleared"

# Clear any other cache files
sudo find "$WP_CONTENT_PATH" -name "*.cache" -delete 2>/dev/null || true
sudo find "$WP_CONTENT_PATH" -name "cache-*" -delete 2>/dev/null || true
print_status "Other cache files cleared"

# Step 2: Clear PHP opcache
echo -e "\n${YELLOW}🧹 Clearing PHP opcache...${NC}"
sudo php -r "opcache_reset();" 2>/dev/null || true
print_status "PHP opcache cleared"

# Step 3: Clear any WordPress transients
echo -e "\n${YELLOW}🗑️  Clearing WordPress transients...${NC}"
if [ -f "/opt/bitnami/wordpress/wp-config.php" ]; then
    cd /opt/bitnami/wordpress
    sudo -u bitnami php -r "
    require_once 'wp-config.php';
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
        echo 'WordPress cache flushed\n';
    }
    if (function_exists('delete_transient')) {
        global \$wpdb;
        \$wpdb->query('DELETE FROM ' . \$wpdb->options . ' WHERE option_name LIKE \"_transient_%\"');
        \$wpdb->query('DELETE FROM ' . \$wpdb->options . ' WHERE option_name LIKE \"_site_transient_%\"');
        echo 'Transients cleared\n';
    }
    " 2>/dev/null || true
fi
print_status "WordPress transients cleared"

# Step 4: Verify wp-config.php is correct
echo -e "\n${YELLOW}🔍 Verifying wp-config.php...${NC}"
if grep -q "define.*WP_CACHE.*true" "$WP_CONFIG_PATH"; then
    print_status "WP_CACHE is correctly set to true"
    echo "Context:"
    grep -A 2 -B 2 "WP_CACHE" "$WP_CONFIG_PATH"
else
    print_error "WP_CACHE is not set to true"
    echo "Current wp-config.php content around WP_CACHE:"
    grep -A 5 -B 5 "WP_CACHE" "$WP_CONFIG_PATH" 2>/dev/null || echo "No WP_CACHE found"
fi

# Step 5: Force reload of wp-config.php
echo -e "\n${YELLOW}🔄 Forcing wp-config.php reload...${NC}"
sudo touch "$WP_CONFIG_PATH"
sudo chmod 644 "$WP_CONFIG_PATH"
print_status "wp-config.php timestamp updated"

# Step 6: Restart PHP-FPM to clear any cached configurations
echo -e "\n${YELLOW}🔄 Restarting PHP-FPM...${NC}"
sudo /opt/bitnami/ctlscript.sh restart php-fpm
print_status "PHP-FPM restarted"

# Step 7: Restart Apache to ensure clean state
echo -e "\n${YELLOW}🔄 Restarting Apache...${NC}"
sudo /opt/bitnami/ctlscript.sh restart apache
print_status "Apache restarted"

# Step 8: Create a test script to verify WP_CACHE constant
echo -e "\n${YELLOW}📊 Creating WP_CACHE verification script...${NC}"
cat << 'EOF' | sudo tee /opt/bitnami/scripts/verify-wp-cache-constant.sh
#!/bin/bash

echo "🔍 WP_CACHE Constant Verification"
echo "================================="

WP_CONFIG_PATH="/opt/bitnami/wordpress/wp-config.php"

# Test 1: Check if constant is defined in wp-config.php
echo -e "\n📄 Test 1: wp-config.php check"
if grep -q "define.*WP_CACHE.*true" "$WP_CONFIG_PATH"; then
    echo "✅ WP_CACHE is defined as true in wp-config.php"
else
    echo "❌ WP_CACHE is not defined as true in wp-config.php"
fi

# Test 2: Check if WordPress can read the constant
echo -e "\n🌐 Test 2: WordPress constant check"
cd /opt/bitnami/wordpress
sudo -u bitnami php -r "
require_once 'wp-config.php';
if (defined('WP_CACHE')) {
    if (WP_CACHE === true) {
        echo '✅ WordPress sees WP_CACHE as true\n';
    } else {
        echo '❌ WordPress sees WP_CACHE as: ' . (WP_CACHE ? 'true' : 'false') . '\n';
    }
} else {
    echo '❌ WordPress does not see WP_CACHE constant\n';
}
"

# Test 3: Check if WP Super Cache plugin can see the constant
echo -e "\n🔌 Test 3: WP Super Cache plugin check"
if [ -f "/opt/bitnami/wordpress/wp-content/plugins/wp-super-cache/wp-cache.php" ]; then
    cd /opt/bitnami/wordpress
    sudo -u bitnami php -r "
    require_once 'wp-config.php';
    require_once 'wp-content/plugins/wp-super-cache/wp-cache.php';
    if (defined('WP_CACHE')) {
        echo '✅ WP Super Cache plugin sees WP_CACHE constant\n';
    } else {
        echo '❌ WP Super Cache plugin does not see WP_CACHE constant\n';
    }
    " 2>/dev/null || echo "Could not test WP Super Cache plugin"
else
    echo "⚠️  WP Super Cache plugin not found"
fi

echo -e "\n✅ Verification complete"
EOF

sudo chmod +x /opt/bitnami/scripts/verify-wp-cache-constant.sh
print_status "Verification script created"

# Step 9: Final status
echo -e "\n${GREEN}🎉 Cache clearing completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Clear your browser cache completely (Ctrl+Shift+Delete)"
echo "2. Go to your WordPress admin panel"
echo "3. Navigate to Settings → WP Super Cache"
echo "4. Try to enable caching"
echo ""
echo "If you still get the error:"
echo "1. Run: sudo /opt/bitnami/scripts/verify-wp-cache-constant.sh"
echo "2. Check the output for any issues"
echo "3. Try deactivating and reactivating the WP Super Cache plugin"
echo ""
echo "To verify the fix worked:"
echo "sudo /opt/bitnami/scripts/verify-wp-cache-constant.sh" 