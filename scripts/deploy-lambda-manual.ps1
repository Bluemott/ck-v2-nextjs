# Manual Lambda deployment script for Cowboy Kimono v2 (Windows PowerShell)
# This script packages and deploys the Lambda function manually

param(
    [string]$FunctionName = "WordPressBlogStack-WordPressRecommendations"
)

# Error handling
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting manual Lambda deployment..." -ForegroundColor Green

# Colors for output
function Write-Status { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>$null
    if (-not $awsVersion) {
        Write-Error "AWS CLI is not installed. Please install it first."
        exit 1
    }
} catch {
    Write-Error "AWS CLI is not installed. Please install it first."
    exit 1
}

Write-Status "Checking AWS credentials..."
try {
    $callerIdentity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    if (-not $callerIdentity) {
        Write-Error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    }
} catch {
    Write-Error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
}

Write-Success "AWS credentials configured"

# Get AWS account and region
$accountId = $callerIdentity.Account
$region = aws configure get region 2>$null
if (-not $region) { $region = "us-east-1" }

Write-Status "Using AWS Account: $accountId"
Write-Status "Using AWS Region: $region"

# Create temporary directory for packaging
$tempDir = [System.IO.Path]::GetTempPath() + [System.Guid]::NewGuid().ToString()
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Status "Created temporary directory: $tempDir"

# Copy Lambda function files
Write-Status "Copying Lambda function files..."
$lambdaSource = Join-Path $PSScriptRoot "..\lambda\recommendations"
if (-not (Test-Path $lambdaSource)) {
    Write-Error "Lambda source directory not found: $lambdaSource"
    exit 1
}

Copy-Item -Path "$lambdaSource\*" -Destination $tempDir -Recurse -Force

# Install dependencies
Write-Status "Installing Lambda dependencies..."
Set-Location $tempDir
npm install --production 2>$null

# Create deployment package using PowerShell's Compress-Archive
Write-Status "Creating deployment package..."
$zipFile = Join-Path $tempDir "lambda-deployment.zip"

# Remove node_modules/.cache if it exists
$cacheDir = Join-Path $tempDir "node_modules\.cache"
if (Test-Path $cacheDir) {
    Remove-Item $cacheDir -Recurse -Force
}

# Create zip file
try {
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force
    Write-Success "Deployment package created: $zipFile"
} catch {
    Write-Error "Failed to create deployment package: $($_.Exception.Message)"
    exit 1
}

# Check if function exists
Write-Status "Checking if function exists..."
try {
    $functionExists = aws lambda get-function --function-name $FunctionName --region $region 2>$null
    if ($functionExists) {
        Write-Status "Updating existing Lambda function..."
        
        # Update function code
        aws lambda update-function-code `
            --function-name $FunctionName `
            --zip-file "fileb://$zipFile" `
            --region $region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Lambda function code updated successfully"
        } else {
            Write-Error "Failed to update Lambda function code"
            exit 1
        }
        
        # Update function configuration
        Write-Status "Updating function configuration..."
        aws lambda update-function-configuration `
            --function-name $FunctionName `
            --environment "Variables={NODE_ENV=production,WORDPRESS_API_URL=https://api.cowboykimono.com,WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com}" `
            --timeout 30 `
            --memory-size 512 `
            --region $region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Lambda function configuration updated successfully"
        } else {
            Write-Error "Failed to update Lambda function configuration"
            exit 1
        }
    } else {
        Write-Warning "Function $FunctionName does not exist. Please deploy the CDK stack first."
        Write-Status "You can deploy the CDK stack with: cd infrastructure && cdk deploy"
    }
} catch {
    Write-Warning "Function $FunctionName does not exist. Please deploy the CDK stack first."
    Write-Status "You can deploy the CDK stack with: cd infrastructure && cdk deploy"
}

# Clean up
Write-Status "Cleaning up temporary files..."
Set-Location $PSScriptRoot
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Success "Lambda function deployment completed!"

Write-Host ""
Write-Host "📊 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test the Lambda function:"
Write-Host "   aws lambda invoke --function-name $FunctionName --payload '{\"postId\": 1, \"limit\": 3}' response.json"
Write-Host ""
Write-Host "2. Check function logs:"
Write-Host "   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/$FunctionName"
Write-Host ""
Write-Host "3. Monitor function metrics in CloudWatch"
Write-Host ""
Write-Host "4. Test the health endpoint:"
Write-Host "   curl https://your-domain.com/api/health" 