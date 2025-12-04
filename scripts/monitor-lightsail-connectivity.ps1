# PowerShell Script to Monitor Lightsail Connectivity
# Runs periodic checks to detect firewall/connectivity issues early
# Enhanced with email/SNS notification capabilities

param(
    [string]$InstanceIP = "34.194.14.49",
    [string]$APIUrl = "https://api.cowboykimono.com",
    [int]$CheckInterval = 300, # 5 minutes in seconds
    [string]$LogFile = "lightsail-connectivity.log",
    [string]$EmailTo = "", # Email address for alerts (optional)
    [string]$SMTPServer = "", # SMTP server for email (optional)
    [string]$SMTPPort = "587", # SMTP port (default: 587)
    [string]$SMTPUser = "", # SMTP username (optional)
    [string]$SMTPPassword = "", # SMTP password (optional)
    [string]$SNSTopicArn = "", # AWS SNS Topic ARN for alerts (optional)
    [switch]$AutoFixFirewall = $false # Attempt to re-apply firewall rules via AWS CLI (requires AWS CLI configured)
)

$ErrorActionPreference = "Continue"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage -ErrorAction SilentlyContinue
}

function Test-PortConnectivity {
    param([string]$Host, [int]$Port, [string]$Name)
    
    try {
        $result = Test-NetConnection -ComputerName $Host -Port $Port -WarningAction SilentlyContinue -ErrorAction Stop
        return @{
            Success = $result.TcpTestSucceeded
            Error = $null
        }
    } catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Test-APIEndpoint {
    param([string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Error = $null
        }
    } catch {
        return @{
            Success = $false
            StatusCode = $null
            Error = $_.Exception.Message
        }
    }
}

function Send-EmailAlert {
    param([string]$Subject, [string]$Body)
    
    if ([string]::IsNullOrEmpty($EmailTo) -or [string]::IsNullOrEmpty($SMTPServer)) {
        return $false
    }
    
    try {
        $smtpPortInt = [int]$SMTPPort
        $securePassword = ConvertTo-SecureString $SMTPPassword -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($SMTPUser, $securePassword)
        
        Send-MailMessage -To $EmailTo `
                        -Subject $Subject `
                        -Body $Body `
                        -SmtpServer $SMTPServer `
                        -Port $smtpPortInt `
                        -Credential $credential `
                        -UseSsl `
                        -ErrorAction Stop
        
        Write-Log "Email alert sent successfully to $EmailTo" "INFO"
        return $true
    } catch {
        Write-Log "Failed to send email alert: $_" "ERROR"
        return $false
    }
}

function Send-SNSAlert {
    param([string]$Subject, [string]$Message)
    
    if ([string]::IsNullOrEmpty($SNSTopicArn)) {
        return $false
    }
    
    try {
        # Check if AWS CLI is available
        $awsCli = Get-Command aws -ErrorAction SilentlyContinue
        if (-not $awsCli) {
            Write-Log "AWS CLI not found. Install AWS CLI to use SNS notifications." "WARNING"
            return $false
        }
        
        $messageBody = @{
            Subject = $Subject
            Message = $Message
            Timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            InstanceIP = $InstanceIP
            APIUrl = $APIUrl
        } | ConvertTo-Json
        
        aws sns publish --topic-arn $SNSTopicArn --subject $Subject --message $messageBody 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "SNS alert sent successfully to $SNSTopicArn" "INFO"
            return $true
        } else {
            Write-Log "Failed to send SNS alert. Check AWS CLI configuration." "ERROR"
            return $false
        }
    } catch {
        Write-Log "Failed to send SNS alert: $_" "ERROR"
        return $false
    }
}

function Send-Alert {
    param([string]$Message)
    
    Write-Log "ALERT: $Message" "ALERT"
    
    $subject = "Lightsail Connectivity Alert - $InstanceIP"
    $body = @"
Lightsail Connectivity Alert

Instance IP: $InstanceIP
API URL: $APIUrl
Time: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Alert Message:
$Message

This is an automated alert from the Lightsail Connectivity Monitor.
"@
    
    # Send email alert if configured
    if (-not [string]::IsNullOrEmpty($EmailTo)) {
        Send-EmailAlert -Subject $subject -Body $body | Out-Null
    }
    
    # Send SNS alert if configured
    if (-not [string]::IsNullOrEmpty($SNSTopicArn)) {
        Send-SNSAlert -Subject $subject -Message $Message | Out-Null
    }
}

function Re-ApplyFirewallRules {
    param([string]$InstanceName)
    
    if (-not $AutoFixFirewall) {
        return $false
    }
    
    Write-Log "Attempting to re-apply firewall rules via AWS CLI..." "INFO"
    
    try {
        # Check if AWS CLI is available
        $awsCli = Get-Command aws -ErrorAction SilentlyContinue
        if (-not $awsCli) {
            Write-Log "AWS CLI not found. Cannot auto-fix firewall rules." "WARNING"
            return $false
        }
        
        # Note: This requires AWS Lightsail CLI commands
        # Lightsail firewall rules are managed via console or API
        # For now, log that manual intervention is needed
        Write-Log "Auto-fix firewall: Manual intervention required. Use Lightsail console to re-apply firewall rules." "INFO"
        Write-Log "Required rules: SSH (22), HTTPS (443)" "INFO"
        
        return $false
    } catch {
        Write-Log "Error attempting firewall fix: $_" "ERROR"
        return $false
    }
}

Write-Log "Starting Lightsail Connectivity Monitor" "INFO"
Write-Log "Instance IP: $InstanceIP" "INFO"
Write-Log "API URL: $APIUrl" "INFO"
Write-Log "Check Interval: $CheckInterval seconds" "INFO"

if (-not [string]::IsNullOrEmpty($EmailTo)) {
    Write-Log "Email alerts enabled: $EmailTo" "INFO"
}

if (-not [string]::IsNullOrEmpty($SNSTopicArn)) {
    Write-Log "SNS alerts enabled: $SNSTopicArn" "INFO"
}

if ($AutoFixFirewall) {
    Write-Log "Auto-fix firewall enabled (requires AWS CLI)" "INFO"
}

$consecutiveFailures = 0
$lastSuccessTime = Get-Date

while ($true) {
    $allChecksPassed = $true
    
    # Check Port 22 (SSH)
    Write-Log "Checking SSH (port 22) connectivity..." "INFO"
    $sshCheck = Test-PortConnectivity -Host $InstanceIP -Port 22 -Name "SSH"
    if ($sshCheck.Success) {
        Write-Log "SSH (port 22): OK" "SUCCESS"
    } else {
        Write-Log "SSH (port 22): FAILED - $($sshCheck.Error)" "ERROR"
        $allChecksPassed = $false
    }
    
    # Check Port 443 (HTTPS)
    Write-Log "Checking HTTPS (port 443) connectivity..." "INFO"
    $httpsCheck = Test-PortConnectivity -Host $InstanceIP -Port 443 -Name "HTTPS"
    if ($httpsCheck.Success) {
        Write-Log "HTTPS (port 443): OK" "SUCCESS"
    } else {
        Write-Log "HTTPS (port 443): FAILED - $($httpsCheck.Error)" "ERROR"
        $allChecksPassed = $false
    }
    
    # Check WordPress API
    Write-Log "Checking WordPress API endpoint..." "INFO"
    $apiCheck = Test-APIEndpoint -Url "$APIUrl/wp-json/wp/v2/posts?per_page=1"
    if ($apiCheck.Success) {
        Write-Log "WordPress API: OK (Status: $($apiCheck.StatusCode))" "SUCCESS"
    } else {
        Write-Log "WordPress API: FAILED - $($apiCheck.Error)" "ERROR"
        $allChecksPassed = $false
    }
    
    # Evaluate results
    if ($allChecksPassed) {
        $consecutiveFailures = 0
        $lastSuccessTime = Get-Date
        Write-Log "All connectivity checks passed" "SUCCESS"
    } else {
        $consecutiveFailures++
        Write-Log "Connectivity check failed ($consecutiveFailures consecutive failures)" "WARNING"
        
        # Alert after 3 consecutive failures (15 minutes)
        if ($consecutiveFailures -ge 3) {
            $timeSinceLastSuccess = (Get-Date) - $lastSuccessTime
            $message = "Lightsail connectivity issues detected. $consecutiveFailures consecutive failures. Last success: $($lastSuccessTime.ToString('yyyy-MM-dd HH:mm:ss')). Time since last success: $([math]::Round($timeSinceLastSuccess.TotalMinutes, 1)) minutes."
            Send-Alert -Message $message
            
            # Attempt auto-fix if enabled
            if ($AutoFixFirewall) {
                Write-Log "Attempting automatic firewall rule re-application..." "INFO"
                Re-ApplyFirewallRules -InstanceName "WordPressInstance" | Out-Null
            }
        }
    }
    
    Write-Log "Waiting $CheckInterval seconds until next check..." "INFO"
    Start-Sleep -Seconds $CheckInterval
}

