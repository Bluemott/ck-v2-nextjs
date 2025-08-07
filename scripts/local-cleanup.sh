#!/bin/bash

# Local Development Environment Cleanup Script
# This script removes unnecessary files from your local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="./cleanup-local-$(date +%Y%m%d-%H%M%S).log"

echo -e "${BLUE}=== Local Development Environment Cleanup Script ===${NC}"
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

log_message "Starting local cleanup process..."

# 1. Clean up scripts directory - keep only essential scripts
log_message "=== Cleaning up scripts directory ==="

# List of scripts to KEEP (essential for ongoing maintenance)
KEEP_SCRIPTS=(
    "check-cache-status.sh"
    "clear-wordpress-cache.sh"
    "restart-bitnami-services.sh"
    "monitor-wordpress-cache.js"
    "test-production-apis.js"
    "server-cleanup.sh"
    "local-cleanup.sh"
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

# Keep only the most comprehensive guide and essential docs
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

safe_remove "security-backups/"
safe_remove "database-backups/"
safe_remove "wordpress-export/"

# 4. Clean up temporary files
log_message "=== Cleaning up temporary files ==="

safe_remove "test-function.zip"
safe_remove "test-https-setup.js"
safe_remove "tsconfig.tsbuildinfo"
safe_remove "aplify.txt"  # Typo in filename

# 5. Clean up deployment directory
log_message "=== Cleaning up deployment directory ==="

safe_remove "deployment/migration-guide.md"

# 6. Clean up any log files
log_message "=== Cleaning up log files ==="

find . -name "*.log" -type f -delete 2>/dev/null || true

# 7. Clean up any backup files
log_message "=== Cleaning up backup files ==="

find . -name "*.backup" -type f -delete 2>/dev/null || true
find . -name "*.bak" -type f -delete 2>/dev/null || true
find . -name "*.old" -type f -delete 2>/dev/null || true

# 8. Clean up empty directories
log_message "=== Cleaning up empty directories ==="

find . -type d -empty -not -path "./.git*" -delete 2>/dev/null || true

# 9. Clean up Next.js build cache
log_message "=== Cleaning up Next.js build cache ==="

safe_remove ".next/"
safe_remove "node_modules/.cache/"

# 10. Clean up any TypeScript build info
log_message "=== Cleaning up TypeScript build info ==="

find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Final summary
log_message "=== Cleanup Summary ==="
echo ""
echo -e "${BLUE}=== Local Cleanup Complete ===${NC}"
echo -e "${GREEN}✓ Removed unnecessary scripts and documentation${NC}"
echo -e "${GREEN}✓ Cleaned up backup directories${NC}"
echo -e "${GREEN}✓ Removed temporary files${NC}"
echo -e "${GREEN}✓ Cleaned up log files${NC}"
echo -e "${GREEN}✓ Removed empty directories${NC}"
echo -e "${GREEN}✓ Cleaned up build cache${NC}"
echo ""
echo -e "${YELLOW}Log file saved to: $LOG_FILE${NC}"
echo -e "${YELLOW}Essential scripts kept:${NC}"
for script in "${KEEP_SCRIPTS[@]}"; do
    echo -e "  - $script"
done
echo ""
echo -e "${BLUE}Local cleanup completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Run 'npm install' to ensure dependencies are up to date"
echo -e "  2. Run 'npm run build' to rebuild the project"
echo -e "  3. Upload the server-cleanup.sh script to your server and run it" 