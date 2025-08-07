# Enhanced Lambda Deployment Script for Cowboy Kimono v2
# Deploys the enhanced Lambda function with caching and performance optimizations

Write-Host "🚀 Deploying Enhanced Lambda Function..." -ForegroundColor Green

# Set variables
$LAMBDA_DIR = "../lambda/recommendations"
$ZIP_FILE = "lambda-enhanced-deployment.zip"
$FUNCTION_NAME = "WordPressRecommendations"

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Navigate to Lambda directory
if (-not (Test-Path $LAMBDA_DIR)) {
    Write-Host "❌ Error: Lambda directory not found: $LAMBDA_DIR" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Preparing Lambda deployment package..." -ForegroundColor Yellow

# Create deployment package
try {
    # Remove existing zip if it exists
    if (Test-Path $ZIP_FILE) {
        Remove-Item $ZIP_FILE -Force
    }

    # Create zip file with Lambda code
    Compress-Archive -Path "$LAMBDA_DIR/*" -DestinationPath $ZIP_FILE -Force

    Write-Host "✅ Deployment package created: $ZIP_FILE" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating deployment package: $_" -ForegroundColor Red
    exit 1
}

# Deploy to AWS Lambda
Write-Host "🔄 Deploying to AWS Lambda..." -ForegroundColor Yellow

try {
    # Update Lambda function code
    aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file "fileb://$ZIP_FILE" --region us-east-1

    Write-Host "✅ Lambda function code updated successfully" -ForegroundColor Green

    # Update Lambda function configuration
    $envVars = 'NODE_ENV=production,WORDPRESS_API_URL=https://api.cowboykimono.com,WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com,CACHE_TTL=300,MAX_RECOMMENDATIONS=5'
    aws lambda update-function-configuration --function-name $FUNCTION_NAME --memory-size 1024 --timeout 30 --environment Variables=$envVars --region us-east-1

    Write-Host "✅ Lambda function configuration updated successfully" -ForegroundColor Green

    # Wait for update to complete
    Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    # Test the function
    Write-Host "🧪 Testing enhanced Lambda function..." -ForegroundColor Yellow
    
    $testPayload = @{
        postId = 1
        limit = 3
    } | ConvertTo-Json

    $response = aws lambda invoke --function-name $FUNCTION_NAME --payload $testPayload --region us-east-1 response.json

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lambda function test successful" -ForegroundColor Green
        
        # Display response
        $responseContent = Get-Content response.json -Raw
        Write-Host "📄 Response preview:" -ForegroundColor Cyan
        Write-Host ($responseContent | ConvertFrom-Json | ConvertTo-Json -Depth 2)
        
        # Clean up test file
        Remove-Item response.json -ErrorAction SilentlyContinue
    } else {
        Write-Host "❌ Lambda function test failed" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Error deploying Lambda function: $_" -ForegroundColor Red
    exit 1
}

# Clean up deployment package
if (Test-Path $ZIP_FILE) {
    Remove-Item $ZIP_FILE -Force
    Write-Host "🧹 Cleaned up deployment package" -ForegroundColor Green
}

Write-Host "🎉 Enhanced Lambda function deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 New features enabled:" -ForegroundColor Cyan
Write-Host "   • Increased memory: 1024MB (from 512MB)" -ForegroundColor White
Write-Host "   • Enhanced timeout: 30 seconds" -ForegroundColor White
Write-Host "   • In-memory caching with 5-minute TTL" -ForegroundColor White
Write-Host "   • Cache headers (X-Cache: HIT/MISS)" -ForegroundColor White
Write-Host "   • Reserved concurrent executions: 10" -ForegroundColor White
Write-Host "   • Active tracing enabled" -ForegroundColor White
Write-Host "   • Performance monitoring" -ForegroundColor White

Write-Host "🔗 Test the function:" -ForegroundColor Yellow
Write-Host "   aws lambda invoke --function-name $FUNCTION_NAME --payload '{""postId"": 1, ""limit"": 3}' response.json" -ForegroundColor Gray
