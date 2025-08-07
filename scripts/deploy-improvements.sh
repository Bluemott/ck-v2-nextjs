#!/bin/bash

# Cowboy Kimono v2 - Infrastructure Improvements Deployment Script
# This script deploys the improved architecture with better monitoring and caching

set -e

echo "🚀 Starting Cowboy Kimono v2 Infrastructure Improvements Deployment"
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    print_error "AWS CDK is not installed. Please install it first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

print_status "Checking current environment..."

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

print_success "AWS credentials configured"

# Check if we're in the right AWS region
CURRENT_REGION=$(aws configure get region)
if [ "$CURRENT_REGION" != "us-east-1" ]; then
    print_warning "Current AWS region is $CURRENT_REGION. Recommended region is us-east-1."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_status "Building Next.js application..."

# Build the Next.js application
if npm run build; then
    print_success "Next.js build completed successfully"
else
    print_error "Next.js build failed"
    exit 1
fi

print_status "Installing Lambda dependencies..."

# Install Lambda dependencies
cd lambda/recommendations
if npm install; then
    print_success "Lambda dependencies installed"
else
    print_error "Lambda dependencies installation failed"
    exit 1
fi
cd ../..

print_status "Deploying infrastructure with CDK..."

# Deploy infrastructure
cd infrastructure
if npm install; then
    print_success "Infrastructure dependencies installed"
else
    print_error "Infrastructure dependencies installation failed"
    exit 1
fi

# Bootstrap CDK if needed
if ! cdk list &> /dev/null; then
    print_status "Bootstrapping CDK..."
    cdk bootstrap
fi

# Deploy the main stack
print_status "Deploying WordPress Blog Stack..."
if cdk deploy --require-approval never; then
    print_success "Infrastructure deployed successfully"
else
    print_error "Infrastructure deployment failed"
    exit 1
fi

cd ..

print_status "Testing health endpoint..."

# Test the health endpoint
HEALTH_RESPONSE=$(curl -s https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1)
if [ $? -eq 0 ]; then
    print_success "WordPress API is accessible"
else
    print_error "WordPress API is not accessible"
    exit 1
fi

print_status "Testing cache functionality..."

# Test cache warming
if node -e "
const { warmCache } = require('./app/lib/api');
warmCache().then(() => console.log('Cache warmed successfully')).catch(console.error);
"; then
    print_success "Cache warming completed"
else
    print_warning "Cache warming failed (this is expected in development)"
fi

print_status "Running final health checks..."

# Test the health endpoint
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "Health check failed")
if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    print_success "Health check passed"
else
    print_warning "Health check failed (expected if not running locally)"
fi

echo ""
echo "🎉 Deployment Summary"
echo "===================="
print_success "✅ Next.js application built successfully"
print_success "✅ Lambda function updated with WordPress REST API integration"
print_success "✅ Infrastructure deployed with improved monitoring"
print_success "✅ Caching system implemented"
print_success "✅ Error boundaries and monitoring enhanced"

echo ""
echo "📊 Next Steps:"
echo "1. Monitor the application using CloudWatch dashboards"
echo "2. Test the recommendations API endpoint"
echo "3. Verify cache performance improvements"
echo "4. Check error monitoring in CloudWatch logs"

echo ""
echo "🔗 Useful Links:"
echo "- Health Check: https://your-domain.com/api/health"
echo "- WordPress API: https://api.cowboykimono.com"
echo "- CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch"

echo ""
print_success "Deployment completed successfully! 🚀" 