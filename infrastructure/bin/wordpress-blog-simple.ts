#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WordPressBlogStackSimple } from '../lib/aws-cdk-stack-simple';

const app = new cdk.App();

// Create the simplified WordPress blog stack
new WordPressBlogStackSimple(app, 'WordPressBlogStackSimple', {
  // You can override the default environment here
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  // Add stack description for better organization
  description: 'Simplified WordPress blog infrastructure with API Gateway and CloudFront',
});

// Add tags for cost tracking
cdk.Tags.of(app).add('Project', 'WordPressBlog');
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('CostCenter', 'Blog'); 