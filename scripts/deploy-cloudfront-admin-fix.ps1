# Deploy CloudFront Admin Fix Script
# This script fixes the WordPress admin login issue by removing X-Forwarded-Host headers

Write-Host "🚀 Deploying CloudFront Admin Fix..." -ForegroundColor Green
Write-Host ""

# Check if AWS CLI is available
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not available. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if CDK is available
try {
    npx cdk --version | Out-Null
    Write-Host "✅ AWS CDK is available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CDK is not available. Installing..." -ForegroundColor Yellow
    npm install -g aws-cdk
}

Write-Host ""
Write-Host "📋 Summary of changes:" -ForegroundColor Cyan
Write-Host "  • Removed X-Forwarded-Host: admin.cowboykimono.com from CloudFront configuration" -ForegroundColor White
Write-Host "  • This prevents redirect loops that were causing cookie/session issues" -ForegroundColor White
Write-Host "  • WordPress will now use its configured base URL instead of being forced to admin.cowboykimono.com" -ForegroundColor White
Write-Host ""

# Navigate to infrastructure directory
Set-Location infrastructure

Write-Host "🔧 Building CDK application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Deploying infrastructure changes..." -ForegroundColor Yellow
npx cdk deploy --require-approval never

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ CloudFront configuration updated successfully!" -ForegroundColor Green
Write-Host ""

# Return to project root
Set-Location ..

Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait 5-10 minutes for CloudFront changes to propagate" -ForegroundColor White
Write-Host "  2. Clear your browser cache and cookies for admin.cowboykimono.com" -ForegroundColor White
Write-Host "  3. Test admin access: https://admin.cowboykimono.com/wp-admin" -ForegroundColor White
Write-Host "  4. If issues persist, also update WordPress configuration on the server" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Deployment complete! The admin login issue should be resolved." -ForegroundColor Green
