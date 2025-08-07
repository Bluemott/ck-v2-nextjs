#!/bin/bash

# WordPress Cache Status Checker for Bitnami
# Quick diagnostic tool to check if caching is working

echo "🔍 WordPress Cache Status Check"
echo "================================"

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

# Redis Status
echo -e "\n🔴 Redis Status:"
echo "----------------"
if command -v redis-server &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        print_status "Redis is running"
        echo "Memory usage: $(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')"
        echo "Connected clients: $(redis-cli info clients | grep connected_clients | cut -d: -f2 | tr -d '\r')"
        echo "Total commands: $(redis-cli info stats | grep total_commands_processed | cut -d: -f2 | tr -d '\r')"
    else
        print_error "Redis is not running"
        echo "Try: sudo systemctl start redis-server"
    fi
else
    print_error "Redis is not installed"
fi

# WordPress Cache Configuration
echo -e "\n⚙️  WordPress Cache Configuration:"
echo "----------------------------------"
WP_CONFIG="/opt/bitnami/wordpress/wp-config.php"

if [ -f "$WP_CONFIG" ]; then
    if grep -q "WP_CACHE.*true" "$WP_CONFIG"; then
        print_status "WP_CACHE is enabled"
    else
        print_warning "WP_CACHE is not enabled"
    fi
    
    if grep -q "WP_REDIS_HOST" "$WP_CONFIG"; then
        print_status "Redis configuration found"
        echo "Redis host: $(grep WP_REDIS_HOST "$WP_CONFIG" | head -1 | cut -d"'" -f4)"
    else
        print_warning "Redis configuration missing"
    fi
else
    print_error "wp-config.php not found"
fi

# Plugin Status
echo -e "\n🔌 Plugin Status:"
echo "-----------------"
WP_PLUGINS="/opt/bitnami/wordpress/wp-content/plugins"

if [ -d "$WP_PLUGINS/redis-cache" ]; then
    print_status "Redis Object Cache plugin installed"
else
    print_warning "Redis Object Cache plugin not found"
fi

if [ -d "$WP_PLUGINS/wp-super-cache" ]; then
    print_status "WP Super Cache plugin installed"
else
    print_warning "WP Super Cache plugin not found"
fi

# Cache Directories
echo -e "\n📁 Cache Directories:"
echo "---------------------"
WP_CONTENT="/opt/bitnami/wordpress/wp-content"

if [ -d "$WP_CONTENT/cache" ]; then
    print_status "Cache directory exists"
    echo "Cache files: $(find "$WP_CONTENT/cache" -type f 2>/dev/null | wc -l)"
else
    print_warning "Cache directory missing"
fi

if [ -w "$WP_CONTENT" ]; then
    print_status "wp-content is writable"
else
    print_error "wp-content is not writable"
    echo "Try: sudo chmod 777 $WP_CONTENT"
fi

# REST API Performance Test
echo -e "\n🚀 REST API Performance Test:"
echo "------------------------------"
API_URL="https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1"

if command -v curl &> /dev/null; then
    echo "Testing: $API_URL"
    
    # Test 1: First request (likely cache miss)
    echo "First request (cache miss):"
    RESPONSE1=$(curl -w "HTTP: %{http_code} | Time: %{time_total}s | Size: %{size_download} bytes" -s -o /dev/null "$API_URL" 2>/dev/null || echo "Error")
    echo "$RESPONSE1"
    
    # Wait a moment
    sleep 1
    
    # Test 2: Second request (should be faster if cached)
    echo "Second request (should be cached):"
    RESPONSE2=$(curl -w "HTTP: %{http_code} | Time: %{time_total}s | Size: %{size_download} bytes" -s -o /dev/null "$API_URL" 2>/dev/null || echo "Error")
    echo "$RESPONSE2"
    
    # Test cache headers
    echo -e "\nCache headers:"
    curl -I -s "$API_URL" | grep -i -E "(cache-control|expires|x-cache)" || echo "No cache headers found"
    
else
    print_warning "curl not available for API testing"
fi

# Apache Status
echo -e "\n🌐 Apache Status:"
echo "-----------------"
if sudo /opt/bitnami/ctlscript.sh status apache | grep -q "running"; then
    print_status "Apache is running"
else
    print_error "Apache is not running"
    echo "Try: sudo /opt/bitnami/ctlscript.sh start apache"
fi

# Cache Configuration Files
echo -e "\n📄 Cache Configuration Files:"
echo "------------------------------"
if [ -f "/opt/bitnami/apache2/conf/vhosts/rest-api-cache.conf" ]; then
    print_status "Apache cache configuration found"
else
    print_warning "Apache cache configuration missing"
fi

if [ -f "$WP_CONTENT/wp-cache-config.php" ]; then
    print_status "WP Super Cache config found"
else
    print_warning "WP Super Cache config missing (normal until plugin is activated)"
fi

if [ -f "$WP_CONTENT/object-cache.php" ]; then
    print_status "Redis object cache dropin found"
else
    print_warning "Redis object cache dropin missing (normal until plugin is activated)"
fi

# System Resources
echo -e "\n💻 System Resources:"
echo "--------------------"
echo "Memory usage:"
free -h | grep -E "(Mem|Swap)"
echo -e "\nDisk usage:"
df -h / | tail -1
echo -e "\nLoad average:"
uptime | cut -d',' -f3-

echo -e "\n${YELLOW}📋 Recommendations:${NC}"
echo "===================="

# Check if Redis is using memory
REDIS_MEMORY=$(redis-cli info memory 2>/dev/null | grep used_memory: | cut -d: -f2 | tr -d '\r' || echo "0")
if [ "$REDIS_MEMORY" -gt 1000000 ]; then
    print_status "Redis is actively caching data"
else
    print_warning "Redis memory usage is low - cache may not be active"
    echo "  - Make sure Redis Object Cache plugin is activated"
    echo "  - Check that WP_REDIS_HOST is correctly configured"
fi

# Check for common issues
if ! redis-cli ping &> /dev/null; then
    echo "🔧 Redis is not running:"
    echo "  sudo systemctl start redis-server"
    echo "  sudo systemctl enable redis-server"
fi

if ! grep -q "WP_CACHE.*true" "$WP_CONFIG" 2>/dev/null; then
    echo "🔧 WP_CACHE is not enabled:"
    echo "  Edit $WP_CONFIG and add: define('WP_CACHE', true);"
fi

echo -e "\n${GREEN}✅ Cache status check complete!${NC}"
echo "If issues persist, run: sudo ./diagnose-and-fix-caching.sh"