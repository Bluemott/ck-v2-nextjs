# Local Development Environment Cleanup Script (PowerShell)
# This script removes unnecessary files from your local development environment

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Log file
$LogFile = "./cleanup-local-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

Write-Host "=== Local Development Environment Cleanup Script ===" -ForegroundColor $Blue
Write-Host "Log file: $LogFile" -ForegroundColor $Yellow
Write-Host ""

# Function to log messages
function Write-LogMessage {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp - $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

# Function to safely remove files/directories
function Remove-Safe {
    param([string]$Path)
    if (Test-Path $Path) {
        Write-LogMessage "Removing: $Path"
        Remove-Item -Path $Path -Recurse -Force
        Write-Host "✓ Removed: $Path" -ForegroundColor $Green
    } else {
        Write-LogMessage "Skipping (not found): $Path"
    }
}

Write-LogMessage "Starting local cleanup process..."

# 1. Clean up scripts directory - keep only essential scripts
Write-LogMessage "=== Cleaning up scripts directory ==="

# List of scripts to KEEP (essential for ongoing maintenance)
$KeepScripts = @(
    "check-cache-status.sh",
    "clear-wordpress-cache.sh", 
    "restart-bitnami-services.sh",
    "monitor-wordpress-cache.js",
    "test-production-apis.js",
    "server-cleanup.sh",
    "local-cleanup.sh",
    "local-cleanup.ps1"
)

# Remove non-essential scripts
Get-ChildItem -Path "scripts" -File | ForEach-Object {
    $scriptName = $_.Name
    $keepScript = $false
    
    foreach ($keep in $KeepScripts) {
        if ($scriptName -eq $keep) {
            $keepScript = $true
            break
        }
    }
    
    if (-not $keepScript) {
        Remove-Safe $_.FullName
    } else {
        Write-LogMessage "Keeping essential script: $scriptName"
    }
}

# 2. Clean up documentation files
Write-LogMessage "=== Cleaning up documentation files ==="

$docsToRemove = @(
    "WORDPRESS_CACHING_GUIDE.md",
    "WORDPRESS_CACHING_DEPLOYMENT_GUIDE.md", 
    "BITNAMI_WORDPRESS_CACHING_GUIDE.md",
    "HEADLESS_WORDPRESS_CACHING_GUIDE.md",
    "QUICK_START_CACHING.md",
    "WORDPRESS_ADMIN_API_TROUBLESHOOTING.md",
    "HTTPS_FIX_ACTION_PLAN.md",
    "BUILD_FIXES_SUMMARY.md",
    "CLEANUP_SUMMARY.md",
    "LIGHTSAIL_SETUP_SUMMARY.md",
    "DEV_BRANCH_SETUP.md"
)

foreach ($doc in $docsToRemove) {
    Remove-Safe $doc
}

# 3. Clean up backup directories
Write-LogMessage "=== Cleaning up backup directories ==="

Remove-Safe "security-backups"
Remove-Safe "database-backups" 
Remove-Safe "wordpress-export"

# 4. Clean up temporary files
Write-LogMessage "=== Cleaning up temporary files ==="

Remove-Safe "test-function.zip"
Remove-Safe "test-https-setup.js"
Remove-Safe "tsconfig.tsbuildinfo"
Remove-Safe "aplify.txt"

# 5. Clean up deployment directory
Write-LogMessage "=== Cleaning up deployment directory ==="

Remove-Safe "deployment/migration-guide.md"

# 6. Clean up any log files
Write-LogMessage "=== Cleaning up log files ==="

Get-ChildItem -Path "." -Recurse -Filter "*.log" | Remove-Item -Force

# 7. Clean up any backup files
Write-LogMessage "=== Cleaning up backup files ==="

Get-ChildItem -Path "." -Recurse -Filter "*.backup" | Remove-Item -Force
Get-ChildItem -Path "." -Recurse -Filter "*.bak" | Remove-Item -Force
Get-ChildItem -Path "." -Recurse -Filter "*.old" | Remove-Item -Force

# 8. Clean up empty directories
Write-LogMessage "=== Cleaning up empty directories ==="

Get-ChildItem -Path "." -Directory -Recurse | Where-Object {
    $_.GetFileSystemInfos().Count -eq 0 -and $_.FullName -notlike "*\.git*"
} | Remove-Item -Force

# 9. Clean up Next.js build cache
Write-LogMessage "=== Cleaning up Next.js build cache ==="

Remove-Safe ".next"
Remove-Safe "node_modules/.cache"

# 10. Clean up any TypeScript build info
Write-LogMessage "=== Cleaning up TypeScript build info ==="

Get-ChildItem -Path "." -Recurse -Filter "*.tsbuildinfo" | Remove-Item -Force

# Final summary
Write-LogMessage "=== Cleanup Summary ==="
Write-Host ""
Write-Host "=== Local Cleanup Complete ===" -ForegroundColor $Blue
Write-Host "✓ Removed unnecessary scripts and documentation" -ForegroundColor $Green
Write-Host "✓ Cleaned up backup directories" -ForegroundColor $Green
Write-Host "✓ Removed temporary files" -ForegroundColor $Green
Write-Host "✓ Cleaned up log files" -ForegroundColor $Green
Write-Host "✓ Removed empty directories" -ForegroundColor $Green
Write-Host "✓ Cleaned up build cache" -ForegroundColor $Green
Write-Host ""
Write-Host "Log file saved to: $LogFile" -ForegroundColor $Yellow
Write-Host "Essential scripts kept:" -ForegroundColor $Yellow
foreach ($script in $KeepScripts) {
    Write-Host "  - $script"
}
Write-Host ""
Write-Host "Local cleanup completed successfully!" -ForegroundColor $Blue
Write-Host "Next steps:" -ForegroundColor $Yellow
Write-Host "  1. Run 'npm install' to ensure dependencies are up to date"
Write-Host "  2. Run 'npm run build' to rebuild the project"
Write-Host "  3. Upload the server-cleanup.sh script to your server and run it" 