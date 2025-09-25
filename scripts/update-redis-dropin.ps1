# Update Redis Object Cache Drop-in Script (PowerShell)
# This script updates the Redis object cache drop-in file on the WordPress server

param(
    [switch]$Force
)

Write-Host "🔄 Updating Redis Object Cache Drop-in" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Configuration
$WP_CONTENT_PATH = "/opt/bitnami/wordpress/wp-content"
$DROPIN_FILE = "$WP_CONTENT_PATH/object-cache.php"
$BACKUP_DIR = "/opt/bitnami/wordpress/wp-content/backups"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$SOURCE_FILE = Join-Path (Split-Path -Parent $SCRIPT_DIR) "wordpress/object-cache.php"

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if source file exists
if (-not (Test-Path $SOURCE_FILE)) {
    Write-Host "❌ Source object-cache.php file not found at: $SOURCE_FILE" -ForegroundColor Red
    Write-Host "Please ensure the updated object-cache.php file is in the wordpress/ directory" -ForegroundColor Yellow
    exit 1
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "✅ Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

try {
    # Step 1: Backup existing drop-in file
    Write-Host "`n📦 Creating backup of existing drop-in..." -ForegroundColor Yellow
    if (Test-Path $DROPIN_FILE) {
        $BACKUP_FILE = "$BACKUP_DIR/object-cache.php.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $DROPIN_FILE $BACKUP_FILE
        Write-Host "✅ Backup created: $BACKUP_FILE" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No existing object-cache.php file found to backup" -ForegroundColor Yellow
    }

    # Step 2: Stop WordPress services temporarily
    Write-Host "`n⏸️  Stopping WordPress services..." -ForegroundColor Yellow
    try {
        & /opt/bitnami/ctlscript.sh stop apache 2>$null
        Write-Host "✅ Apache stopped" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not stop Apache (may not be running)" -ForegroundColor Yellow
    }

    # Step 3: Remove existing drop-in file
    Write-Host "`n🗑️  Removing existing drop-in file..." -ForegroundColor Yellow
    if (Test-Path $DROPIN_FILE) {
        Remove-Item $DROPIN_FILE -Force
        Write-Host "✅ Existing object-cache.php removed" -ForegroundColor Green
    }

    # Step 4: Copy new drop-in file
    Write-Host "`n📋 Installing new drop-in file..." -ForegroundColor Yellow
    Copy-Item $SOURCE_FILE $DROPIN_FILE
    Write-Host "✅ New object-cache.php installed" -ForegroundColor Green

    # Step 5: Set file permissions (Unix-style via WSL if available)
    Write-Host "`n🔍 Setting file permissions..." -ForegroundColor Yellow
    try {
        # Try to set permissions via WSL if available
        wsl chown bitnami:bitnami $DROPIN_FILE 2>$null
        wsl chmod 644 $DROPIN_FILE 2>$null
        Write-Host "✅ File permissions set" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not set Unix permissions (WSL may not be available)" -ForegroundColor Yellow
    }

    # Step 6: Clear PHP opcache
    Write-Host "`n🧹 Clearing PHP opcache..." -ForegroundColor Yellow
    try {
        php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache cleared'; } else { echo 'OPcache not available'; }" 2>$null
        Write-Host "✅ PHP opcache cleared" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not clear PHP opcache" -ForegroundColor Yellow
    }

    # Step 7: Start WordPress services
    Write-Host "`n▶️  Starting WordPress services..." -ForegroundColor Yellow
    try {
        & /opt/bitnami/ctlscript.sh start apache
        Write-Host "✅ Apache started" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not start Apache" -ForegroundColor Yellow
    }

    # Step 8: Test Redis connection
    Write-Host "`n🔴 Testing Redis connection..." -ForegroundColor Yellow
    try {
        $redisTest = wsl redis-cli ping 2>$null
        if ($redisTest -eq "PONG") {
            Write-Host "✅ Redis is running and accessible" -ForegroundColor Green
            
            # Test basic Redis operations
            wsl redis-cli set "test_key" "test_value" 2>$null
            $testValue = wsl redis-cli get "test_key" 2>$null
            if ($testValue -eq "test_value") {
                Write-Host "✅ Redis read/write operations working" -ForegroundColor Green
                wsl redis-cli del "test_key" 2>$null
            } else {
                Write-Host "⚠️  Redis read/write operations may have issues" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Redis is not responding to ping" -ForegroundColor Red
        }
    } catch {
        Write-Host "⚠️  Could not test Redis connection (redis-cli may not be available)" -ForegroundColor Yellow
    }

    # Step 9: Verify WordPress can load the drop-in
    Write-Host "`n🔍 Verifying WordPress drop-in loading..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2  # Give Apache time to start

    try {
        $response = Invoke-WebRequest -Uri "https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ WordPress API is responding correctly" -ForegroundColor Green
        } else {
            Write-Host "⚠️  WordPress API returned status code: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  WordPress API may have issues - check error logs" -ForegroundColor Yellow
    }

    # Step 10: Display cache status
    Write-Host "`n📊 Cache Status Information:" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow

    # Check if Redis Object Cache plugin is active
    $pluginPath = "/opt/bitnami/wordpress/wp-content/plugins/redis-cache"
    if (Test-Path $pluginPath) {
        Write-Host "✅ Redis Object Cache plugin is installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis Object Cache plugin not found" -ForegroundColor Yellow
    }

    # Check drop-in file version
    if (Test-Path $DROPIN_FILE) {
        $content = Get-Content $DROPIN_FILE -Raw
        if ($content -match 'version (\d+\.\d+\.\d+)') {
            $version = $matches[1]
            Write-Host "✅ Drop-in version: $version" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not determine drop-in version" -ForegroundColor Yellow
        }
    }

    # Check Redis memory usage
    try {
        $memoryUsage = wsl redis-cli info memory | Select-String "used_memory_human" | ForEach-Object { $_.Line.Split(':')[1].Trim() }
        if ($memoryUsage) {
            Write-Host "✅ Redis memory usage: $memoryUsage" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Could not get Redis memory usage" -ForegroundColor Yellow
    }

    Write-Host "`n🎉 Redis Object Cache Drop-in Update Complete!" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Check WordPress admin panel for Redis cache status"
    Write-Host "2. Go to Settings > Redis to verify the drop-in is recognized"
    Write-Host "3. Enable object cache if not already enabled"
    Write-Host "4. Monitor cache performance and hit rates"
    Write-Host ""
    Write-Host "If you encounter any issues:"
    Write-Host "- Check error logs: sudo tail -f /opt/bitnami/apache2/logs/error_log"
    Write-Host "- Verify Redis is running: sudo systemctl status redis-server"
    Write-Host "- Test Redis connection: redis-cli ping"
    Write-Host ""
    Write-Host "Backup location: $BACKUP_DIR"

} catch {
    Write-Host "`n❌ Error occurred during update: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check the error and try again" -ForegroundColor Yellow
    exit 1
}
