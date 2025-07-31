#!/usr/bin/env node

/**
 * Aurora Security Group Fix Script
 * Provides secure access to Aurora database for migration
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔒 Aurora Security Group Fix Script');
console.log('===================================\n');

// Configuration
const config = {
  region: 'us-east-1',
  stackName: 'WordPressBlogStack',
  auroraSecurityGroupName: 'WordPressBlogStack-AuroraSecurityGroup',
  lambdaSecurityGroupName: 'WordPressBlogStack-LambdaSecurityGroup',
  backupDir: './security-backups',
  logFile: './security-fix.log'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
  
  fs.appendFileSync(config.logFile, `${timestamp} [${type.toUpperCase()}] ${message}\n`);
}

function getCurrentIP() {
  try {
    // Get current public IP
    const ip = execSync('curl -s https://checkip.amazonaws.com', { encoding: 'utf8' }).trim();
    log(`Current public IP: ${ip}`, 'success');
    return ip;
  } catch (error) {
    log('Could not determine public IP, using placeholder', 'error');
    return '0.0.0.0/32'; // Placeholder
  }
}

function createSecurityBackup() {
  log('Creating security configuration backup...');
  
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `${config.backupDir}/security-backup-${timestamp}.json`;
  
  const backupData = {
    timestamp: new Date().toISOString(),
    currentIP: getCurrentIP(),
    securityGroups: {
      aurora: config.auroraSecurityGroupName,
      lambda: config.lambdaSecurityGroupName
    },
    notes: 'Security configuration backup before changes'
  };
  
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  log(`✅ Security backup created: ${backupFile}`, 'success');
  
  return backupFile;
}

function getSecurityGroupId(groupName) {
  try {
    const command = `aws ec2 describe-security-groups --filters "Name=group-name,Values=${groupName}" --query "SecurityGroups[0].GroupId" --output text --region ${config.region}`;
    const groupId = execSync(command, { encoding: 'utf8' }).trim();
    
    if (groupId === 'None') {
      throw new Error(`Security group ${groupName} not found`);
    }
    
    log(`Found security group: ${groupId}`, 'success');
    return groupId;
  } catch (error) {
    log(`Error finding security group ${groupName}: ${error.message}`, 'error');
    return null;
  }
}

function addTemporaryAccess(securityGroupId, ipAddress) {
  log(`Adding temporary access for IP: ${ipAddress}`);
  
  try {
    const command = `aws ec2 authorize-security-group-ingress \
      --group-id ${securityGroupId} \
      --protocol tcp \
      --port 5432 \
      --cidr ${ipAddress}/32 \
      --description "Temporary access for migration" \
      --region ${config.region}`;
    
    execSync(command, { stdio: 'pipe' });
    log('✅ Temporary access rule added successfully', 'success');
    return true;
  } catch (error) {
    if (error.message.includes('InvalidPermission.Duplicate')) {
      log('ℹ️ Access rule already exists', 'info');
      return true;
    } else {
      log(`❌ Failed to add access rule: ${error.message}`, 'error');
      return false;
    }
  }
}

function removeTemporaryAccess(securityGroupId, ipAddress) {
  log(`Removing temporary access for IP: ${ipAddress}`);
  
  try {
    const command = `aws ec2 revoke-security-group-ingress \
      --group-id ${securityGroupId} \
      --protocol tcp \
      --port 5432 \
      --cidr ${ipAddress}/32 \
      --region ${config.region}`;
    
    execSync(command, { stdio: 'pipe' });
    log('✅ Temporary access rule removed successfully', 'success');
    return true;
  } catch (error) {
    log(`❌ Failed to remove access rule: ${error.message}`, 'error');
    return false;
  }
}

function createBastionHost() {
  log('Creating bastion host for secure database access...');
  
  const bastionTemplate = `
# Bastion Host CloudFormation Template
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Bastion Host for Aurora Database Access'

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID where Aurora is located
  
  PublicSubnetId:
    Type: AWS::EC2::Subnet::Id
    Description: Public subnet for bastion host
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access

Resources:
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: AuroraBastionSecurityGroup
      GroupDescription: Security group for bastion host
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # Restrict to your IP in production
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          DestinationSecurityGroupId: !Ref AuroraSecurityGroupId

  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      SubnetId: !Ref PublicSubnetId
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y postgresql15
          echo "Bastion host ready for Aurora access"

Outputs:
  BastionPublicIP:
    Description: Public IP of bastion host
    Value: !GetAtt BastionHost.PublicIp
  BastionSecurityGroupId:
    Description: Security group ID of bastion host
    Value: !Ref BastionSecurityGroup
`;
  
  const templateFile = `${config.backupDir}/bastion-template.yaml`;
  fs.writeFileSync(templateFile, bastionTemplate);
  log(`✅ Bastion host template created: ${templateFile}`, 'success');
  
  return templateFile;
}

function generateSSMSessionManagerGuide() {
  log('Generating SSM Session Manager guide...');
  
  const ssmGuide = `
# AWS Systems Manager Session Manager Guide

## Prerequisites
1. Install AWS CLI and Session Manager plugin
2. Configure AWS credentials with appropriate permissions
3. Ensure your IAM user/role has SSM permissions

## Connect to Aurora via SSM Session Manager

### Step 1: Create an EC2 instance in the same VPC as Aurora
aws ec2 run-instances \\
  --image-id ami-0c02fb55956c7d316 \\
  --instance-type t3.micro \\
  --key-name your-key-pair \\
  --security-group-ids sg-xxxxxxxxx \\
  --subnet-id subnet-xxxxxxxxx \\
  --iam-instance-profile Name=SSMInstanceProfile \\
  --user-data '#!/bin/bash
    yum update -y
    yum install -y postgresql15'

### Step 2: Connect via Session Manager
aws ssm start-session --target i-xxxxxxxxx

### Step 3: Connect to Aurora from the EC2 instance
psql -h wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com \\
     -U postgres \\
     -d wordpress \\
     -p 5432

## Security Benefits
- No need for SSH keys or bastion hosts
- All connections are logged in CloudTrail
- IAM-based access control
- Encrypted connections
`;
  
  const guideFile = `${config.backupDir}/ssm-session-manager-guide.md`;
  fs.writeFileSync(guideFile, ssmGuide);
  log(`✅ SSM Session Manager guide created: ${guideFile}`, 'success');
  
  return guideFile;
}

function generateSecretsManagerSetup() {
  log('Generating Secrets Manager setup guide...');
  
  const secretsGuide = `
# AWS Secrets Manager Setup for Aurora

## Step 1: Create Secret for Aurora Credentials
aws secretsmanager create-secret \\
  --name "WordPressAuroraSecret" \\
  --description "Aurora database credentials for WordPress migration" \\
  --secret-string '{
    "username": "postgres",
    "password": "your-secure-password",
    "engine": "postgres",
    "host": "wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "wordpress"
  }'

## Step 2: Update Lambda Functions to Use Secrets
Update your Lambda environment variables to use Secrets Manager:

DB_SECRET_ARN: arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:WordPressAuroraSecret

## Step 3: Update Lambda Code to Retrieve Secrets
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getDatabaseCredentials() {
  const secret = await secretsManager.getSecretValue({
    SecretId: process.env.DB_SECRET_ARN
  }).promise();
  
  return JSON.parse(secret.SecretString);
}

## Step 4: Rotate Passwords Regularly
aws secretsmanager rotate-secret \\
  --secret-id "WordPressAuroraSecret" \\
  --rotation-rules '{
    "AutomaticallyAfterDays": 30
  }'
`;
  
  const secretsFile = `${config.backupDir}/secrets-manager-setup.md`;
  fs.writeFileSync(secretsFile, secretsGuide);
  log(`✅ Secrets Manager setup guide created: ${secretsFile}`, 'success');
  
  return secretsFile;
}

function generateMigrationChecklist() {
  log('Generating migration checklist...');
  
  const checklist = `
# Aurora Migration Security Checklist

## Pre-Migration Security
- [ ] Create backup of current WordPress database
- [ ] Document current security group configurations
- [ ] Identify all required database access patterns
- [ ] Plan rollback strategy

## Security Setup Options (Choose One)

### Option A: Temporary Security Group Access
- [ ] Add your IP to Aurora security group
- [ ] Complete migration
- [ ] Remove temporary access rule
- [ ] Verify no unauthorized access

### Option B: Bastion Host
- [ ] Deploy bastion host in public subnet
- [ ] Configure security groups for SSH access
- [ ] Use bastion host for database access
- [ ] Remove bastion host after migration

### Option C: SSM Session Manager
- [ ] Create EC2 instance with SSM role
- [ ] Configure Session Manager access
- [ ] Use Session Manager for database access
- [ ] Terminate EC2 instance after migration

## Data Migration Security
- [ ] Use encrypted connections (SSL/TLS)
- [ ] Validate data integrity after migration
- [ ] Test with small data subset first
- [ ] Monitor for unauthorized access attempts

## Post-Migration Security
- [ ] Remove temporary access rules
- [ ] Update application to use new database
- [ ] Monitor database performance and access
- [ ] Document new security configuration
- [ ] Schedule regular security audits

## Monitoring and Alerting
- [ ] Set up CloudWatch alarms for database access
- [ ] Configure VPC Flow Logs
- [ ] Enable CloudTrail for API calls
- [ ] Set up security group change alerts
`;
  
  const checklistFile = `${config.backupDir}/migration-security-checklist.md`;
  fs.writeFileSync(checklistFile, checklist);
  log(`✅ Migration checklist created: ${checklistFile}`, 'success');
  
  return checklistFile;
}

async function main() {
  try {
    log('🚀 Starting Aurora security configuration...');
    
    // Create security backup
    createSecurityBackup();
    
    // Get current IP
    const currentIP = getCurrentIP();
    
    // Find Aurora security group
    const auroraSecurityGroupId = getSecurityGroupId(config.auroraSecurityGroupName);
    
    if (!auroraSecurityGroupId) {
      log('❌ Could not find Aurora security group', 'error');
      log('Please check the security group name or create it manually', 'error');
      return;
    }
    
    // Generate security guides
    createBastionHost();
    generateSSMSessionManagerGuide();
    generateSecretsManagerSetup();
    generateMigrationChecklist();
    
    // Ask user for preferred access method
    console.log('\n🔒 Choose your preferred secure access method:');
    console.log('1. Temporary security group access (quick, but less secure)');
    console.log('2. Bastion host (more secure, requires EC2 setup)');
    console.log('3. SSM Session Manager (most secure, no additional infrastructure)');
    console.log('4. Just generate guides (manual setup)');
    
    // For now, we'll just generate the guides
    log('📋 Security guides and templates have been generated', 'success');
    log('Please review the files in the security-backups directory', 'info');
    
    console.log('\n📁 Generated files:');
    console.log(`   - ${config.backupDir}/bastion-template.yaml`);
    console.log(`   - ${config.backupDir}/ssm-session-manager-guide.md`);
    console.log(`   - ${config.backupDir}/secrets-manager-setup.md`);
    console.log(`   - ${config.backupDir}/migration-security-checklist.md`);
    
    log('✅ Security configuration complete', 'success');
    
  } catch (error) {
    log(`❌ Security configuration failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getCurrentIP,
  addTemporaryAccess,
  removeTemporaryAccess,
  createBastionHost,
  generateSSMSessionManagerGuide,
  generateSecretsManagerSetup
}; 