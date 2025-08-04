import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class WordPressBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Security Group (simplified - no VPC needed for Lightsail architecture)
    const lambdaSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: undefined, // No VPC needed for Lightsail architecture
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Recommendations Lambda Function (simplified for Lightsail architecture)
    const recommendationsLambda = new lambda.Function(this, 'WordPressRecommendations', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda/recommendations'),
      environment: {
        NODE_ENV: 'production',
        WORDPRESS_API_URL: 'https://api.cowboykimono.com',
        WORDPRESS_ADMIN_URL: 'https://admin.cowboykimono.com',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'WordPressAPI', {
      restApiName: 'WordPress REST API',
      description: 'API Gateway for WordPress REST API and Lambda functions (Lightsail-based)',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.OFF, // Disable logging to avoid CloudWatch role issues
        dataTraceEnabled: false, // Cost optimization: disable data tracing
        metricsEnabled: true,
      },
    });

    // Recommendations endpoint
    const recommendationsResource = api.root.addResource('recommendations');
    recommendationsResource.addMethod('POST', new apigateway.LambdaIntegration(recommendationsLambda, {
      proxy: true,
    }), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
          },
        },
      ],
    });

    // CloudFront Distribution (for media delivery from Lightsail)
    const cloudfrontDistribution = new cloudfront.Distribution(this, 'WordPressDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('api.cowboykimono.com', {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(`${api.restApiId}.execute-api.${this.region}.amazonaws.com`, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originPath: '/prod', // Add the API Gateway stage path
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // Allow POST methods
        },
        '/wp-content/uploads/*': {
          origin: new origins.HttpOrigin('api.cowboykimono.com', {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          functionAssociations: [
            {
              function: new cloudfront.Function(this, 'MediaURLRewrite', {
                code: cloudfront.FunctionCode.fromInline(`
                  function handler(event) {
                    var request = event.request;
                    var uri = request.uri;
                    
                    // Rewrite media URLs to include proper headers
                    if (uri.startsWith('/wp-content/uploads/')) {
                      request.headers['cache-control'] = { value: 'public, max-age=31536000' };
                      request.headers['access-control-allow-origin'] = { value: '*' };
                    }
                    
                    return request;
                  }
                `),
              }),
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Cost optimization: use only North America and Europe
      enableLogging: false, // Disable logging to avoid ACL issues
    });

    // Outputs
    new cdk.CfnOutput(this, 'RecommendationsEndpoint', {
      value: `${api.url}recommendations`,
      description: 'Recommendations API Endpoint',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${cloudfrontDistribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: cloudfrontDistribution.distributionId,
      description: 'CloudFront Distribution ID for media invalidation',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: cloudfrontDistribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'Architecture', {
      value: 'Lightsail WordPress with Next.js Frontend',
      description: 'Current Architecture',
    });

    new cdk.CfnOutput(this, 'WordPressURL', {
      value: 'https://api.cowboykimono.com',
      description: 'WordPress REST API URL (Lightsail)',
    });

    new cdk.CfnOutput(this, 'WordPressAdminURL', {
      value: 'https://admin.cowboykimono.com',
      description: 'WordPress Admin URL (Lightsail)',
    });
  }
} 