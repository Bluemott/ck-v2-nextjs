#!/bin/bash

# Server Cleanup Script for Bitnami WordPress Instance
# This script removes unnecessary files and scripts from the server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="/tmp/server-cleanup-$(date +%Y%m%d-%H%M%S).log"

echo -e "${BLUE}=== Bitnami WordPress Server Cleanup Script ===${NC}"
echo -e "${YELLOW}Log file: $LOG_FILE${NC}"
echo ""

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check if file/directory exists before removing
safe_remove() {
    if [ -e "$1" ]; then
        log_message "Removing: $1"
        rm -rf "$1"
        echo -e "${GREEN}✓ Removed: $1${NC}"
    else
        log_message "Skipping (not found): $1"
    fi
}

# Function to check if directory is empty
check_empty_dir() {
    if [ -d "$1" ] && [ -z "$(ls -A "$1" 2>/dev/null)" ]; then
        log_message "Removing empty directory: $1"
        rmdir "$1"
        echo -e "${GREEN}✓ Removed empty directory: $1${NC}"
    fi
}

log_message "Starting server cleanup process..."

# 1. Clean up scripts directory - keep only essential scripts
log_message "=== Cleaning up scripts directory ==="

# List of scripts to KEEP (essential for ongoing maintenance)
KEEP_SCRIPTS=(
    "check-cache-status.sh"
    "clear-wordpress-cache.sh"
    "restart-bitnami-services.sh"
    "monitor-wordpress-cache.js"
    "test-production-apis.js"
)

# Remove non-essential scripts
for script in scripts/*.sh scripts/*.js scripts/*.php; do
    if [ -f "$script" ]; then
        script_name=$(basename "$script")
        keep_script=false
        
        for keep in "${KEEP_SCRIPTS[@]}"; do
            if [ "$script_name" = "$keep" ]; then
                keep_script=true
                break
            fi
        done
        
        if [ "$keep_script" = false ]; then
            safe_remove "$script"
        else
            log_message "Keeping essential script: $script_name"
        fi
    fi
done

# 2. Clean up documentation files - keep only the most comprehensive guide
log_message "=== Cleaning up documentation files ==="

# Keep only the most comprehensive guide
safe_remove "WORDPRESS_CACHING_GUIDE.md"
safe_remove "WORDPRESS_CACHING_DEPLOYMENT_GUIDE.md"
safe_remove "BITNAMI_WORDPRESS_CACHING_GUIDE.md"
safe_remove "HEADLESS_WORDPRESS_CACHING_GUIDE.md"
safe_remove "QUICK_START_CACHING.md"
safe_remove "WORDPRESS_ADMIN_API_TROUBLESHOOTING.md"
safe_remove "HTTPS_FIX_ACTION_PLAN.md"
safe_remove "BUILD_FIXES_SUMMARY.md"
safe_remove "CLEANUP_SUMMARY.md"
safe_remove "LIGHTSAIL_SETUP_SUMMARY.md"
safe_remove "DEV_BRANCH_SETUP.md"

# 3. Clean up backup directories
log_message "=== Cleaning up backup directories ==="

# Remove old security backups
safe_remove "security-backups/"

# Remove empty database backups
safe_remove "database-backups/"

# Remove WordPress export files (these are large and no longer needed)
safe_remove "wordpress-export/"

# 4. Clean up temporary files
log_message "=== Cleaning up temporary files ==="

safe_remove "test-function.zip"
safe_remove "test-https-setup.js"
safe_remove "tsconfig.tsbuildinfo"
safe_remove "aplify.txt"  # Typo in filename

# 5. Clean up deployment directory (keep only essential files)
log_message "=== Cleaning up deployment directory ==="

safe_remove "deployment/migration-guide.md"

# 6. Clean up any log files that might have been created
log_message "=== Cleaning up log files ==="

# Remove any .log files in the project
find . -name "*.log" -type f -delete 2>/dev/null || true

# 7. Clean up any backup files created by scripts
log_message "=== Cleaning up backup files ==="

# Remove .backup files
find . -name "*.backup" -type f -delete 2>/dev/null || true
find . -name "*.bak" -type f -delete 2>/dev/null || true
find . -name "*.old" -type f -delete 2>/dev/null || true

# 8. Clean up empty directories
log_message "=== Cleaning up empty directories ==="

# Find and remove empty directories (except .git)
find . -type d -empty -not -path "./.git*" -delete 2>/dev/null || true

# 9. Clean up any temporary files in the server's temp directories
log_message "=== Cleaning up server temp files ==="

# Clean up any cache files that might have been created
if [ -d "/tmp" ]; then
    find /tmp -name "*wordpress*" -type f -mtime +7 -delete 2>/dev/null || true
    find /tmp -name "*cache*" -type f -mtime +7 -delete 2>/dev/null || true
fi

# 10. Clean up any WordPress debug logs on the server
log_message "=== Cleaning up WordPress debug logs ==="

if [ -f "/opt/bitnami/wordpress/wp-content/debug.log" ]; then
    log_message "Clearing WordPress debug log"
    > /opt/bitnami/wordpress/wp-content/debug.log
    echo -e "${GREEN}✓ Cleared WordPress debug log${NC}"
fi

# 11. Clean up any Redis logs
log_message "=== Cleaning up Redis logs ==="

if [ -f "/var/log/redis/redis-server.log" ]; then
    log_message "Clearing Redis log"
    > /var/log/redis/redis-server.log
    echo -e "${GREEN}✓ Cleared Redis log${NC}"
fi

# 12. Clean up any Apache logs (keep recent entries)
log_message "=== Cleaning up Apache logs ==="

if [ -f "/opt/bitnami/apache2/logs/error_log" ]; then
    log_message "Truncating Apache error log (keeping last 1000 lines)"
    tail -n 1000 /opt/bitnami/apache2/logs/error_log > /tmp/error_log.tmp && mv /tmp/error_log.tmp /opt/bitnami/apache2/logs/error_log
    echo -e "${GREEN}✓ Cleaned Apache error log${NC}"
fi

if [ -f "/opt/bitnami/apache2/logs/access_log" ]; then
    log_message "Truncating Apache access log (keeping last 1000 lines)"
    tail -n 1000 /opt/bitnami/apache2/logs/access_log > /tmp/access_log.tmp && mv /tmp/access_log.tmp /opt/bitnami/apache2/logs/access_log
    echo -e "${GREEN}✓ Cleaned Apache access log${NC}"
fi

# 13. Clean up any PHP session files
log_message "=== Cleaning up PHP session files ==="

if [ -d "/opt/bitnami/php/tmp" ]; then
    find /opt/bitnami/php/tmp -name "sess_*" -type f -mtime +1 -delete 2>/dev/null || true
    echo -e "${GREEN}✓ Cleaned old PHP session files${NC}"
fi

# 14. Clean up any WordPress cache files
log_message "=== Cleaning up WordPress cache files ==="

if [ -d "/opt/bitnami/wordpress/wp-content/cache" ]; then
    find /opt/bitnami/wordpress/wp-content/cache -type f -mtime +7 -delete 2>/dev/null || true
    echo -e "${GREEN}✓ Cleaned old WordPress cache files${NC}"
fi

# 15. Clean up any Redis cache (optional - uncomment if needed)
# log_message "=== Cleaning up Redis cache ==="
# redis-cli FLUSHALL 2>/dev/null || true
# echo -e "${GREEN}✓ Cleared Redis cache${NC}"

# Final summary
log_message "=== Cleanup Summary ==="
echo ""
echo -e "${BLUE}=== Cleanup Complete ===${NC}"
echo -e "${GREEN}✓ Removed unnecessary scripts and documentation${NC}"
echo -e "${GREEN}✓ Cleaned up backup directories${NC}"
echo -e "${GREEN}✓ Removed temporary files${NC}"
echo -e "${GREEN}✓ Cleaned up log files${NC}"
echo -e "${GREEN}✓ Removed empty directories${NC}"
echo ""
echo -e "${YELLOW}Log file saved to: $LOG_FILE${NC}"
echo -e "${YELLOW}Essential scripts kept:${NC}"
for script in "${KEEP_SCRIPTS[@]}"; do
    echo -e "  - $script"
done
echo ""
echo -e "${BLUE}Server cleanup completed successfully!${NC}" 