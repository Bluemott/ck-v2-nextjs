import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class WordPressBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Recommendations Lambda Function (updated for WordPress REST API)
    const recommendationsLambda = new lambda.Function(
      this,
      'WordPressRecommendations',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('../lambda/recommendations'),
        environment: {
          NODE_ENV: 'production',
          WORDPRESS_API_URL: 'https://api.cowboykimono.com',
          WORDPRESS_ADMIN_URL: 'https://admin.cowboykimono.com',
          // Add caching configuration
          CACHE_TTL: '300',
          MAX_RECOMMENDATIONS: '5',
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 1024, // Increased for better performance
        logRetention: logs.RetentionDays.ONE_WEEK,
        description: 'WordPress recommendations Lambda function using REST API',
        // Add tracing
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Add CloudWatch permissions for monitoring
    recommendationsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'WordPressAPI', {
      restApiName: 'WordPress REST API',
      description:
        'API Gateway for WordPress REST API and Lambda functions (Lightsail-based)',
      // Disable default CORS to use explicit OPTIONS method
      defaultCorsPreflightOptions: undefined,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.OFF, // Disable logging to avoid CloudWatch issues
        dataTraceEnabled: false, // Cost optimization: disable data tracing
        metricsEnabled: true,
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
    });

    // Recommendations endpoint
    const recommendationsResource = api.root.addResource('recommendations');
    recommendationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(recommendationsLambda, {
        proxy: true,
      })
    );

    // Add OPTIONS method that goes to the Lambda function
    recommendationsResource.addMethod(
      'OPTIONS',
      new apigateway.LambdaIntegration(recommendationsLambda, {
        proxy: true,
      })
    );

    // Enhanced CloudFront Distribution with Security Headers and Optimizations
    const cloudfrontDistribution = new cloudfront.Distribution(
      this,
      'WordPressDistribution',
      {
        defaultBehavior: {
          origin: new origins.HttpOrigin('api.cowboykimono.com', {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originShieldRegion: this.region,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          // Add security headers
          responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(
            this,
            'SecurityHeaders',
            {
              responseHeadersPolicyName: 'SecurityHeaders',
              comment: 'Security headers for all responses',
              securityHeadersBehavior: {
                contentSecurityPolicy: {
                  override: true,
                  contentSecurityPolicy:
                    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https:; connect-src 'self' https://api.cowboykimono.com https://www.google-analytics.com; frame-src 'self' https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self';",
                },
                strictTransportSecurity: {
                  override: true,
                  accessControlMaxAge: cdk.Duration.days(2 * 365),
                  includeSubdomains: true,
                  preload: true,
                },
                contentTypeOptions: {
                  override: true,
                },
                frameOptions: {
                  override: true,
                  frameOption: cloudfront.HeadersFrameOption.DENY,
                },
                referrerPolicy: {
                  override: true,
                  referrerPolicy:
                    cloudfront.HeadersReferrerPolicy
                      .STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                },
                xssProtection: {
                  override: true,
                  protection: true,
                  modeBlock: true,
                },
              },
              customHeadersBehavior: {
                customHeaders: [
                  {
                    header: 'Permissions-Policy',
                    value:
                      'camera=(), microphone=(), geolocation=(), payment=()',
                    override: true,
                  },
                  {
                    header: 'Cross-Origin-Embedder-Policy',
                    value: 'require-corp',
                    override: true,
                  },
                  {
                    header: 'Cross-Origin-Opener-Policy',
                    value: 'same-origin',
                    override: true,
                  },
                  {
                    header: 'Cross-Origin-Resource-Policy',
                    value: 'same-origin',
                    override: true,
                  },
                ],
              },
            }
          ),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: new origins.HttpOrigin(
              `${api.restApiId}.execute-api.${this.region}.amazonaws.com`,
              {
                protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                originPath: '/prod', // Add the API Gateway stage path
              }
            ),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // Allow POST methods
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
            // Add security headers for API routes
            responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(
              this,
              'APISecurityHeaders',
              {
                responseHeadersPolicyName: 'APISecurityHeaders',
                comment: 'Security headers for API responses',
                securityHeadersBehavior: {
                  contentSecurityPolicy: {
                    override: true,
                    contentSecurityPolicy:
                      "default-src 'self'; script-src 'none'; style-src 'none';",
                  },
                  strictTransportSecurity: {
                    override: true,
                    accessControlMaxAge: cdk.Duration.days(2 * 365),
                    includeSubdomains: true,
                    preload: true,
                  },
                  contentTypeOptions: {
                    override: true,
                  },
                  frameOptions: {
                    override: true,
                    frameOption: cloudfront.HeadersFrameOption.DENY,
                  },
                },
                customHeadersBehavior: {
                  customHeaders: [
                    {
                      header: 'X-Custom-API-Version',
                      value: '1.0',
                      override: true,
                    },
                  ],
                },
              }
            ),
          },
          '/wp-content/uploads/*': {
            origin: new origins.HttpOrigin('api.cowboykimono.com', {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
              originShieldRegion: this.region,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy:
              cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
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
            // Add security headers for media files
            responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(
              this,
              'MediaSecurityHeaders',
              {
                responseHeadersPolicyName: 'MediaSecurityHeaders',
                comment: 'Security headers for media files',
                securityHeadersBehavior: {
                  contentTypeOptions: {
                    override: true,
                  },
                },
                customHeadersBehavior: {
                  customHeaders: [
                    {
                      header: 'Cache-Control',
                      value: 'public, max-age=31536000',
                      override: true,
                    },
                  ],
                },
              }
            ),
          },
        },
        // Add error pages
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/404',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/404',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 500,
            responseHttpStatus: 200,
            responsePagePath: '/500',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 502,
            responseHttpStatus: 200,
            responsePagePath: '/500',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 503,
            responseHttpStatus: 200,
            responsePagePath: '/500',
            ttl: cdk.Duration.minutes(5),
          },
        ],
        // Add price class for cost optimization
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        // Add logging with proper bucket configuration
        enableLogging: true,
        logBucket: new s3.Bucket(this, 'CloudFrontLogs', {
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          encryption: s3.BucketEncryption.S3_MANAGED,
          versioned: false,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
          lifecycleRules: [
            {
              id: 'LogRetention',
              enabled: true,
              expiration: cdk.Duration.days(60),
              transitions: [
                {
                  storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                  transitionAfter: cdk.Duration.days(30),
                },
              ],
            },
          ],
        }),
        comment: 'Cowboy Kimono WordPress Distribution with Enhanced Security',
      }
    );

    // CloudWatch Alarms for monitoring
    const lambdaErrorAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'LambdaErrorAlarm',
      {
        metric: recommendationsLambda.metricErrors(),
        threshold: 1,
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function errors exceeded threshold',
        alarmName: 'WordPressBlogStack-lambda-errors',
      }
    );

    const lambdaDurationAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        metric: recommendationsLambda.metricDuration(),
        threshold: 25000, // 25 seconds
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function duration exceeded threshold',
        alarmName: 'WordPressBlogStack-lambda-duration',
      }
    );

    const lambdaThrottleAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'LambdaThrottleAlarm',
      {
        metric: recommendationsLambda.metricThrottles(),
        threshold: 1,
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function throttles detected',
        alarmName: 'WordPressBlogStack-lambda-throttles',
      }
    );

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: 'WordPressBlogStack-alerts',
      displayName: 'WordPress Blog Stack Alerts',
    });

    // Connect alarms to SNS topic
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );
    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // CloudWatch Dashboards for monitoring
    const applicationDashboard = new cloudwatch.Dashboard(
      this,
      'ApplicationDashboard',
      {
        dashboardName: 'CowboyKimono-production-application-metrics',
        widgets: [
          // Lambda Metrics
          [
            new cloudwatch.GraphWidget({
              title: 'Lambda Function Metrics',
              left: [
                recommendationsLambda.metricInvocations(),
                recommendationsLambda.metricErrors(),
              ],
              right: [
                recommendationsLambda.metricDuration(),
                recommendationsLambda.metricThrottles(),
              ],
            }),
          ],
          // API Gateway Metrics
          [
            new cloudwatch.GraphWidget({
              title: 'API Gateway Metrics',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Count',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                  dimensionsMap: { ApiName: api.restApiId },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: '5XXError',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                  dimensionsMap: { ApiName: api.restApiId },
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Latency',
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                  dimensionsMap: { ApiName: api.restApiId },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: '4XXError',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                  dimensionsMap: { ApiName: api.restApiId },
                }),
              ],
            }),
          ],
          // CloudFront Metrics
          [
            new cloudwatch.GraphWidget({
              title: 'CloudFront Metrics',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/CloudFront',
                  metricName: 'Requests',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                  dimensionsMap: {
                    DistributionId: cloudfrontDistribution.distributionId,
                    Region: 'Global',
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/CloudFront',
                  metricName: 'ErrorRate',
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                  dimensionsMap: {
                    DistributionId: cloudfrontDistribution.distributionId,
                    Region: 'Global',
                  },
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'AWS/CloudFront',
                  metricName: 'CacheHitRate',
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                  dimensionsMap: {
                    DistributionId: cloudfrontDistribution.distributionId,
                    Region: 'Global',
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/CloudFront',
                  metricName: 'BytesDownloaded',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                  dimensionsMap: {
                    DistributionId: cloudfrontDistribution.distributionId,
                    Region: 'Global',
                  },
                }),
              ],
            }),
          ],
          // Custom Application Metrics
          [
            new cloudwatch.GraphWidget({
              title: 'Custom Application Metrics',
              left: [
                new cloudwatch.Metric({
                  namespace: 'WordPress/API',
                  metricName: 'APICallCount',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                }),
                new cloudwatch.Metric({
                  namespace: 'WordPress/API',
                  metricName: 'APICallDuration',
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'Lambda/API',
                  metricName: 'RequestCount',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                }),
                new cloudwatch.Metric({
                  namespace: 'Lambda/API',
                  metricName: 'ResponseTime',
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                }),
              ],
            }),
          ],
          // Cache Metrics
          [
            new cloudwatch.GraphWidget({
              title: 'Cache Performance',
              left: [
                new cloudwatch.Metric({
                  namespace: 'WordPress/Cache',
                  metricName: 'CacheHit',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                }),
                new cloudwatch.Metric({
                  namespace: 'WordPress/Cache',
                  metricName: 'CacheMiss',
                  statistic: 'Sum',
                  period: cdk.Duration.minutes(5),
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'WordPress/Cache',
                  metricName: 'CacheOperationDuration',
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                }),
              ],
            }),
          ],
        ],
      }
    );

    // Infrastructure Health Dashboard
    const infrastructureDashboard = new cloudwatch.Dashboard(
      this,
      'InfrastructureDashboard',
      {
        dashboardName: 'CowboyKimono-production-infrastructure-health',
        widgets: [
          // System Overview
          [
            new cloudwatch.TextWidget({
              markdown: `
# Cowboy Kimono - Production Environment

## Architecture Overview
- **Frontend:** Next.js on AWS Amplify
- **Backend:** WordPress on Lightsail
- **API:** REST API via WordPress
- **CDN:** CloudFront Distribution
- **Serverless:** Lambda Functions
- **Monitoring:** CloudWatch Dashboards & Alerts

## Key Endpoints
- **WordPress API:** https://api.cowboykimono.com
- **Lambda Function:** ${recommendationsLambda.functionName}
- **CloudFront:** ${cloudfrontDistribution.distributionId}

## Alert Configuration
- Lambda errors, duration, and throttles
- API Gateway 4XX/5XX errors and latency
- CloudFront error rate and cache performance
- Custom application metrics

## Response Time Targets
- **API Calls:** < 2 seconds
- **Lambda Functions:** < 25 seconds
- **Page Load:** < 3 seconds
- **Cache Hit Rate:** > 80%

Last Updated: ${new Date().toISOString()}
            `,
              height: 8,
              width: 24,
            }),
          ],
          // Alarm Status
          [
            new cloudwatch.AlarmStatusWidget({
              title: 'Alarm Status',
              alarms: [
                lambdaErrorAlarm,
                lambdaDurationAlarm,
                lambdaThrottleAlarm,
              ],
              height: 6,
              width: 12,
            }),
          ],
        ],
      }
    );

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

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: recommendationsLambda.functionName,
      description: 'Recommendations Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: recommendationsLambda.functionArn,
      description: 'Recommendations Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });

    new cdk.CfnOutput(this, 'ApplicationDashboardName', {
      value: applicationDashboard.dashboardName,
      description: 'Application metrics dashboard name',
    });

    new cdk.CfnOutput(this, 'InfrastructureDashboardName', {
      value: infrastructureDashboard.dashboardName,
      description: 'Infrastructure health dashboard name',
    });
  }
}
