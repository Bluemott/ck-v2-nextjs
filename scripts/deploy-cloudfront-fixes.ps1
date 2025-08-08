# Deploy CloudFront Fixes for Cowboy Kimono v2
# This script deploys the updated CloudFront configuration and infrastructure fixes

Write-Host "🚀 Deploying CloudFront fixes for Cowboy Kimono v2..." -ForegroundColor Green

# Set environment variables
$env:NODE_ENV = "production"
$env:NEXT_TELEMETRY_DISABLED = "1"

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed. Please install Node.js and npm." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "aws")) {
    Write-Host "❌ AWS CLI is not installed. Please install AWS CLI." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "cdk")) {
    Write-Host "❌ AWS CDK is not installed. Please install AWS CDK." -ForegroundColor Red
    Write-Host "Run: npm install -g aws-cdk" -ForegroundColor Yellow
    exit 1
}

# Build the Next.js application
Write-Host "🔨 Building Next.js application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Deploy infrastructure with CDK
Write-Host "🏗️ Deploying infrastructure with CDK..." -ForegroundColor Yellow

# Navigate to infrastructure directory
Push-Location "infrastructure"

try {
    # Install dependencies
    Write-Host "📦 Installing CDK dependencies..." -ForegroundColor Yellow
    npm install

    # Bootstrap CDK (if needed)
    Write-Host "🚀 Bootstrapping CDK..." -ForegroundColor Yellow
    cdk bootstrap

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

# Deploy to Amplify
Write-Host "🚀 Deploying to AWS Amplify..." -ForegroundColor Yellow

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository. Please initialize git and commit your changes." -ForegroundColor Red
    exit 1
}

# Add all changes
git add .

# Commit changes
$commitMessage = "Deploy CloudFront fixes and infrastructure updates - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $commitMessage

# Push to trigger Amplify deployment
Write-Host "📤 Pushing to trigger Amplify deployment..." -ForegroundColor Yellow
git push

Write-Host "✅ Deployment process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of changes:" -ForegroundColor Cyan
Write-Host "  • Fixed Web Vitals API endpoint with proper CORS headers" -ForegroundColor White
Write-Host "  • Updated CloudFront configuration for subdomains" -ForegroundColor White
Write-Host "  • Added proper routing for api.cowboykimono.com and admin.cowboykimono.com" -ForegroundColor White
Write-Host "  • Updated middleware to exclude analytics from rate limiting" -ForegroundColor White
Write-Host "  • Enhanced security headers and CORS configuration" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait for Amplify deployment to complete" -ForegroundColor White
Write-Host "  2. Test the web vitals endpoint: https://cowboykimono.com/api/analytics/web-vitals" -ForegroundColor White
Write-Host "  3. Test WordPress API calls: https://api.cowboykimono.com/wp-json/wp/v2/posts" -ForegroundColor White
Write-Host "  4. Test admin access: https://admin.cowboykimono.com/wp-admin" -ForegroundColor White
Write-Host "  5. Monitor CloudWatch logs for any issues" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
