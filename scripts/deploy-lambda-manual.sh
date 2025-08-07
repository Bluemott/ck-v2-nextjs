#!/bin/bash

# Manual Lambda deployment script for Cowboy Kimono v2
# This script packages and deploys the Lambda function manually

set -e

echo "🚀 Starting manual Lambda deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

print_status "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

print_success "AWS credentials configured"

# Get AWS account and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

print_status "Using AWS Account: $ACCOUNT_ID"
print_status "Using AWS Region: $REGION"

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
print_status "Created temporary directory: $TEMP_DIR"

# Copy Lambda function files
print_status "Copying Lambda function files..."
cp -r lambda/recommendations/* "$TEMP_DIR/"

# Install dependencies
print_status "Installing Lambda dependencies..."
cd "$TEMP_DIR"
npm install --production

# Create deployment package
print_status "Creating deployment package..."
zip -r lambda-deployment.zip . -x "*.git*" "node_modules/.cache/*"

# Get function name from existing stack (if it exists)
FUNCTION_NAME="WordPressBlogStack-WordPressRecommendations"

print_status "Checking if function exists..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    print_status "Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://lambda-deployment.zip" \
        --region "$REGION"
    
    print_status "Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --environment "Variables={NODE_ENV=production,WORDPRESS_API_URL=https://api.cowboykimono.com,WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com,AWS_REGION=$REGION}" \
        --timeout 30 \
        --memory-size 512 \
        --region "$REGION"
else
    print_warning "Function $FUNCTION_NAME does not exist. Please deploy the CDK stack first."
    print_status "You can deploy the CDK stack with: cd infrastructure && cdk deploy"
fi

# Clean up
print_status "Cleaning up temporary files..."
cd -
rm -rf "$TEMP_DIR"

print_success "Lambda function deployment completed!"

echo ""
echo "📊 Next Steps:"
echo "1. Test the Lambda function:"
echo "   aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"postId\": 1, \"limit\": 3}' response.json"
echo ""
echo "2. Check function logs:"
echo "   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/$FUNCTION_NAME"
echo ""
echo "3. Monitor function metrics in CloudWatch" 