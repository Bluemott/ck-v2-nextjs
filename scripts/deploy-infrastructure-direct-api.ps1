# Deploy Infrastructure with Direct WordPress API Access
# Removes CloudFront from in front of WordPress API for better performance

Write-Host "🚀 Deploying Infrastructure with Direct WordPress API Access..." -ForegroundColor Green

# Navigate to infrastructure directory
Set-Location infrastructure

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

# Deploy the main stack (current stack being used)
Write-Host "☁️ Deploying AWS CDK Stack (Direct API Access)..." -ForegroundColor Yellow
Write-Host "📋 Current Stack: WordPressBlogStack" -ForegroundColor Cyan
Write-Host "🔗 Stack ARN: arn:aws:cloudformation:us-east-1:925242451851:stack/WordPressBlogStack/341fa750-7282-11f0-9f49-0e2ac79fa5f5" -ForegroundColor Cyan

npx cdk deploy WordPressBlogStack --require-approval never

# Check deployment status
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Infrastructure deployed successfully!" -ForegroundColor Green
    Write-Host "📋 Architecture: Lightsail WordPress with Direct API Access" -ForegroundColor Cyan
    Write-Host "🔗 WordPress API: https://api.cowboykimono.com (Direct)" -ForegroundColor Cyan
    Write-Host "🔗 WordPress Admin: https://admin.cowboykimono.com (Direct)" -ForegroundColor Cyan
    Write-Host "💾 Caching: WordPress Redis + REST API Caching" -ForegroundColor Cyan
    Write-Host "☁️ CloudFront: Frontend only (removed from WordPress API)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Infrastructure deployment failed!" -ForegroundColor Red
    exit 1
}

# Return to root directory
Set-Location ..

Write-Host "🎉 Deployment complete! WordPress API now uses direct access with Redis caching." -ForegroundColor Green
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test WordPress images loading without CORS errors" -ForegroundColor White
Write-Host "   2. Verify Lambda recommendations working without validation errors" -ForegroundColor White
Write-Host "   3. Check that links work consistently in Chrome" -ForegroundColor White
