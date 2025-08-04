#!/usr/bin/env ts-node

import * as cdk from 'aws-cdk-lib';
import { MonitoringStack } from '../lib/monitoring-stack';
import { WordPressBlogStack } from '../lib/aws-cdk-stack';

const app = new cdk.App();

// Get stack outputs from existing WordPress stack
const wordpressStack = new WordPressBlogStack(app, 'WordPressBlogStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Create monitoring stack with dependencies
const monitoringStack = new MonitoringStack(app, 'WordPressMonitoringStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  wordpressApiUrl: 'https://api.cowboykimono.com', // Replace with your actual API URL
  cloudfrontDistributionId: 'E1234567890ABC', // Replace with your actual CloudFront distribution ID
  auroraClusterName: 'WordPressAurora', // Replace with your actual Aurora cluster name
  lambdaFunctionNames: [
    'WordPressBlogStack-DatabaseSetup',
    'WordPressBlogStack-DataImport',
    'WordPressBlogStack-WordPressGraphQL',
  ],
});

// Add dependency
monitoringStack.addDependency(wordpressStack);

// Add tags
cdk.Tags.of(monitoringStack).add('Project', 'CowboyKimono');
cdk.Tags.of(monitoringStack).add('Environment', process.env.NODE_ENV || 'development');
cdk.Tags.of(monitoringStack).add('Component', 'Monitoring');

app.synth(); 