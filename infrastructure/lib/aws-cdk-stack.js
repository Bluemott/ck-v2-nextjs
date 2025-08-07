"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordPressBlogStack = void 0;
const cdk = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const cloudwatchActions = require("aws-cdk-lib/aws-cloudwatch-actions");
const iam = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const logs = require("aws-cdk-lib/aws-logs");
const s3 = require("aws-cdk-lib/aws-s3");
const sns = require("aws-cdk-lib/aws-sns");
class WordPressBlogStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Recommendations Lambda Function (updated for WordPress REST API)
        const recommendationsLambda = new lambda.Function(this, 'WordPressRecommendations', {
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
        });
        // Add CloudWatch permissions for monitoring
        recommendationsLambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: ['*'],
        }));
        // API Gateway
        const api = new apigateway.RestApi(this, 'WordPressAPI', {
            restApiName: 'WordPress REST API',
            description: 'API Gateway for WordPress REST API and Lambda functions (Lightsail-based)',
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
        recommendationsResource.addMethod('POST', new apigateway.LambdaIntegration(recommendationsLambda, {
            proxy: true,
        }));
        // Add OPTIONS method that goes to the Lambda function
        recommendationsResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(recommendationsLambda, {
            proxy: true,
        }));
        // Enhanced CloudFront Distribution with Security Headers and Optimizations
        const cloudfrontDistribution = new cloudfront.Distribution(this, 'WordPressDistribution', {
            defaultBehavior: {
                origin: new origins.HttpOrigin('api.cowboykimono.com', {
                    protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                    originShieldRegion: this.region,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                // Add security headers
                responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
                    responseHeadersPolicyName: 'SecurityHeaders',
                    comment: 'Security headers for all responses',
                    securityHeadersBehavior: {
                        contentSecurityPolicy: {
                            override: true,
                            contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https:; connect-src 'self' https://api.cowboykimono.com https://www.google-analytics.com; frame-src 'self' https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self';",
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
                            referrerPolicy: cloudfront.HeadersReferrerPolicy
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
                                value: 'camera=(), microphone=(), geolocation=(), payment=()',
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
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
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
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    // Add security headers for API routes
                    responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'APISecurityHeaders', {
                        responseHeadersPolicyName: 'APISecurityHeaders',
                        comment: 'Security headers for API responses',
                        securityHeadersBehavior: {
                            contentSecurityPolicy: {
                                override: true,
                                contentSecurityPolicy: "default-src 'self'; script-src 'none'; style-src 'none';",
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
                    }),
                },
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
                    // Add security headers for media files
                    responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'MediaSecurityHeaders', {
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
                    }),
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
        });
        // CloudWatch Alarms for monitoring
        const lambdaErrorAlarm = new cdk.aws_cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
            metric: recommendationsLambda.metricErrors(),
            threshold: 1,
            evaluationPeriods: 2,
            alarmDescription: 'Lambda function errors exceeded threshold',
            alarmName: 'WordPressBlogStack-lambda-errors',
        });
        const lambdaDurationAlarm = new cdk.aws_cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
            metric: recommendationsLambda.metricDuration(),
            threshold: 25000, // 25 seconds
            evaluationPeriods: 2,
            alarmDescription: 'Lambda function duration exceeded threshold',
            alarmName: 'WordPressBlogStack-lambda-duration',
        });
        const lambdaThrottleAlarm = new cdk.aws_cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
            metric: recommendationsLambda.metricThrottles(),
            threshold: 1,
            evaluationPeriods: 2,
            alarmDescription: 'Lambda function throttles detected',
            alarmName: 'WordPressBlogStack-lambda-throttles',
        });
        // SNS Topic for alerts
        const alertTopic = new sns.Topic(this, 'AlertTopic', {
            topicName: 'WordPressBlogStack-alerts',
            displayName: 'WordPress Blog Stack Alerts',
        });
        // Connect alarms to SNS topic
        lambdaErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        lambdaDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        lambdaThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        // CloudWatch Dashboards for monitoring
        const applicationDashboard = new cloudwatch.Dashboard(this, 'ApplicationDashboard', {
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
        });
        // Infrastructure Health Dashboard
        const infrastructureDashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNkay1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF3cy1jZGstc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUN6RCx5REFBeUQ7QUFDekQsOERBQThEO0FBQzlELHlEQUF5RDtBQUN6RCx3RUFBd0U7QUFDeEUsMkNBQTJDO0FBQzNDLGlEQUFpRDtBQUNqRCw2Q0FBNkM7QUFDN0MseUNBQXlDO0FBQ3pDLDJDQUEyQztBQUczQyxNQUFhLGtCQUFtQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQy9DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsbUVBQW1FO1FBQ25FLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUMvQyxJQUFJLEVBQ0osMEJBQTBCLEVBQzFCO1lBQ0UsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsMkJBQTJCLENBQUM7WUFDeEQsV0FBVyxFQUFFO2dCQUNYLFFBQVEsRUFBRSxZQUFZO2dCQUN0QixpQkFBaUIsRUFBRSw4QkFBOEI7Z0JBQ2pELG1CQUFtQixFQUFFLGdDQUFnQztnQkFDckQsNEJBQTRCO2dCQUM1QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsbUJBQW1CLEVBQUUsR0FBRzthQUN6QjtZQUNELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsVUFBVSxFQUFFLElBQUksRUFBRSxtQ0FBbUM7WUFDckQsWUFBWSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUTtZQUN6QyxXQUFXLEVBQUUsMERBQTBEO1lBQ3ZFLGNB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SCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxXQUFXO1lBQ3hDLFdBQVcsRUFBRSxxQ0FBcUM7U0FDbkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxRQUFRO1lBQzFCLFdBQVcsRUFBRSwwQkFBMEI7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUNsRCxLQUFLLEVBQUUsb0JBQW9CLENBQUMsYUFBYTtZQUN6QyxXQUFXLEVBQUUsb0NBQW9DO1NBQ2xELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDckQsS0FBSyxFQUFFLHVCQUF1QixDQUFDLGFBQWE7WUFDNUMsV0FBVyxFQUFFLHNDQUFzQztTQUNwRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExcUJELGdEQTBxQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcclxuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XHJcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XHJcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xyXG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoQWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XHJcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xyXG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xyXG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFdvcmRQcmVzc0Jsb2dTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIExhbWJkYSBGdW5jdGlvbiAodXBkYXRlZCBmb3IgV29yZFByZXNzIFJFU1QgQVBJKVxyXG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcclxuICAgICAgdGhpcyxcclxuICAgICAgJ1dvcmRQcmVzc1JlY29tbWVuZGF0aW9ucycsXHJcbiAgICAgIHtcclxuICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcclxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXHJcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9sYW1iZGEvcmVjb21tZW5kYXRpb25zJyksXHJcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgIE5PREVfRU5WOiAncHJvZHVjdGlvbicsXHJcbiAgICAgICAgICBXT1JEUFJFU1NfQVBJX1VSTDogJ2h0dHBzOi8vYXBpLmNvd2JveWtpbW9uby5jb20nLFxyXG4gICAgICAgICAgV09SRFBSRVNTX0FETUlOX1VSTDogJ2h0dHBzOi8vYWRtaW4uY293Ym95a2ltb25vLmNvbScsXHJcbiAgICAgICAgICAvLyBBZGQgY2FjaGluZyBjb25maWd1cmF0aW9uXHJcbiAgICAgICAgICBDQUNIRV9UVEw6ICczMDAnLFxyXG4gICAgICAgICAgTUFYX1JFQ09NTUVOREFUSU9OUzogJzUnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxyXG4gICAgICAgIG1lbW9yeVNpemU6IDEwMjQsIC8vIEluY3JlYXNlZCBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlXHJcbiAgICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdXb3JkUHJlc3MgcmVjb21tZW5kYXRpb25zIExhbWJkYSBmdW5jdGlvbiB1c2luZyBSRVNUIEFQSScsXHJcbiAgICAgICAgLy8gQWRkIHRyYWNpbmdcclxuICAgICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gQWRkIENsb3VkV2F0Y2ggcGVybWlzc2lvbnMgZm9yIG1vbml0b3JpbmdcclxuICAgIHJlY29tbWVuZGF0aW9uc0xhbWJkYS5hZGRUb1JvbGVQb2xpY3koXHJcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAgJ2Nsb3Vkd2F0Y2g6UHV0TWV0cmljRGF0YScsXHJcbiAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXHJcbiAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxyXG4gICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIC8vIEFQSSBHYXRld2F5XHJcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdXb3JkUHJlc3NBUEknLCB7XHJcbiAgICAgIHJlc3RBcGlOYW1lOiAnV29yZFByZXNzIFJFU1QgQVBJJyxcclxuICAgICAgZGVzY3JpcHRpb246XHJcbiAgICAgICAgJ0FQSSBHYXRld2F5IGZvciBXb3JkUHJlc3MgUkVTVCBBUEkgYW5kIExhbWJkYSBmdW5jdGlvbnMgKExpZ2h0c2FpbC1iYXNlZCknLFxyXG4gICAgICAvLyBEaXNhYmxlIGRlZmF1bHQgQ09SUyB0byB1c2UgZXhwbGljaXQgT1BUSU9OUyBtZXRob2RcclxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB1bmRlZmluZWQsXHJcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcclxuICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcclxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLk9GRiwgLy8gRGlzYWJsZSBsb2dnaW5nIHRvIGF2b2lkIENsb3VkV2F0Y2ggaXNzdWVzXHJcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogZmFsc2UsIC8vIENvc3Qgb3B0aW1pemF0aW9uOiBkaXNhYmxlIGRhdGEgdHJhY2luZ1xyXG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiAxMDAsXHJcbiAgICAgICAgdGhyb3R0bGluZ1JhdGVMaW1pdDogNTAsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZWNvbW1lbmRhdGlvbnMgZW5kcG9pbnRcclxuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uc1Jlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3JlY29tbWVuZGF0aW9ucycpO1xyXG4gICAgcmVjb21tZW5kYXRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHJlY29tbWVuZGF0aW9uc0xhbWJkYSwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBBZGQgT1BUSU9OUyBtZXRob2QgdGhhdCBnb2VzIHRvIHRoZSBMYW1iZGEgZnVuY3Rpb25cclxuICAgIHJlY29tbWVuZGF0aW9uc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ09QVElPTlMnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihyZWNvbW1lbmRhdGlvbnNMYW1iZGEsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgLy8gRW5oYW5jZWQgQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gd2l0aCBTZWN1cml0eSBIZWFkZXJzIGFuZCBPcHRpbWl6YXRpb25zXHJcbiAgICBjb25zdCBjbG91ZGZyb250RGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKFxyXG4gICAgICB0aGlzLFxyXG4gICAgICAnV29yZFByZXNzRGlzdHJpYnV0aW9uJyxcclxuICAgICAge1xyXG4gICAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xyXG4gICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKCdhcGkuY293Ym95a2ltb25vLmNvbScsIHtcclxuICAgICAgICAgICAgcHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUFNfT05MWSxcclxuICAgICAgICAgICAgb3JpZ2luU2hpZWxkUmVnaW9uOiB0aGlzLnJlZ2lvbixcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6XHJcbiAgICAgICAgICAgIGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXHJcbiAgICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcclxuICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSLFxyXG4gICAgICAgICAgLy8gQWRkIHNlY3VyaXR5IGhlYWRlcnNcclxuICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeTogbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KFxyXG4gICAgICAgICAgICB0aGlzLFxyXG4gICAgICAgICAgICAnU2VjdXJpdHlIZWFkZXJzJyxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeU5hbWU6ICdTZWN1cml0eUhlYWRlcnMnLFxyXG4gICAgICAgICAgICAgIGNvbW1lbnQ6ICdTZWN1cml0eSBoZWFkZXJzIGZvciBhbGwgcmVzcG9uc2VzJyxcclxuICAgICAgICAgICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xyXG4gICAgICAgICAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OiB7XHJcbiAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6XHJcbiAgICAgICAgICAgICAgICAgICAgXCJkZWZhdWx0LXNyYyAnc2VsZic7IHNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL3d3dy5nb29nbGV0YWdtYW5hZ2VyLmNvbSBodHRwczovL3d3dy5nb29nbGUtYW5hbHl0aWNzLmNvbTsgc3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbTsgZm9udC1zcmMgJ3NlbGYnIGh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb207IGltZy1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOiBibG9iOjsgbWVkaWEtc3JjICdzZWxmJyBodHRwczo7IGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczovL2FwaS5jb3dib3lraW1vbm8uY29tIGh0dHBzOi8vd3d3Lmdvb2dsZS1hbmFseXRpY3MuY29tOyBmcmFtZS1zcmMgJ3NlbGYnIGh0dHBzOi8vd3d3Lmdvb2dsZXRhZ21hbmFnZXIuY29tOyBvYmplY3Qtc3JjICdub25lJzsgYmFzZS11cmkgJ3NlbGYnOyBmb3JtLWFjdGlvbiAnc2VsZic7XCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc3RyaWN0VHJhbnNwb3J0U2VjdXJpdHk6IHtcclxuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIGFjY2Vzc0NvbnRyb2xNYXhBZ2U6IGNkay5EdXJhdGlvbi5kYXlzKDIgKiAzNjUpLFxyXG4gICAgICAgICAgICAgICAgICBpbmNsdWRlU3ViZG9tYWluczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgcHJlbG9hZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjb250ZW50VHlwZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZnJhbWVPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICBmcmFtZU9wdGlvbjogY2xvdWRmcm9udC5IZWFkZXJzRnJhbWVPcHRpb24uREVOWSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeToge1xyXG4gICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k6XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvdWRmcm9udC5IZWFkZXJzUmVmZXJyZXJQb2xpY3lcclxuICAgICAgICAgICAgICAgICAgICAgIC5TVFJJQ1RfT1JJR0lOX1dIRU5fQ1JPU1NfT1JJR0lOLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHhzc1Byb3RlY3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIHByb3RlY3Rpb246IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIG1vZGVCbG9jazogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjdXN0b21IZWFkZXJzQmVoYXZpb3I6IHtcclxuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnM6IFtcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcjogJ1Blcm1pc3Npb25zLVBvbGljeScsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAnY2FtZXJhPSgpLCBtaWNyb3Bob25lPSgpLCBnZW9sb2NhdGlvbj0oKSwgcGF5bWVudD0oKScsXHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6ICdDcm9zcy1PcmlnaW4tRW1iZWRkZXItUG9saWN5JyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3JlcXVpcmUtY29ycCcsXHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6ICdDcm9zcy1PcmlnaW4tT3BlbmVyLVBvbGljeScsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdzYW1lLW9yaWdpbicsXHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6ICdDcm9zcy1PcmlnaW4tUmVzb3VyY2UtUG9saWN5JyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3NhbWUtb3JpZ2luJyxcclxuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFELFxyXG4gICAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFELFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWRkaXRpb25hbEJlaGF2aW9yczoge1xyXG4gICAgICAgICAgJy9hcGkvKic6IHtcclxuICAgICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKFxyXG4gICAgICAgICAgICAgIGAke2FwaS5yZXN0QXBpSWR9LmV4ZWN1dGUtYXBpLiR7dGhpcy5yZWdpb259LmFtYXpvbmF3cy5jb21gLFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHByb3RvY29sUG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblByb3RvY29sUG9saWN5LkhUVFBTX09OTFksXHJcbiAgICAgICAgICAgICAgICBvcmlnaW5QYXRoOiAnL3Byb2QnLCAvLyBBZGQgdGhlIEFQSSBHYXRld2F5IHN0YWdlIHBhdGhcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OlxyXG4gICAgICAgICAgICAgIGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXHJcbiAgICAgICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfRElTQUJMRUQsXHJcbiAgICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSLFxyXG4gICAgICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19BTEwsIC8vIEFsbG93IFBPU1QgbWV0aG9kc1xyXG4gICAgICAgICAgICBjYWNoZWRNZXRob2RzOiBjbG91ZGZyb250LkNhY2hlZE1ldGhvZHMuQ0FDSEVfR0VUX0hFQUQsXHJcbiAgICAgICAgICAgIC8vIEFkZCBzZWN1cml0eSBoZWFkZXJzIGZvciBBUEkgcm91dGVzXHJcbiAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeTogbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KFxyXG4gICAgICAgICAgICAgIHRoaXMsXHJcbiAgICAgICAgICAgICAgJ0FQSVNlY3VyaXR5SGVhZGVycycsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5TmFtZTogJ0FQSVNlY3VyaXR5SGVhZGVycycsXHJcbiAgICAgICAgICAgICAgICBjb21tZW50OiAnU2VjdXJpdHkgaGVhZGVycyBmb3IgQVBJIHJlc3BvbnNlcycsXHJcbiAgICAgICAgICAgICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xyXG4gICAgICAgICAgICAgICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6IHtcclxuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6XHJcbiAgICAgICAgICAgICAgICAgICAgICBcImRlZmF1bHQtc3JjICdzZWxmJzsgc2NyaXB0LXNyYyAnbm9uZSc7IHN0eWxlLXNyYyAnbm9uZSc7XCIsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzQ29udHJvbE1heEFnZTogY2RrLkR1cmF0aW9uLmRheXMoMiAqIDM2NSksXHJcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZVN1YmRvbWFpbnM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJlbG9hZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgY29udGVudFR5cGVPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIGZyYW1lT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lT3B0aW9uOiBjbG91ZGZyb250LkhlYWRlcnNGcmFtZU9wdGlvbi5ERU5ZLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnNCZWhhdmlvcjoge1xyXG4gICAgICAgICAgICAgICAgICBjdXN0b21IZWFkZXJzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnWC1DdXN0b20tQVBJLVZlcnNpb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcxLjAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgICcvd3AtY29udGVudC91cGxvYWRzLyonOiB7XHJcbiAgICAgICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuSHR0cE9yaWdpbignYXBpLmNvd2JveWtpbW9uby5jb20nLCB7XHJcbiAgICAgICAgICAgICAgcHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUFNfT05MWSxcclxuICAgICAgICAgICAgICBvcmlnaW5TaGllbGRSZWdpb246IHRoaXMucmVnaW9uLFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6XHJcbiAgICAgICAgICAgICAgY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcclxuICAgICAgICAgICAgY2FjaGVQb2xpY3k6XHJcbiAgICAgICAgICAgICAgY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRF9GT1JfVU5DT01QUkVTU0VEX09CSkVDVFMsXHJcbiAgICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5DT1JTX1MzX09SSUdJTixcclxuICAgICAgICAgICAgZnVuY3Rpb25Bc3NvY2lhdGlvbnM6IFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbjogbmV3IGNsb3VkZnJvbnQuRnVuY3Rpb24odGhpcywgJ01lZGlhVVJMUmV3cml0ZScsIHtcclxuICAgICAgICAgICAgICAgICAgY29kZTogY2xvdWRmcm9udC5GdW5jdGlvbkNvZGUuZnJvbUlubGluZShgXHJcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVxdWVzdCA9IGV2ZW50LnJlcXVlc3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVyaSA9IHJlcXVlc3QudXJpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJld3JpdGUgbWVkaWEgVVJMcyB0byBpbmNsdWRlIHByb3BlciBoZWFkZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVyaS5zdGFydHNXaXRoKCcvd3AtY29udGVudC91cGxvYWRzLycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ2NhY2hlLWNvbnRyb2wnXSA9IHsgdmFsdWU6ICdwdWJsaWMsIG1heC1hZ2U9MzE1MzYwMDAnIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnNbJ2FjY2Vzcy1jb250cm9sLWFsbG93LW9yaWdpbiddID0geyB2YWx1ZTogJyonIH07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBgKSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgZXZlbnRUeXBlOiBjbG91ZGZyb250LkZ1bmN0aW9uRXZlbnRUeXBlLlZJRVdFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIC8vIEFkZCBzZWN1cml0eSBoZWFkZXJzIGZvciBtZWRpYSBmaWxlc1xyXG4gICAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3k6IG5ldyBjbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeShcclxuICAgICAgICAgICAgICB0aGlzLFxyXG4gICAgICAgICAgICAgICdNZWRpYVNlY3VyaXR5SGVhZGVycycsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5TmFtZTogJ01lZGlhU2VjdXJpdHlIZWFkZXJzJyxcclxuICAgICAgICAgICAgICAgIGNvbW1lbnQ6ICdTZWN1cml0eSBoZWFkZXJzIGZvciBtZWRpYSBmaWxlcycsXHJcbiAgICAgICAgICAgICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xyXG4gICAgICAgICAgICAgICAgICBjb250ZW50VHlwZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjdXN0b21IZWFkZXJzQmVoYXZpb3I6IHtcclxuICAgICAgICAgICAgICAgICAgY3VzdG9tSGVhZGVyczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcjogJ0NhY2hlLUNvbnRyb2wnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdwdWJsaWMsIG1heC1hZ2U9MzE1MzYwMDAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIEFkZCBlcnJvciBwYWdlc1xyXG4gICAgICAgIGVycm9yUmVzcG9uc2VzOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcclxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvNDA0JyxcclxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcclxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvNDA0JyxcclxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDUwMCxcclxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvNTAwJyxcclxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDUwMixcclxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvNTAwJyxcclxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDUwMyxcclxuICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvNTAwJyxcclxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICAvLyBBZGQgcHJpY2UgY2xhc3MgZm9yIGNvc3Qgb3B0aW1pemF0aW9uXHJcbiAgICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcclxuICAgICAgICAvLyBBZGQgbG9nZ2luZyB3aXRoIHByb3BlciBidWNrZXQgY29uZmlndXJhdGlvblxyXG4gICAgICAgIGVuYWJsZUxvZ2dpbmc6IHRydWUsXHJcbiAgICAgICAgbG9nQnVja2V0OiBuZXcgczMuQnVja2V0KHRoaXMsICdDbG91ZEZyb250TG9ncycsIHtcclxuICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXHJcbiAgICAgICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcclxuICAgICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXHJcbiAgICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXHJcbiAgICAgICAgICB2ZXJzaW9uZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgb2JqZWN0T3duZXJzaGlwOiBzMy5PYmplY3RPd25lcnNoaXAuQlVDS0VUX09XTkVSX1BSRUZFUlJFRCxcclxuICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBpZDogJ0xvZ1JldGVudGlvbicsXHJcbiAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cyg2MCksXHJcbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuSU5GUkVRVUVOVF9BQ0NFU1MsXHJcbiAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9KSxcclxuICAgICAgICBjb21tZW50OiAnQ293Ym95IEtpbW9ubyBXb3JkUHJlc3MgRGlzdHJpYnV0aW9uIHdpdGggRW5oYW5jZWQgU2VjdXJpdHknLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIENsb3VkV2F0Y2ggQWxhcm1zIGZvciBtb25pdG9yaW5nXHJcbiAgICBjb25zdCBsYW1iZGFFcnJvckFsYXJtID0gbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybShcclxuICAgICAgdGhpcyxcclxuICAgICAgJ0xhbWJkYUVycm9yQWxhcm0nLFxyXG4gICAgICB7XHJcbiAgICAgICAgbWV0cmljOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljRXJyb3JzKCksXHJcbiAgICAgICAgdGhyZXNob2xkOiAxLFxyXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxyXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZXJyb3JzIGV4Y2VlZGVkIHRocmVzaG9sZCcsXHJcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS1lcnJvcnMnLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGxhbWJkYUR1cmF0aW9uQWxhcm0gPSBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkFsYXJtKFxyXG4gICAgICB0aGlzLFxyXG4gICAgICAnTGFtYmRhRHVyYXRpb25BbGFybScsXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRyaWM6IHJlY29tbWVuZGF0aW9uc0xhbWJkYS5tZXRyaWNEdXJhdGlvbigpLFxyXG4gICAgICAgIHRocmVzaG9sZDogMjUwMDAsIC8vIDI1IHNlY29uZHNcclxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcclxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnTGFtYmRhIGZ1bmN0aW9uIGR1cmF0aW9uIGV4Y2VlZGVkIHRocmVzaG9sZCcsXHJcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS1kdXJhdGlvbicsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgbGFtYmRhVGhyb3R0bGVBbGFybSA9IG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgICdMYW1iZGFUaHJvdHRsZUFsYXJtJyxcclxuICAgICAge1xyXG4gICAgICAgIG1ldHJpYzogcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY1Rocm90dGxlcygpLFxyXG4gICAgICAgIHRocmVzaG9sZDogMSxcclxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcclxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnTGFtYmRhIGZ1bmN0aW9uIHRocm90dGxlcyBkZXRlY3RlZCcsXHJcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS10aHJvdHRsZXMnLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFNOUyBUb3BpYyBmb3IgYWxlcnRzXHJcbiAgICBjb25zdCBhbGVydFRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQWxlcnRUb3BpYycsIHtcclxuICAgICAgdG9waWNOYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWFsZXJ0cycsXHJcbiAgICAgIGRpc3BsYXlOYW1lOiAnV29yZFByZXNzIEJsb2cgU3RhY2sgQWxlcnRzJyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENvbm5lY3QgYWxhcm1zIHRvIFNOUyB0b3BpY1xyXG4gICAgbGFtYmRhRXJyb3JBbGFybS5hZGRBbGFybUFjdGlvbihcclxuICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKVxyXG4gICAgKTtcclxuICAgIGxhbWJkYUR1cmF0aW9uQWxhcm0uYWRkQWxhcm1BY3Rpb24oXHJcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYylcclxuICAgICk7XHJcbiAgICBsYW1iZGFUaHJvdHRsZUFsYXJtLmFkZEFsYXJtQWN0aW9uKFxyXG4gICAgICBuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKGFsZXJ0VG9waWMpXHJcbiAgICApO1xyXG5cclxuICAgIC8vIENsb3VkV2F0Y2ggRGFzaGJvYXJkcyBmb3IgbW9uaXRvcmluZ1xyXG4gICAgY29uc3QgYXBwbGljYXRpb25EYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQoXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgICdBcHBsaWNhdGlvbkRhc2hib2FyZCcsXHJcbiAgICAgIHtcclxuICAgICAgICBkYXNoYm9hcmROYW1lOiAnQ293Ym95S2ltb25vLXByb2R1Y3Rpb24tYXBwbGljYXRpb24tbWV0cmljcycsXHJcbiAgICAgICAgd2lkZ2V0czogW1xyXG4gICAgICAgICAgLy8gTGFtYmRhIE1ldHJpY3NcclxuICAgICAgICAgIFtcclxuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xyXG4gICAgICAgICAgICAgIHRpdGxlOiAnTGFtYmRhIEZ1bmN0aW9uIE1ldHJpY3MnLFxyXG4gICAgICAgICAgICAgIGxlZnQ6IFtcclxuICAgICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uc0xhbWJkYS5tZXRyaWNJbnZvY2F0aW9ucygpLFxyXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY0Vycm9ycygpLFxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcclxuICAgICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uc0xhbWJkYS5tZXRyaWNEdXJhdGlvbigpLFxyXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY1Rocm90dGxlcygpLFxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIC8vIEFQSSBHYXRld2F5IE1ldHJpY3NcclxuICAgICAgICAgIFtcclxuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xyXG4gICAgICAgICAgICAgIHRpdGxlOiAnQVBJIEdhdGV3YXkgTWV0cmljcycsXHJcbiAgICAgICAgICAgICAgbGVmdDogW1xyXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxyXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ291bnQnLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaS5yZXN0QXBpSWQgfSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxyXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnNVhYRXJyb3InLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaS5yZXN0QXBpSWQgfSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcclxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcclxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0xhdGVuY3knLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlOYW1lOiBhcGkucmVzdEFwaUlkIH0sXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcclxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJzRYWEVycm9yJyxcclxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlOYW1lOiBhcGkucmVzdEFwaUlkIH0sXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICAvLyBDbG91ZEZyb250IE1ldHJpY3NcclxuICAgICAgICAgIFtcclxuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xyXG4gICAgICAgICAgICAgIHRpdGxlOiAnQ2xvdWRGcm9udCBNZXRyaWNzJyxcclxuICAgICAgICAgICAgICBsZWZ0OiBbXHJcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXHJcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXF1ZXN0cycsXHJcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcclxuICAgICAgICAgICAgICAgICAgICBEaXN0cmlidXRpb25JZDogY2xvdWRmcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZCxcclxuICAgICAgICAgICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXHJcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdFcnJvclJhdGUnLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxyXG4gICAgICAgICAgICAgICAgICAgIFJlZ2lvbjogJ0dsb2JhbCcsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgIHJpZ2h0OiBbXHJcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXHJcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZUhpdFJhdGUnLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxyXG4gICAgICAgICAgICAgICAgICAgIFJlZ2lvbjogJ0dsb2JhbCcsXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcclxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0J5dGVzRG93bmxvYWRlZCcsXHJcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcclxuICAgICAgICAgICAgICAgICAgICBEaXN0cmlidXRpb25JZDogY2xvdWRmcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZCxcclxuICAgICAgICAgICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgLy8gQ3VzdG9tIEFwcGxpY2F0aW9uIE1ldHJpY3NcclxuICAgICAgICAgIFtcclxuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xyXG4gICAgICAgICAgICAgIHRpdGxlOiAnQ3VzdG9tIEFwcGxpY2F0aW9uIE1ldHJpY3MnLFxyXG4gICAgICAgICAgICAgIGxlZnQ6IFtcclxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9BUEknLFxyXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQVBJQ2FsbENvdW50JyxcclxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0FQSScsXHJcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdBUElDYWxsRHVyYXRpb24nLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcclxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0xhbWJkYS9BUEknLFxyXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnUmVxdWVzdENvdW50JyxcclxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnTGFtYmRhL0FQSScsXHJcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXNwb25zZVRpbWUnLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIC8vIENhY2hlIE1ldHJpY3NcclxuICAgICAgICAgIFtcclxuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xyXG4gICAgICAgICAgICAgIHRpdGxlOiAnQ2FjaGUgUGVyZm9ybWFuY2UnLFxyXG4gICAgICAgICAgICAgIGxlZnQ6IFtcclxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9DYWNoZScsXHJcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZUhpdCcsXHJcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9DYWNoZScsXHJcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZU1pc3MnLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICByaWdodDogW1xyXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0NhY2hlJyxcclxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NhY2hlT3BlcmF0aW9uRHVyYXRpb24nLFxyXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICBdLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEluZnJhc3RydWN0dXJlIEhlYWx0aCBEYXNoYm9hcmRcclxuICAgIGNvbnN0IGluZnJhc3RydWN0dXJlRGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKFxyXG4gICAgICB0aGlzLFxyXG4gICAgICAnSW5mcmFzdHJ1Y3R1cmVEYXNoYm9hcmQnLFxyXG4gICAgICB7XHJcbiAgICAgICAgZGFzaGJvYXJkTmFtZTogJ0Nvd2JveUtpbW9uby1wcm9kdWN0aW9uLWluZnJhc3RydWN0dXJlLWhlYWx0aCcsXHJcbiAgICAgICAgd2lkZ2V0czogW1xyXG4gICAgICAgICAgLy8gU3lzdGVtIE92ZXJ2aWV3XHJcbiAgICAgICAgICBbXHJcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLlRleHRXaWRnZXQoe1xyXG4gICAgICAgICAgICAgIG1hcmtkb3duOiBgXHJcbiMgQ293Ym95IEtpbW9ubyAtIFByb2R1Y3Rpb24gRW52aXJvbm1lbnRcclxuXHJcbiMjIEFyY2hpdGVjdHVyZSBPdmVydmlld1xyXG4tICoqRnJvbnRlbmQ6KiogTmV4dC5qcyBvbiBBV1MgQW1wbGlmeVxyXG4tICoqQmFja2VuZDoqKiBXb3JkUHJlc3Mgb24gTGlnaHRzYWlsXHJcbi0gKipBUEk6KiogUkVTVCBBUEkgdmlhIFdvcmRQcmVzc1xyXG4tICoqQ0ROOioqIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uXHJcbi0gKipTZXJ2ZXJsZXNzOioqIExhbWJkYSBGdW5jdGlvbnNcclxuLSAqKk1vbml0b3Jpbmc6KiogQ2xvdWRXYXRjaCBEYXNoYm9hcmRzICYgQWxlcnRzXHJcblxyXG4jIyBLZXkgRW5kcG9pbnRzXHJcbi0gKipXb3JkUHJlc3MgQVBJOioqIGh0dHBzOi8vYXBpLmNvd2JveWtpbW9uby5jb21cclxuLSAqKkxhbWJkYSBGdW5jdGlvbjoqKiAke3JlY29tbWVuZGF0aW9uc0xhbWJkYS5mdW5jdGlvbk5hbWV9XHJcbi0gKipDbG91ZEZyb250OioqICR7Y2xvdWRmcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZH1cclxuXHJcbiMjIEFsZXJ0IENvbmZpZ3VyYXRpb25cclxuLSBMYW1iZGEgZXJyb3JzLCBkdXJhdGlvbiwgYW5kIHRocm90dGxlc1xyXG4tIEFQSSBHYXRld2F5IDRYWC81WFggZXJyb3JzIGFuZCBsYXRlbmN5XHJcbi0gQ2xvdWRGcm9udCBlcnJvciByYXRlIGFuZCBjYWNoZSBwZXJmb3JtYW5jZVxyXG4tIEN1c3RvbSBhcHBsaWNhdGlvbiBtZXRyaWNzXHJcblxyXG4jIyBSZXNwb25zZSBUaW1lIFRhcmdldHNcclxuLSAqKkFQSSBDYWxsczoqKiA8IDIgc2Vjb25kc1xyXG4tICoqTGFtYmRhIEZ1bmN0aW9uczoqKiA8IDI1IHNlY29uZHNcclxuLSAqKlBhZ2UgTG9hZDoqKiA8IDMgc2Vjb25kc1xyXG4tICoqQ2FjaGUgSGl0IFJhdGU6KiogPiA4MCVcclxuXHJcbkxhc3QgVXBkYXRlZDogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XHJcbiAgICAgICAgICAgIGAsXHJcbiAgICAgICAgICAgICAgaGVpZ2h0OiA4LFxyXG4gICAgICAgICAgICAgIHdpZHRoOiAyNCxcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgLy8gQWxhcm0gU3RhdHVzXHJcbiAgICAgICAgICBbXHJcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkFsYXJtU3RhdHVzV2lkZ2V0KHtcclxuICAgICAgICAgICAgICB0aXRsZTogJ0FsYXJtIFN0YXR1cycsXHJcbiAgICAgICAgICAgICAgYWxhcm1zOiBbXHJcbiAgICAgICAgICAgICAgICBsYW1iZGFFcnJvckFsYXJtLFxyXG4gICAgICAgICAgICAgICAgbGFtYmRhRHVyYXRpb25BbGFybSxcclxuICAgICAgICAgICAgICAgIGxhbWJkYVRocm90dGxlQWxhcm0sXHJcbiAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICBoZWlnaHQ6IDYsXHJcbiAgICAgICAgICAgICAgd2lkdGg6IDEyLFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBPdXRwdXRzXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUmVjb21tZW5kYXRpb25zRW5kcG9pbnQnLCB7XHJcbiAgICAgIHZhbHVlOiBgJHthcGkudXJsfXJlY29tbWVuZGF0aW9uc2AsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVjb21tZW5kYXRpb25zIEFQSSBFbmRwb2ludCcsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2xvdWRGcm9udFVSTCcsIHtcclxuICAgICAgdmFsdWU6IGBodHRwczovLyR7Y2xvdWRmcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lfWAsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gVVJMJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250RGlzdHJpYnV0aW9uSWQnLCB7XHJcbiAgICAgIHZhbHVlOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIElEIGZvciBtZWRpYSBpbnZhbGlkYXRpb24nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Nsb3VkRnJvbnREb21haW5OYW1lJywge1xyXG4gICAgICB2YWx1ZTogY2xvdWRmcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIERvbWFpbiBOYW1lJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcmNoaXRlY3R1cmUnLCB7XHJcbiAgICAgIHZhbHVlOiAnTGlnaHRzYWlsIFdvcmRQcmVzcyB3aXRoIE5leHQuanMgRnJvbnRlbmQnLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgQXJjaGl0ZWN0dXJlJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXb3JkUHJlc3NVUkwnLCB7XHJcbiAgICAgIHZhbHVlOiAnaHR0cHM6Ly9hcGkuY293Ym95a2ltb25vLmNvbScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnV29yZFByZXNzIFJFU1QgQVBJIFVSTCAoTGlnaHRzYWlsKScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV29yZFByZXNzQWRtaW5VUkwnLCB7XHJcbiAgICAgIHZhbHVlOiAnaHR0cHM6Ly9hZG1pbi5jb3dib3lraW1vbm8uY29tJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdXb3JkUHJlc3MgQWRtaW4gVVJMIChMaWdodHNhaWwpJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMYW1iZGFGdW5jdGlvbk5hbWUnLCB7XHJcbiAgICAgIHZhbHVlOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEuZnVuY3Rpb25OYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1JlY29tbWVuZGF0aW9ucyBMYW1iZGEgRnVuY3Rpb24gTmFtZScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTGFtYmRhRnVuY3Rpb25Bcm4nLCB7XHJcbiAgICAgIHZhbHVlOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEuZnVuY3Rpb25Bcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVjb21tZW5kYXRpb25zIExhbWJkYSBGdW5jdGlvbiBBUk4nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FsZXJ0VG9waWNBcm4nLCB7XHJcbiAgICAgIHZhbHVlOiBhbGVydFRvcGljLnRvcGljQXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1NOUyBUb3BpYyBBUk4gZm9yIGFsZXJ0cycsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBwbGljYXRpb25EYXNoYm9hcmROYW1lJywge1xyXG4gICAgICB2YWx1ZTogYXBwbGljYXRpb25EYXNoYm9hcmQuZGFzaGJvYXJkTmFtZSxcclxuICAgICAgZGVzY3JpcHRpb246ICdBcHBsaWNhdGlvbiBtZXRyaWNzIGRhc2hib2FyZCBuYW1lJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdJbmZyYXN0cnVjdHVyZURhc2hib2FyZE5hbWUnLCB7XHJcbiAgICAgIHZhbHVlOiBpbmZyYXN0cnVjdHVyZURhc2hib2FyZC5kYXNoYm9hcmROYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0luZnJhc3RydWN0dXJlIGhlYWx0aCBkYXNoYm9hcmQgbmFtZScsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19