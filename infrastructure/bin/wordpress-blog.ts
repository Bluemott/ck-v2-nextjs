#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WordPressBlogStack } from '../lib/aws-cdk-stack';

const app = new cdk.App();

// Create the WordPress blog stack
new WordPressBlogStack(app, 'WordPressBlogStack', {
  // You can override the default environment here
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  // Add stack description for better organization
  description: 'Cost-optimized WordPress blog infrastructure with API Gateway, Lambda, and Aurora Serverless',
});

// Add tags for cost tracking
cdk.Tags.of(app).add('Project', 'WordPressBlog');
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('CostCenter', 'Blog'); 