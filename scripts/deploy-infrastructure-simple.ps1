# Deploy Infrastructure for Cowboy Kimono v2 (Simple Version)
# This script deploys only the CDK infrastructure (CloudFront, Lambda, etc.)

Write-Host "🏗️ Deploying infrastructure for Cowboy Kimono v2..." -ForegroundColor Green

# Set environment variables
$env:NODE_ENV = "production"
$env:NEXT_TELEMETRY_DISABLED = "1"

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "aws")) {
    Write-Host "❌ AWS CLI is not installed. Please install AWS CLI." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "cdk")) {
    Write-Host "❌ AWS CDK is not installed. Please install AWS CDK." -ForegroundColor Red
    Write-Host "Run: npm install -g aws-cdk" -ForegroundColor Yellow
    exit 1
}

# Deploy infrastructure with CDK
Write-Host "🏗️ Deploying infrastructure with CDK..." -ForegroundColor Yellow

# Navigate to infrastructure directory
Push-Location "infrastructure"

try {
    # Install dependencies without running prepare scripts
    Write-Host "📦 Installing CDK dependencies..." -ForegroundColor Yellow
    npm install --ignore-scripts --silent

    # Bootstrap CDK (if needed)
    Write-Host "🚀 Bootstrapping CDK..." -ForegroundColor Yellow
    cdk bootstrap --require-approval never

    # Deploy the stack
    Write-Host "🚀 Deploying CDK stack..." -ForegroundColor Yellow
    cdk deploy --require-approval never

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ CDK deployment failed!" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green

} catch {
    Write-Host "❌ Infrastructure deployment failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Return to original directory
    Pop-Location
}

Write-Host "✅ Infrastructure deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of infrastructure changes:" -ForegroundColor Cyan
Write-Host "  • CloudFront distribution with subdomain routing" -ForegroundColor White
Write-Host "  • API Gateway for Lambda functions" -ForegroundColor White
Write-Host "  • Lambda function for recommendations" -ForegroundColor White
Write-Host "  • Security headers and CORS configuration" -ForegroundColor White
Write-Host "  • CloudWatch monitoring and logging" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test the web vitals endpoint: https://cowboykimono.com/api/analytics/web-vitals" -ForegroundColor White
Write-Host "  2. Test WordPress API calls: https://api.cowboykimono.com/wp-json/wp/v2/posts" -ForegroundColor White
Write-Host "  3. Test admin access: https://admin.cowboykimono.com/wp-admin" -ForegroundColor White
Write-Host "  4. Monitor CloudWatch logs for any issues" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Infrastructure deployment completed successfully!" -ForegroundColor Green
