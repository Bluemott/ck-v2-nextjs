#!/bin/bash

# Cowboy Kimono v2 - SNS Alert Subscription Script (Bash)
# This script helps you subscribe to CloudWatch alerts via SNS

set -e

# Default values
EMAIL_ADDRESS=""
REGION="${AWS_REGION:-us-east-1}"

# Function to print colored output
print_success() {
    echo -e "✅ $1"
}

print_info() {
    echo -e "ℹ️  $1"
}

print_warning() {
    echo -e "⚠️  $1"
}

print_error() {
    echo -e "❌ $1"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--email)
            EMAIL_ADDRESS="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 -e <email> [-r <region>]"
            echo "  -e, --email    Email address to subscribe to alerts"
            echo "  -r, --region   AWS region (default: us-east-1)"
            echo "  -h, --help     Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if email is provided
if [[ -z "$EMAIL_ADDRESS" ]]; then
    print_error "Email address is required. Use -e or --email option."
    echo "Usage: $0 -e <email> [-r <region>]"
    exit 1
fi

print_info "Subscribing to CloudWatch alerts for $EMAIL_ADDRESS"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Get the SNS Topic ARN from the stack outputs
print_info "Getting SNS Topic ARN from stack outputs..."

ALERT_TOPIC_ARN=$(aws cloudformation describe-stacks \
    --stack-name WordPressBlogStack \
    --query 'Stacks[0].Outputs[?OutputKey==`AlertTopicArn`].OutputValue' \
    --output text \
    --region "$REGION" 2>/dev/null || echo "")

if [[ -z "$ALERT_TOPIC_ARN" ]]; then
    print_error "Could not find AlertTopicArn in stack outputs. Please ensure the monitoring stack is deployed."
    exit 1
fi

print_info "Found SNS Topic ARN: $ALERT_TOPIC_ARN"

# Subscribe to the SNS topic
print_info "Subscribing to SNS topic..."

SUBSCRIPTION_ARN=$(aws sns subscribe \
    --topic-arn "$ALERT_TOPIC_ARN" \
    --protocol email \
    --notification-endpoint "$EMAIL_ADDRESS" \
    --region "$REGION" \
    --output text)

print_success "Successfully subscribed to alerts!"
print_info "Subscription ARN: $SUBSCRIPTION_ARN"
echo ""
print_info "📧 Check your email ($EMAIL_ADDRESS) for a confirmation message"
print_info "📧 Click the confirmation link to start receiving alerts"
echo ""
print_info "🔗 CloudWatch Console:"
print_info "  https://console.aws.amazon.com/cloudwatch/home?region=$REGION"
echo ""
print_info "📊 Dashboard URLs:"
print_info "  Application Metrics: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=CowboyKimono-production-application-metrics"
print_info "  Infrastructure Health: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=CowboyKimono-production-infrastructure-health"

print_success "Alert subscription setup complete!" 