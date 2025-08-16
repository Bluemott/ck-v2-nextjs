# Update WordPress Configuration Script
# This script updates the WordPress configuration to handle CloudFront admin access properly

Write-Host "🔧 Updating WordPress Configuration..." -ForegroundColor Green
Write-Host ""

# Check if the key file exists
$keyFile = "LightsailWP.pem"
if (-not (Test-Path $keyFile)) {
    Write-Host "❌ Key file $keyFile not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Key file found: $keyFile" -ForegroundColor Green

# Upload the new wp-config file
Write-Host "📤 Uploading new WordPress configuration..." -ForegroundColor Yellow
scp -i $keyFile wp-config-admin-fixed.php bitnami@34.194.14.49:/tmp/wp-config-admin-fixed.php

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload configuration file" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration file uploaded successfully" -ForegroundColor Green

# Apply the new configuration
Write-Host "🔧 Applying new WordPress configuration..." -ForegroundColor Yellow
ssh -i $keyFile bitnami@34.194.14.49 @"
# Backup current configuration
sudo cp /opt/bitnami/wordpress/wp-config.php /opt/bitnami/wordpress/wp-config.php.backup.$(date +%Y%m%d_%H%M%S)

# Apply new configuration
sudo cp /tmp/wp-config-admin-fixed.php /opt/bitnami/wordpress/wp-config.php
sudo chown bitnami:daemon /opt/bitnami/wordpress/wp-config.php
sudo chmod 644 /opt/bitnami/wordpress/wp-config.php

# Restart Apache to apply changes
sudo /opt/bitnami/ctlscript.sh restart apache

echo 'WordPress configuration updated successfully'
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to apply WordPress configuration" -ForegroundColor Red
    exit 1
}

Write-Host "✅ WordPress configuration updated successfully" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Configuration changes applied:" -ForegroundColor Cyan
Write-Host "  • WordPress now detects admin.cowboykimono.com and uses it as the base URL" -ForegroundColor White
Write-Host "  • Direct access to wp-origin.cowboykimono.com still works for API calls" -ForegroundColor White
Write-Host "  • SSL and security settings maintained" -ForegroundColor White
Write-Host ""

Write-Host "🎉 WordPress configuration update complete!" -ForegroundColor Green
Write-Host "You can now test admin access at: https://admin.cowboykimono.com/wp-admin" -ForegroundColor Cyan
