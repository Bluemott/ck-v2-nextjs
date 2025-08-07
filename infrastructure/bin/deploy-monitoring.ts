#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

// Get environment from context or default to 'production'
const environment = app.node.tryGetContext('environment') || 'production';
const applicationName = app.node.tryGetContext('applicationName') || 'CowboyKimono';

// Get infrastructure details from context or use defaults
const lambdaFunctionName = app.node.tryGetContext('lambdaFunctionName');
const apiGatewayId = app.node.tryGetContext('apiGatewayId');
const cloudFrontDistributionId = app.node.tryGetContext('cloudFrontDistributionId');
const wordpressApiUrl = app.node.tryGetContext('wordpressApiUrl') || 'api.cowboykimono.com';

new MonitoringStack(app, `${applicationName}MonitoringStack`, {
  environment,
  applicationName,
  lambdaFunctionName,
  apiGatewayId,
  cloudFrontDistributionId,
  wordpressApiUrl,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `CloudWatch monitoring stack for ${applicationName} ${environment} environment`,
}); 