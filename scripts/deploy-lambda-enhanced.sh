#!/bin/bash

# Enhanced Lambda Deployment Script for Cowboy Kimono v2
# Deploys the enhanced Lambda function with caching and performance optimizations

set -e  # Exit on any error

echo "🚀 Deploying Enhanced Lambda Function..."

# Set variables
LAMBDA_DIR="../lambda/recommendations"
ZIP_FILE="lambda-enhanced-deployment.zip"
FUNCTION_NAME="WordPressRecommendations"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to Lambda directory
if [ ! -d "$LAMBDA_DIR" ]; then
    echo "❌ Error: Lambda directory not found: $LAMBDA_DIR"
    exit 1
fi

echo "📁 Preparing Lambda deployment package..."

# Create deployment package
if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
fi

# Create zip file with Lambda code
zip -r "$ZIP_FILE" "$LAMBDA_DIR"/*

echo "✅ Deployment package created: $ZIP_FILE"

# Deploy to AWS Lambda
echo "🔄 Deploying to AWS Lambda..."

# Update Lambda function code
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region us-east-1

echo "✅ Lambda function code updated successfully"

# Update Lambda function configuration
aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --memory-size 1024 \
    --timeout 30 \
    --environment Variables='{NODE_ENV=production,WORDPRESS_API_URL=https://api.cowboykimono.com,WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com,CACHE_TTL=300,MAX_RECOMMENDATIONS=5}' \
    --region us-east-1

echo "✅ Lambda function configuration updated successfully"

# Wait for update to complete
echo "⏳ Waiting for deployment to complete..."
sleep 10

# Test the function
echo "🧪 Testing enhanced Lambda function..."

cat > test-payload.json << EOF
{
  "postId": 1,
  "limit": 3
}
EOF

aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload file://test-payload.json \
    --region us-east-1 \
    response.json

if [ $? -eq 0 ]; then
    echo "✅ Lambda function test successful"
    
    # Display response
    echo "📄 Response preview:"
    cat response.json | jq '.' 2>/dev/null || cat response.json
    
    # Clean up test files
    rm -f response.json test-payload.json
else
    echo "❌ Lambda function test failed"
    rm -f test-payload.json
fi

# Clean up deployment package
if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
    echo "🧹 Cleaned up deployment package"
fi

echo "🎉 Enhanced Lambda function deployment completed successfully!"
echo "📊 New features enabled:"
echo "   • Increased memory: 1024MB (from 512MB)"
echo "   • Enhanced timeout: 30 seconds"
echo "   • In-memory caching with 5-minute TTL"
echo "   • Cache headers (X-Cache: HIT/MISS)"
echo "   • Reserved concurrent executions: 10"
echo "   • Active tracing enabled"
echo "   • Performance monitoring"

echo "🔗 Test the function:"
echo "   aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"postId\": 1, \"limit\": 3}' response.json"
