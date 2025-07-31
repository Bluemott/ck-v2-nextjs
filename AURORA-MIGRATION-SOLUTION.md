# Aurora Database Migration Solution

## Current Issues Identified

Based on the diagnostic results, the following issues need to be resolved:

1. **Aurora Connection Timeout**: `connect ETIMEDOUT 10.0.4.69:5432`
2. **GraphQL API Error**: HTTP 502 (Bad Gateway)
3. **Security Group Access**: Aurora database is not accessible from your local machine
4. **Data Integrity**: Cannot validate data due to connection issues

## Security Group Information

- **Aurora Security Group ID**: `sg-0223a3e585cb7cb9f`
- **Aurora Security Group Name**: `WordPressBlogStack-AuroraSecurityGroup75F699F6-AwevXSXsplOs`
- **Your Current IP**: `98.60.25.83`

## Solution Options (Choose One)

### Option 1: Temporary Security Group Access (Quick Fix)

This is the fastest way to get access for migration, but should be removed after completion.

```bash
# Add your IP to Aurora security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-0223a3e585cb7cb9f \
  --protocol tcp \
  --port 5432 \
  --cidr 98.60.25.83/32 \
  --description "Temporary access for migration" \
  --region us-east-1

# Test connection
node scripts/test-database-query.js

# After migration, remove access
aws ec2 revoke-security-group-ingress \
  --group-id sg-0223a3e585cb7cb9f \
  --protocol tcp \
  --port 5432 \
  --cidr 98.60.25.83/32 \
  --region us-east-1
```

### Option 2: AWS Systems Manager Session Manager (Recommended)

This is the most secure approach and doesn't require opening security groups.

1. **Create an EC2 instance in the same VPC**:
```bash
# Get VPC and subnet information
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*WordPress*" --query "Vpcs[0].VpcId" --output text --region us-east-1

# Create EC2 instance with SSM role
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-0223a3e585cb7cb9f \
  --subnet-id subnet-xxxxxxxxx \
  --iam-instance-profile Name=SSMInstanceProfile \
  --user-data '#!/bin/bash
    yum update -y
    yum install -y postgresql15'
```

2. **Connect via Session Manager**:
```bash
aws ssm start-session --target i-xxxxxxxxx
```

3. **Connect to Aurora from EC2**:
```bash
psql -h wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d wordpress \
     -p 5432
```

### Option 3: Bastion Host (Intermediate Security)

Use the generated bastion host template in `security-backups/bastion-template.yaml`.

## Step-by-Step Migration Process

### Phase 1: Security Setup

1. **Choose your access method** (see options above)
2. **Test database connection**:
```bash
node scripts/test-database-query.js
```

3. **Verify GraphQL API**:
```bash
node scripts/test-graphql-api.js
```

### Phase 2: Data Migration

1. **Run comprehensive diagnostics**:
```bash
node scripts/safe-aurora-migration.js
```

2. **Execute migration**:
```bash
node scripts/execute-safe-migration.js
```

3. **Validate results**:
```bash
node scripts/test-database-query.js
```

### Phase 3: Testing & Validation

1. **Test GraphQL API with new data**
2. **Verify frontend integration**
3. **Performance testing**

### Phase 4: Production Cutover

1. **Update DNS/domain configuration**
2. **Monitor application performance**
3. **Remove temporary access rules**

## AWS Console Actions Required

### 1. Security Group Configuration

In AWS Console → EC2 → Security Groups:

1. Find security group: `WordPressBlogStack-AuroraSecurityGroup75F699F6-AwevXSXsplOs`
2. Edit inbound rules
3. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your IP (98.60.25.83/32)
   - Description: "Temporary migration access"

### 2. Lambda Function Check

In AWS Console → Lambda:

1. Check function: `WordPressBlogStack-WordPressGraphQL`
2. Verify environment variables
3. Check CloudWatch logs for errors

### 3. API Gateway Check

In AWS Console → API Gateway:

1. Check API: `WordPressBlogStack-WordPressAPI`
2. Verify integration with Lambda
3. Check deployment status

## Monitoring & Troubleshooting

### Check Aurora Status
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier wordpressblogstack-wordpressauroracaf35a28 \
  --region us-east-1
```

### Check Lambda Logs
```bash
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/WordPressBlogStack" \
  --region us-east-1
```

### Test API Gateway
```bash
curl -X POST https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ posts(first: 1) { nodes { id title } } }"}'
```

## Safety Measures

1. **Always backup before changes**
2. **Test with small data first**
3. **Monitor CloudWatch metrics**
4. **Have rollback plan ready**
5. **Remove temporary access after migration**

## Cost Optimization

1. **Use Aurora Serverless v2** (already configured)
2. **Set appropriate capacity limits**
3. **Monitor and adjust based on usage**
4. **Use CloudFront for caching**
5. **Implement proper logging retention**

## Next Steps

1. **Choose your preferred access method**
2. **Execute the security setup**
3. **Run the migration scripts**
4. **Validate the results**
5. **Plan the production cutover**

## Support Files Generated

- `scripts/safe-aurora-migration.js` - Diagnostic script
- `scripts/fix-aurora-security.js` - Security configuration
- `scripts/execute-safe-migration.js` - Migration execution
- `security-backups/` - Security guides and templates
- `database-backups/` - Migration reports and backups

## Emergency Rollback

If issues occur during migration:

1. **Stop the migration process**
2. **Check CloudWatch logs for errors**
3. **Restore from backup if needed**
4. **Remove temporary access rules**
5. **Contact AWS support if necessary**

---

**Remember**: Always follow the principle of least privilege and remove temporary access as soon as the migration is complete. 