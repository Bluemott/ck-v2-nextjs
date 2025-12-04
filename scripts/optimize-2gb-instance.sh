#!/bin/bash
# Optimize WordPress instance for 2GB RAM
# Run this on the new server

echo "============================================================"
echo "WordPress Instance Optimization for 2GB RAM"
echo "============================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check current memory
echo "[Pre-Check] Current Memory Usage:"
free -h
echo ""

# Backup files
echo "[1/5] Creating backups..."
sudo cp /opt/bitnami/php/etc/php-fpm.d/www.conf /opt/bitnami/php/etc/php-fpm.d/www.conf.backup.$(date +%Y%m%d)
sudo cp /opt/bitnami/mysql/my.cnf /opt/bitnami/mysql/my.cnf.backup.$(date +%Y%m%d) 2>/dev/null || echo "my.cnf backup skipped (may not exist)"
sudo cp /opt/bitnami/php/etc/php.ini /opt/bitnami/php/etc/php.ini.backup.$(date +%Y%m%d)
echo -e "${GREEN}✓ Backups created${NC}"
echo ""

# Optimize PHP-FPM
echo "[2/5] Optimizing PHP-FPM configuration..."
PHP_FPM_CONFIG="/opt/bitnami/php/etc/php-fpm.d/www.conf"

# Check current settings
echo "Current PHP-FPM settings:"
grep -E "pm\.(max_children|start_servers|min_spare_servers|max_spare_servers)" "$PHP_FPM_CONFIG" | head -n 4

# Update settings
echo ""
echo "Updating PHP-FPM settings for 2GB RAM..."

# Update pm.max_children
if grep -q "pm.max_children" "$PHP_FPM_CONFIG"; then
    sudo sed -i 's/^pm.max_children = .*/pm.max_children = 20/' "$PHP_FPM_CONFIG"
else
    echo "pm.max_children = 20" | sudo tee -a "$PHP_FPM_CONFIG" > /dev/null
fi

# Update pm.start_servers
if grep -q "pm.start_servers" "$PHP_FPM_CONFIG"; then
    sudo sed -i 's/^pm.start_servers = .*/pm.start_servers = 5/' "$PHP_FPM_CONFIG"
else
    echo "pm.start_servers = 5" | sudo tee -a "$PHP_FPM_CONFIG" > /dev/null
fi

# Update pm.min_spare_servers
if grep -q "pm.min_spare_servers" "$PHP_FPM_CONFIG"; then
    sudo sed -i 's/^pm.min_spare_servers = .*/pm.min_spare_servers = 3/' "$PHP_FPM_CONFIG"
else
    echo "pm.min_spare_servers = 3" | sudo tee -a "$PHP_FPM_CONFIG" > /dev/null
fi

# Update pm.max_spare_servers
if grep -q "pm.max_spare_servers" "$PHP_FPM_CONFIG"; then
    sudo sed -i 's/^pm.max_spare_servers = .*/pm.max_spare_servers = 8/' "$PHP_FPM_CONFIG"
else
    echo "pm.max_spare_servers = 8" | sudo tee -a "$PHP_FPM_CONFIG" > /dev/null
fi

echo -e "${GREEN}✓ PHP-FPM configuration updated${NC}"
echo "New settings:"
grep -E "pm\.(max_children|start_servers|min_spare_servers|max_spare_servers)" "$PHP_FPM_CONFIG" | head -n 4
echo ""

# Optimize MariaDB
echo "[3/5] Optimizing MariaDB configuration..."
MYSQL_CONFIG="/opt/bitnami/mysql/my.cnf"

if [ -f "$MYSQL_CONFIG" ]; then
    # Check current innodb_buffer_pool_size
    echo "Current MariaDB settings:"
    grep -i "innodb_buffer_pool_size\|max_connections" "$MYSQL_CONFIG" | head -n 2 || echo "Using defaults"
    
    # Add/update innodb_buffer_pool_size
    if grep -q "innodb_buffer_pool_size" "$MYSQL_CONFIG"; then
        sudo sed -i 's/^innodb_buffer_pool_size.*/innodb_buffer_pool_size = 256M/' "$MYSQL_CONFIG"
    else
        echo "" | sudo tee -a "$MYSQL_CONFIG" > /dev/null
        echo "[mysqld]" | sudo tee -a "$MYSQL_CONFIG" > /dev/null
        echo "innodb_buffer_pool_size = 256M" | sudo tee -a "$MYSQL_CONFIG" > /dev/null
        echo "max_connections = 50" | sudo tee -a "$MYSQL_CONFIG" > /dev/null
    fi
    
    echo -e "${GREEN}✓ MariaDB configuration updated${NC}"
else
    echo -e "${YELLOW}⚠ MariaDB config file not found, skipping${NC}"
fi
echo ""

# Optimize Redis
echo "[4/5] Optimizing Redis configuration..."
redis-cli CONFIG SET maxmemory 256mb 2>/dev/null && echo -e "${GREEN}✓ Redis maxmemory set to 256MB${NC}" || echo -e "${YELLOW}⚠ Redis config update skipped${NC}"
redis-cli CONFIG SET maxmemory-policy allkeys-lru 2>/dev/null && echo -e "${GREEN}✓ Redis eviction policy set${NC}" || echo -e "${YELLOW}⚠ Redis policy update skipped${NC}"

# Make Redis settings permanent
REDIS_CONFIG="/opt/bitnami/redis/etc/redis.conf"
if [ -f "$REDIS_CONFIG" ]; then
    if ! grep -q "maxmemory 256mb" "$REDIS_CONFIG"; then
        echo "maxmemory 256mb" | sudo tee -a "$REDIS_CONFIG" > /dev/null
        echo "maxmemory-policy allkeys-lru" | sudo tee -a "$REDIS_CONFIG" > /dev/null
        echo -e "${GREEN}✓ Redis settings saved to config file${NC}"
    fi
fi
echo ""

# Enable OPcache
echo "[5/5] Enabling PHP OPcache..."
PHP_INI="/opt/bitnami/php/etc/php.ini"

if grep -q "^;opcache.enable" "$PHP_INI"; then
    sudo sed -i 's/^;opcache.enable=.*/opcache.enable=1/' "$PHP_INI"
    echo -e "${GREEN}✓ OPcache enabled${NC}"
elif grep -q "^opcache.enable=0" "$PHP_INI"; then
    sudo sed -i 's/^opcache.enable=0/opcache.enable=1/' "$PHP_INI"
    echo -e "${GREEN}✓ OPcache enabled${NC}"
else
    echo -e "${YELLOW}⚠ OPcache may already be enabled or config differs${NC}"
fi

# Set OPcache memory
if grep -q "^;opcache.memory_consumption" "$PHP_INI"; then
    sudo sed -i 's/^;opcache.memory_consumption=.*/opcache.memory_consumption=128/' "$PHP_INI"
fi

echo ""

# Restart services
echo "============================================================"
echo "Restarting Services"
echo "============================================================"
echo ""

echo "Restarting PHP-FPM..."
sudo /opt/bitnami/ctlscript.sh restart php-fpm
sleep 3

echo "Restarting Apache..."
sudo /opt/bitnami/ctlscript.sh restart apache
sleep 3

echo "Restarting MariaDB..."
sudo /opt/bitnami/ctlscript.sh restart mariadb
sleep 3

echo "Restarting Redis (if needed)..."
sudo /opt/bitnami/ctlscript.sh restart redis 2>/dev/null || echo "Redis restart skipped"
sleep 2

echo ""

# Verify optimizations
echo "============================================================"
echo "Verification"
echo "============================================================"
echo ""

echo "Memory usage after optimization:"
free -h
echo ""

echo "PHP-FPM processes:"
ps aux | grep php-fpm | grep -v grep | wc -l
echo "active workers"
echo ""

echo "Testing WordPress API..."
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1)
if [ "$API_TEST" = "200" ]; then
    echo -e "${GREEN}✓ WordPress API responding correctly${NC}"
else
    echo -e "${RED}✗ WordPress API returned: $API_TEST${NC}"
fi
echo ""

echo "============================================================"
echo "Optimization Complete!"
echo "============================================================"
echo ""
echo "Summary of changes:"
echo "  ✓ PHP-FPM: max_children = 20 (better concurrency)"
echo "  ✓ MariaDB: innodb_buffer_pool_size = 256M (faster queries)"
echo "  ✓ Redis: maxmemory = 256MB (better caching)"
echo "  ✓ OPcache: Enabled (faster PHP execution)"
echo ""
echo "Monitor for 30 minutes to ensure stability:"
echo "  watch -n 60 'free -h && echo \"\" && ps aux | grep php-fpm | wc -l'"
echo ""

