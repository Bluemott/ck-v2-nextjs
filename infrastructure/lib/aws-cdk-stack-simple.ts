import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class WordPressBlogStackSimple extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // API Gateway
    const api = new apigateway.RestApi(this, 'WordPressAPI', {
      restApiName: 'WordPress REST API',
      description: 'API Gateway for WordPress REST API (Lightsail-based)',
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

    // CloudFront Distribution (for media delivery from Lightsail)
    const cloudfrontDistribution = new cloudfront.Distribution(this, 'WordPressDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('api.cowboykimono.com', {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          originShieldRegion: this.region,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      },
      additionalBehaviors: {
        '/wp-content/uploads/*': {
          origin: new origins.HttpOrigin('api.cowboykimono.com', {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originShieldRegion: this.region,
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
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableLogging: false,
      comment: 'Cowboy Kimono WordPress Distribution',
    });

    // Outputs
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

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint',
    });
  }
} 