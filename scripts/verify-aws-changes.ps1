# Verification Script for AWS Security & Cost Optimization Changes
# Run this after CDK deployment to verify all changes took effect

Write-Host "Verifying AWS Security & Cost Optimization Changes..." -ForegroundColor Cyan
Write-Host ""

$region = "us-east-1"
$stackName = "WordPressBlogStack"
$lambdaFunctionName = "WordPressBlogStack-WordPressRecommendations*"

# Check Lambda Function Configuration
Write-Host "1. Checking Lambda Function Configuration..." -ForegroundColor Yellow
try {
    $lambda = aws lambda get-function --function-name $lambdaFunctionName --region $region 2>&1 | ConvertFrom-Json
    
    Write-Host "   ✅ Lambda Function Found: $($lambda.Configuration.FunctionName)" -ForegroundColor Green
    
    # Check Memory
    $memory = $lambda.Configuration.MemorySize
    if ($memory -eq 512) {
        Write-Host "   ✅ Memory: $memory MB (Correct - optimized from 1024 MB)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Memory: $memory MB (Expected 512 MB)" -ForegroundColor Yellow
    }
    
    # Check Environment Encryption
    if ($lambda.Configuration.KMSKeyArn) {
        Write-Host "   ✅ Environment Encryption: Enabled with KMS key" -ForegroundColor Green
        Write-Host "      KMS Key ARN: $($lambda.Configuration.KMSKeyArn)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Environment Encryption: NOT ENABLED" -ForegroundColor Red
    }
    
    # Check Dead Letter Queue
    if ($lambda.Configuration.DeadLetterConfig -and $lambda.Configuration.DeadLetterConfig.TargetArn) {
        Write-Host "   ✅ Dead Letter Queue: Configured" -ForegroundColor Green
        Write-Host "      DLQ ARN: $($lambda.Configuration.DeadLetterConfig.TargetArn)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Dead Letter Queue: NOT CONFIGURED" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error checking Lambda: $_" -ForegroundColor Red
}

Write-Host ""

# Check WAF on API Gateway
Write-Host "2. Checking WAF on API Gateway..." -ForegroundColor Yellow
try {
    $apiId = "0xde6p9ls2"
    $stageName = "prod"
    
    # Get WAF associations for API Gateway
    $wafAssociations = aws wafv2 list-resources-for-web-acl --web-acl-arn "*" --scope REGIONAL --region $region 2>&1 | ConvertFrom-Json
    
    $apiArn = "arn:aws:apigateway:$region::/restapis/$apiId/stages/$stageName"
    $found = $false
    
    foreach ($resource in $wafAssociations.ResourceArns) {
        if ($resource -like "*$apiId*") {
            Write-Host "   ✅ WAF Associated with API Gateway" -ForegroundColor Green
            Write-Host "      Resource ARN: $resource" -ForegroundColor Gray
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "   ⚠️  WAF Association: Not found (may need to check manually)" -ForegroundColor Yellow
        Write-Host "      Check: AWS Console → API Gateway → Settings → Web ACL" -ForegroundColor Gray
    }
    
    # List WAF WebACLs
    $webAcls = aws wafv2 list-web-acls --scope REGIONAL --region $region 2>&1 | ConvertFrom-Json
    $wafFound = $false
    foreach ($webAcl in $webAcls.WebACLs) {
        if ($webAcl.Name -like "*wordpress*" -or $webAcl.Name -like "*api-gateway*") {
            Write-Host "   ✅ WAF WebACL Found: $($webAcl.Name)" -ForegroundColor Green
            Write-Host "      ARN: $($webAcl.ARN)" -ForegroundColor Gray
            $wafFound = $true
        }
    }
    
    if (-not $wafFound) {
        Write-Host "   ❌ WAF WebACL: NOT FOUND" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️  Error checking WAF: $_" -ForegroundColor Yellow
    Write-Host "      Check manually: AWS Console → WAF → Web ACLs" -ForegroundColor Gray
}

Write-Host ""

# Check KMS Key
Write-Host "3. Checking KMS Key..." -ForegroundColor Yellow
try {
    $keys = aws kms list-keys --region $region 2>&1 | ConvertFrom-Json
    
    $lambdaKeyFound = $false
    foreach ($key in $keys.Keys) {
        $keyDetails = aws kms describe-key --key-id $key.KeyId --region $region 2>&1 | ConvertFrom-Json
        if ($keyDetails.KeyMetadata.Description -like "*Lambda*environment*") {
            Write-Host "   ✅ KMS Key Found: $($keyDetails.KeyMetadata.Description)" -ForegroundColor Green
            Write-Host "      Key ID: $($keyDetails.KeyMetadata.KeyId)" -ForegroundColor Gray
            Write-Host "      Key Rotation: $($keyDetails.KeyMetadata.KeyRotationEnabled)" -ForegroundColor Gray
            $lambdaKeyFound = $true
        }
    }
    
    if (-not $lambdaKeyFound) {
        Write-Host "   ⚠️  KMS Key: Not found (may be created on next deployment)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Error checking KMS: $_" -ForegroundColor Yellow
}

Write-Host ""

# Check SQS DLQ
Write-Host "4. Checking Dead Letter Queue..." -ForegroundColor Yellow
try {
    $queues = aws sqs list-queues --region $region 2>&1 | ConvertFrom-Json
    
    $dlqFound = $false
    foreach ($queueUrl in $queues.QueueUrls) {
        if ($queueUrl -like "*dlq*" -or $queueUrl -like "*recommendations*") {
            Write-Host "   ✅ DLQ Found: $queueUrl" -ForegroundColor Green
            $dlqFound = $true
        }
    }
    
    if (-not $dlqFound) {
        Write-Host "   ⚠️  DLQ: Not found (may be created on next deployment)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Error checking SQS: $_" -ForegroundColor Yellow
}

Write-Host ""

# Check IAM Policy (least privilege)
Write-Host "5. Checking IAM Policy (Least Privilege)..." -ForegroundColor Yellow
try {
    $lambdaRole = aws iam get-role --role-name "WordPressBlogStack-WordPressRecommendationsServiceR*" --region $region 2>&1 | ConvertFrom-Json
    
    if ($lambdaRole) {
        $policies = aws iam list-role-policies --role-name $lambdaRole.Role.RoleName --region $region 2>&1 | ConvertFrom-Json
        
        foreach ($policyName in $policies.PolicyNames) {
            $policy = aws iam get-role-policy --role-name $lambdaRole.Role.RoleName --policy-name $policyName --region $region 2>&1 | ConvertFrom-Json
            $policyDoc = $policy.PolicyDocument | ConvertTo-Json -Depth 10
            
            if ($policyDoc -match '"\*"') {
                Write-Host "   ⚠️  Policy '$policyName' still contains wildcard resources" -ForegroundColor Yellow
            } else {
                Write-Host "   ✅ Policy '$policyName' uses specific ARNs (least privilege)" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "   ⚠️  Error checking IAM: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "   If any items show ❌ or ⚠️, the changes may not have been fully deployed."
Write-Host "   Try running: cd infrastructure && cdk deploy WordPressBlogStack"
Write-Host ""
Write-Host "   For manual verification:" -ForegroundColor Cyan
Write-Host "   - Lambda: AWS Console → Lambda → Functions → WordPressRecommendations"
Write-Host "   - WAF: AWS Console → WAF → Web ACLs (REGIONAL scope)"
Write-Host "   - API Gateway: AWS Console → API Gateway → Settings → Web ACL"
Write-Host "   - KMS: AWS Console → KMS → Customer managed keys"
Write-Host "   - SQS: AWS Console -> SQS -> Queues"
Write-Host ""

