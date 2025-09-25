#!/bin/bash

# Test Redis Cache Functionality
# This script tests the Redis object cache functionality after updating the drop-in

set -e

echo "🧪 Testing Redis Cache Functionality"
echo "===================================="

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
API_URL="https://api.cowboykimono.com"
WP_ADMIN_URL="https://admin.cowboykimono.com"

# Test 1: Redis Connection
echo -e "\n${YELLOW}🔴 Test 1: Redis Connection${NC}"
echo "------------------------"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        print_status "Redis is running and accessible"
        
        # Get Redis info
        echo "Redis version: $(redis-cli info server | grep redis_version | cut -d: -f2 | tr -d '\r')"
        echo "Memory usage: $(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')"
        echo "Connected clients: $(redis-cli info clients | grep connected_clients | cut -d: -f2 | tr -d '\r')"
        echo "Total commands: $(redis-cli info stats | grep total_commands_processed | cut -d: -f2 | tr -d '\r')"
    else
        print_error "Redis is not responding to ping"
        echo "Please check Redis service: sudo systemctl status redis-server"
    fi
else
    print_error "redis-cli not found"
fi

# Test 2: WordPress API Response
echo -e "\n${YELLOW}🌐 Test 2: WordPress API Response${NC}"
echo "--------------------------------"
if command -v curl &> /dev/null; then
    echo "Testing: $API_URL/wp-json/wp/v2/posts?per_page=1"
    
    # First request (likely cache miss)
    echo "First request (cache miss):"
    RESPONSE1=$(curl -w "HTTP: %{http_code} | Time: %{time_total}s | Size: %{size_download} bytes" -s -o /dev/null "$API_URL/wp-json/wp/v2/posts?per_page=1" 2>/dev/null || echo "Error")
    echo "$RESPONSE1"
    
    # Wait a moment
    sleep 1
    
    # Second request (should be faster if cached)
    echo "Second request (should be cached):"
    RESPONSE2=$(curl -w "HTTP: %{http_code} | Time: %{time_total}s | Size: %{size_download} bytes" -s -o /dev/null "$API_URL/wp-json/wp/v2/posts?per_page=1" 2>/dev/null || echo "Error")
    echo "$RESPONSE2"
    
    # Test cache headers
    echo -e "\nCache headers:"
    curl -I -s "$API_URL/wp-json/wp/v2/posts?per_page=1" | grep -i -E "(cache-control|expires|x-cache)" || echo "No cache headers found"
    
else
    print_warning "curl not available for API testing"
fi

# Test 3: WordPress Admin Access
echo -e "\n${YELLOW}🔐 Test 3: WordPress Admin Access${NC}"
echo "--------------------------------"
if command -v curl &> /dev/null; then
    echo "Testing: $WP_ADMIN_URL/wp-admin"
    
    ADMIN_RESPONSE=$(curl -w "HTTP: %{http_code} | Time: %{time_total}s" -s -o /dev/null "$WP_ADMIN_URL/wp-admin" 2>/dev/null || echo "Error")
    echo "$ADMIN_RESPONSE"
    
    # Check if we get redirected to login (expected)
    if curl -s -I "$WP_ADMIN_URL/wp-admin" | grep -i "location.*login"; then
        print_status "Admin redirects to login (expected behavior)"
    else
        print_warning "Admin access may have issues"
    fi
else
    print_warning "curl not available for admin testing"
fi

# Test 4: Redis Object Cache Plugin Status
echo -e "\n${YELLOW}🔌 Test 4: Redis Object Cache Plugin Status${NC}"
echo "--------------------------------------------"
WP_PLUGINS="/opt/bitnami/wordpress/wp-content/plugins"

if [ -d "$WP_PLUGINS/redis-cache" ]; then
    print_status "Redis Object Cache plugin is installed"
    
    # Check plugin version
    if [ -f "$WP_PLUGINS/redis-cache/redis-cache.php" ]; then
        VERSION=$(grep -o "Version: [0-9]\+\.[0-9]\+\.[0-9]\+" "$WP_PLUGINS/redis-cache/redis-cache.php" | cut -d' ' -f2)
        if [ -n "$VERSION" ]; then
            echo "Plugin version: $VERSION"
        fi
    fi
else
    print_warning "Redis Object Cache plugin not found"
fi

# Test 5: Object Cache Drop-in Status
echo -e "\n${YELLOW}📄 Test 5: Object Cache Drop-in Status${NC}"
echo "------------------------------------"
WP_CONTENT="/opt/bitnami/wordpress/wp-content"

if [ -f "$WP_CONTENT/object-cache.php" ]; then
    print_status "Object cache drop-in file exists"
    
    # Check drop-in version
    VERSION=$(grep -o "version [0-9]\+\.[0-9]\+\.[0-9]\+" "$WP_CONTENT/object-cache.php" | head -1 | cut -d' ' -f2)
    if [ -n "$VERSION" ]; then
        echo "Drop-in version: $VERSION"
    fi
    
    # Check file permissions
    PERMS=$(stat -c "%a" "$WP_CONTENT/object-cache.php")
    OWNER=$(stat -c "%U:%G" "$WP_CONTENT/object-cache.php")
    echo "File permissions: $PERMS"
    echo "File owner: $OWNER"
    
    # Check if file is readable by web server
    if [ -r "$WP_CONTENT/object-cache.php" ]; then
        print_status "Drop-in file is readable"
    else
        print_error "Drop-in file is not readable"
    fi
else
    print_error "Object cache drop-in file not found"
fi

# Test 6: Redis Memory Usage and Keys
echo -e "\n${YELLOW}💾 Test 6: Redis Memory Usage and Keys${NC}"
echo "------------------------------------"
if command -v redis-cli &> /dev/null && redis-cli ping &> /dev/null; then
    echo "Memory usage: $(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')"
    echo "Memory peak: $(redis-cli info memory | grep used_memory_peak_human | cut -d: -f2 | tr -d '\r')"
    echo "Total keys: $(redis-cli dbsize)"
    
    # Check for WordPress-related keys
    WP_KEYS=$(redis-cli keys "*wp*" | wc -l)
    echo "WordPress-related keys: $WP_KEYS"
    
    if [ "$WP_KEYS" -gt 0 ]; then
        print_status "WordPress keys found in Redis"
        echo "Sample keys:"
        redis-cli keys "*wp*" | head -5
    else
        print_warning "No WordPress keys found in Redis"
    fi
else
    print_warning "Cannot check Redis memory usage"
fi

# Test 7: Performance Test
echo -e "\n${YELLOW}⚡ Test 7: Performance Test${NC}"
echo "-------------------------"
if command -v curl &> /dev/null; then
    echo "Testing API response times..."
    
    # Test multiple endpoints
    ENDPOINTS=(
        "/wp-json/wp/v2/posts?per_page=1"
        "/wp-json/wp/v2/categories?per_page=5"
        "/wp-json/wp/v2/tags?per_page=5"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        echo -n "Testing $endpoint: "
        TIME=$(curl -w "%{time_total}" -s -o /dev/null "$API_URL$endpoint" 2>/dev/null || echo "Error")
        echo "${TIME}s"
    done
else
    print_warning "curl not available for performance testing"
fi

# Test 8: Error Log Check
echo -e "\n${YELLOW}📋 Test 8: Error Log Check${NC}"
echo "------------------------"
ERROR_LOG="/opt/bitnami/apache2/logs/error_log"

if [ -f "$ERROR_LOG" ]; then
    echo "Checking recent Redis-related errors..."
    
    # Check for Redis errors in the last 100 lines
    REDIS_ERRORS=$(tail -100 "$ERROR_LOG" | grep -i redis | wc -l)
    if [ "$REDIS_ERRORS" -gt 0 ]; then
        print_warning "Found $REDIS_ERRORS Redis-related errors in recent logs"
        echo "Recent Redis errors:"
        tail -100 "$ERROR_LOG" | grep -i redis | tail -3
    else
        print_status "No recent Redis errors found"
    fi
    
    # Check for PHP errors
    PHP_ERRORS=$(tail -100 "$ERROR_LOG" | grep -i "php error" | wc -l)
    if [ "$PHP_ERRORS" -gt 0 ]; then
        print_warning "Found $PHP_ERRORS PHP errors in recent logs"
    else
        print_status "No recent PHP errors found"
    fi
else
    print_warning "Error log not found at $ERROR_LOG"
fi

# Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "==============="

# Count successful tests
SUCCESS_COUNT=0
TOTAL_TESTS=8

# Redis connection
if redis-cli ping &> /dev/null; then
    ((SUCCESS_COUNT++))
fi

# API response
if curl -s -o /dev/null -w "%{http_code}" "$API_URL/wp-json/wp/v2/posts?per_page=1" | grep -q "200"; then
    ((SUCCESS_COUNT++))
fi

# Admin access
if curl -s -I "$WP_ADMIN_URL/wp-admin" | grep -q "location.*login"; then
    ((SUCCESS_COUNT++))
fi

# Plugin installed
if [ -d "$WP_PLUGINS/redis-cache" ]; then
    ((SUCCESS_COUNT++))
fi

# Drop-in exists
if [ -f "$WP_CONTENT/object-cache.php" ]; then
    ((SUCCESS_COUNT++))
fi

# Redis has keys
if redis-cli dbsize &> /dev/null && [ "$(redis-cli dbsize)" -gt 0 ]; then
    ((SUCCESS_COUNT++))
fi

# Performance test
if curl -w "%{time_total}" -s -o /dev/null "$API_URL/wp-json/wp/v2/posts?per_page=1" &> /dev/null; then
    ((SUCCESS_COUNT++))
fi

# Error log accessible
if [ -f "$ERROR_LOG" ]; then
    ((SUCCESS_COUNT++))
fi

echo "Tests passed: $SUCCESS_COUNT/$TOTAL_TESTS"

if [ "$SUCCESS_COUNT" -eq "$TOTAL_TESTS" ]; then
    print_status "All tests passed! Redis cache is working correctly."
elif [ "$SUCCESS_COUNT" -ge 6 ]; then
    print_warning "Most tests passed. Minor issues may need attention."
else
    print_error "Several tests failed. Please check the configuration."
fi

echo -e "\n${BLUE}💡 Next Steps:${NC}"
echo "1. Check WordPress admin panel: $WP_ADMIN_URL/wp-admin"
echo "2. Go to Settings > Redis to verify cache status"
echo "3. Monitor cache hit rates and performance"
echo "4. Check error logs regularly: sudo tail -f $ERROR_LOG"
