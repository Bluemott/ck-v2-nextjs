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
                    customHeaders: {
                        'X-Forwarded-Host': 'api.cowboykimono.com',
                        'X-CloudFront-Origin': 'api',
                    },
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
                            contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https:; connect-src 'self' https://api.cowboykimono.com https://www.google-analytics.com https://*.execute-api.us-east-1.amazonaws.com; frame-src 'self' https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self';",
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
                // Next.js API routes (analytics, etc.) - route to API Gateway
                '/api/*': {
                    origin: new origins.HttpOrigin(`${api.restApiId}.execute-api.${this.region}.amazonaws.com`, {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                        originPath: '/prod', // Add the API Gateway stage path
                        customHeaders: {
                            'X-Forwarded-Host': 'cowboykimono.com',
                            'X-CloudFront-Origin': 'amplify',
                        },
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // Allow POST methods
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    // Add CORS headers for API routes
                    responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'APISecurityHeaders', {
                        responseHeadersPolicyName: 'APISecurityHeaders',
                        comment: 'Security headers for API responses with CORS',
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
                                    header: 'Cache-Control',
                                    value: 'no-cache, no-store, must-revalidate',
                                    override: true,
                                },
                            ],
                        },
                    }),
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
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    // Add security headers for admin routes
                    responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'AdminSecurityHeaders', {
                        responseHeadersPolicyName: 'AdminSecurityHeaders',
                        comment: 'Security headers for admin responses',
                        securityHeadersBehavior: {
                            contentSecurityPolicy: {
                                override: true,
                                contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",
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
                    }),
                },
                // WordPress REST API routes - point to wp-origin for proper WordPress functionality
                '/wp-json/*': {
                    origin: new origins.HttpOrigin('wp-origin.cowboykimono.com', {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                        customHeaders: {
                            'X-Forwarded-Host': 'wp-origin.cowboykimono.com',
                            'X-CloudFront-Origin': 'wordpress',
                        },
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    // Add CORS headers for REST API
                    responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'RESTAPISecurityHeaders', {
                        responseHeadersPolicyName: 'RESTAPISecurityHeaders',
                        comment: 'Security headers for REST API responses with CORS',
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
                                    header: 'Cache-Control',
                                    value: 'public, max-age=300, s-maxage=600',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNkay1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF3cy1jZGstc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUN6RCx5REFBeUQ7QUFDekQsOERBQThEO0FBQzlELHlEQUF5RDtBQUN6RCx3RUFBd0U7QUFDeEUsMkNBQTJDO0FBQzNDLGlEQUFpRDtBQUNqRCw2Q0FBNkM7QUFDN0MseUNBQXlDO0FBQ3pDLDJDQUEyQztBQUczQyxNQUFhLGtCQUFtQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQy9DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsbUVBQW1FO1FBQ25FLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUMvQyxJQUFJLEVBQ0osMEJBQTBCLEVBQzFCO1lBQ0UsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsMkJBQTJCLENBQUM7WUFDeEQsV0FBVyxFQUFFO2dCQUNYLFFBQVEsRUFBRSxZQUFZO2dCQUN0QixpQkFBaUIsRUFBRSw4QkFBOEI7Z0JBQ2pELG1CQUFtQixFQUFFLGdDQUFnQztnQkFDckQsNEJBQTRCO2dCQUM1QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsbUJBQW1CLEVBQUUsR0FBRzthQUN6QjtZQUNELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsVUFBVSxFQUFFLElBQUksRUFBRSxtQ0FBbUM7WUFDckQsWUFBWSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUTtZQUN6QyxXQUFXLEVBQUUsMERBQTBEO1lBQ3ZFLGNB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c0M7U0FDcEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM3hCRCxnREEyeEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoQWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgY2xhc3MgV29yZFByZXNzQmxvZ1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIExhbWJkYSBGdW5jdGlvbiAodXBkYXRlZCBmb3IgV29yZFByZXNzIFJFU1QgQVBJKVxuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uc0xhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ1dvcmRQcmVzc1JlY29tbWVuZGF0aW9ucycsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vbGFtYmRhL3JlY29tbWVuZGF0aW9ucycpLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIE5PREVfRU5WOiAncHJvZHVjdGlvbicsXG4gICAgICAgICAgV09SRFBSRVNTX0FQSV9VUkw6ICdodHRwczovL2FwaS5jb3dib3lraW1vbm8uY29tJyxcbiAgICAgICAgICBXT1JEUFJFU1NfQURNSU5fVVJMOiAnaHR0cHM6Ly9hZG1pbi5jb3dib3lraW1vbm8uY29tJyxcbiAgICAgICAgICAvLyBBZGQgY2FjaGluZyBjb25maWd1cmF0aW9uXG4gICAgICAgICAgQ0FDSEVfVFRMOiAnMzAwJyxcbiAgICAgICAgICBNQVhfUkVDT01NRU5EQVRJT05TOiAnNScsXG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgbWVtb3J5U2l6ZTogMTAyNCwgLy8gSW5jcmVhc2VkIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV29yZFByZXNzIHJlY29tbWVuZGF0aW9ucyBMYW1iZGEgZnVuY3Rpb24gdXNpbmcgUkVTVCBBUEknLFxuICAgICAgICAvLyBBZGQgdHJhY2luZ1xuICAgICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEFkZCBDbG91ZFdhdGNoIHBlcm1pc3Npb25zIGZvciBtb25pdG9yaW5nXG4gICAgcmVjb21tZW5kYXRpb25zTGFtYmRhLmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgJ2Nsb3Vkd2F0Y2g6UHV0TWV0cmljRGF0YScsXG4gICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nR3JvdXAnLFxuICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnV29yZFByZXNzQVBJJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdXb3JkUHJlc3MgUkVTVCBBUEknLFxuICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICdBUEkgR2F0ZXdheSBmb3IgV29yZFByZXNzIFJFU1QgQVBJIGFuZCBMYW1iZGEgZnVuY3Rpb25zIChMaWdodHNhaWwtYmFzZWQpJyxcbiAgICAgIC8vIERpc2FibGUgZGVmYXVsdCBDT1JTIHRvIHVzZSBleHBsaWNpdCBPUFRJT05TIG1ldGhvZFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB1bmRlZmluZWQsXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHN0YWdlTmFtZTogJ3Byb2QnLFxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLk9GRiwgLy8gRGlzYWJsZSBsb2dnaW5nIHRvIGF2b2lkIENsb3VkV2F0Y2ggaXNzdWVzXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IGZhbHNlLCAvLyBDb3N0IG9wdGltaXphdGlvbjogZGlzYWJsZSBkYXRhIHRyYWNpbmdcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiAxMDAsXG4gICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IDUwLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFJlY29tbWVuZGF0aW9ucyBlbmRwb2ludFxuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uc1Jlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3JlY29tbWVuZGF0aW9ucycpO1xuICAgIHJlY29tbWVuZGF0aW9uc1Jlc291cmNlLmFkZE1ldGhvZChcbiAgICAgICdQT1NUJyxcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHJlY29tbWVuZGF0aW9uc0xhbWJkYSwge1xuICAgICAgICBwcm94eTogdHJ1ZSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEFkZCBPUFRJT05TIG1ldGhvZCB0aGF0IGdvZXMgdG8gdGhlIExhbWJkYSBmdW5jdGlvblxuICAgIHJlY29tbWVuZGF0aW9uc1Jlc291cmNlLmFkZE1ldGhvZChcbiAgICAgICdPUFRJT05TJyxcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHJlY29tbWVuZGF0aW9uc0xhbWJkYSwge1xuICAgICAgICBwcm94eTogdHJ1ZSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEVuaGFuY2VkIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIHdpdGggU2VjdXJpdHkgSGVhZGVycyBhbmQgT3B0aW1pemF0aW9uc1xuICAgIGNvbnN0IGNsb3VkZnJvbnREaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ1dvcmRQcmVzc0Rpc3RyaWJ1dGlvbicsXG4gICAgICB7XG4gICAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuSHR0cE9yaWdpbignYXBpLmNvd2JveWtpbW9uby5jb20nLCB7XG4gICAgICAgICAgICBwcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQU19PTkxZLFxuICAgICAgICAgICAgb3JpZ2luU2hpZWxkUmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICAgIGN1c3RvbUhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ1gtRm9yd2FyZGVkLUhvc3QnOiAnYXBpLmNvd2JveWtpbW9uby5jb20nLFxuICAgICAgICAgICAgICAnWC1DbG91ZEZyb250LU9yaWdpbic6ICdhcGknLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTpcbiAgICAgICAgICAgIGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19PUFRJTUlaRUQsXG4gICAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5SZXF1ZXN0UG9saWN5LkFMTF9WSUVXRVIsXG4gICAgICAgICAgLy8gQWRkIHNlY3VyaXR5IGhlYWRlcnNcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3k6IG5ldyBjbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeShcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAnU2VjdXJpdHlIZWFkZXJzJyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5TmFtZTogJ1NlY3VyaXR5SGVhZGVycycsXG4gICAgICAgICAgICAgIGNvbW1lbnQ6ICdTZWN1cml0eSBoZWFkZXJzIGZvciBhbGwgcmVzcG9uc2VzJyxcbiAgICAgICAgICAgICAgc2VjdXJpdHlIZWFkZXJzQmVoYXZpb3I6IHtcbiAgICAgICAgICAgICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6IHtcbiAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OlxuICAgICAgICAgICAgICAgICAgICBcImRlZmF1bHQtc3JjICdzZWxmJzsgc2NyaXB0LXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnIGh0dHBzOi8vd3d3Lmdvb2dsZXRhZ21hbmFnZXIuY29tIGh0dHBzOi8vd3d3Lmdvb2dsZS1hbmFseXRpY3MuY29tOyBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tOyBmb250LXNyYyAnc2VsZicgaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbTsgaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6IGJsb2I6OyBtZWRpYS1zcmMgJ3NlbGYnIGh0dHBzOjsgY29ubmVjdC1zcmMgJ3NlbGYnIGh0dHBzOi8vYXBpLmNvd2JveWtpbW9uby5jb20gaHR0cHM6Ly93d3cuZ29vZ2xlLWFuYWx5dGljcy5jb20gaHR0cHM6Ly8qLmV4ZWN1dGUtYXBpLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tOyBmcmFtZS1zcmMgJ3NlbGYnIGh0dHBzOi8vd3d3Lmdvb2dsZXRhZ21hbmFnZXIuY29tOyBvYmplY3Qtc3JjICdub25lJzsgYmFzZS11cmkgJ3NlbGYnOyBmb3JtLWFjdGlvbiAnc2VsZic7XCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdHJpY3RUcmFuc3BvcnRTZWN1cml0eToge1xuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICBhY2Nlc3NDb250cm9sTWF4QWdlOiBjZGsuRHVyYXRpb24uZGF5cygyICogMzY1KSxcbiAgICAgICAgICAgICAgICAgIGluY2x1ZGVTdWJkb21haW5zOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgcHJlbG9hZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmcmFtZU9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgZnJhbWVPcHRpb246IGNsb3VkZnJvbnQuSGVhZGVyc0ZyYW1lT3B0aW9uLkRFTlksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeToge1xuICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeTpcbiAgICAgICAgICAgICAgICAgICAgY2xvdWRmcm9udC5IZWFkZXJzUmVmZXJyZXJQb2xpY3lcbiAgICAgICAgICAgICAgICAgICAgICAuU1RSSUNUX09SSUdJTl9XSEVOX0NST1NTX09SSUdJTixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHhzc1Byb3RlY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgcHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIG1vZGVCbG9jazogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjdXN0b21IZWFkZXJzQmVoYXZpb3I6IHtcbiAgICAgICAgICAgICAgICBjdXN0b21IZWFkZXJzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcjogJ1Blcm1pc3Npb25zLVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOlxuICAgICAgICAgICAgICAgICAgICAgICdjYW1lcmE9KCksIG1pY3JvcGhvbmU9KCksIGdlb2xvY2F0aW9uPSgpLCBwYXltZW50PSgpJyxcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6ICdDcm9zcy1PcmlnaW4tRW1iZWRkZXItUG9saWN5JyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdyZXF1aXJlLWNvcnAnLFxuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcjogJ0Nyb3NzLU9yaWdpbi1PcGVuZXItUG9saWN5JyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnQ3Jvc3MtT3JpZ2luLVJlc291cmNlLVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnc2FtZS1vcmlnaW4nLFxuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApLFxuICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFELFxuICAgICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRCxcbiAgICAgICAgfSxcbiAgICAgICAgYWRkaXRpb25hbEJlaGF2aW9yczoge1xuICAgICAgICAgIC8vIE5leHQuanMgQVBJIHJvdXRlcyAoYW5hbHl0aWNzLCBldGMuKSAtIHJvdXRlIHRvIEFQSSBHYXRld2F5XG4gICAgICAgICAgJy9hcGkvKic6IHtcbiAgICAgICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuSHR0cE9yaWdpbihcbiAgICAgICAgICAgICAgYCR7YXBpLnJlc3RBcGlJZH0uZXhlY3V0ZS1hcGkuJHt0aGlzLnJlZ2lvbn0uYW1hem9uYXdzLmNvbWAsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQU19PTkxZLFxuICAgICAgICAgICAgICAgIG9yaWdpblBhdGg6ICcvcHJvZCcsIC8vIEFkZCB0aGUgQVBJIEdhdGV3YXkgc3RhZ2UgcGF0aFxuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICdYLUZvcndhcmRlZC1Ib3N0JzogJ2Nvd2JveWtpbW9uby5jb20nLFxuICAgICAgICAgICAgICAgICAgJ1gtQ2xvdWRGcm9udC1PcmlnaW4nOiAnYW1wbGlmeScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OlxuICAgICAgICAgICAgICBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19ESVNBQkxFRCxcbiAgICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSLFxuICAgICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfQUxMLCAvLyBBbGxvdyBQT1NUIG1ldGhvZHNcbiAgICAgICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRCxcbiAgICAgICAgICAgIC8vIEFkZCBDT1JTIGhlYWRlcnMgZm9yIEFQSSByb3V0ZXNcbiAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeTogbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KFxuICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAnQVBJU2VjdXJpdHlIZWFkZXJzJyxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeU5hbWU6ICdBUElTZWN1cml0eUhlYWRlcnMnLFxuICAgICAgICAgICAgICAgIGNvbW1lbnQ6ICdTZWN1cml0eSBoZWFkZXJzIGZvciBBUEkgcmVzcG9uc2VzIHdpdGggQ09SUycsXG4gICAgICAgICAgICAgICAgc2VjdXJpdHlIZWFkZXJzQmVoYXZpb3I6IHtcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnRTZWN1cml0eVBvbGljeToge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OlxuICAgICAgICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdub25lJzsgc3R5bGUtc3JjICdub25lJztcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBzdHJpY3RUcmFuc3BvcnRTZWN1cml0eToge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzQ29udHJvbE1heEFnZTogY2RrLkR1cmF0aW9uLmRheXMoMiAqIDM2NSksXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVTdWJkb21haW5zOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBmcmFtZU9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lT3B0aW9uOiBjbG91ZGZyb250LkhlYWRlcnNGcmFtZU9wdGlvbi5ERU5ZLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeTpcbiAgICAgICAgICAgICAgICAgICAgICBjbG91ZGZyb250LkhlYWRlcnNSZWZlcnJlclBvbGljeVxuICAgICAgICAgICAgICAgICAgICAgICAgLlNUUklDVF9PUklHSU5fV0hFTl9DUk9TU19PUklHSU4sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgeHNzUHJvdGVjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbW9kZUJsb2NrOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgICAgICAgICAgY3VzdG9tSGVhZGVyczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnQ2FjaGUtQ29udHJvbCcsXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICduby1jYWNoZSwgbm8tc3RvcmUsIG11c3QtcmV2YWxpZGF0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICksXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBXb3JkUHJlc3MgYWRtaW4gcm91dGVzXG4gICAgICAgICAgJy93cC1hZG1pbi8qJzoge1xuICAgICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKCdhZG1pbi5jb3dib3lraW1vbm8uY29tJywge1xuICAgICAgICAgICAgICBwcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQU19PTkxZLFxuICAgICAgICAgICAgICBjdXN0b21IZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ1gtRm9yd2FyZGVkLUhvc3QnOiAnYWRtaW4uY293Ym95a2ltb25vLmNvbScsXG4gICAgICAgICAgICAgICAgJ1gtQ2xvdWRGcm9udC1PcmlnaW4nOiAnYWRtaW4nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTpcbiAgICAgICAgICAgICAgY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfRElTQUJMRUQsXG4gICAgICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RQb2xpY3kuQUxMX1ZJRVdFUixcbiAgICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0FMTCxcbiAgICAgICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRCxcbiAgICAgICAgICAgIC8vIEFkZCBzZWN1cml0eSBoZWFkZXJzIGZvciBhZG1pbiByb3V0ZXNcbiAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeTogbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KFxuICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAnQWRtaW5TZWN1cml0eUhlYWRlcnMnLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5TmFtZTogJ0FkbWluU2VjdXJpdHlIZWFkZXJzJyxcbiAgICAgICAgICAgICAgICBjb21tZW50OiAnU2VjdXJpdHkgaGVhZGVycyBmb3IgYWRtaW4gcmVzcG9uc2VzJyxcbiAgICAgICAgICAgICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgICAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6XG4gICAgICAgICAgICAgICAgICAgICAgXCJkZWZhdWx0LXNyYyAnc2VsZic7IHNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyAndW5zYWZlLWV2YWwnOyBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJzsgaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6OyBjb25uZWN0LXNyYyAnc2VsZicgaHR0cHM6OyBmcmFtZS1zcmMgJ3NlbGYnOyBvYmplY3Qtc3JjICdub25lJzsgYmFzZS11cmkgJ3NlbGYnOyBmb3JtLWFjdGlvbiAnc2VsZic7XCIsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgc3RyaWN0VHJhbnNwb3J0U2VjdXJpdHk6IHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc0NvbnRyb2xNYXhBZ2U6IGNkay5EdXJhdGlvbi5kYXlzKDIgKiAzNjUpLFxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlU3ViZG9tYWluczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJlbG9hZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBjb250ZW50VHlwZU9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgZnJhbWVPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBmcmFtZU9wdGlvbjogY2xvdWRmcm9udC5IZWFkZXJzRnJhbWVPcHRpb24uU0FNRU9SSUdJTixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeToge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k6XG4gICAgICAgICAgICAgICAgICAgICAgY2xvdWRmcm9udC5IZWFkZXJzUmVmZXJyZXJQb2xpY3lcbiAgICAgICAgICAgICAgICAgICAgICAgIC5TVFJJQ1RfT1JJR0lOX1dIRU5fQ1JPU1NfT1JJR0lOLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHhzc1Byb3RlY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHByb3RlY3Rpb246IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1vZGVCbG9jazogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjdXN0b21IZWFkZXJzQmVoYXZpb3I6IHtcbiAgICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcjogJ0NhY2hlLUNvbnRyb2wnLFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnbm8tY2FjaGUsIG5vLXN0b3JlLCBtdXN0LXJldmFsaWRhdGUnLFxuICAgICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnWC1BZG1pbi1Sb3V0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd0cnVlJyxcbiAgICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vIFdvcmRQcmVzcyBSRVNUIEFQSSByb3V0ZXMgLSBwb2ludCB0byB3cC1vcmlnaW4gZm9yIHByb3BlciBXb3JkUHJlc3MgZnVuY3Rpb25hbGl0eVxuICAgICAgICAgICcvd3AtanNvbi8qJzoge1xuICAgICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKCd3cC1vcmlnaW4uY293Ym95a2ltb25vLmNvbScsIHtcbiAgICAgICAgICAgICAgcHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUFNfT05MWSxcbiAgICAgICAgICAgICAgY3VzdG9tSGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdYLUZvcndhcmRlZC1Ib3N0JzogJ3dwLW9yaWdpbi5jb3dib3lraW1vbm8uY29tJyxcbiAgICAgICAgICAgICAgICAnWC1DbG91ZEZyb250LU9yaWdpbic6ICd3b3JkcHJlc3MnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTpcbiAgICAgICAgICAgICAgY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxuICAgICAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5SZXF1ZXN0UG9saWN5LkFMTF9WSUVXRVIsXG4gICAgICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19BTEwsXG4gICAgICAgICAgICBjYWNoZWRNZXRob2RzOiBjbG91ZGZyb250LkNhY2hlZE1ldGhvZHMuQ0FDSEVfR0VUX0hFQUQsXG4gICAgICAgICAgICAvLyBBZGQgQ09SUyBoZWFkZXJzIGZvciBSRVNUIEFQSVxuICAgICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5OiBuZXcgY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3koXG4gICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICdSRVNUQVBJU2VjdXJpdHlIZWFkZXJzJyxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeU5hbWU6ICdSRVNUQVBJU2VjdXJpdHlIZWFkZXJzJyxcbiAgICAgICAgICAgICAgICBjb21tZW50OiAnU2VjdXJpdHkgaGVhZGVycyBmb3IgUkVTVCBBUEkgcmVzcG9uc2VzIHdpdGggQ09SUycsXG4gICAgICAgICAgICAgICAgc2VjdXJpdHlIZWFkZXJzQmVoYXZpb3I6IHtcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnRTZWN1cml0eVBvbGljeToge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OlxuICAgICAgICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdub25lJzsgc3R5bGUtc3JjICdub25lJztcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBzdHJpY3RUcmFuc3BvcnRTZWN1cml0eToge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzQ29udHJvbE1heEFnZTogY2RrLkR1cmF0aW9uLmRheXMoMiAqIDM2NSksXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVTdWJkb21haW5zOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBmcmFtZU9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lT3B0aW9uOiBjbG91ZGZyb250LkhlYWRlcnNGcmFtZU9wdGlvbi5ERU5ZLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeTpcbiAgICAgICAgICAgICAgICAgICAgICBjbG91ZGZyb250LkhlYWRlcnNSZWZlcnJlclBvbGljeVxuICAgICAgICAgICAgICAgICAgICAgICAgLlNUUklDVF9PUklHSU5fV0hFTl9DUk9TU19PUklHSU4sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgeHNzUHJvdGVjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbW9kZUJsb2NrOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGN1c3RvbUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgICAgICAgICAgY3VzdG9tSGVhZGVyczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnQ2FjaGUtQ29udHJvbCcsXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdwdWJsaWMsIG1heC1hZ2U9MzAwLCBzLW1heGFnZT02MDAnLFxuICAgICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIC8vIEFkZCBlcnJvciBwYWdlc1xuICAgICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy80MDQnLFxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy80MDQnLFxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDUwMCxcbiAgICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy81MDAnLFxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDUwMixcbiAgICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy81MDAnLFxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDUwMyxcbiAgICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy81MDAnLFxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICAvLyBBZGQgcHJpY2UgY2xhc3MgZm9yIGNvc3Qgb3B0aW1pemF0aW9uXG4gICAgICAgIHByaWNlQ2xhc3M6IGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDAsXG4gICAgICAgIC8vIEFkZCBsb2dnaW5nIHdpdGggcHJvcGVyIGJ1Y2tldCBjb25maWd1cmF0aW9uXG4gICAgICAgIGVuYWJsZUxvZ2dpbmc6IHRydWUsXG4gICAgICAgIGxvZ0J1Y2tldDogbmV3IHMzLkJ1Y2tldCh0aGlzLCAnQ2xvdWRGcm9udExvZ3MnLCB7XG4gICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgICAgICB2ZXJzaW9uZWQ6IGZhbHNlLFxuICAgICAgICAgIG9iamVjdE93bmVyc2hpcDogczMuT2JqZWN0T3duZXJzaGlwLkJVQ0tFVF9PV05FUl9QUkVGRVJSRUQsXG4gICAgICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdMb2dSZXRlbnRpb24nLFxuICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cyg2MCksXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuSU5GUkVRVUVOVF9BQ0NFU1MsXG4gICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgY29tbWVudDogJ0Nvd2JveSBLaW1vbm8gV29yZFByZXNzIERpc3RyaWJ1dGlvbiB3aXRoIEVuaGFuY2VkIFNlY3VyaXR5JyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gTm90ZTogYXBpLmNvd2JveWtpbW9uby5jb20gYW5kIGFkbWluLmNvd2JveWtpbW9uby5jb20gQ2xvdWRGcm9udCBkaXN0cmlidXRpb25zIGV4aXN0IGJ1dCBhcmUgbWFuYWdlZCBtYW51YWxseVxuICAgIC8vIGFkbWluLmNvd2JveWtpbW9uby5jb20gRGlzdHJpYnV0aW9uIElEOiBFU0MwSlhPWFZXWDRKXG4gICAgLy8gVG8gZml4IHRoZSBXb3JkUHJlc3MgYWRtaW4gbG9naW4gaXNzdWUsIG1hbnVhbGx5IHVwZGF0ZSB0aGUgb3JpZ2luIGNvbmZpZ3VyYXRpb25cbiAgICAvLyB0byByZW1vdmUgWC1Gb3J3YXJkZWQtSG9zdCBoZWFkZXJzIGFuZCBzZXQgb3JpZ2luIHRvIHdwLW9yaWdpbi5jb3dib3lraW1vbm8uY29tXG5cbiAgICAvLyBOb3RlOiBhZG1pbi5jb3dib3lraW1vbm8uY29tIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uIGV4aXN0cyBidXQgaXMgbWFuYWdlZCBtYW51YWxseVxuICAgIC8vIERpc3RyaWJ1dGlvbiBJRDogRVNDMEpYT1hWV1g0SlxuICAgIC8vIFRvIGZpeCB0aGUgV29yZFByZXNzIGFkbWluIGxvZ2luIGlzc3VlLCBtYW51YWxseSB1cGRhdGUgdGhlIG9yaWdpbiBjb25maWd1cmF0aW9uXG4gICAgLy8gdG8gcmVtb3ZlIFgtRm9yd2FyZGVkLUhvc3QgaGVhZGVycyBhbmQgc2V0IG9yaWdpbiB0byB3cC1vcmlnaW4uY293Ym95a2ltb25vLmNvbVxuXG4gICAgLy8gTWFpbiBzaXRlIENsb3VkRnJvbnQgKEFtcGxpZnkgbWFuYWdlZClcbiAgICAvLyBUaGlzIGlzIGhhbmRsZWQgYnkgQW1wbGlmeSBhdXRvbWF0aWNhbGx5XG5cbiAgICAvLyBDbG91ZFdhdGNoIEFsYXJtcyBmb3IgbW9uaXRvcmluZ1xuICAgIGNvbnN0IGxhbWJkYUVycm9yQWxhcm0gPSBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkFsYXJtKFxuICAgICAgdGhpcyxcbiAgICAgICdMYW1iZGFFcnJvckFsYXJtJyxcbiAgICAgIHtcbiAgICAgICAgbWV0cmljOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljRXJyb3JzKCksXG4gICAgICAgIHRocmVzaG9sZDogMSxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZXJyb3JzIGV4Y2VlZGVkIHRocmVzaG9sZCcsXG4gICAgICAgIGFsYXJtTmFtZTogJ1dvcmRQcmVzc0Jsb2dTdGFjay1sYW1iZGEtZXJyb3JzJyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3QgbGFtYmRhRHVyYXRpb25BbGFybSA9IG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICB0aGlzLFxuICAgICAgJ0xhbWJkYUR1cmF0aW9uQWxhcm0nLFxuICAgICAge1xuICAgICAgICBtZXRyaWM6IHJlY29tbWVuZGF0aW9uc0xhbWJkYS5tZXRyaWNEdXJhdGlvbigpLFxuICAgICAgICB0aHJlc2hvbGQ6IDI1MDAwLCAvLyAyNSBzZWNvbmRzXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnTGFtYmRhIGZ1bmN0aW9uIGR1cmF0aW9uIGV4Y2VlZGVkIHRocmVzaG9sZCcsXG4gICAgICAgIGFsYXJtTmFtZTogJ1dvcmRQcmVzc0Jsb2dTdGFjay1sYW1iZGEtZHVyYXRpb24nLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBsYW1iZGFUaHJvdHRsZUFsYXJtID0gbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybShcbiAgICAgIHRoaXMsXG4gICAgICAnTGFtYmRhVGhyb3R0bGVBbGFybScsXG4gICAgICB7XG4gICAgICAgIG1ldHJpYzogcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY1Rocm90dGxlcygpLFxuICAgICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnTGFtYmRhIGZ1bmN0aW9uIHRocm90dGxlcyBkZXRlY3RlZCcsXG4gICAgICAgIGFsYXJtTmFtZTogJ1dvcmRQcmVzc0Jsb2dTdGFjay1sYW1iZGEtdGhyb3R0bGVzJyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gU05TIFRvcGljIGZvciBhbGVydHNcbiAgICBjb25zdCBhbGVydFRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQWxlcnRUb3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogJ1dvcmRQcmVzc0Jsb2dTdGFjay1hbGVydHMnLFxuICAgICAgZGlzcGxheU5hbWU6ICdXb3JkUHJlc3MgQmxvZyBTdGFjayBBbGVydHMnLFxuICAgIH0pO1xuXG4gICAgLy8gQ29ubmVjdCBhbGFybXMgdG8gU05TIHRvcGljXG4gICAgbGFtYmRhRXJyb3JBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYylcbiAgICApO1xuICAgIGxhbWJkYUR1cmF0aW9uQWxhcm0uYWRkQWxhcm1BY3Rpb24oXG4gICAgICBuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKGFsZXJ0VG9waWMpXG4gICAgKTtcbiAgICBsYW1iZGFUaHJvdHRsZUFsYXJtLmFkZEFsYXJtQWN0aW9uKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKVxuICAgICk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIERhc2hib2FyZHMgZm9yIG1vbml0b3JpbmdcbiAgICBjb25zdCBhcHBsaWNhdGlvbkRhc2hib2FyZCA9IG5ldyBjbG91ZHdhdGNoLkRhc2hib2FyZChcbiAgICAgIHRoaXMsXG4gICAgICAnQXBwbGljYXRpb25EYXNoYm9hcmQnLFxuICAgICAge1xuICAgICAgICBkYXNoYm9hcmROYW1lOiAnQ293Ym95S2ltb25vLXByb2R1Y3Rpb24tYXBwbGljYXRpb24tbWV0cmljcycsXG4gICAgICAgIHdpZGdldHM6IFtcbiAgICAgICAgICAvLyBMYW1iZGEgTWV0cmljc1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdMYW1iZGEgRnVuY3Rpb24gTWV0cmljcycsXG4gICAgICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljSW52b2NhdGlvbnMoKSxcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljRXJyb3JzKCksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHJpZ2h0OiBbXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY0R1cmF0aW9uKCksXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY1Rocm90dGxlcygpLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgICAvLyBBUEkgR2F0ZXdheSBNZXRyaWNzXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgICAgICB0aXRsZTogJ0FQSSBHYXRld2F5IE1ldHJpY3MnLFxuICAgICAgICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDb3VudCcsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQXBpTmFtZTogYXBpLnJlc3RBcGlJZCB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnNVhYRXJyb3InLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaS5yZXN0QXBpSWQgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0xhdGVuY3knLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlOYW1lOiBhcGkucmVzdEFwaUlkIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICc0WFhFcnJvcicsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQXBpTmFtZTogYXBpLnJlc3RBcGlJZCB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgICAvLyBDbG91ZEZyb250IE1ldHJpY3NcbiAgICAgICAgICBbXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgICAgIHRpdGxlOiAnQ2xvdWRGcm9udCBNZXRyaWNzJyxcbiAgICAgICAgICAgICAgbGVmdDogW1xuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnUmVxdWVzdHMnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgICAgICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0Nsb3VkRnJvbnQnLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0Vycm9yUmF0ZScsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgICAgICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0Nsb3VkRnJvbnQnLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NhY2hlSGl0UmF0ZScsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgICAgICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0Nsb3VkRnJvbnQnLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0J5dGVzRG93bmxvYWRlZCcsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgRGlzdHJpYnV0aW9uSWQ6IGNsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIFJlZ2lvbjogJ0dsb2JhbCcsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgICAvLyBDdXN0b20gQXBwbGljYXRpb24gTWV0cmljc1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdDdXN0b20gQXBwbGljYXRpb24gTWV0cmljcycsXG4gICAgICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0FQSScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQVBJQ2FsbENvdW50JyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdXb3JkUHJlc3MvQVBJJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdBUElDYWxsRHVyYXRpb24nLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByaWdodDogW1xuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdMYW1iZGEvQVBJJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXF1ZXN0Q291bnQnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0xhbWJkYS9BUEknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ1Jlc3BvbnNlVGltZScsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIENhY2hlIE1ldHJpY3NcbiAgICAgICAgICBbXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgICAgIHRpdGxlOiAnQ2FjaGUgUGVyZm9ybWFuY2UnLFxuICAgICAgICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9DYWNoZScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ2FjaGVIaXQnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9DYWNoZScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ2FjaGVNaXNzJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByaWdodDogW1xuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdXb3JkUHJlc3MvQ2FjaGUnLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NhY2hlT3BlcmF0aW9uRHVyYXRpb24nLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgXSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gSW5mcmFzdHJ1Y3R1cmUgSGVhbHRoIERhc2hib2FyZFxuICAgIGNvbnN0IGluZnJhc3RydWN0dXJlRGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKFxuICAgICAgdGhpcyxcbiAgICAgICdJbmZyYXN0cnVjdHVyZURhc2hib2FyZCcsXG4gICAgICB7XG4gICAgICAgIGRhc2hib2FyZE5hbWU6ICdDb3dib3lLaW1vbm8tcHJvZHVjdGlvbi1pbmZyYXN0cnVjdHVyZS1oZWFsdGgnLFxuICAgICAgICB3aWRnZXRzOiBbXG4gICAgICAgICAgLy8gU3lzdGVtIE92ZXJ2aWV3XG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guVGV4dFdpZGdldCh7XG4gICAgICAgICAgICAgIG1hcmtkb3duOiBgXG4jIENvd2JveSBLaW1vbm8gLSBQcm9kdWN0aW9uIEVudmlyb25tZW50XG5cbiMjIEFyY2hpdGVjdHVyZSBPdmVydmlld1xuLSAqKkZyb250ZW5kOioqIE5leHQuanMgb24gQVdTIEFtcGxpZnlcbi0gKipCYWNrZW5kOioqIFdvcmRQcmVzcyBvbiBMaWdodHNhaWxcbi0gKipBUEk6KiogUkVTVCBBUEkgdmlhIFdvcmRQcmVzc1xuLSAqKkNETjoqKiBDbG91ZEZyb250IERpc3RyaWJ1dGlvblxuLSAqKlNlcnZlcmxlc3M6KiogTGFtYmRhIEZ1bmN0aW9uc1xuLSAqKk1vbml0b3Jpbmc6KiogQ2xvdWRXYXRjaCBEYXNoYm9hcmRzICYgQWxlcnRzXG5cbiMjIEtleSBFbmRwb2ludHNcbi0gKipXb3JkUHJlc3MgQVBJOioqIGh0dHBzOi8vYXBpLmNvd2JveWtpbW9uby5jb21cbi0gKipMYW1iZGEgRnVuY3Rpb246KiogJHtyZWNvbW1lbmRhdGlvbnNMYW1iZGEuZnVuY3Rpb25OYW1lfVxuLSAqKkNsb3VkRnJvbnQ6KiogJHtjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkfVxuXG4jIyBBbGVydCBDb25maWd1cmF0aW9uXG4tIExhbWJkYSBlcnJvcnMsIGR1cmF0aW9uLCBhbmQgdGhyb3R0bGVzXG4tIEFQSSBHYXRld2F5IDRYWC81WFggZXJyb3JzIGFuZCBsYXRlbmN5XG4tIENsb3VkRnJvbnQgZXJyb3IgcmF0ZSBhbmQgY2FjaGUgcGVyZm9ybWFuY2Vcbi0gQ3VzdG9tIGFwcGxpY2F0aW9uIG1ldHJpY3NcblxuIyMgUmVzcG9uc2UgVGltZSBUYXJnZXRzXG4tICoqQVBJIENhbGxzOioqIDwgMiBzZWNvbmRzXG4tICoqTGFtYmRhIEZ1bmN0aW9uczoqKiA8IDI1IHNlY29uZHNcbi0gKipQYWdlIExvYWQ6KiogPCAzIHNlY29uZHNcbi0gKipDYWNoZSBIaXQgUmF0ZToqKiA+IDgwJVxuXG5MYXN0IFVwZGF0ZWQ6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxuICAgICAgICAgICAgYCxcbiAgICAgICAgICAgICAgaGVpZ2h0OiA4LFxuICAgICAgICAgICAgICB3aWR0aDogMjQsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIEFsYXJtIFN0YXR1c1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkFsYXJtU3RhdHVzV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdBbGFybSBTdGF0dXMnLFxuICAgICAgICAgICAgICBhbGFybXM6IFtcbiAgICAgICAgICAgICAgICBsYW1iZGFFcnJvckFsYXJtLFxuICAgICAgICAgICAgICAgIGxhbWJkYUR1cmF0aW9uQWxhcm0sXG4gICAgICAgICAgICAgICAgbGFtYmRhVGhyb3R0bGVBbGFybSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgaGVpZ2h0OiA2LFxuICAgICAgICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1JlY29tbWVuZGF0aW9uc0VuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IGAke2FwaS51cmx9cmVjb21tZW5kYXRpb25zYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVjb21tZW5kYXRpb25zIEFQSSBFbmRwb2ludCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2xvdWRGcm9udFVSTCcsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke2Nsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBVUkwnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Nsb3VkRnJvbnREaXN0cmlidXRpb25JZCcsIHtcbiAgICAgIHZhbHVlOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBJRCBmb3IgbWVkaWEgaW52YWxpZGF0aW9uJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250RG9tYWluTmFtZScsIHtcbiAgICAgIHZhbHVlOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIERvbWFpbiBOYW1lJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcmNoaXRlY3R1cmUnLCB7XG4gICAgICB2YWx1ZTogJ0xpZ2h0c2FpbCBXb3JkUHJlc3Mgd2l0aCBOZXh0LmpzIEZyb250ZW5kJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBBcmNoaXRlY3R1cmUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dvcmRQcmVzc1VSTCcsIHtcbiAgICAgIHZhbHVlOiAnaHR0cHM6Ly9hcGkuY293Ym95a2ltb25vLmNvbScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1dvcmRQcmVzcyBSRVNUIEFQSSBVUkwgKExpZ2h0c2FpbCknLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dvcmRQcmVzc0FkbWluVVJMJywge1xuICAgICAgdmFsdWU6ICdodHRwczovL2FkbWluLmNvd2JveWtpbW9uby5jb20nLFxuICAgICAgZGVzY3JpcHRpb246ICdXb3JkUHJlc3MgQWRtaW4gVVJMIChMaWdodHNhaWwpJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMYW1iZGFGdW5jdGlvbk5hbWUnLCB7XG4gICAgICB2YWx1ZTogcmVjb21tZW5kYXRpb25zTGFtYmRhLmZ1bmN0aW9uTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVjb21tZW5kYXRpb25zIExhbWJkYSBGdW5jdGlvbiBOYW1lJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMYW1iZGFGdW5jdGlvbkFybicsIHtcbiAgICAgIHZhbHVlOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEuZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ1JlY29tbWVuZGF0aW9ucyBMYW1iZGEgRnVuY3Rpb24gQVJOJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBbGVydFRvcGljQXJuJywge1xuICAgICAgdmFsdWU6IGFsZXJ0VG9waWMudG9waWNBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ1NOUyBUb3BpYyBBUk4gZm9yIGFsZXJ0cycsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBwbGljYXRpb25EYXNoYm9hcmROYW1lJywge1xuICAgICAgdmFsdWU6IGFwcGxpY2F0aW9uRGFzaGJvYXJkLmRhc2hib2FyZE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FwcGxpY2F0aW9uIG1ldHJpY3MgZGFzaGJvYXJkIG5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0luZnJhc3RydWN0dXJlRGFzaGJvYXJkTmFtZScsIHtcbiAgICAgIHZhbHVlOiBpbmZyYXN0cnVjdHVyZURhc2hib2FyZC5kYXNoYm9hcmROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdJbmZyYXN0cnVjdHVyZSBoZWFsdGggZGFzaGJvYXJkIG5hbWUnLFxuICAgIH0pO1xuICB9XG59XG4iXX0=