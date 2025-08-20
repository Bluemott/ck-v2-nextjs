import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class WordPressBlogStackSimple extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // API Gateway for Lambda functions only
    const api = new apigateway.RestApi(this, 'WordPressAPI', {
      restApiName: 'WordPress REST API',
      description:
        'API Gateway for Lambda functions (WordPress API handled directly by Lightsail)',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        allowCredentials: true,
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'Architecture', {
      value: 'Lightsail WordPress with Next.js Frontend (Direct API Access)',
      description: 'Current Architecture',
    });

    new cdk.CfnOutput(this, 'WordPressURL', {
      value: 'https://api.cowboykimono.com',
      description: 'WordPress REST API URL (Lightsail - Direct Access)',
    });

    new cdk.CfnOutput(this, 'WordPressAdminURL', {
      value: 'https://admin.cowboykimono.com',
      description: 'WordPress Admin URL (Lightsail - Direct Access)',
    });

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint (Lambda Functions Only)',
    });

    new cdk.CfnOutput(this, 'CachingStrategy', {
      value: 'WordPress Redis + REST API Caching (No CloudFront)',
      description: 'Current Caching Strategy',
    });
  }
}
