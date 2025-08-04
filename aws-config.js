// aws-config.js - AWS SDK configuration for local development
import { fromEnv } from '@aws-sdk/credential-providers';

export const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: fromEnv(),
};

export const lambdaConfig = {
  ...awsConfig,
  apiVersion: '2015-03-31',
};