# Enhanced CloudFront Configuration Deployment Script
# Deploys the enhanced CloudFront distribution with security headers and optimizations

Write-Host "🚀 Deploying Enhanced CloudFront Configuration..." -ForegroundColor Green

# Navigate to infrastructure directory
Set-Location infrastructure

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing CDK dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the CDK app
Write-Host "🔨 Building CDK application..." -ForegroundColor Yellow
npm run build

# Deploy the stack with enhanced CloudFront configuration
Write-Host "☁️ Deploying WordPress Blog Stack with Enhanced CloudFront..." -ForegroundColor Yellow
cdk deploy WordPressBlogStack --require-approval never

# Check deployment status
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Enhanced CloudFront configuration deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test the CloudFront distribution URL" -ForegroundColor White
    Write-Host "2. Verify security headers are present" -ForegroundColor White
    Write-Host "3. Check error pages are working" -ForegroundColor White
    Write-Host "4. Monitor CloudWatch logs for any issues" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 To view CloudFront logs:" -ForegroundColor Cyan
    Write-Host "   - Check S3 bucket: CloudFrontLogs" -ForegroundColor White
    Write-Host "   - Monitor CloudWatch metrics" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}

# Return to original directory
Set-Location ..
