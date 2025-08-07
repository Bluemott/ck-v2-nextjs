# Cowboy Kimono v2 - SNS Alert Subscription Script (PowerShell)
# This script helps you subscribe to CloudWatch alerts via SNS

param(
    [Parameter(Mandatory=$true)]
    [string]$EmailAddress,
    
    [string]$Region = $env:AWS_REGION
)

if (-not $Region) {
    $Region = "us-east-1"
}

# Function to print colored output
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Info "Subscribing to CloudWatch alerts for $EmailAddress"

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
} catch {
    Write-Error "AWS CLI is not installed. Please install it first."
    exit 1
}

# Get the SNS Topic ARN from the stack outputs
Write-Info "Getting SNS Topic ARN from stack outputs..."

try {
    $AlertTopicArn = aws cloudformation describe-stacks `
        --stack-name WordPressBlogStack `
        --query 'Stacks[0].Outputs[?OutputKey==`AlertTopicArn`].OutputValue' `
        --output text `
        --region $Region 2>$null

    if (-not $AlertTopicArn) {
        Write-Error "Could not find AlertTopicArn in stack outputs. Please ensure the monitoring stack is deployed."
        exit 1
    }

    Write-Info "Found SNS Topic ARN: $AlertTopicArn"
} catch {
    Write-Error "Failed to get SNS Topic ARN. Please ensure the monitoring stack is deployed."
    exit 1
}

# Subscribe to the SNS topic
Write-Info "Subscribing to SNS topic..."

try {
    $SubscriptionArn = aws sns subscribe `
        --topic-arn $AlertTopicArn `
        --protocol email `
        --notification-endpoint $EmailAddress `
        --region $Region `
        --output text

    Write-Success "Successfully subscribed to alerts!"
    Write-Info "Subscription ARN: $SubscriptionArn"
    Write-Host ""
    Write-Info "📧 Check your email ($EmailAddress) for a confirmation message"
    Write-Info "📧 Click the confirmation link to start receiving alerts"
    Write-Host ""
    Write-Info "🔗 CloudWatch Console:"
    Write-Info "  https://console.aws.amazon.com/cloudwatch/home?region=$Region"
    Write-Host ""
    Write-Info "📊 Dashboard URLs:"
    Write-Info "  Application Metrics: https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=CowboyKimono-production-application-metrics"
    Write-Info "  Infrastructure Health: https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=CowboyKimono-production-infrastructure-health"

} catch {
    Write-Error "Failed to subscribe to SNS topic. Please check your AWS credentials and try again."
    exit 1
}

Write-Success "Alert subscription setup complete!" 