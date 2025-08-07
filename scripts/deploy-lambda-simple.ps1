# Simple Lambda deployment script for Cowboy Kimono v2 (Windows PowerShell)

param(
    [string]$FunctionName = "WordPressBlogStack-WordPressRecommendations"
)

Write-Host "🚀 Starting Lambda deployment..." -ForegroundColor Green

# Check AWS CLI
try {
    aws --version | Out-Null
    Write-Host "[INFO] AWS CLI found" -ForegroundColor Blue
} catch {
    Write-Host "[ERROR] AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    $callerIdentity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "[SUCCESS] AWS credentials configured" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] AWS credentials not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Get region
$region = aws configure get region
if (-not $region) { $region = "us-east-1" }
Write-Host "[INFO] Using region: $region" -ForegroundColor Blue

# Create temp directory
$tempDir = [System.IO.Path]::GetTempPath() + [System.Guid]::NewGuid().ToString()
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "[INFO] Created temp directory: $tempDir" -ForegroundColor Blue

# Copy Lambda files
$lambdaSource = Join-Path $PSScriptRoot "..\lambda\recommendations"
if (-not (Test-Path $lambdaSource)) {
    Write-Host "[ERROR] Lambda source not found: $lambdaSource" -ForegroundColor Red
    exit 1
}

Copy-Item -Path "$lambdaSource\*" -Destination $tempDir -Recurse -Force
Write-Host "[INFO] Copied Lambda files" -ForegroundColor Blue

# Install dependencies
Set-Location $tempDir
npm install --production 2>$null
Write-Host "[INFO] Installed dependencies" -ForegroundColor Blue

# Create zip
$zipFile = Join-Path $tempDir "lambda-deployment.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force
Write-Host "[SUCCESS] Created deployment package" -ForegroundColor Green

# Check if function exists
try {
    $functionExists = aws lambda get-function --function-name $FunctionName --region $region 2>$null
    if ($functionExists) {
        Write-Host "[INFO] Updating existing Lambda function..." -ForegroundColor Blue
        
        # Update code
        aws lambda update-function-code --function-name $FunctionName --zip-file "fileb://$zipFile" --region $region
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Lambda function code updated" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to update Lambda function code" -ForegroundColor Red
            exit 1
        }
        
        # Update configuration
        aws lambda update-function-configuration --function-name $FunctionName --environment "Variables={NODE_ENV=production,WORDPRESS_API_URL=https://api.cowboykimono.com,WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com}" --timeout 30 --memory-size 512 --region $region
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Lambda function configuration updated" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to update Lambda function configuration" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[WARNING] Function $FunctionName does not exist. Please deploy CDK stack first." -ForegroundColor Yellow
        Write-Host "[INFO] Run: cd infrastructure && cdk deploy" -ForegroundColor Blue
    }
} catch {
    Write-Host "[WARNING] Function $FunctionName does not exist. Please deploy CDK stack first." -ForegroundColor Yellow
    Write-Host "[INFO] Run: cd infrastructure && cdk deploy" -ForegroundColor Blue
}

# Clean up
Set-Location $PSScriptRoot
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "[INFO] Cleaned up temporary files" -ForegroundColor Blue

Write-Host ""
Write-Host "✅ Lambda deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test: aws lambda invoke --function-name $FunctionName --payload '{\"postId\": 1, \"limit\": 3}' response.json"
Write-Host "2. Check logs: aws logs describe-log-groups --log-group-name-prefix /aws/lambda/$FunctionName"
Write-Host "3. Monitor: CloudWatch console"
Write-Host "4. Health check: curl https://your-domain.com/api/health" 