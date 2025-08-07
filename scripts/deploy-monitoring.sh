#!/bin/bash

# Cowboy Kimono v2 - Monitoring Stack Deployment Script
# This script deploys CloudWatch dashboards and alerts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
ENVIRONMENT=${1:-production}
APPLICATION_NAME="CowboyKimono"
REGION=${AWS_REGION:-us-east-1}

print_info "Deploying monitoring stack for $APPLICATION_NAME ($ENVIRONMENT)"

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

# Navigate to infrastructure directory
cd infrastructure

print_info "Installing dependencies..."
npm install

# Get infrastructure details from existing stack
print_info "Getting infrastructure details from existing stack..."

# Get Lambda function name
LAMBDA_FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name WordPressBlogStack \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text \
    --region $REGION 2>/dev/null || echo "")

# Get API Gateway ID
API_GATEWAY_ID=$(aws cloudformation describe-stacks \
    --stack-name WordPressBlogStack \
    --query 'Stacks[0].Outputs[?OutputKey==`RecommendationsEndpoint`].OutputValue' \
    --output text \
    --region $REGION 2>/dev/null | sed 's|https://\([^.]*\)\.execute-api\.\([^.]*\)\.amazonaws\.com.*|\1|' || echo "")

# Get CloudFront Distribution ID
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name WordPressBlogStack \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text \
    --region $REGION 2>/dev/null || echo "")

print_info "Infrastructure details:"
print_info "  Lambda Function: $LAMBDA_FUNCTION_NAME"
print_info "  API Gateway ID: $API_GATEWAY_ID"
print_info "  CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"

# Deploy monitoring stack
print_info "Deploying monitoring stack..."

cdk deploy ${APPLICATION_NAME}MonitoringStack \
    --context environment=$ENVIRONMENT \
    --context applicationName=$APPLICATION_NAME \
    --context lambdaFunctionName="$LAMBDA_FUNCTION_NAME" \
    --context apiGatewayId="$API_GATEWAY_ID" \
    --context cloudFrontDistributionId="$CLOUDFRONT_DISTRIBUTION_ID" \
    --context wordpressApiUrl="api.cowboykimono.com" \
    --require-approval never

print_success "Monitoring stack deployed successfully!"

# Get stack outputs
print_info "Getting stack outputs..."

ALERT_TOPIC_ARN=$(aws cloudformation describe-stacks \
    --stack-name ${APPLICATION_NAME}MonitoringStack \
    --query 'Stacks[0].Outputs[?OutputKey==`AlertTopicArn`].OutputValue' \
    --output text \
    --region $REGION)

APPLICATION_DASHBOARD=$(aws cloudformation describe-stacks \
    --stack-name ${APPLICATION_NAME}MonitoringStack \
    --query 'Stacks[0].Outputs[?OutputKey==`ApplicationDashboardName`].OutputValue' \
    --output text \
    --region $REGION)

INFRASTRUCTURE_DASHBOARD=$(aws cloudformation describe-stacks \
    --stack-name ${APPLICATION_NAME}MonitoringStack \
    --query 'Stacks[0].Outputs[?OutputKey==`InfrastructureDashboardName`].OutputValue' \
    --output text \
    --region $REGION)

print_success "Monitoring setup complete!"
echo ""
print_info "📊 Monitoring Resources:"
print_info "  Alert Topic ARN: $ALERT_TOPIC_ARN"
print_info "  Application Dashboard: $APPLICATION_DASHBOARD"
print_info "  Infrastructure Dashboard: $INFRASTRUCTURE_DASHBOARD"
echo ""
print_info "🔗 CloudWatch Console:"
print_info "  https://console.aws.amazon.com/cloudwatch/home?region=$REGION"
echo ""
print_info "📧 To receive alerts, subscribe to the SNS topic:"
print_info "  aws sns subscribe --topic-arn $ALERT_TOPIC_ARN --protocol email --notification-endpoint your-email@example.com"
echo ""
print_info "📈 View dashboards:"
print_info "  Application Metrics: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$APPLICATION_DASHBOARD"
print_info "  Infrastructure Health: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$INFRASTRUCTURE_DASHBOARD"

# Return to original directory
cd ..

print_success "Monitoring deployment complete!" 