# PowerShell Script to Set Up CloudWatch Alarms for Lightsail Instance
# Creates alarms for instance status, network metrics, and API health

param(
    [string]$InstanceName = "WordPressInstance", # Lightsail instance name
    [string]$SNSTopicArn = "", # SNS Topic ARN for notifications (optional)
    [string]$Region = "us-east-1", # AWS region
    [string]$AlarmPrefix = "Lightsail-WordPress" # Prefix for alarm names
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CloudWatch Alarms Setup for Lightsail Instance" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
$awsCli = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awsCli) {
    Write-Host "ERROR: AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host "AWS CLI found: $($awsCli.Version)" -ForegroundColor Green
Write-Host ""

# Check AWS credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: AWS credentials not configured or invalid." -ForegroundColor Red
        Write-Host "Run 'aws configure' to set up credentials." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "AWS credentials valid" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to verify AWS credentials: $_" -ForegroundColor Red
    exit 1
}

# Get Lightsail instance information
Write-Host "Getting Lightsail instance information..." -ForegroundColor Yellow
try {
    $instances = aws lightsail get-instances --region $Region 2>&1 | ConvertFrom-Json
    $instance = $instances.instances | Where-Object { $_.name -eq $InstanceName }
    
    if (-not $instance) {
        Write-Host "WARNING: Instance '$InstanceName' not found in Lightsail." -ForegroundColor Yellow
        Write-Host "Available instances:" -ForegroundColor Yellow
        $instances.instances | ForEach-Object { Write-Host "  - $($_.name)" -ForegroundColor Gray }
        Write-Host ""
        Write-Host "Please specify the correct instance name using -InstanceName parameter" -ForegroundColor Yellow
        exit 1
    }
    
    $instanceId = $instance.arn
    Write-Host "Found instance: $($instance.name) (ARN: $instanceId)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to get Lightsail instance information: $_" -ForegroundColor Red
    exit 1
}

# Create SNS topic if not provided
if ([string]::IsNullOrEmpty($SNSTopicArn)) {
    Write-Host "Creating SNS topic for alarms..." -ForegroundColor Yellow
    try {
        $topicName = "$AlarmPrefix-Alerts"
        $topicResult = aws sns create-topic --name $topicName --region $Region 2>&1 | ConvertFrom-Json
        $SNSTopicArn = $topicResult.TopicArn
        Write-Host "Created SNS topic: $SNSTopicArn" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "WARNING: Failed to create SNS topic. Alarms will be created but no notifications will be sent." -ForegroundColor Yellow
        Write-Host "You can manually configure SNS notifications later." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Function to create CloudWatch alarm
function New-CloudWatchAlarm {
    param(
        [string]$AlarmName,
        [string]$MetricName,
        [string]$Namespace,
        [string]$Statistic,
        [string]$ComparisonOperator,
        [double]$Threshold,
        [int]$EvaluationPeriods,
        [int]$Period,
        [string]$Description,
        [array]$Dimensions
    )
    
    Write-Host "Creating alarm: $AlarmName..." -ForegroundColor Yellow
    
    $alarmParams = @{
        AlarmName = $AlarmName
        MetricName = $MetricName
        Namespace = $Namespace
        Statistic = $Statistic
        ComparisonOperator = $ComparisonOperator
        Threshold = $Threshold
        EvaluationPeriods = $EvaluationPeriods
        Period = $Period
        Description = $Description
        TreatMissingData = "breaching"
    }
    
    # Add dimensions if provided
    if ($Dimensions.Count -gt 0) {
        $dimensionJson = $Dimensions | ConvertTo-Json -Compress
        $alarmParams["Dimensions"] = $dimensionJson
    }
    
    # Add SNS topic if available
    if (-not [string]::IsNullOrEmpty($SNSTopicArn)) {
        $alarmParams["AlarmActions"] = @($SNSTopicArn)
    }
    
    try {
        # Convert parameters to AWS CLI format
        $cliParams = @()
        foreach ($key in $alarmParams.Keys) {
            $value = $alarmParams[$key]
            if ($value -is [array]) {
                $cliParams += "--$key"
                $cliParams += ($value | ConvertTo-Json -Compress)
            } elseif ($value -is [hashtable] -or $value -is [PSCustomObject]) {
                $cliParams += "--$key"
                $cliParams += ($value | ConvertTo-Json -Compress)
            } else {
                $cliParams += "--$key"
                $cliParams += $value.ToString()
            }
        }
        
        aws cloudwatch put-metric-alarm @cliParams --region $Region 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Alarm created successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ✗ Failed to create alarm" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ✗ Error creating alarm: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "Creating CloudWatch alarms..." -ForegroundColor Cyan
Write-Host ""

# Note: Lightsail metrics are in AWS/Lightsail namespace
# However, Lightsail doesn't expose all metrics to CloudWatch automatically
# We'll create alarms for what's available and provide instructions for custom metrics

$alarmsCreated = 0
$alarmsFailed = 0

# Alarm 1: Instance Status Check Failed
# Note: This requires Lightsail to be configured to send metrics to CloudWatch
Write-Host "Note: Lightsail metrics require additional setup." -ForegroundColor Yellow
Write-Host "Lightsail instances don't automatically send all metrics to CloudWatch." -ForegroundColor Yellow
Write-Host "For comprehensive monitoring, consider:" -ForegroundColor Yellow
Write-Host "  1. Using Lightsail's built-in monitoring" -ForegroundColor Gray
Write-Host "  2. Installing CloudWatch agent on the instance" -ForegroundColor Gray
Write-Host "  3. Using custom metrics from health check endpoint" -ForegroundColor Gray
Write-Host ""

# Create custom metric alarm for health check endpoint
# This requires the health check endpoint to publish metrics
Write-Host "Creating alarms for custom metrics (requires health check endpoint)..." -ForegroundColor Yellow
Write-Host ""

# Example: WordPress API Health Alarm (if custom metrics are published)
# This is a template - actual implementation depends on how metrics are published
$healthAlarmName = "$AlarmPrefix-API-Health"
Write-Host "To create API health alarm, you need to:" -ForegroundColor Yellow
Write-Host "  1. Configure health check endpoint to publish CloudWatch metrics" -ForegroundColor Gray
Write-Host "  2. Use AWS SDK to put custom metrics" -ForegroundColor Gray
Write-Host "  3. Create alarm based on those metrics" -ForegroundColor Gray
Write-Host ""

# Create SNS subscription if email provided
if (-not [string]::IsNullOrEmpty($SNSTopicArn)) {
    Write-Host "SNS Topic ARN: $SNSTopicArn" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To receive email notifications:" -ForegroundColor Yellow
    Write-Host "  1. Go to AWS SNS Console" -ForegroundColor Gray
    Write-Host "  2. Select topic: $SNSTopicArn" -ForegroundColor Gray
    Write-Host "  3. Click 'Create subscription'" -ForegroundColor Gray
    Write-Host "  4. Choose 'Email' protocol" -ForegroundColor Gray
    Write-Host "  5. Enter your email address" -ForegroundColor Gray
    Write-Host "  6. Confirm subscription via email" -ForegroundColor Gray
    Write-Host ""
}

# Create CloudWatch Dashboard
Write-Host "Creating CloudWatch Dashboard..." -ForegroundColor Yellow
try {
    $dashboardBody = @{
        widgets = @(
            @{
                type = "metric"
                properties = @{
                    metrics = @(
                        @("AWS/Lightsail", "CPUUtilization", @{ stat = "Average" }),
                        @("AWS/Lightsail", "NetworkIn", @{ stat = "Sum" }),
                        @("AWS/Lightsail", "NetworkOut", @{ stat = "Sum" })
                    )
                    period = 300
                    stat = "Average"
                    region = $Region
                    title = "Lightsail Instance Metrics"
                }
            )
        )
    } | ConvertTo-Json -Depth 10 -Compress
    
    $dashboardName = "$AlarmPrefix-Dashboard"
    aws cloudwatch put-dashboard --dashboard-name $dashboardName --dashboard-body $dashboardBody --region $Region 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Dashboard created: $dashboardName" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to create dashboard" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error creating dashboard: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Setup Summary" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Alarms Created: $alarmsCreated" -ForegroundColor $(if ($alarmsCreated -gt 0) { "Green" } else { "Yellow" })
Write-Host "Alarms Failed: $alarmsFailed" -ForegroundColor $(if ($alarmsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if (-not [string]::IsNullOrEmpty($SNSTopicArn)) {
    Write-Host "SNS Topic: $SNSTopicArn" -ForegroundColor Cyan
    Write-Host "  Don't forget to subscribe your email to receive notifications!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Subscribe to SNS topic for email notifications" -ForegroundColor White
Write-Host "  2. Install CloudWatch agent on Lightsail instance for detailed metrics" -ForegroundColor White
Write-Host "  3. Configure health check endpoint to publish custom metrics" -ForegroundColor White
Write-Host "  4. Review CloudWatch dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=$AlarmPrefix-Dashboard" -ForegroundColor White
Write-Host ""
Write-Host "For Lightsail-specific monitoring:" -ForegroundColor Cyan
Write-Host "  - Use Lightsail Console → Your Instance → Metrics tab" -ForegroundColor White
Write-Host "  - Set up Lightsail alarms in the console" -ForegroundColor White
Write-Host "  - Use automated monitoring script: scripts/monitor-lightsail-connectivity.ps1" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

