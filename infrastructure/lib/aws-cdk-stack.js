'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.WordPressBlogStack = void 0;
const cdk = require('aws-cdk-lib');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const cloudwatchActions = require('aws-cdk-lib/aws-cloudwatch-actions');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
const logs = require('aws-cdk-lib/aws-logs');
const s3 = require('aws-cdk-lib/aws-s3');
const sns = require('aws-cdk-lib/aws-sns');
class WordPressBlogStack extends cdk.Stack {
  constructor(scope, id, props) {
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
            customHeaders: {
              'X-Forwarded-Host': 'api.cowboykimono.com',
              'X-CloudFront-Origin': 'api',
            },
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
                    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https:; connect-src 'self' https://api.cowboykimono.com https://www.google-analytics.com https://*.execute-api.us-east-1.amazonaws.com; frame-src 'self' https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self';",
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
          // Lambda API routes only - route to API Gateway
          // Note: Next.js API routes (like /api/analytics/*) are handled by Amplify, not API Gateway
          '/api/recommendations*': {
            origin: new origins.HttpOrigin(
              `${api.restApiId}.execute-api.${this.region}.amazonaws.com`,
              {
                protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                originPath: '/prod', // Add the API Gateway stage path
                customHeaders: {
                  'X-Forwarded-Host': 'cowboykimono.com',
                  'X-CloudFront-Origin': 'amplify',
                },
              }
            ),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // Allow POST methods
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
            // Add CORS headers for API routes
            responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(
              this,
              'APISecurityHeaders',
              {
                responseHeadersPolicyName: 'APISecurityHeaders',
                comment: 'Security headers for API responses with CORS',
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
                      header: 'Cache-Control',
                      value: 'no-cache, no-store, must-revalidate',
                      override: true,
                    },
                  ],
                },
              }
            ),
          },
          // WordPress admin routes
          '/wp-admin/*': {
            origin: new origins.HttpOrigin('admin.cowboykimono.com', {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
              customHeaders: {
                'X-Forwarded-Host': 'admin.cowboykimono.com',
                'X-CloudFront-Origin': 'admin',
              },
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
            // Add security headers for admin routes
            responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(
              this,
              'AdminSecurityHeaders',
              {
                responseHeadersPolicyName: 'AdminSecurityHeaders',
                comment: 'Security headers for admin responses',
                securityHeadersBehavior: {
                  contentSecurityPolicy: {
                    override: true,
                    contentSecurityPolicy:
                      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",
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
                    frameOption: cloudfront.HeadersFrameOption.SAMEORIGIN,
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
                      header: 'Cache-Control',
                      value: 'no-cache, no-store, must-revalidate',
                      override: true,
                    },
                    {
                      header: 'X-Admin-Route',
                      value: 'true',
                      override: true,
                    },
                  ],
                },
              }
            ),
          },
          // WordPress REST API routes - REMOVED for direct access
          // Direct access to api.cowboykimono.com for better performance and CORS handling
          // WordPress Redis caching provides better performance than CloudFront for API
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
    // Note: api.cowboykimono.com and admin.cowboykimono.com CloudFront distributions exist but are managed manually
    // admin.cowboykimono.com Distribution ID: ESC0JXOXVWX4J
    // To fix the WordPress admin login issue, manually update the origin configuration
    // to remove X-Forwarded-Host headers and set origin to wp-origin.cowboykimono.com
    // Note: admin.cowboykimono.com CloudFront distribution exists but is managed manually
    // Distribution ID: ESC0JXOXVWX4J
    // To fix the WordPress admin login issue, manually update the origin configuration
    // to remove X-Forwarded-Host headers and set origin to wp-origin.cowboykimono.com
    // Main site CloudFront (Amplify managed)
    // This is handled by Amplify automatically
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
exports.WordPressBlogStack = WordPressBlogStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNkay1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF3cy1jZGstc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUN6RCx5REFBeUQ7QUFDekQsOERBQThEO0FBQzlELHlEQUF5RDtBQUN6RCx3RUFBd0U7QUFDeEUsMkNBQTJDO0FBQzNDLGlEQUFpRDtBQUNqRCw2Q0FBNkM7QUFDN0MseUNBQXlDO0FBQ3pDLDJDQUEyQztBQUczQyxNQUFhLGtCQUFtQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQy9DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsbUVBQW1FO1FBQ25FLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUMvQyxJQUFJLEVBQ0osMEJBQTBCLEVBQzFCO1lBQ0UsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsMkJBQTJCLENBQUM7WUFDeEQsV0FBVyxFQUFFO2dCQUNYLFFBQVEsRUFBRSxZQUFZO2dCQUN0QixpQkFBaUIsRUFBRSw4QkFBOEI7Z0JBQ2pELG1CQUFtQixFQUFFLGdDQUFnQztnQkFDckQsNEJBQTRCO2dCQUM1QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsbUJBQW1CLEVBQUUsR0FBRzthQUN6QjtZQUNELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsVUFBVSxFQUFFLElBQUksRUFBRSxtQ0FBbUM7WUFDckQsWUFBWSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUTtZQUN6QyxXQUFXLEVBQUUsMERBQTBEO1lBQ3ZFLGNB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LEVBQUUsb0JBQW9CLEVBQUU7WUFDNUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDLFlBQVk7WUFDekMsV0FBVyxFQUFFLHNDQUFzQztTQUNwRCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxXQUFXO1lBQ3hDLFdBQVcsRUFBRSxxQ0FBcUM7U0FDbkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxRQUFRO1lBQzFCLFdBQVcsRUFBRSwwQkFBMEI7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUNsRCxLQUFLLEVBQUUsb0JBQW9CLENBQUMsYUFBYTtZQUN6QyxXQUFXLEVBQUUsb0NBQW9DO1NBQ2xELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDckQsS0FBSyxFQUFFLHVCQUF1QixDQUFDLGFBQWE7WUFDNUMsV0FBVyxFQUFFLHNDQUFzQztTQUNwRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE3dEJELGdEQTZ0QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2hBY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBjbGFzcyBXb3JkUHJlc3NCbG9nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBSZWNvbW1lbmRhdGlvbnMgTGFtYmRhIEZ1bmN0aW9uICh1cGRhdGVkIGZvciBXb3JkUHJlc3MgUkVTVCBBUEkpXG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICAnV29yZFByZXNzUmVjb21tZW5kYXRpb25zJyxcbiAgICAgIHtcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9sYW1iZGEvcmVjb21tZW5kYXRpb25zJyksXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgTk9ERV9FTlY6ICdwcm9kdWN0aW9uJyxcbiAgICAgICAgICBXT1JEUFJFU1NfQVBJX1VSTDogJ2h0dHBzOi8vYXBpLmNvd2JveWtpbW9uby5jb20nLFxuICAgICAgICAgIFdPUkRQUkVTU19BRE1JTl9VUkw6ICdodHRwczovL2FkbWluLmNvd2JveWtpbW9uby5jb20nLFxuICAgICAgICAgIC8vIEFkZCBjYWNoaW5nIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICBDQUNIRV9UVEw6ICczMDAnLFxuICAgICAgICAgIE1BWF9SRUNPTU1FTkRBVElPTlM6ICc1JyxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgICBtZW1vcnlTaXplOiAxMDI0LCAvLyBJbmNyZWFzZWQgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAgICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdXb3JkUHJlc3MgcmVjb21tZW5kYXRpb25zIExhbWJkYSBmdW5jdGlvbiB1c2luZyBSRVNUIEFQSScsXG4gICAgICAgIC8vIEFkZCB0cmFjaW5nXG4gICAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQWRkIENsb3VkV2F0Y2ggcGVybWlzc2lvbnMgZm9yIG1vbml0b3JpbmdcbiAgICByZWNvbW1lbmRhdGlvbnNMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnY2xvdWR3YXRjaDpQdXRNZXRyaWNEYXRhJyxcbiAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdXb3JkUHJlc3NBUEknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ1dvcmRQcmVzcyBSRVNUIEFQSScsXG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgJ0FQSSBHYXRld2F5IGZvciBXb3JkUHJlc3MgUkVTVCBBUEkgYW5kIExhbWJkYSBmdW5jdGlvbnMgKExpZ2h0c2FpbC1iYXNlZCknLFxuICAgICAgLy8gRGlzYWJsZSBkZWZhdWx0IENPUlMgdG8gdXNlIGV4cGxpY2l0IE9QVElPTlMgbWV0aG9kXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHVuZGVmaW5lZCxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiAncHJvZCcsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuT0ZGLCAvLyBEaXNhYmxlIGxvZ2dpbmcgdG8gYXZvaWQgQ2xvdWRXYXRjaCBpc3N1ZXNcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogZmFsc2UsIC8vIENvc3Qgb3B0aW1pemF0aW9uOiBkaXNhYmxlIGRhdGEgdHJhY2luZ1xuICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDEwMCxcbiAgICAgICAgdGhyb3R0bGluZ1JhdGVMaW1pdDogNTAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIGVuZHBvaW50XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgncmVjb21tZW5kYXRpb25zJyk7XG4gICAgcmVjb21tZW5kYXRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFxuICAgICAgJ1BPU1QnLFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVjb21tZW5kYXRpb25zTGFtYmRhLCB7XG4gICAgICAgIHByb3h5OiB0cnVlLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQWRkIE9QVElPTlMgbWV0aG9kIHRoYXQgZ29lcyB0byB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgcmVjb21tZW5kYXRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFxuICAgICAgJ09QVElPTlMnLFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVjb21tZW5kYXRpb25zTGFtYmRhLCB7XG4gICAgICAgIHByb3h5OiB0cnVlLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gRW5oYW5jZWQgQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gd2l0aCBTZWN1cml0eSBIZWFkZXJzIGFuZCBPcHRpbWl6YXRpb25zXG4gICAgY29uc3QgY2xvdWRmcm9udERpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbihcbiAgICAgIHRoaXMsXG4gICAgICAnV29yZFByZXNzRGlzdHJpYnV0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKCdhcGkuY293Ym95a2ltb25vLmNvbScsIHtcbiAgICAgICAgICAgIHByb3RvY29sUG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblByb3RvY29sUG9saWN5LkhUVFBTX09OTFksXG4gICAgICAgICAgICBvcmlnaW5TaGllbGRSZWdpb246IHRoaXMucmVnaW9uLFxuICAgICAgICAgICAgY3VzdG9tSGVhZGVyczoge1xuICAgICAgICAgICAgICAnWC1Gb3J3YXJkZWQtSG9zdCc6ICdhcGkuY293Ym95a2ltb25vLmNvbScsXG4gICAgICAgICAgICAgICdYLUNsb3VkRnJvbnQtT3JpZ2luJzogJ2FwaScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OlxuICAgICAgICAgICAgY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RQb2xpY3kuQUxMX1ZJRVdFUixcbiAgICAgICAgICAvLyBBZGQgc2VjdXJpdHkgaGVhZGVyc1xuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeTogbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICdTZWN1cml0eUhlYWRlcnMnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3lOYW1lOiAnU2VjdXJpdHlIZWFkZXJzJyxcbiAgICAgICAgICAgICAgY29tbWVudDogJ1NlY3VyaXR5IGhlYWRlcnMgZm9yIGFsbCByZXNwb25zZXMnLFxuICAgICAgICAgICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRTZWN1cml0eVBvbGljeToge1xuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6XG4gICAgICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgaHR0cHM6Ly93d3cuZ29vZ2xldGFnbWFuYWdlci5jb20gaHR0cHM6Ly93d3cuZ29vZ2xlLWFuYWx5dGljcy5jb207IHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnIGh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb207IGZvbnQtc3JjICdzZWxmJyBodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tOyBpbWctc3JjICdzZWxmJyBkYXRhOiBodHRwczogYmxvYjo7IG1lZGlhLXNyYyAnc2VsZicgaHR0cHM6OyBjb25uZWN0LXNyYyAnc2VsZicgaHR0cHM6Ly9hcGkuY293Ym95a2ltb25vLmNvbSBodHRwczovL3d3dy5nb29nbGUtYW5hbHl0aWNzLmNvbSBodHRwczovLyouZXhlY3V0ZS1hcGkudXMtZWFzdC0xLmFtYXpvbmF3cy5jb207IGZyYW1lLXNyYyAnc2VsZicgaHR0cHM6Ly93d3cuZ29vZ2xldGFnbWFuYWdlci5jb207IG9iamVjdC1zcmMgJ25vbmUnOyBiYXNlLXVyaSAnc2VsZic7IGZvcm0tYWN0aW9uICdzZWxmJztcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7XG4gICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIGFjY2Vzc0NvbnRyb2xNYXhBZ2U6IGNkay5EdXJhdGlvbi5kYXlzKDIgKiAzNjUpLFxuICAgICAgICAgICAgICAgICAgaW5jbHVkZVN1YmRvbWFpbnM6IHRydWUsXG4gICAgICAgICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGVPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZyYW1lT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICBmcmFtZU9wdGlvbjogY2xvdWRmcm9udC5IZWFkZXJzRnJhbWVPcHRpb24uREVOWSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OlxuICAgICAgICAgICAgICAgICAgICBjbG91ZGZyb250LkhlYWRlcnNSZWZlcnJlclBvbGljeVxuICAgICAgICAgICAgICAgICAgICAgIC5TVFJJQ1RfT1JJR0lOX1dIRU5fQ1JPU1NfT1JJR0lOLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeHNzUHJvdGVjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICBwcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgbW9kZUJsb2NrOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnM6IFtcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnUGVybWlzc2lvbnMtUG9saWN5JyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6XG4gICAgICAgICAgICAgICAgICAgICAgJ2NhbWVyYT0oKSwgbWljcm9waG9uZT0oKSwgZ2VvbG9jYXRpb249KCksIHBheW1lbnQ9KCknLFxuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcjogJ0Nyb3NzLU9yaWdpbi1FbWJlZGRlci1Qb2xpY3knLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3JlcXVpcmUtY29ycCcsXG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnQ3Jvc3MtT3JpZ2luLU9wZW5lci1Qb2xpY3knLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3NhbWUtb3JpZ2luJyxcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6ICdDcm9zcy1PcmlnaW4tUmVzb3VyY2UtUG9saWN5JyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICksXG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQUQsXG4gICAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFELFxuICAgICAgICB9LFxuICAgICAgICBhZGRpdGlvbmFsQmVoYXZpb3JzOiB7XG4gICAgICAgICAgLy8gTmV4dC5qcyBBUEkgcm91dGVzIChhbmFseXRpY3MsIGV0Yy4pIC0gcm91dGUgdG8gQVBJIEdhdGV3YXlcbiAgICAgICAgICAnL2FwaS8qJzoge1xuICAgICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKFxuICAgICAgICAgICAgICBgJHthcGkucmVzdEFwaUlkfS5leGVjdXRlLWFwaS4ke3RoaXMucmVnaW9ufS5hbWF6b25hd3MuY29tYCxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHByb3RvY29sUG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblByb3RvY29sUG9saWN5LkhUVFBTX09OTFksXG4gICAgICAgICAgICAgICAgb3JpZ2luUGF0aDogJy9wcm9kJywgLy8gQWRkIHRoZSBBUEkgR2F0ZXdheSBzdGFnZSBwYXRoXG4gICAgICAgICAgICAgICAgY3VzdG9tSGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgJ1gtRm9yd2FyZGVkLUhvc3QnOiAnY293Ym95a2ltb25vLmNvbScsXG4gICAgICAgICAgICAgICAgICAnWC1DbG91ZEZyb250LU9yaWdpbic6ICdhbXBsaWZ5JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6XG4gICAgICAgICAgICAgIGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX0RJU0FCTEVELFxuICAgICAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5SZXF1ZXN0UG9saWN5LkFMTF9WSUVXRVIsXG4gICAgICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19BTEwsIC8vIEFsbG93IFBPU1QgbWV0aG9kc1xuICAgICAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFELFxuICAgICAgICAgICAgLy8gQWRkIENPUlMgaGVhZGVycyBmb3IgQVBJIHJvdXRlc1xuICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5OiBuZXcgY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3koXG4gICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICdBUElTZWN1cml0eUhlYWRlcnMnLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5TmFtZTogJ0FQSVNlY3VyaXR5SGVhZGVycycsXG4gICAgICAgICAgICAgICAgY29tbWVudDogJ1NlY3VyaXR5IGhlYWRlcnMgZm9yIEFQSSByZXNwb25zZXMgd2l0aCBDT1JTJyxcbiAgICAgICAgICAgICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgICAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6XG4gICAgICAgICAgICAgICAgICAgICAgXCJkZWZhdWx0LXNyYyAnc2VsZic7IHNjcmlwdC1zcmMgJ25vbmUnOyBzdHlsZS1zcmMgJ25vbmUnO1wiLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NDb250cm9sTWF4QWdlOiBjZGsuRHVyYXRpb24uZGF5cygyICogMzY1KSxcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZVN1YmRvbWFpbnM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHByZWxvYWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgY29udGVudFR5cGVPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGZyYW1lT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVPcHRpb246IGNsb3VkZnJvbnQuSGVhZGVyc0ZyYW1lT3B0aW9uLkRFTlksXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k6IHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OlxuICAgICAgICAgICAgICAgICAgICAgIGNsb3VkZnJvbnQuSGVhZGVyc1JlZmVycmVyUG9saWN5XG4gICAgICAgICAgICAgICAgICAgICAgICAuU1RSSUNUX09SSUdJTl9XSEVOX0NST1NTX09SSUdJTixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB4c3NQcm90ZWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtb2RlQmxvY2s6IHRydWUsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY3VzdG9tSGVhZGVyc0JlaGF2aW9yOiB7XG4gICAgICAgICAgICAgICAgICBjdXN0b21IZWFkZXJzOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBoZWFkZXI6ICdDYWNoZS1Db250cm9sJyxcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ25vLWNhY2hlLCBuby1zdG9yZSwgbXVzdC1yZXZhbGlkYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vIFdvcmRQcmVzcyBhZG1pbiByb3V0ZXNcbiAgICAgICAgICAnL3dwLWFkbWluLyonOiB7XG4gICAgICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLkh0dHBPcmlnaW4oJ2FkbWluLmNvd2JveWtpbW9uby5jb20nLCB7XG4gICAgICAgICAgICAgIHByb3RvY29sUG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblByb3RvY29sUG9saWN5LkhUVFBTX09OTFksXG4gICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnWC1Gb3J3YXJkZWQtSG9zdCc6ICdhZG1pbi5jb3dib3lraW1vbm8uY29tJyxcbiAgICAgICAgICAgICAgICAnWC1DbG91ZEZyb250LU9yaWdpbic6ICdhZG1pbicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OlxuICAgICAgICAgICAgICBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19ESVNBQkxFRCxcbiAgICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSLFxuICAgICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfQUxMLFxuICAgICAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFELFxuICAgICAgICAgICAgLy8gQWRkIHNlY3VyaXR5IGhlYWRlcnMgZm9yIGFkbWluIHJvdXRlc1xuICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5OiBuZXcgY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3koXG4gICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICdBZG1pblNlY3VyaXR5SGVhZGVycycsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3lOYW1lOiAnQWRtaW5TZWN1cml0eUhlYWRlcnMnLFxuICAgICAgICAgICAgICAgIGNvbW1lbnQ6ICdTZWN1cml0eSBoZWFkZXJzIGZvciBhZG1pbiByZXNwb25zZXMnLFxuICAgICAgICAgICAgICAgIHNlY3VyaXR5SGVhZGVyc0JlaGF2aW9yOiB7XG4gICAgICAgICAgICAgICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6IHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRTZWN1cml0eVBvbGljeTpcbiAgICAgICAgICAgICAgICAgICAgICBcImRlZmF1bHQtc3JjICdzZWxmJzsgc2NyaXB0LXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnICd1bnNhZmUtZXZhbCc7IHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnOyBpbWctc3JjICdzZWxmJyBkYXRhOiBodHRwczo7IGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczo7IGZyYW1lLXNyYyAnc2VsZic7IG9iamVjdC1zcmMgJ25vbmUnOyBiYXNlLXVyaSAnc2VsZic7IGZvcm0tYWN0aW9uICdzZWxmJztcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBzdHJpY3RUcmFuc3BvcnRTZWN1cml0eToge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzQ29udHJvbE1heEFnZTogY2RrLkR1cmF0aW9uLmRheXMoMiAqIDM2NSksXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVTdWJkb21haW5zOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBmcmFtZU9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lT3B0aW9uOiBjbG91ZGZyb250LkhlYWRlcnNGcmFtZU9wdGlvbi5TQU1FT1JJR0lOLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeTpcbiAgICAgICAgICAgICAgICAgICAgICBjbG91ZGZyb250LkhlYWRlcnNSZWZlcnJlclBvbGljeVxuICAgICAgICAgICAgICAgICAgICAgICAgLlNUUklDVF9PUklHSU5fV0hFTl9DUk9TU19PUklHSU4sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgeHNzUHJvdGVjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbW9kZUJsb2NrOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgICAgICAgICAgY3VzdG9tSGVhZGVyczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnQ2FjaGUtQ29udHJvbCcsXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICduby1jYWNoZSwgbm8tc3RvcmUsIG11c3QtcmV2YWxpZGF0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBoZWFkZXI6ICdYLUFkbWluLVJvdXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3RydWUnLFxuICAgICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgLy8gV29yZFByZXNzIFJFU1QgQVBJIHJvdXRlcyAtIFJFTU9WRUQgZm9yIGRpcmVjdCBhY2Nlc3NcbiAgICAgICAgICAvLyBEaXJlY3QgYWNjZXNzIHRvIGFwaS5jb3dib3lraW1vbm8uY29tIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UgYW5kIENPUlMgaGFuZGxpbmdcbiAgICAgICAgICAvLyBXb3JkUHJlc3MgUmVkaXMgY2FjaGluZyBwcm92aWRlcyBiZXR0ZXIgcGVyZm9ybWFuY2UgdGhhbiBDbG91ZEZyb250IGZvciBBUElcbiAgICAgICAgfSxcbiAgICAgICAgLy8gQWRkIGVycm9yIHBhZ2VzXG4gICAgICAgIGVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnLzQwNCcsXG4gICAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnLzQwNCcsXG4gICAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaHR0cFN0YXR1czogNTAwLFxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnLzUwMCcsXG4gICAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaHR0cFN0YXR1czogNTAyLFxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnLzUwMCcsXG4gICAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaHR0cFN0YXR1czogNTAzLFxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnLzUwMCcsXG4gICAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIC8vIEFkZCBwcmljZSBjbGFzcyBmb3IgY29zdCBvcHRpbWl6YXRpb25cbiAgICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcbiAgICAgICAgLy8gQWRkIGxvZ2dpbmcgd2l0aCBwcm9wZXIgYnVja2V0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgZW5hYmxlTG9nZ2luZzogdHJ1ZSxcbiAgICAgICAgbG9nQnVja2V0OiBuZXcgczMuQnVja2V0KHRoaXMsICdDbG91ZEZyb250TG9ncycsIHtcbiAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxuICAgICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgICAgIHZlcnNpb25lZDogZmFsc2UsXG4gICAgICAgICAgb2JqZWN0T3duZXJzaGlwOiBzMy5PYmplY3RPd25lcnNoaXAuQlVDS0VUX09XTkVSX1BSRUZFUlJFRCxcbiAgICAgICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ0xvZ1JldGVudGlvbicsXG4gICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDYwKSxcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5JTkZSRVFVRU5UX0FDQ0VTUyxcbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICBjb21tZW50OiAnQ293Ym95IEtpbW9ubyBXb3JkUHJlc3MgRGlzdHJpYnV0aW9uIHdpdGggRW5oYW5jZWQgU2VjdXJpdHknLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBOb3RlOiBhcGkuY293Ym95a2ltb25vLmNvbSBhbmQgYWRtaW4uY293Ym95a2ltb25vLmNvbSBDbG91ZEZyb250IGRpc3RyaWJ1dGlvbnMgZXhpc3QgYnV0IGFyZSBtYW5hZ2VkIG1hbnVhbGx5XG4gICAgLy8gYWRtaW4uY293Ym95a2ltb25vLmNvbSBEaXN0cmlidXRpb24gSUQ6IEVTQzBKWE9YVldYNEpcbiAgICAvLyBUbyBmaXggdGhlIFdvcmRQcmVzcyBhZG1pbiBsb2dpbiBpc3N1ZSwgbWFudWFsbHkgdXBkYXRlIHRoZSBvcmlnaW4gY29uZmlndXJhdGlvblxuICAgIC8vIHRvIHJlbW92ZSBYLUZvcndhcmRlZC1Ib3N0IGhlYWRlcnMgYW5kIHNldCBvcmlnaW4gdG8gd3Atb3JpZ2luLmNvd2JveWtpbW9uby5jb21cblxuICAgIC8vIE5vdGU6IGFkbWluLmNvd2JveWtpbW9uby5jb20gQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gZXhpc3RzIGJ1dCBpcyBtYW5hZ2VkIG1hbnVhbGx5XG4gICAgLy8gRGlzdHJpYnV0aW9uIElEOiBFU0MwSlhPWFZXWDRKXG4gICAgLy8gVG8gZml4IHRoZSBXb3JkUHJlc3MgYWRtaW4gbG9naW4gaXNzdWUsIG1hbnVhbGx5IHVwZGF0ZSB0aGUgb3JpZ2luIGNvbmZpZ3VyYXRpb25cbiAgICAvLyB0byByZW1vdmUgWC1Gb3J3YXJkZWQtSG9zdCBoZWFkZXJzIGFuZCBzZXQgb3JpZ2luIHRvIHdwLW9yaWdpbi5jb3dib3lraW1vbm8uY29tXG5cbiAgICAvLyBNYWluIHNpdGUgQ2xvdWRGcm9udCAoQW1wbGlmeSBtYW5hZ2VkKVxuICAgIC8vIFRoaXMgaXMgaGFuZGxlZCBieSBBbXBsaWZ5IGF1dG9tYXRpY2FsbHlcblxuICAgIC8vIENsb3VkV2F0Y2ggQWxhcm1zIGZvciBtb25pdG9yaW5nXG4gICAgY29uc3QgbGFtYmRhRXJyb3JBbGFybSA9IG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICB0aGlzLFxuICAgICAgJ0xhbWJkYUVycm9yQWxhcm0nLFxuICAgICAge1xuICAgICAgICBtZXRyaWM6IHJlY29tbWVuZGF0aW9uc0xhbWJkYS5tZXRyaWNFcnJvcnMoKSxcbiAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0xhbWJkYSBmdW5jdGlvbiBlcnJvcnMgZXhjZWVkZWQgdGhyZXNob2xkJyxcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS1lcnJvcnMnLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBsYW1iZGFEdXJhdGlvbkFsYXJtID0gbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybShcbiAgICAgIHRoaXMsXG4gICAgICAnTGFtYmRhRHVyYXRpb25BbGFybScsXG4gICAgICB7XG4gICAgICAgIG1ldHJpYzogcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY0R1cmF0aW9uKCksXG4gICAgICAgIHRocmVzaG9sZDogMjUwMDAsIC8vIDI1IHNlY29uZHNcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZHVyYXRpb24gZXhjZWVkZWQgdGhyZXNob2xkJyxcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS1kdXJhdGlvbicsXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IGxhbWJkYVRocm90dGxlQWxhcm0gPSBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkFsYXJtKFxuICAgICAgdGhpcyxcbiAgICAgICdMYW1iZGFUaHJvdHRsZUFsYXJtJyxcbiAgICAgIHtcbiAgICAgICAgbWV0cmljOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljVGhyb3R0bGVzKCksXG4gICAgICAgIHRocmVzaG9sZDogMSxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gdGhyb3R0bGVzIGRldGVjdGVkJyxcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS10aHJvdHRsZXMnLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBTTlMgVG9waWMgZm9yIGFsZXJ0c1xuICAgIGNvbnN0IGFsZXJ0VG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdBbGVydFRvcGljJywge1xuICAgICAgdG9waWNOYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWFsZXJ0cycsXG4gICAgICBkaXNwbGF5TmFtZTogJ1dvcmRQcmVzcyBCbG9nIFN0YWNrIEFsZXJ0cycsXG4gICAgfSk7XG5cbiAgICAvLyBDb25uZWN0IGFsYXJtcyB0byBTTlMgdG9waWNcbiAgICBsYW1iZGFFcnJvckFsYXJtLmFkZEFsYXJtQWN0aW9uKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKVxuICAgICk7XG4gICAgbGFtYmRhRHVyYXRpb25BbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYylcbiAgICApO1xuICAgIGxhbWJkYVRocm90dGxlQWxhcm0uYWRkQWxhcm1BY3Rpb24oXG4gICAgICBuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKGFsZXJ0VG9waWMpXG4gICAgKTtcblxuICAgIC8vIENsb3VkV2F0Y2ggRGFzaGJvYXJkcyBmb3IgbW9uaXRvcmluZ1xuICAgIGNvbnN0IGFwcGxpY2F0aW9uRGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKFxuICAgICAgdGhpcyxcbiAgICAgICdBcHBsaWNhdGlvbkRhc2hib2FyZCcsXG4gICAgICB7XG4gICAgICAgIGRhc2hib2FyZE5hbWU6ICdDb3dib3lLaW1vbm8tcHJvZHVjdGlvbi1hcHBsaWNhdGlvbi1tZXRyaWNzJyxcbiAgICAgICAgd2lkZ2V0czogW1xuICAgICAgICAgIC8vIExhbWJkYSBNZXRyaWNzXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgICAgICB0aXRsZTogJ0xhbWJkYSBGdW5jdGlvbiBNZXRyaWNzJyxcbiAgICAgICAgICAgICAgbGVmdDogW1xuICAgICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uc0xhbWJkYS5tZXRyaWNJbnZvY2F0aW9ucygpLFxuICAgICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uc0xhbWJkYS5tZXRyaWNFcnJvcnMoKSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljRHVyYXRpb24oKSxcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljVGhyb3R0bGVzKCksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIEFQSSBHYXRld2F5IE1ldHJpY3NcbiAgICAgICAgICBbXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgICAgIHRpdGxlOiAnQVBJIEdhdGV3YXkgTWV0cmljcycsXG4gICAgICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NvdW50JyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlOYW1lOiBhcGkucmVzdEFwaUlkIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICc1WFhFcnJvcicsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQXBpTmFtZTogYXBpLnJlc3RBcGlJZCB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByaWdodDogW1xuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnTGF0ZW5jeScsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaS5yZXN0QXBpSWQgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJzRYWEVycm9yJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlOYW1lOiBhcGkucmVzdEFwaUlkIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIENsb3VkRnJvbnQgTWV0cmljc1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdDbG91ZEZyb250IE1ldHJpY3MnLFxuICAgICAgICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXF1ZXN0cycsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgRGlzdHJpYnV0aW9uSWQ6IGNsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIFJlZ2lvbjogJ0dsb2JhbCcsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JSYXRlJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgRGlzdHJpYnV0aW9uSWQ6IGNsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIFJlZ2lvbjogJ0dsb2JhbCcsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByaWdodDogW1xuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ2FjaGVIaXRSYXRlJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgRGlzdHJpYnV0aW9uSWQ6IGNsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIFJlZ2lvbjogJ0dsb2JhbCcsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQnl0ZXNEb3dubG9hZGVkJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICAgICAgICBEaXN0cmlidXRpb25JZDogY2xvdWRmcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgUmVnaW9uOiAnR2xvYmFsJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIEN1c3RvbSBBcHBsaWNhdGlvbiBNZXRyaWNzXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgICAgICB0aXRsZTogJ0N1c3RvbSBBcHBsaWNhdGlvbiBNZXRyaWNzJyxcbiAgICAgICAgICAgICAgbGVmdDogW1xuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdXb3JkUHJlc3MvQVBJJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdBUElDYWxsQ291bnQnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9BUEknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0FQSUNhbGxEdXJhdGlvbicsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHJpZ2h0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0xhbWJkYS9BUEknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ1JlcXVlc3RDb3VudCcsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnTGFtYmRhL0FQSScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnUmVzcG9uc2VUaW1lJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLy8gQ2FjaGUgTWV0cmljc1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdDYWNoZSBQZXJmb3JtYW5jZScsXG4gICAgICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0NhY2hlJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZUhpdCcsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0NhY2hlJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZU1pc3MnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHJpZ2h0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9DYWNoZScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ2FjaGVPcGVyYXRpb25EdXJhdGlvbicsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBJbmZyYXN0cnVjdHVyZSBIZWFsdGggRGFzaGJvYXJkXG4gICAgY29uc3QgaW5mcmFzdHJ1Y3R1cmVEYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQoXG4gICAgICB0aGlzLFxuICAgICAgJ0luZnJhc3RydWN0dXJlRGFzaGJvYXJkJyxcbiAgICAgIHtcbiAgICAgICAgZGFzaGJvYXJkTmFtZTogJ0Nvd2JveUtpbW9uby1wcm9kdWN0aW9uLWluZnJhc3RydWN0dXJlLWhlYWx0aCcsXG4gICAgICAgIHdpZGdldHM6IFtcbiAgICAgICAgICAvLyBTeXN0ZW0gT3ZlcnZpZXdcbiAgICAgICAgICBbXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5UZXh0V2lkZ2V0KHtcbiAgICAgICAgICAgICAgbWFya2Rvd246IGBcbiMgQ293Ym95IEtpbW9ubyAtIFByb2R1Y3Rpb24gRW52aXJvbm1lbnRcblxuIyMgQXJjaGl0ZWN0dXJlIE92ZXJ2aWV3XG4tICoqRnJvbnRlbmQ6KiogTmV4dC5qcyBvbiBBV1MgQW1wbGlmeVxuLSAqKkJhY2tlbmQ6KiogV29yZFByZXNzIG9uIExpZ2h0c2FpbFxuLSAqKkFQSToqKiBSRVNUIEFQSSB2aWEgV29yZFByZXNzXG4tICoqQ0ROOioqIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uXG4tICoqU2VydmVybGVzczoqKiBMYW1iZGEgRnVuY3Rpb25zXG4tICoqTW9uaXRvcmluZzoqKiBDbG91ZFdhdGNoIERhc2hib2FyZHMgJiBBbGVydHNcblxuIyMgS2V5IEVuZHBvaW50c1xuLSAqKldvcmRQcmVzcyBBUEk6KiogaHR0cHM6Ly9hcGkuY293Ym95a2ltb25vLmNvbVxuLSAqKkxhbWJkYSBGdW5jdGlvbjoqKiAke3JlY29tbWVuZGF0aW9uc0xhbWJkYS5mdW5jdGlvbk5hbWV9XG4tICoqQ2xvdWRGcm9udDoqKiAke2Nsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWR9XG5cbiMjIEFsZXJ0IENvbmZpZ3VyYXRpb25cbi0gTGFtYmRhIGVycm9ycywgZHVyYXRpb24sIGFuZCB0aHJvdHRsZXNcbi0gQVBJIEdhdGV3YXkgNFhYLzVYWCBlcnJvcnMgYW5kIGxhdGVuY3lcbi0gQ2xvdWRGcm9udCBlcnJvciByYXRlIGFuZCBjYWNoZSBwZXJmb3JtYW5jZVxuLSBDdXN0b20gYXBwbGljYXRpb24gbWV0cmljc1xuXG4jIyBSZXNwb25zZSBUaW1lIFRhcmdldHNcbi0gKipBUEkgQ2FsbHM6KiogPCAyIHNlY29uZHNcbi0gKipMYW1iZGEgRnVuY3Rpb25zOioqIDwgMjUgc2Vjb25kc1xuLSAqKlBhZ2UgTG9hZDoqKiA8IDMgc2Vjb25kc1xuLSAqKkNhY2hlIEhpdCBSYXRlOioqID4gODAlXG5cbkxhc3QgVXBkYXRlZDogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG4gICAgICAgICAgICBgLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDgsXG4gICAgICAgICAgICAgIHdpZHRoOiAyNCxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLy8gQWxhcm0gU3RhdHVzXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guQWxhcm1TdGF0dXNXaWRnZXQoe1xuICAgICAgICAgICAgICB0aXRsZTogJ0FsYXJtIFN0YXR1cycsXG4gICAgICAgICAgICAgIGFsYXJtczogW1xuICAgICAgICAgICAgICAgIGxhbWJkYUVycm9yQWxhcm0sXG4gICAgICAgICAgICAgICAgbGFtYmRhRHVyYXRpb25BbGFybSxcbiAgICAgICAgICAgICAgICBsYW1iZGFUaHJvdHRsZUFsYXJtLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICAgICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgIF0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUmVjb21tZW5kYXRpb25zRW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogYCR7YXBpLnVybH1yZWNvbW1lbmRhdGlvbnNgLFxuICAgICAgZGVzY3JpcHRpb246ICdSZWNvbW1lbmRhdGlvbnMgQVBJIEVuZHBvaW50JyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250VVJMJywge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7Y2xvdWRmcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIFVSTCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2xvdWRGcm9udERpc3RyaWJ1dGlvbklkJywge1xuICAgICAgdmFsdWU6IGNsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIElEIGZvciBtZWRpYSBpbnZhbGlkYXRpb24nLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Nsb3VkRnJvbnREb21haW5OYW1lJywge1xuICAgICAgdmFsdWU6IGNsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gRG9tYWluIE5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FyY2hpdGVjdHVyZScsIHtcbiAgICAgIHZhbHVlOiAnTGlnaHRzYWlsIFdvcmRQcmVzcyB3aXRoIE5leHQuanMgRnJvbnRlbmQnLFxuICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IEFyY2hpdGVjdHVyZScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV29yZFByZXNzVVJMJywge1xuICAgICAgdmFsdWU6ICdodHRwczovL2FwaS5jb3dib3lraW1vbm8uY29tJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnV29yZFByZXNzIFJFU1QgQVBJIFVSTCAoTGlnaHRzYWlsKScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV29yZFByZXNzQWRtaW5VUkwnLCB7XG4gICAgICB2YWx1ZTogJ2h0dHBzOi8vYWRtaW4uY293Ym95a2ltb25vLmNvbScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1dvcmRQcmVzcyBBZG1pbiBVUkwgKExpZ2h0c2FpbCknLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xhbWJkYUZ1bmN0aW9uTmFtZScsIHtcbiAgICAgIHZhbHVlOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEuZnVuY3Rpb25OYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdSZWNvbW1lbmRhdGlvbnMgTGFtYmRhIEZ1bmN0aW9uIE5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xhbWJkYUZ1bmN0aW9uQXJuJywge1xuICAgICAgdmFsdWU6IHJlY29tbWVuZGF0aW9uc0xhbWJkYS5mdW5jdGlvbkFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVjb21tZW5kYXRpb25zIExhbWJkYSBGdW5jdGlvbiBBUk4nLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FsZXJ0VG9waWNBcm4nLCB7XG4gICAgICB2YWx1ZTogYWxlcnRUb3BpYy50b3BpY0FybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnU05TIFRvcGljIEFSTiBmb3IgYWxlcnRzJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcHBsaWNhdGlvbkRhc2hib2FyZE5hbWUnLCB7XG4gICAgICB2YWx1ZTogYXBwbGljYXRpb25EYXNoYm9hcmQuZGFzaGJvYXJkTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQXBwbGljYXRpb24gbWV0cmljcyBkYXNoYm9hcmQgbmFtZScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSW5mcmFzdHJ1Y3R1cmVEYXNoYm9hcmROYW1lJywge1xuICAgICAgdmFsdWU6IGluZnJhc3RydWN0dXJlRGFzaGJvYXJkLmRhc2hib2FyZE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0luZnJhc3RydWN0dXJlIGhlYWx0aCBkYXNoYm9hcmQgbmFtZScsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
