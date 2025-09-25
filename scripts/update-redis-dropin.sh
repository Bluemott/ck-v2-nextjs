#!/bin/bash

# Update Redis Object Cache Drop-in Script
# This script updates the Redis object cache drop-in file on the WordPress server

set -e

echo "🔄 Updating Redis Object Cache Drop-in"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
WP_CONTENT_PATH="/opt/bitnami/wordpress/wp-content"
DROPIN_FILE="$WP_CONTENT_PATH/object-cache.php"
BACKUP_DIR="/opt/bitnami/wordpress/wp-content/backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/../wordpress/object-cache.php"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root or with sudo"
    echo "Usage: sudo $0"
    exit 1
fi

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
    print_error "Source object-cache.php file not found at: $SOURCE_FILE"
    echo "Please ensure the updated object-cache.php file is in the wordpress/ directory"
    exit 1
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    print_status "Created backup directory: $BACKUP_DIR"
fi

# Step 1: Backup existing drop-in file
echo -e "\n${YELLOW}📦 Creating backup of existing drop-in...${NC}"
if [ -f "$DROPIN_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/object-cache.php.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$DROPIN_FILE" "$BACKUP_FILE"
    print_status "Backup created: $BACKUP_FILE"
else
    print_warning "No existing object-cache.php file found to backup"
fi

# Step 2: Stop WordPress services temporarily
echo -e "\n${YELLOW}⏸️  Stopping WordPress services...${NC}"
sudo /opt/bitnami/ctlscript.sh stop apache 2>/dev/null || true
print_status "Apache stopped"

# Step 3: Remove existing drop-in file
echo -e "\n${YELLOW}🗑️  Removing existing drop-in file...${NC}"
if [ -f "$DROPIN_FILE" ]; then
    rm -f "$DROPIN_FILE"
    print_status "Existing object-cache.php removed"
fi

# Step 4: Copy new drop-in file
echo -e "\n${YELLOW}📋 Installing new drop-in file...${NC}"
cp "$SOURCE_FILE" "$DROPIN_FILE"
chown bitnami:bitnami "$DROPIN_FILE"
chmod 644 "$DROPIN_FILE"
print_status "New object-cache.php installed"

# Step 5: Verify file permissions and ownership
echo -e "\n${YELLOW}🔍 Verifying file permissions...${NC}"
if [ -f "$DROPIN_FILE" ]; then
    PERMS=$(stat -c "%a" "$DROPIN_FILE")
    OWNER=$(stat -c "%U:%G" "$DROPIN_FILE")
    print_status "File permissions: $PERMS"
    print_status "File owner: $OWNER"
    
    if [ "$PERMS" != "644" ]; then
        print_warning "Setting correct permissions (644)"
        chmod 644 "$DROPIN_FILE"
    fi
    
    if [ "$OWNER" != "bitnami:bitnami" ]; then
        print_warning "Setting correct ownership (bitnami:bitnami)"
        chown bitnami:bitnami "$DROPIN_FILE"
    fi
else
    print_error "Drop-in file not found after installation"
    exit 1
fi

# Step 6: Clear PHP opcache
echo -e "\n${YELLOW}🧹 Clearing PHP opcache...${NC}"
sudo php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache cleared'; } else { echo 'OPcache not available'; }" 2>/dev/null || true
print_status "PHP opcache cleared"

# Step 7: Start WordPress services
echo -e "\n${YELLOW}▶️  Starting WordPress services...${NC}"
sudo /opt/bitnami/ctlscript.sh start apache
print_status "Apache started"

# Step 8: Test Redis connection
echo -e "\n${YELLOW}🔴 Testing Redis connection...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        print_status "Redis is running and accessible"
        
        # Test basic Redis operations
        redis-cli set "test_key" "test_value" &> /dev/null
        if redis-cli get "test_key" | grep -q "test_value"; then
            print_status "Redis read/write operations working"
            redis-cli del "test_key" &> /dev/null
        else
            print_warning "Redis read/write operations may have issues"
        fi
    else
        print_error "Redis is not responding to ping"
        echo "Please check Redis service status: sudo systemctl status redis-server"
    fi
else
    print_warning "redis-cli not found - cannot test Redis connection"
fi

# Step 9: Verify WordPress can load the drop-in
echo -e "\n${YELLOW}🔍 Verifying WordPress drop-in loading...${NC}"
sleep 2  # Give Apache time to start

# Test if WordPress can load without errors
if curl -s -o /dev/null -w "%{http_code}" "https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1" | grep -q "200"; then
    print_status "WordPress API is responding correctly"
else
    print_warning "WordPress API may have issues - check error logs"
fi

# Step 10: Display cache status
echo -e "\n${YELLOW}📊 Cache Status Information:${NC}"
echo "================================"

# Check if Redis Object Cache plugin is active
if [ -d "/opt/bitnami/wordpress/wp-content/plugins/redis-cache" ]; then
    print_status "Redis Object Cache plugin is installed"
else
    print_warning "Redis Object Cache plugin not found"
fi

# Check drop-in file version
if [ -f "$DROPIN_FILE" ]; then
    VERSION=$(grep -o "version [0-9]\+\.[0-9]\+\.[0-9]\+" "$DROPIN_FILE" | head -1 | cut -d' ' -f2)
    if [ -n "$VERSION" ]; then
        print_status "Drop-in version: $VERSION"
    else
        print_warning "Could not determine drop-in version"
    fi
fi

# Check Redis memory usage
if command -v redis-cli &> /dev/null && redis-cli ping &> /dev/null; then
    MEMORY_USAGE=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    print_status "Redis memory usage: $MEMORY_USAGE"
fi

echo -e "\n${GREEN}🎉 Redis Object Cache Drop-in Update Complete!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Check WordPress admin panel for Redis cache status"
echo "2. Go to Settings > Redis to verify the drop-in is recognized"
echo "3. Enable object cache if not already enabled"
echo "4. Monitor cache performance and hit rates"
echo ""
echo "If you encounter any issues:"
echo "- Check error logs: sudo tail -f /opt/bitnami/apache2/logs/error_log"
echo "- Verify Redis is running: sudo systemctl status redis-server"
echo "- Test Redis connection: redis-cli ping"
echo ""
echo "Backup location: $BACKUP_DIR"
