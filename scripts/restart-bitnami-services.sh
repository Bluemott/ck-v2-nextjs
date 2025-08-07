#!/bin/bash

# Restart Bitnami Services
# This script restarts the Bitnami services that were stopped

set -e

echo "🔄 Restarting Bitnami Services"
echo "=============================="

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

# Step 1: Check current service status
echo -e "\n${YELLOW}🔍 Checking current service status...${NC}"
sudo /opt/bitnami/ctlscript.sh status

# Step 2: Wait a moment for any pending operations
echo -e "\n${YELLOW}⏳ Waiting for pending operations to complete...${NC}"
sleep 5

# Step 3: Start PHP-FPM first
echo -e "\n${YELLOW}🚀 Starting PHP-FPM...${NC}"
sudo /opt/bitnami/ctlscript.sh start php-fpm
print_status "PHP-FPM started"

# Step 4: Wait a moment
sleep 2

# Step 5: Start Apache
echo -e "\n${YELLOW}🚀 Starting Apache...${NC}"
sudo /opt/bitnami/ctlscript.sh start apache
print_status "Apache started"

# Step 6: Wait a moment
sleep 2

# Step 7: Check if services are running
echo -e "\n${YELLOW}🔍 Checking if services are running...${NC}"
sudo /opt/bitnami/ctlscript.sh status

# Step 8: Check if port 80 is listening
echo -e "\n${YELLOW}🔍 Checking if port 80 is listening...${NC}"
if sudo netstat -tlnp | grep :80; then
    print_status "Apache is listening on port 80"
else
    print_error "Apache is not listening on port 80"
fi

# Step 9: Test if website is accessible
echo -e "\n${YELLOW}🌐 Testing website accessibility...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    print_status "Website is accessible"
else
    print_warning "Website might not be accessible yet"
fi

# Step 10: Final status
echo -e "\n${GREEN}🎉 Services restart completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Try accessing your website: http://admin.cowboykimono.com"
echo "2. Try accessing WordPress admin: http://admin.cowboykimono.com/wp-admin"
echo "3. If still not accessible, wait a few minutes and try again"
echo ""
echo "If the website is still not accessible:"
echo "1. Check: sudo /opt/bitnami/ctlscript.sh status"
echo "2. Check: sudo tail -20 /opt/bitnami/apache2/logs/error_log" 