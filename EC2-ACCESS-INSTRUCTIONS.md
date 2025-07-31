# EC2 Instance Access Instructions

## ✅ Instance Created Successfully

- **Instance ID**: `i-007b32d30926b5894`
- **Status**: Running
- **Private IP**: `10.0.1.237`
- **IAM Role**: `SSMInstanceProfile` (enables Session Manager access)
- **Security Group**: Same as Aurora (allows database access)

## 🔐 Access Methods

### Method 1: AWS Systems Manager Session Manager (Recommended)

This is the most secure method and doesn't require SSH keys.

#### Step 1: Install AWS Session Manager Plugin (if not already installed)

**Windows (PowerShell)**:
```powershell
# Download and install the Session Manager plugin
# Download from: https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe
```

**macOS**:
```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac/sessionmanager-bundle.zip" -o "sessionmanager-bundle.zip"
unzip sessionmanager-bundle.zip
sudo ./sessionmanager-bundle/install -i /usr/local/sessionmanagerplugin -b /usr/local/bin/session-manager-plugin
```

**Linux**:
```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
sudo yum install -y session-manager-plugin.rpm
```

#### Step 2: Connect via Session Manager

```bash
aws ssm start-session --target i-007b32d30926b5894 --region us-east-1
```

### Method 2: AWS Console (Browser-based)

1. **Go to AWS Console**: https://console.aws.amazon.com/ec2/
2. **Navigate to EC2 Instances**
3. **Find instance**: `i-007b32d30926b5894`
4. **Select the instance**
5. **Click "Connect"**
6. **Choose "Session Manager"**
7. **Click "Connect"**

### Method 3: AWS CLI with Browser

If you have the Session Manager plugin installed, you can also use:

```bash
aws ssm start-session --target i-007b32d30926b5894 --region us-east-1 --profile your-profile-name
```

## 🚀 Once Connected to the Instance

### Step 1: Update and Install Dependencies

```bash
# Update the system
sudo yum update -y

# Install Node.js and npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install PostgreSQL client
sudo yum install -y postgresql15

# Install Git
sudo yum install -y git
```

### Step 2: Clone Your Repository

```bash
# Clone your repository
git clone https://github.com/your-repo/ck-v2-nextjs.git
cd ck-v2-nextjs

# Install dependencies
npm install
```

### Step 3: Test Database Connection

```bash
# Test Aurora connection
node scripts/test-database-query.js
```

### Step 4: Run Migration Scripts

```bash
# Run comprehensive diagnostics
node scripts/safe-aurora-migration.js

# Execute migration
node scripts/execute-safe-migration.js
```

## 🔧 Troubleshooting

### If Session Manager doesn't work:

1. **Check IAM permissions**:
```bash
aws iam get-role --role-name SSMInstanceRole
```

2. **Verify the instance has the correct role**:
```bash
aws ec2 describe-instances --instance-ids i-007b32d30926b5894 --query "Reservations[0].Instances[0].IamInstanceProfile" --region us-east-1
```

3. **Check if SSM agent is running** (from within the instance):
```bash
sudo systemctl status amazon-ssm-agent
```

### If you can't connect via Session Manager:

1. **Try the AWS Console method** (Method 2 above)
2. **Check your AWS CLI configuration**:
```bash
aws configure list
```

3. **Verify your permissions**:
```bash
aws sts get-caller-identity
```

## 📊 Instance Details

### Current Configuration
- **AMI**: Amazon Linux 2
- **Instance Type**: t3.micro
- **VPC**: vpc-0682675c817aba46a
- **Subnet**: subnet-0e343aa3d0dd17cb5 (Public)
- **Security Group**: sg-0223a3e585cb7cb9f

### Network Access
- ✅ **Aurora Database**: Accessible (same security group)
- ✅ **Internet**: Accessible (public subnet)
- ✅ **SSM**: Accessible (IAM role configured)

## 🛠️ Useful Commands

### From Your Local Machine

```bash
# Check instance status
aws ec2 describe-instances --instance-ids i-007b32d30926b5894 --region us-east-1

# Connect via Session Manager
aws ssm start-session --target i-007b32d30926b5894 --region us-east-1

# Get instance details
aws ec2 describe-instances --instance-ids i-007b32d30926b5894 --query "Reservations[0].Instances[0].{InstanceId:InstanceId,State:State.Name,PublicIp:PublicIpAddress,PrivateIp:PrivateIpAddress}" --output table --region us-east-1
```

### From Within the Instance

```bash
# Test Aurora connection
psql -h wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com -U postgres -d wordpress -p 5432

# Check system resources
df -h
free -h
top

# Check installed packages
yum list installed | grep postgresql
node --version
npm --version
```

## 🔒 Security Notes

- ✅ **No SSH keys required** - Session Manager handles authentication
- ✅ **Encrypted connections** - All traffic is encrypted
- ✅ **IAM-based access** - Uses your AWS credentials
- ✅ **Audit trail** - All sessions are logged in CloudTrail

## 💰 Cost Information

- **EC2 t3.micro**: ~$8/month
- **Session Manager**: Free
- **Data transfer**: Minimal (only during migration)

## 🧹 Cleanup After Migration

```bash
# Terminate the instance when done
aws ec2 terminate-instances --instance-ids i-007b32d30926b5894 --region us-east-1

# Remove temporary security group rules
aws ec2 revoke-security-group-ingress --group-id sg-0223a3e585cb7cb9f --protocol tcp --port 5432 --cidr 98.60.25.83/32 --region us-east-1
```

---

**Next Step**: Connect to the instance using Session Manager and begin the migration process! 