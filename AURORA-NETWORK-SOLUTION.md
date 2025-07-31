# Aurora Network Access Solution

## Problem Analysis

The Aurora database is in a **private isolated subnet** within VPC `vpc-0682675c817aba46a`, which means:

1. **No direct internet access** - Aurora is not accessible from outside the VPC
2. **Security group rule added** - But network routing prevents connection
3. **Lambda functions work** - Because they're in the same VPC with proper routing

## Solution Options

### Option 1: AWS Systems Manager Session Manager (Recommended)

This is the most secure and cost-effective solution.

#### Step 1: Create EC2 Instance in Public Subnet

```bash
# Get public subnet ID
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=vpc-0682675c817aba46a" "Name=map-public-ip-on-launch,Values=true" \
  --query "Subnets[0].SubnetId" \
  --output text \
  --region us-east-1

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

#### Step 2: Connect via Session Manager

```bash
# Get instance ID
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" "Name=tag:Name,Values=*migration*" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text \
  --region us-east-1

# Connect via Session Manager
aws ssm start-session --target i-xxxxxxxxx
```

#### Step 3: Connect to Aurora from EC2

```bash
# From the EC2 instance
psql -h wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d wordpress \
     -p 5432
```

### Option 2: Bastion Host Setup

#### Step 1: Create Bastion Host

```bash
# Create security group for bastion
aws ec2 create-security-group \
  --group-name AuroraBastionSG \
  --description "Security group for Aurora bastion host" \
  --vpc-id vpc-0682675c817aba46a \
  --region us-east-1

# Add SSH access to bastion
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 98.60.25.83/32 \
  --region us-east-1

# Create bastion host
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --user-data '#!/bin/bash
    yum update -y
    yum install -y postgresql15'
```

#### Step 2: SSH to Bastion and Connect to Aurora

```bash
# SSH to bastion host
ssh -i your-key.pem ec2-user@bastion-public-ip

# From bastion, connect to Aurora
psql -h wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d wordpress \
     -p 5432
```

### Option 3: VPC Endpoint for RDS (Advanced)

This allows direct access from your local machine through AWS private network.

```bash
# Create VPC endpoint for RDS
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0682675c817aba46a \
  --service-name com.amazonaws.us-east-1.rds \
  --region us-east-1
```

## Immediate Action Plan

### Phase 1: Quick Setup (Recommended)

1. **Create EC2 instance for migration**:
```bash
# Get public subnet
SUBNET_ID=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=vpc-0682675c817aba46a" "Name=map-public-ip-on-launch,Values=true" \
  --query "Subnets[0].SubnetId" \
  --output text \
  --region us-east-1)

echo "Public subnet: $SUBNET_ID"

# Create EC2 instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --security-group-ids sg-0223a3e585cb7cb9f \
  --subnet-id $SUBNET_ID \
  --iam-instance-profile Name=SSMInstanceProfile \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=MigrationHost}]' \
  --user-data '#!/bin/bash
    yum update -y
    yum install -y postgresql15
    echo "Migration host ready"'
```

2. **Wait for instance to be ready**:
```bash
# Check instance status
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=MigrationHost" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text \
  --region us-east-1
```

3. **Connect via Session Manager**:
```bash
# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=MigrationHost" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text \
  --region us-east-1)

echo "Instance ID: $INSTANCE_ID"

# Connect via Session Manager
aws ssm start-session --target $INSTANCE_ID
```

### Phase 2: Migration Execution

1. **From the EC2 instance, run migration scripts**:
```bash
# Clone your repository or upload scripts
git clone https://github.com/your-repo/ck-v2-nextjs.git
cd ck-v2-nextjs

# Test database connection
node scripts/test-database-query.js

# Run migration
node scripts/execute-safe-migration.js
```

2. **Monitor migration progress**:
```bash
# Check CloudWatch logs
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/WordPressBlogStack" \
  --region us-east-1
```

### Phase 3: Cleanup

1. **Remove temporary access**:
```bash
aws ec2 revoke-security-group-ingress \
  --group-id sg-0223a3e585cb7cb9f \
  --protocol tcp \
  --port 5432 \
  --cidr 98.60.25.83/32 \
  --region us-east-1
```

2. **Terminate migration host**:
```bash
aws ec2 terminate-instances \
  --instance-ids $INSTANCE_ID \
  --region us-east-1
```

## Cost Optimization

- **EC2 t3.micro**: ~$8/month (only needed during migration)
- **SSM Session Manager**: Free
- **Aurora Serverless v2**: Scales to 0 when not in use
- **No NAT Gateway costs**: Using Session Manager instead

## Security Best Practices

1. **Use IAM roles** for EC2 instance
2. **Session Manager** logs all connections
3. **Remove access** after migration
4. **Monitor CloudTrail** for audit trail
5. **Use Secrets Manager** for credentials

## Troubleshooting

### If Session Manager doesn't work:

1. **Check IAM permissions**:
```bash
aws iam get-role --role-name SSMInstanceProfile
```

2. **Verify SSM agent**:
```bash
# From EC2 instance
sudo systemctl status amazon-ssm-agent
```

3. **Check security groups**:
```bash
aws ec2 describe-security-groups \
  --group-ids sg-0223a3e585cb7cb9f \
  --region us-east-1
```

### If Aurora connection fails from EC2:

1. **Check Aurora status**:
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93 \
  --region us-east-1
```

2. **Verify security group rules**:
```bash
aws ec2 describe-security-group-rules \
  --filters "Name=group-id,Values=sg-0223a3e585cb7cb9f" \
  --region us-east-1
```

## Next Steps

1. **Choose your preferred method** (Session Manager recommended)
2. **Execute the setup commands**
3. **Run migration from the EC2 instance**
4. **Validate results**
5. **Clean up temporary resources**

---

**Note**: The Session Manager approach is recommended because it's secure, cost-effective, and doesn't require managing SSH keys or bastion hosts. 