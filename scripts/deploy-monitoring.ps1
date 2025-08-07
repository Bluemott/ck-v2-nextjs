# Cowboy Kimono v2 - Monitoring Stack Deployment Script (PowerShell)
# This script deploys CloudWatch dashboards and alerts

param(
    [string]$Environment = "production",
    [string]$ApplicationName = "CowboyKimono",
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

Write-Info "Deploying monitoring stack for $ApplicationName ($Environment)"

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
} catch {
    Write-Error "AWS CLI is not installed. Please install it first."
    exit 1
}

# Check if CDK is installed
try {
    cdk --version | Out-Null
} catch {
    Write-Error "AWS CDK is not installed. Please install it first."
    exit 1
}

# Navigate to infrastructure directory
Set-Location infrastructure

Write-Info "Installing dependencies..."
npm install

# Get infrastructure details from existing stack
Write-Info "Getting infrastructure details from existing stack..."

# Get Lambda function name
try {
    $LambdaFunctionName = aws cloudformation describe-stacks `
        --stack-name WordPressBlogStack `
        --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' `
        --output text `
        --region $Region 2>$null
} catch {
    $LambdaFunctionName = ""
}

# Get API Gateway ID
try {
    $ApiGatewayOutput = aws cloudformation describe-stacks `
        --stack-name WordPressBlogStack `
        --query 'Stacks[0].Outputs[?OutputKey==`RecommendationsEndpoint`].OutputValue' `
        --output text `
        --region $Region 2>$null
    
    if ($ApiGatewayOutput -match 'https://([^.]+)\.execute-api\.([^.]+)\.amazonaws\.com') {
        $ApiGatewayId = $matches[1]
    } else {
        $ApiGatewayId = ""
    }
} catch {
    $ApiGatewayId = ""
}

# Get CloudFront Distribution ID
try {
    $CloudFrontDistributionId = aws cloudformation describe-stacks `
        --stack-name WordPressBlogStack `
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' `
        --output text `
        --region $Region 2>$null
} catch {
    $CloudFrontDistributionId = ""
}

Write-Info "Infrastructure details:"
Write-Info "  Lambda Function: $LambdaFunctionName"
Write-Info "  API Gateway ID: $ApiGatewayId"
Write-Info "  CloudFront Distribution: $CloudFrontDistributionId"

# Deploy monitoring stack
Write-Info "Deploying monitoring stack..."

cdk deploy "${ApplicationName}MonitoringStack" `
    --context environment=$Environment `
    --context applicationName=$ApplicationName `
    --context lambdaFunctionName="$LambdaFunctionName" `
    --context apiGatewayId="$ApiGatewayId" `
    --context cloudFrontDistributionId="$CloudFrontDistributionId" `
    --context wordpressApiUrl="api.cowboykimono.com" `
    --require-approval never

Write-Success "Monitoring stack deployed successfully!"

# Get stack outputs
Write-Info "Getting stack outputs..."

try {
    $AlertTopicArn = aws cloudformation describe-stacks `
        --stack-name "${ApplicationName}MonitoringStack" `
        --query 'Stacks[0].Outputs[?OutputKey==`AlertTopicArn`].OutputValue' `
        --output text `
        --region $Region

    $ApplicationDashboard = aws cloudformation describe-stacks `
        --stack-name "${ApplicationName}MonitoringStack" `
        --query 'Stacks[0].Outputs[?OutputKey==`ApplicationDashboardName`].OutputValue' `
        --output text `
        --region $Region

    $InfrastructureDashboard = aws cloudformation describe-stacks `
        --stack-name "${ApplicationName}MonitoringStack" `
        --query 'Stacks[0].Outputs[?OutputKey==`InfrastructureDashboardName`].OutputValue' `
        --output text `
        --region $Region
} catch {
    Write-Warning "Could not retrieve stack outputs"
    $AlertTopicArn = ""
    $ApplicationDashboard = ""
    $InfrastructureDashboard = ""
}

Write-Success "Monitoring setup complete!"
Write-Host ""
Write-Info "📊 Monitoring Resources:"
Write-Info "  Alert Topic ARN: $AlertTopicArn"
Write-Info "  Application Dashboard: $ApplicationDashboard"
Write-Info "  Infrastructure Dashboard: $InfrastructureDashboard"
Write-Host ""
Write-Info "🔗 CloudWatch Console:"
Write-Info "  https://console.aws.amazon.com/cloudwatch/home?region=$Region"
Write-Host ""
Write-Info "📧 To receive alerts, subscribe to the SNS topic:"
Write-Info "  aws sns subscribe --topic-arn $AlertTopicArn --protocol email --notification-endpoint your-email@example.com"
Write-Host ""
Write-Info "📈 View dashboards:"
Write-Info "  Application Metrics: https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=$ApplicationDashboard"
Write-Info "  Infrastructure Health: https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=$InfrastructureDashboard"

# Return to original directory
Set-Location ..

Write-Success "Monitoring deployment complete!" 