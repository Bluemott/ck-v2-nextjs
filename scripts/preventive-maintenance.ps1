# PowerShell Script for Preventive Maintenance of Lightsail Instance
# Runs scheduled maintenance tasks to prevent crashes

param(
    [string]$InstanceIP = "34.194.14.49",
    [string]$APIUrl = "https://api.cowboykimono.com",
    [switch]$CreateSnapshot = $true,
    [switch]$RestartInstance = $false, # Set to $true to actually restart (use with caution)
    [string]$InstanceName = "WordPressInstance",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Lightsail Preventive Maintenance" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

$maintenanceLog = @()
$issues = @()
$warnings = @()

function Write-MaintenanceLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    $maintenanceLog += $logEntry
    Write-Host $logEntry -ForegroundColor $(switch ($Level) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "White" }
    })
}

# Step 1: Pre-Maintenance Checks
Write-MaintenanceLog "Step 1: Pre-Maintenance Checks" "INFO"
Write-Host ""

# Check connectivity
Write-MaintenanceLog "Checking connectivity..." "INFO"
try {
    $sshTest = Test-NetConnection -ComputerName $InstanceIP -Port 22 -WarningAction SilentlyContinue -ErrorAction Stop
    $httpsTest = Test-NetConnection -ComputerName $InstanceIP -Port 443 -WarningAction SilentlyContinue -ErrorAction Stop
    
    if ($sshTest.TcpTestSucceeded -and $httpsTest.TcpTestSucceeded) {
        Write-MaintenanceLog "Connectivity: OK" "SUCCESS"
    } else {
        $issues += "Connectivity issues detected before maintenance"
        Write-MaintenanceLog "Connectivity: ISSUES DETECTED" "WARNING"
    }
} catch {
    $issues += "Cannot test connectivity: $_"
    Write-MaintenanceLog "Connectivity: CANNOT TEST" "ERROR"
}

# Check API health
Write-MaintenanceLog "Checking API health..." "INFO"
try {
    $apiResponse = Invoke-WebRequest -Uri "$APIUrl/wp-json/wp/v2/posts?per_page=1" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($apiResponse.StatusCode -eq 200) {
        Write-MaintenanceLog "API Health: OK" "SUCCESS"
    } else {
        $warnings += "API returned status code: $($apiResponse.StatusCode)"
        Write-MaintenanceLog "API Health: WARNING (Status: $($apiResponse.StatusCode))" "WARNING"
    }
} catch {
    $issues += "API health check failed: $_"
    Write-MaintenanceLog "API Health: FAILED" "ERROR"
}

# Step 2: Create Snapshot
if ($CreateSnapshot) {
    Write-Host ""
    Write-MaintenanceLog "Step 2: Creating Snapshot" "INFO"
    
    # Check if AWS CLI is available
    $awsCli = Get-Command aws -ErrorAction SilentlyContinue
    if (-not $awsCli) {
        $warnings += "AWS CLI not found. Cannot create snapshot automatically."
        Write-MaintenanceLog "AWS CLI not found. Manual snapshot required." "WARNING"
        Write-MaintenanceLog "  → Go to Lightsail Console → Your Instance → Snapshots → Create snapshot" "INFO"
    } else {
        try {
            # Get instance ARN
            $instances = aws lightsail get-instances --region $Region 2>&1 | ConvertFrom-Json
            $instance = $instances.instances | Where-Object { $_.name -eq $InstanceName }
            
            if ($instance) {
                $snapshotName = "maintenance-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
                Write-MaintenanceLog "Creating snapshot: $snapshotName" "INFO"
                
                $snapshotResult = aws lightsail create-instance-snapshot --instance-name $InstanceName --instance-snapshot-name $snapshotName --region $Region 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-MaintenanceLog "Snapshot created: $snapshotName" "SUCCESS"
                } else {
                    $warnings += "Failed to create snapshot: $snapshotResult"
                    Write-MaintenanceLog "Snapshot creation failed. Manual snapshot recommended." "WARNING"
                }
            } else {
                $warnings += "Instance '$InstanceName' not found. Manual snapshot required."
                Write-MaintenanceLog "Instance not found. Manual snapshot required." "WARNING"
            }
        } catch {
            $warnings += "Error creating snapshot: $_"
            Write-MaintenanceLog "Snapshot creation error. Manual snapshot recommended." "WARNING"
        }
    }
}

# Step 3: Re-apply Firewall Rules (Preventive)
Write-Host ""
Write-MaintenanceLog "Step 3: Re-applying Firewall Rules (Preventive)" "INFO"
Write-MaintenanceLog "This helps prevent firewall rule sync failures" "INFO"
Write-MaintenanceLog "  → Go to Lightsail Console → Your Instance → Networking" "INFO"
Write-MaintenanceLog "  → Remove and re-add SSH (22) and HTTPS (443) rules" "INFO"
Write-MaintenanceLog "  → Wait 2 minutes for propagation" "INFO"

# Step 4: Resource Checks (via API/External)
Write-Host ""
Write-MaintenanceLog "Step 4: Resource Health Checks" "INFO"

# Check API response time (indicator of resource health)
try {
    $startTime = Get-Date
    $response = Invoke-WebRequest -Uri "$APIUrl/wp-json/wp/v2/posts?per_page=1" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
    
    if ($responseTime -lt 3000) {
        Write-MaintenanceLog "API Response Time: OK ($([math]::Round($responseTime, 2))ms)" "SUCCESS"
    } elseif ($responseTime -lt 5000) {
        $warnings += "API response time is slow: $([math]::Round($responseTime, 2))ms"
        Write-MaintenanceLog "API Response Time: SLOW ($([math]::Round($responseTime, 2))ms)" "WARNING"
    } else {
        $issues += "API response time is very slow: $([math]::Round($responseTime, 2))ms"
        Write-MaintenanceLog "API Response Time: VERY SLOW ($([math]::Round($responseTime, 2))ms)" "ERROR"
    }
} catch {
    $issues += "Cannot check API response time: $_"
    Write-MaintenanceLog "API Response Time: CANNOT CHECK" "ERROR"
}

# Step 5: Optional Instance Restart
if ($RestartInstance) {
    Write-Host ""
    Write-MaintenanceLog "Step 5: Instance Restart" "INFO"
    Write-MaintenanceLog "WARNING: This will cause brief downtime" "WARNING"
    
    $awsCli = Get-Command aws -ErrorAction SilentlyContinue
    if (-not $awsCli) {
        $warnings += "AWS CLI not found. Cannot restart automatically."
        Write-MaintenanceLog "AWS CLI not found. Manual restart required." "WARNING"
        Write-MaintenanceLog "  → Go to Lightsail Console → Your Instance → Stop → Wait 2-3 min → Start" "INFO"
    } else {
        Write-MaintenanceLog "Stopping instance..." "INFO"
        try {
            aws lightsail stop-instance --instance-name $InstanceName --region $Region 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-MaintenanceLog "Instance stopped. Waiting 3 minutes..." "INFO"
                Start-Sleep -Seconds 180
                
                Write-MaintenanceLog "Starting instance..." "INFO"
                aws lightsail start-instance --instance-name $InstanceName --region $Region 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-MaintenanceLog "Instance started. Waiting 3 minutes for services..." "INFO"
                    Start-Sleep -Seconds 180
                    
                    # Verify connectivity
                    Write-MaintenanceLog "Verifying connectivity..." "INFO"
                    $verifyTest = Test-NetConnection -ComputerName $InstanceIP -Port 443 -WarningAction SilentlyContinue -ErrorAction Stop
                    if ($verifyTest.TcpTestSucceeded) {
                        Write-MaintenanceLog "Connectivity verified after restart" "SUCCESS"
                    } else {
                        $issues += "Connectivity verification failed after restart"
                        Write-MaintenanceLog "Connectivity verification FAILED" "ERROR"
                    }
                } else {
                    $issues += "Failed to start instance"
                    Write-MaintenanceLog "Failed to start instance" "ERROR"
                }
            } else {
                $issues += "Failed to stop instance"
                Write-MaintenanceLog "Failed to stop instance" "ERROR"
            }
        } catch {
            $issues += "Error during restart: $_"
            Write-MaintenanceLog "Restart error: $_" "ERROR"
        }
    }
} else {
    Write-Host ""
    Write-MaintenanceLog "Step 5: Instance Restart (SKIPPED)" "INFO"
    Write-MaintenanceLog "  → Use -RestartInstance switch to enable automatic restart" "INFO"
    Write-MaintenanceLog "  → Or manually restart via Lightsail Console if needed" "INFO"
}

# Step 6: Post-Maintenance Verification
Write-Host ""
Write-MaintenanceLog "Step 6: Post-Maintenance Verification" "INFO"

# Final connectivity check
Write-MaintenanceLog "Final connectivity check..." "INFO"
try {
    $finalSshTest = Test-NetConnection -ComputerName $InstanceIP -Port 22 -WarningAction SilentlyContinue -ErrorAction Stop
    $finalHttpsTest = Test-NetConnection -ComputerName $InstanceIP -Port 443 -WarningAction SilentlyContinue -ErrorAction Stop
    $finalApiTest = Invoke-WebRequest -Uri "$APIUrl/wp-json/wp/v2/posts?per_page=1" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    
    if ($finalSshTest.TcpTestSucceeded -and $finalHttpsTest.TcpTestSucceeded -and $finalApiTest.StatusCode -eq 200) {
        Write-MaintenanceLog "All services verified: OK" "SUCCESS"
    } else {
        $issues += "Post-maintenance verification failed"
        Write-MaintenanceLog "Post-maintenance verification: FAILED" "ERROR"
    }
} catch {
    $issues += "Post-maintenance verification error: $_"
    Write-MaintenanceLog "Post-maintenance verification: ERROR" "ERROR"
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Maintenance Summary" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-MaintenanceLog "Maintenance completed successfully" "SUCCESS"
} else {
    if ($issues.Count -gt 0) {
        Write-Host "[ISSUES]:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "  - $issue" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "[WARNINGS]:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

Write-Host "Next Maintenance: Schedule for first Sunday of next month" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

# Save log
$logFile = "maintenance-$(Get-Date -Format 'yyyy-MM-dd').log"
$maintenanceLog | Out-File -FilePath $logFile -Encoding UTF8
Write-Host "Maintenance log saved to: $logFile" -ForegroundColor Gray
Write-Host ""

