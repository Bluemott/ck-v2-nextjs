"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordPressBlogStack = void 0;
const cdk = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const cloudwatchActions = require("aws-cdk-lib/aws-cloudwatch-actions");
const iam = require("aws-cdk-lib/aws-iam");
const kms = require("aws-cdk-lib/aws-kms");
const lambda = require("aws-cdk-lib/aws-lambda");
const logs = require("aws-cdk-lib/aws-logs");
const sns = require("aws-cdk-lib/aws-sns");
const sqs = require("aws-cdk-lib/aws-sqs");
const wafv2 = require("aws-cdk-lib/aws-wafv2");
class WordPressBlogStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // KMS key for Lambda environment variable encryption
        const lambdaEnvKey = new kms.Key(this, 'LambdaEnvKey', {
            description: 'KMS key for Lambda environment variable encryption',
            enableKeyRotation: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep key for security
        });
        // Dead Letter Queue for Lambda failures (using default encryption to avoid circular dependency)
        const lambdaDLQ = new sqs.Queue(this, 'LambdaDLQ', {
            queueName: 'wordpress-recommendations-dlq',
            retentionPeriod: cdk.Duration.days(14), // Keep failed messages for 14 days
            encryption: sqs.QueueEncryption.SQS_MANAGED, // Use SQS-managed encryption to avoid KMS circular dependency
        });
        // Create log group BEFORE Lambda to avoid circular dependency
        // Using logGroup instead of deprecated logRetention property (see AWS docs)
        const lambdaLogGroup = new logs.LogGroup(this, 'RecommendationsLogGroup', {
            logGroupName: '/aws/lambda/WordPressBlogStack-Recommendations',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Delete log group when stack is deleted
        });
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
            memorySize: 512, // Optimized from 1024 MB for cost savings
            // Use explicit logGroup instead of logRetention to avoid circular dependency
            logGroup: lambdaLogGroup,
            description: 'WordPress recommendations Lambda function using REST API',
            tracing: lambda.Tracing.ACTIVE,
            environmentEncryption: lambdaEnvKey, // Encrypt environment variables
            deadLetterQueue: lambdaDLQ, // Configure DLQ for error handling
        });
        // Note: KMS permissions are automatically granted by CDK when using environmentEncryption
        // No manual grant needed - CDK handles this automatically
        // Add CloudWatch permissions for monitoring (least privilege - specific ARNs)
        // Use the explicit log group we created (no circular dependency)
        recommendationsLambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'xray:PutTelemetryRecords',
                'xray:PutTraceSegments',
            ],
            resources: [
                // Use the explicit log group ARN - no circular dependency
                lambdaLogGroup.logGroupArn,
                `${lambdaLogGroup.logGroupArn}:*`,
                // X-Ray permissions (region-scoped)
                `arn:aws:xray:${this.region}:${this.account}:*`,
            ],
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
        // AWS WAF for API Gateway protection
        const apiGatewayWebAcl = new wafv2.CfnWebACL(this, 'ApiGatewayWAF', {
            scope: 'REGIONAL',
            defaultAction: { allow: {} },
            name: 'wordpress-api-gateway-waf',
            description: 'WAF for WordPress API Gateway - protects against common attacks',
            rules: [
                {
                    name: 'AWSManagedRulesCommonRuleSet',
                    priority: 1,
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesCommonRuleSet',
                        },
                    },
                    overrideAction: { none: {} },
                    visibilityConfig: {
                        sampledRequestsEnabled: true,
                        cloudWatchMetricsEnabled: true,
                        metricName: 'CommonRuleSetMetric',
                    },
                },
                {
                    name: 'AWSManagedRulesKnownBadInputsRuleSet',
                    priority: 2,
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesKnownBadInputsRuleSet',
                        },
                    },
                    overrideAction: { none: {} },
                    visibilityConfig: {
                        sampledRequestsEnabled: true,
                        cloudWatchMetricsEnabled: true,
                        metricName: 'KnownBadInputsMetric',
                    },
                },
                {
                    name: 'RateLimitRule',
                    priority: 3,
                    statement: {
                        rateBasedStatement: {
                            limit: 2000,
                            aggregateKeyType: 'IP',
                        },
                    },
                    action: { block: {} },
                    visibilityConfig: {
                        sampledRequestsEnabled: true,
                        cloudWatchMetricsEnabled: true,
                        metricName: 'RateLimitMetric',
                    },
                },
            ],
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: 'ApiGatewayWAF',
            },
        });
        // Associate WAF with API Gateway
        // Note: API Gateway stage is 'prod' as defined in deployOptions
        new wafv2.CfnWebACLAssociation(this, 'ApiGatewayWAFAssociation', {
            resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/prod`,
            webAclArn: apiGatewayWebAcl.attrArn,
        });
        // Note: CloudFront distributions were removed - main site uses Amplify-managed CloudFront
        // Admin and API go directly to Lightsail (no CloudFront needed)
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
        // DLQ alarm for Lambda failures
        const dlqAlarm = new cloudwatch.Alarm(this, 'LambdaDLQAlarm', {
            metric: lambdaDLQ.metricNumberOfMessagesReceived(),
            threshold: 1,
            evaluationPeriods: 1,
            alarmDescription: 'Lambda function failures detected in DLQ',
            alarmName: 'WordPressBlogStack-lambda-dlq',
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
        dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        // CloudWatch Dashboards for monitoring
        // TEMPORARILY COMMENTED OUT to resolve circular dependency during deployment
        // TODO: Re-enable after successful deployment
        /*
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
              // WAF Metrics
              [
                new cloudwatch.GraphWidget({
                  title: 'WAF Metrics',
                  left: [
                    new cloudwatch.Metric({
                      namespace: 'AWS/WAFV2',
                      metricName: 'AllowedRequests',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: {
                        WebACL: apiGatewayWebAcl.name!,
                        Rule: 'ALL',
                        Region: this.region,
                      },
                    }),
                    new cloudwatch.Metric({
                      namespace: 'AWS/WAFV2',
                      metricName: 'BlockedRequests',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: {
                        WebACL: apiGatewayWebAcl.name!,
                        Rule: 'ALL',
                        Region: this.region,
                      },
                    }),
                  ],
                  right: [
                    new cloudwatch.Metric({
                      namespace: 'AWS/WAFV2',
                      metricName: 'CountedRequests',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: {
                        WebACL: apiGatewayWebAcl.name!,
                        Rule: 'ALL',
                        Region: this.region,
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
        // TEMPORARILY COMMENTED OUT to resolve circular dependency
        /*
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
    - **Frontend:** Next.js on AWS Amplify (with Amplify-managed CloudFront)
    - **Backend:** WordPress on Lightsail
    - **API:** REST API via WordPress
    - **Serverless:** Lambda Functions with WAF protection
    - **Monitoring:** CloudWatch Dashboards & Alerts
    
    ## Key Endpoints
    - **WordPress API:** https://api.cowboykimono.com
    - **API Gateway:** ${api.restApiId}
    
    ## Alert Configuration
    - Lambda errors, duration, throttles, and DLQ messages
    - API Gateway 4XX/5XX errors and latency
    - WAF blocked/allowed requests
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
                    dlqAlarm,
                  ],
                  height: 6,
                  width: 12,
                }),
              ],
            ],
          }
        );
        */
        // End of commented dashboards
        // Outputs
        new cdk.CfnOutput(this, 'RecommendationsEndpoint', {
            value: `${api.url}recommendations`,
            description: 'Recommendations API Endpoint',
        });
        new cdk.CfnOutput(this, 'Architecture', {
            value: 'Lightsail WordPress with Next.js Frontend on Amplify',
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
        // Dashboard outputs temporarily disabled
        /*
        new cdk.CfnOutput(this, 'ApplicationDashboardName', {
          value: applicationDashboard.dashboardName,
          description: 'Application metrics dashboard name',
        });
    
        new cdk.CfnOutput(this, 'InfrastructureDashboardName', {
          value: infrastructureDashboard.dashboardName,
          description: 'Infrastructure health dashboard name',
        });
        */
    }
}
exports.WordPressBlogStack = WordPressBlogStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNkay1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF3cy1jZGstc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUN6RCx5REFBeUQ7QUFDekQsd0VBQXdFO0FBQ3hFLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsaURBQWlEO0FBQ2pELDZDQUE2QztBQUM3QywyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLCtDQUErQztBQUcvQyxNQUFhLGtCQUFtQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQy9DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIscURBQXFEO1FBQ3JELE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3JELFdBQVcsRUFBRSxvREFBb0Q7WUFDakUsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsd0JBQXdCO1NBQ2xFLENBQUMsQ0FBQztRQUVILGdHQUFnRztRQUNoRyxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNqRCxTQUFTLEVBQUUsK0JBQStCO1lBQzFDLGVBQWUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxtQ0FBbUM7WUFDM0UsVUFBVSxFQUFFLEdBQUcsQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLDhEQUE4RDtTQUM1RyxDQUFDLENBQUM7UUFFSCw4REFBOEQ7UUFDOUQsNEVBQTRFO1FBQzVFLE1BQU0sY0FBYyxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUseUJBQXlC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WUFDdkMsV0FBVyxFQUFFLGlDQUFpQztTQUMvQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxZQUFZO1lBQ3pDLFdBQVcsRUFBRSxzQ0FBc0M7U0FDcEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUscUJBQXFCLENBQUMsV0FBVztZQUN4QyxXQUFXLEVBQUUscUNBQXFDO1NBQ25ELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxVQUFVLENBQUMsUUFBUTtZQUMxQixXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztRQUVILHlDQUF5QztRQUN6Qzs7Ozs7Ozs7OztVQVVFO0lBQ0osQ0FBQztDQUNGO0FBcmhCRCxnREFxaEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoQWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGttcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0ICogYXMgd2FmdjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXdhZnYyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgY2xhc3MgV29yZFByZXNzQmxvZ1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gS01TIGtleSBmb3IgTGFtYmRhIGVudmlyb25tZW50IHZhcmlhYmxlIGVuY3J5cHRpb25cbiAgICBjb25zdCBsYW1iZGFFbnZLZXkgPSBuZXcga21zLktleSh0aGlzLCAnTGFtYmRhRW52S2V5Jywge1xuICAgICAgZGVzY3JpcHRpb246ICdLTVMga2V5IGZvciBMYW1iZGEgZW52aXJvbm1lbnQgdmFyaWFibGUgZW5jcnlwdGlvbicsXG4gICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiwgLy8gS2VlcCBrZXkgZm9yIHNlY3VyaXR5XG4gICAgfSk7XG5cbiAgICAvLyBEZWFkIExldHRlciBRdWV1ZSBmb3IgTGFtYmRhIGZhaWx1cmVzICh1c2luZyBkZWZhdWx0IGVuY3J5cHRpb24gdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jeSlcbiAgICBjb25zdCBsYW1iZGFETFEgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdMYW1iZGFETFEnLCB7XG4gICAgICBxdWV1ZU5hbWU6ICd3b3JkcHJlc3MtcmVjb21tZW5kYXRpb25zLWRscScsXG4gICAgICByZXRlbnRpb25QZXJpb2Q6IGNkay5EdXJhdGlvbi5kYXlzKDE0KSwgLy8gS2VlcCBmYWlsZWQgbWVzc2FnZXMgZm9yIDE0IGRheXNcbiAgICAgIGVuY3J5cHRpb246IHNxcy5RdWV1ZUVuY3J5cHRpb24uU1FTX01BTkFHRUQsIC8vIFVzZSBTUVMtbWFuYWdlZCBlbmNyeXB0aW9uIHRvIGF2b2lkIEtNUyBjaXJjdWxhciBkZXBlbmRlbmN5XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgbG9nIGdyb3VwIEJFRk9SRSBMYW1iZGEgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jeVxuICAgIC8vIFVzaW5nIGxvZ0dyb3VwIGluc3RlYWQgb2YgZGVwcmVjYXRlZCBsb2dSZXRlbnRpb24gcHJvcGVydHkgKHNlZSBBV1MgZG9jcylcbiAgICBjb25zdCBsYW1iZGFMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdSZWNvbW1lbmRhdGlvbnNMb2dHcm91cCcsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogJy9hd3MvbGFtYmRhL1dvcmRQcmVzc0Jsb2dTdGFjay1SZWNvbW1lbmRhdGlvbnMnLFxuICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBEZWxldGUgbG9nIGdyb3VwIHdoZW4gc3RhY2sgaXMgZGVsZXRlZFxuICAgIH0pO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIExhbWJkYSBGdW5jdGlvbiAodXBkYXRlZCBmb3IgV29yZFByZXNzIFJFU1QgQVBJKVxuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uc0xhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ1dvcmRQcmVzc1JlY29tbWVuZGF0aW9ucycsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vbGFtYmRhL3JlY29tbWVuZGF0aW9ucycpLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIE5PREVfRU5WOiAncHJvZHVjdGlvbicsXG4gICAgICAgICAgV09SRFBSRVNTX0FQSV9VUkw6ICdodHRwczovL2FwaS5jb3dib3lraW1vbm8uY29tJyxcbiAgICAgICAgICBXT1JEUFJFU1NfQURNSU5fVVJMOiAnaHR0cHM6Ly9hZG1pbi5jb3dib3lraW1vbm8uY29tJyxcbiAgICAgICAgICAvLyBBZGQgY2FjaGluZyBjb25maWd1cmF0aW9uXG4gICAgICAgICAgQ0FDSEVfVFRMOiAnMzAwJyxcbiAgICAgICAgICBNQVhfUkVDT01NRU5EQVRJT05TOiAnNScsXG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgbWVtb3J5U2l6ZTogNTEyLCAvLyBPcHRpbWl6ZWQgZnJvbSAxMDI0IE1CIGZvciBjb3N0IHNhdmluZ3NcbiAgICAgICAgLy8gVXNlIGV4cGxpY2l0IGxvZ0dyb3VwIGluc3RlYWQgb2YgbG9nUmV0ZW50aW9uIHRvIGF2b2lkIGNpcmN1bGFyIGRlcGVuZGVuY3lcbiAgICAgICAgbG9nR3JvdXA6IGxhbWJkYUxvZ0dyb3VwLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dvcmRQcmVzcyByZWNvbW1lbmRhdGlvbnMgTGFtYmRhIGZ1bmN0aW9uIHVzaW5nIFJFU1QgQVBJJyxcbiAgICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxuICAgICAgICBlbnZpcm9ubWVudEVuY3J5cHRpb246IGxhbWJkYUVudktleSwgLy8gRW5jcnlwdCBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgICAgICAgZGVhZExldHRlclF1ZXVlOiBsYW1iZGFETFEsIC8vIENvbmZpZ3VyZSBETFEgZm9yIGVycm9yIGhhbmRsaW5nXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIE5vdGU6IEtNUyBwZXJtaXNzaW9ucyBhcmUgYXV0b21hdGljYWxseSBncmFudGVkIGJ5IENESyB3aGVuIHVzaW5nIGVudmlyb25tZW50RW5jcnlwdGlvblxuICAgIC8vIE5vIG1hbnVhbCBncmFudCBuZWVkZWQgLSBDREsgaGFuZGxlcyB0aGlzIGF1dG9tYXRpY2FsbHlcblxuICAgIC8vIEFkZCBDbG91ZFdhdGNoIHBlcm1pc3Npb25zIGZvciBtb25pdG9yaW5nIChsZWFzdCBwcml2aWxlZ2UgLSBzcGVjaWZpYyBBUk5zKVxuICAgIC8vIFVzZSB0aGUgZXhwbGljaXQgbG9nIGdyb3VwIHdlIGNyZWF0ZWQgKG5vIGNpcmN1bGFyIGRlcGVuZGVuY3kpXG4gICAgcmVjb21tZW5kYXRpb25zTGFtYmRhLmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgJ2Nsb3Vkd2F0Y2g6UHV0TWV0cmljRGF0YScsXG4gICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICAgICd4cmF5OlB1dFRlbGVtZXRyeVJlY29yZHMnLFxuICAgICAgICAgICd4cmF5OlB1dFRyYWNlU2VnbWVudHMnLFxuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAvLyBVc2UgdGhlIGV4cGxpY2l0IGxvZyBncm91cCBBUk4gLSBubyBjaXJjdWxhciBkZXBlbmRlbmN5XG4gICAgICAgICAgbGFtYmRhTG9nR3JvdXAubG9nR3JvdXBBcm4sXG4gICAgICAgICAgYCR7bGFtYmRhTG9nR3JvdXAubG9nR3JvdXBBcm59OipgLFxuICAgICAgICAgIC8vIFgtUmF5IHBlcm1pc3Npb25zIChyZWdpb24tc2NvcGVkKVxuICAgICAgICAgIGBhcm46YXdzOnhyYXk6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OipgLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdXb3JkUHJlc3NBUEknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ1dvcmRQcmVzcyBSRVNUIEFQSScsXG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgJ0FQSSBHYXRld2F5IGZvciBXb3JkUHJlc3MgUkVTVCBBUEkgYW5kIExhbWJkYSBmdW5jdGlvbnMgKExpZ2h0c2FpbC1iYXNlZCknLFxuICAgICAgLy8gRGlzYWJsZSBkZWZhdWx0IENPUlMgdG8gdXNlIGV4cGxpY2l0IE9QVElPTlMgbWV0aG9kXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHVuZGVmaW5lZCxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiAncHJvZCcsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuT0ZGLCAvLyBEaXNhYmxlIGxvZ2dpbmcgdG8gYXZvaWQgQ2xvdWRXYXRjaCBpc3N1ZXNcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogZmFsc2UsIC8vIENvc3Qgb3B0aW1pemF0aW9uOiBkaXNhYmxlIGRhdGEgdHJhY2luZ1xuICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDEwMCxcbiAgICAgICAgdGhyb3R0bGluZ1JhdGVMaW1pdDogNTAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIGVuZHBvaW50XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgncmVjb21tZW5kYXRpb25zJyk7XG4gICAgcmVjb21tZW5kYXRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFxuICAgICAgJ1BPU1QnLFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVjb21tZW5kYXRpb25zTGFtYmRhLCB7XG4gICAgICAgIHByb3h5OiB0cnVlLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQWRkIE9QVElPTlMgbWV0aG9kIHRoYXQgZ29lcyB0byB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgcmVjb21tZW5kYXRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFxuICAgICAgJ09QVElPTlMnLFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVjb21tZW5kYXRpb25zTGFtYmRhLCB7XG4gICAgICAgIHByb3h5OiB0cnVlLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQVdTIFdBRiBmb3IgQVBJIEdhdGV3YXkgcHJvdGVjdGlvblxuICAgIGNvbnN0IGFwaUdhdGV3YXlXZWJBY2wgPSBuZXcgd2FmdjIuQ2ZuV2ViQUNMKHRoaXMsICdBcGlHYXRld2F5V0FGJywge1xuICAgICAgc2NvcGU6ICdSRUdJT05BTCcsXG4gICAgICBkZWZhdWx0QWN0aW9uOiB7IGFsbG93OiB7fSB9LFxuICAgICAgbmFtZTogJ3dvcmRwcmVzcy1hcGktZ2F0ZXdheS13YWYnLFxuICAgICAgZGVzY3JpcHRpb246ICdXQUYgZm9yIFdvcmRQcmVzcyBBUEkgR2F0ZXdheSAtIHByb3RlY3RzIGFnYWluc3QgY29tbW9uIGF0dGFja3MnLFxuICAgICAgcnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdBV1NNYW5hZ2VkUnVsZXNDb21tb25SdWxlU2V0JyxcbiAgICAgICAgICBwcmlvcml0eTogMSxcbiAgICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICAgIG1hbmFnZWRSdWxlR3JvdXBTdGF0ZW1lbnQ6IHtcbiAgICAgICAgICAgICAgdmVuZG9yTmFtZTogJ0FXUycsXG4gICAgICAgICAgICAgIG5hbWU6ICdBV1NNYW5hZ2VkUnVsZXNDb21tb25SdWxlU2V0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvdmVycmlkZUFjdGlvbjogeyBub25lOiB7fSB9LFxuICAgICAgICAgIHZpc2liaWxpdHlDb25maWc6IHtcbiAgICAgICAgICAgIHNhbXBsZWRSZXF1ZXN0c0VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ29tbW9uUnVsZVNldE1ldHJpYycsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdBV1NNYW5hZ2VkUnVsZXNLbm93bkJhZElucHV0c1J1bGVTZXQnLFxuICAgICAgICAgIHByaW9yaXR5OiAyLFxuICAgICAgICAgIHN0YXRlbWVudDoge1xuICAgICAgICAgICAgbWFuYWdlZFJ1bGVHcm91cFN0YXRlbWVudDoge1xuICAgICAgICAgICAgICB2ZW5kb3JOYW1lOiAnQVdTJyxcbiAgICAgICAgICAgICAgbmFtZTogJ0FXU01hbmFnZWRSdWxlc0tub3duQmFkSW5wdXRzUnVsZVNldCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgb3ZlcnJpZGVBY3Rpb246IHsgbm9uZToge30gfSxcbiAgICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgY2xvdWRXYXRjaE1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJ0tub3duQmFkSW5wdXRzTWV0cmljJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1JhdGVMaW1pdFJ1bGUnLFxuICAgICAgICAgIHByaW9yaXR5OiAzLFxuICAgICAgICAgIHN0YXRlbWVudDoge1xuICAgICAgICAgICAgcmF0ZUJhc2VkU3RhdGVtZW50OiB7XG4gICAgICAgICAgICAgIGxpbWl0OiAyMDAwLFxuICAgICAgICAgICAgICBhZ2dyZWdhdGVLZXlUeXBlOiAnSVAnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFjdGlvbjogeyBibG9jazoge30gfSxcbiAgICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgY2xvdWRXYXRjaE1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJ1JhdGVMaW1pdE1ldHJpYycsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgIHNhbXBsZWRSZXF1ZXN0c0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIGNsb3VkV2F0Y2hNZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgbWV0cmljTmFtZTogJ0FwaUdhdGV3YXlXQUYnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFzc29jaWF0ZSBXQUYgd2l0aCBBUEkgR2F0ZXdheVxuICAgIC8vIE5vdGU6IEFQSSBHYXRld2F5IHN0YWdlIGlzICdwcm9kJyBhcyBkZWZpbmVkIGluIGRlcGxveU9wdGlvbnNcbiAgICBuZXcgd2FmdjIuQ2ZuV2ViQUNMQXNzb2NpYXRpb24odGhpcywgJ0FwaUdhdGV3YXlXQUZBc3NvY2lhdGlvbicsIHtcbiAgICAgIHJlc291cmNlQXJuOiBgYXJuOmF3czphcGlnYXRld2F5OiR7dGhpcy5yZWdpb259OjovcmVzdGFwaXMvJHthcGkucmVzdEFwaUlkfS9zdGFnZXMvcHJvZGAsXG4gICAgICB3ZWJBY2xBcm46IGFwaUdhdGV3YXlXZWJBY2wuYXR0ckFybixcbiAgICB9KTtcblxuICAgIC8vIE5vdGU6IENsb3VkRnJvbnQgZGlzdHJpYnV0aW9ucyB3ZXJlIHJlbW92ZWQgLSBtYWluIHNpdGUgdXNlcyBBbXBsaWZ5LW1hbmFnZWQgQ2xvdWRGcm9udFxuICAgIC8vIEFkbWluIGFuZCBBUEkgZ28gZGlyZWN0bHkgdG8gTGlnaHRzYWlsIChubyBDbG91ZEZyb250IG5lZWRlZClcblxuICAgIC8vIENsb3VkV2F0Y2ggQWxhcm1zIGZvciBtb25pdG9yaW5nXG4gICAgY29uc3QgbGFtYmRhRXJyb3JBbGFybSA9IG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICB0aGlzLFxuICAgICAgJ0xhbWJkYUVycm9yQWxhcm0nLFxuICAgICAge1xuICAgICAgICBtZXRyaWM6IHJlY29tbWVuZGF0aW9uc0xhbWJkYS5tZXRyaWNFcnJvcnMoKSxcbiAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0xhbWJkYSBmdW5jdGlvbiBlcnJvcnMgZXhjZWVkZWQgdGhyZXNob2xkJyxcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS1lcnJvcnMnLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBsYW1iZGFEdXJhdGlvbkFsYXJtID0gbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybShcbiAgICAgIHRoaXMsXG4gICAgICAnTGFtYmRhRHVyYXRpb25BbGFybScsXG4gICAgICB7XG4gICAgICAgIG1ldHJpYzogcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY0R1cmF0aW9uKCksXG4gICAgICAgIHRocmVzaG9sZDogMjUwMDAsIC8vIDI1IHNlY29uZHNcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZHVyYXRpb24gZXhjZWVkZWQgdGhyZXNob2xkJyxcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS1kdXJhdGlvbicsXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IGxhbWJkYVRocm90dGxlQWxhcm0gPSBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkFsYXJtKFxuICAgICAgdGhpcyxcbiAgICAgICdMYW1iZGFUaHJvdHRsZUFsYXJtJyxcbiAgICAgIHtcbiAgICAgICAgbWV0cmljOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljVGhyb3R0bGVzKCksXG4gICAgICAgIHRocmVzaG9sZDogMSxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gdGhyb3R0bGVzIGRldGVjdGVkJyxcbiAgICAgICAgYWxhcm1OYW1lOiAnV29yZFByZXNzQmxvZ1N0YWNrLWxhbWJkYS10aHJvdHRsZXMnLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBETFEgYWxhcm0gZm9yIExhbWJkYSBmYWlsdXJlc1xuICAgIGNvbnN0IGRscUFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0xhbWJkYURMUUFsYXJtJywge1xuICAgICAgbWV0cmljOiBsYW1iZGFETFEubWV0cmljTnVtYmVyT2ZNZXNzYWdlc1JlY2VpdmVkKCksXG4gICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZmFpbHVyZXMgZGV0ZWN0ZWQgaW4gRExRJyxcbiAgICAgIGFsYXJtTmFtZTogJ1dvcmRQcmVzc0Jsb2dTdGFjay1sYW1iZGEtZGxxJyxcbiAgICB9KTtcblxuICAgIC8vIFNOUyBUb3BpYyBmb3IgYWxlcnRzXG4gICAgY29uc3QgYWxlcnRUb3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ0FsZXJ0VG9waWMnLCB7XG4gICAgICB0b3BpY05hbWU6ICdXb3JkUHJlc3NCbG9nU3RhY2stYWxlcnRzJyxcbiAgICAgIGRpc3BsYXlOYW1lOiAnV29yZFByZXNzIEJsb2cgU3RhY2sgQWxlcnRzJyxcbiAgICB9KTtcblxuICAgIC8vIENvbm5lY3QgYWxhcm1zIHRvIFNOUyB0b3BpY1xuICAgIGxhbWJkYUVycm9yQWxhcm0uYWRkQWxhcm1BY3Rpb24oXG4gICAgICBuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKGFsZXJ0VG9waWMpXG4gICAgKTtcbiAgICBsYW1iZGFEdXJhdGlvbkFsYXJtLmFkZEFsYXJtQWN0aW9uKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKVxuICAgICk7XG4gICAgbGFtYmRhVGhyb3R0bGVBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYylcbiAgICApO1xuICAgIGRscUFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYykpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBEYXNoYm9hcmRzIGZvciBtb25pdG9yaW5nXG4gICAgLy8gVEVNUE9SQVJJTFkgQ09NTUVOVEVEIE9VVCB0byByZXNvbHZlIGNpcmN1bGFyIGRlcGVuZGVuY3kgZHVyaW5nIGRlcGxveW1lbnRcbiAgICAvLyBUT0RPOiBSZS1lbmFibGUgYWZ0ZXIgc3VjY2Vzc2Z1bCBkZXBsb3ltZW50XG4gICAgLypcbiAgICBjb25zdCBhcHBsaWNhdGlvbkRhc2hib2FyZCA9IG5ldyBjbG91ZHdhdGNoLkRhc2hib2FyZChcbiAgICAgIHRoaXMsXG4gICAgICAnQXBwbGljYXRpb25EYXNoYm9hcmQnLFxuICAgICAge1xuICAgICAgICBkYXNoYm9hcmROYW1lOiAnQ293Ym95S2ltb25vLXByb2R1Y3Rpb24tYXBwbGljYXRpb24tbWV0cmljcycsXG4gICAgICAgIHdpZGdldHM6IFtcbiAgICAgICAgICAvLyBMYW1iZGEgTWV0cmljc1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdMYW1iZGEgRnVuY3Rpb24gTWV0cmljcycsXG4gICAgICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljSW52b2NhdGlvbnMoKSxcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnNMYW1iZGEubWV0cmljRXJyb3JzKCksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHJpZ2h0OiBbXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY0R1cmF0aW9uKCksXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zTGFtYmRhLm1ldHJpY1Rocm90dGxlcygpLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgICAvLyBBUEkgR2F0ZXdheSBNZXRyaWNzXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgICAgICB0aXRsZTogJ0FQSSBHYXRld2F5IE1ldHJpY3MnLFxuICAgICAgICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDb3VudCcsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQXBpTmFtZTogYXBpLnJlc3RBcGlJZCB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnNVhYRXJyb3InLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaS5yZXN0QXBpSWQgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0xhdGVuY3knLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlOYW1lOiBhcGkucmVzdEFwaUlkIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICc0WFhFcnJvcicsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQXBpTmFtZTogYXBpLnJlc3RBcGlJZCB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgICAvLyBXQUYgTWV0cmljc1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdXQUYgTWV0cmljcycsXG4gICAgICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL1dBRlYyJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdBbGxvd2VkUmVxdWVzdHMnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgICAgICAgIFdlYkFDTDogYXBpR2F0ZXdheVdlYkFjbC5uYW1lISxcbiAgICAgICAgICAgICAgICAgICAgUnVsZTogJ0FMTCcsXG4gICAgICAgICAgICAgICAgICAgIFJlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvV0FGVjInLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0Jsb2NrZWRSZXF1ZXN0cycsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgV2ViQUNMOiBhcGlHYXRld2F5V2ViQWNsLm5hbWUhLFxuICAgICAgICAgICAgICAgICAgICBSdWxlOiAnQUxMJyxcbiAgICAgICAgICAgICAgICAgICAgUmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHJpZ2h0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9XQUZWMicsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ291bnRlZFJlcXVlc3RzJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICAgICAgICBXZWJBQ0w6IGFwaUdhdGV3YXlXZWJBY2wubmFtZSEsXG4gICAgICAgICAgICAgICAgICAgIFJ1bGU6ICdBTEwnLFxuICAgICAgICAgICAgICAgICAgICBSZWdpb246IHRoaXMucmVnaW9uLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLy8gQ3VzdG9tIEFwcGxpY2F0aW9uIE1ldHJpY3NcbiAgICAgICAgICBbXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgICAgIHRpdGxlOiAnQ3VzdG9tIEFwcGxpY2F0aW9uIE1ldHJpY3MnLFxuICAgICAgICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9BUEknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0FQSUNhbGxDb3VudCcsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0FQSScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQVBJQ2FsbER1cmF0aW9uJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnTGFtYmRhL0FQSScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnUmVxdWVzdENvdW50JyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdMYW1iZGEvQVBJJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXNwb25zZVRpbWUnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgICAvLyBDYWNoZSBNZXRyaWNzXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgICAgICB0aXRsZTogJ0NhY2hlIFBlcmZvcm1hbmNlJyxcbiAgICAgICAgICAgICAgbGVmdDogW1xuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdXb3JkUHJlc3MvQ2FjaGUnLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NhY2hlSGl0JyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdXb3JkUHJlc3MvQ2FjaGUnLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NhY2hlTWlzcycsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmlnaHQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0NhY2hlJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZU9wZXJhdGlvbkR1cmF0aW9uJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgIF0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEluZnJhc3RydWN0dXJlIEhlYWx0aCBEYXNoYm9hcmRcbiAgICAvLyBURU1QT1JBUklMWSBDT01NRU5URUQgT1VUIHRvIHJlc29sdmUgY2lyY3VsYXIgZGVwZW5kZW5jeVxuICAgIC8qXG4gICAgY29uc3QgaW5mcmFzdHJ1Y3R1cmVEYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQoXG4gICAgICB0aGlzLFxuICAgICAgJ0luZnJhc3RydWN0dXJlRGFzaGJvYXJkJyxcbiAgICAgIHtcbiAgICAgICAgZGFzaGJvYXJkTmFtZTogJ0Nvd2JveUtpbW9uby1wcm9kdWN0aW9uLWluZnJhc3RydWN0dXJlLWhlYWx0aCcsXG4gICAgICAgIHdpZGdldHM6IFtcbiAgICAgICAgICAvLyBTeXN0ZW0gT3ZlcnZpZXdcbiAgICAgICAgICBbXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5UZXh0V2lkZ2V0KHtcbiAgICAgICAgICAgICAgbWFya2Rvd246IGBcbiMgQ293Ym95IEtpbW9ubyAtIFByb2R1Y3Rpb24gRW52aXJvbm1lbnRcblxuIyMgQXJjaGl0ZWN0dXJlIE92ZXJ2aWV3XG4tICoqRnJvbnRlbmQ6KiogTmV4dC5qcyBvbiBBV1MgQW1wbGlmeSAod2l0aCBBbXBsaWZ5LW1hbmFnZWQgQ2xvdWRGcm9udClcbi0gKipCYWNrZW5kOioqIFdvcmRQcmVzcyBvbiBMaWdodHNhaWxcbi0gKipBUEk6KiogUkVTVCBBUEkgdmlhIFdvcmRQcmVzc1xuLSAqKlNlcnZlcmxlc3M6KiogTGFtYmRhIEZ1bmN0aW9ucyB3aXRoIFdBRiBwcm90ZWN0aW9uXG4tICoqTW9uaXRvcmluZzoqKiBDbG91ZFdhdGNoIERhc2hib2FyZHMgJiBBbGVydHNcblxuIyMgS2V5IEVuZHBvaW50c1xuLSAqKldvcmRQcmVzcyBBUEk6KiogaHR0cHM6Ly9hcGkuY293Ym95a2ltb25vLmNvbVxuLSAqKkFQSSBHYXRld2F5OioqICR7YXBpLnJlc3RBcGlJZH1cblxuIyMgQWxlcnQgQ29uZmlndXJhdGlvblxuLSBMYW1iZGEgZXJyb3JzLCBkdXJhdGlvbiwgdGhyb3R0bGVzLCBhbmQgRExRIG1lc3NhZ2VzXG4tIEFQSSBHYXRld2F5IDRYWC81WFggZXJyb3JzIGFuZCBsYXRlbmN5XG4tIFdBRiBibG9ja2VkL2FsbG93ZWQgcmVxdWVzdHNcbi0gQ3VzdG9tIGFwcGxpY2F0aW9uIG1ldHJpY3NcblxuIyMgUmVzcG9uc2UgVGltZSBUYXJnZXRzXG4tICoqQVBJIENhbGxzOioqIDwgMiBzZWNvbmRzXG4tICoqTGFtYmRhIEZ1bmN0aW9uczoqKiA8IDI1IHNlY29uZHNcbi0gKipQYWdlIExvYWQ6KiogPCAzIHNlY29uZHNcbi0gKipDYWNoZSBIaXQgUmF0ZToqKiA+IDgwJVxuXG5MYXN0IFVwZGF0ZWQ6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxuICAgICAgICAgICAgYCxcbiAgICAgICAgICAgICAgaGVpZ2h0OiA4LFxuICAgICAgICAgICAgICB3aWR0aDogMjQsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIEFsYXJtIFN0YXR1c1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkFsYXJtU3RhdHVzV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdBbGFybSBTdGF0dXMnLFxuICAgICAgICAgICAgICBhbGFybXM6IFtcbiAgICAgICAgICAgICAgICBsYW1iZGFFcnJvckFsYXJtLFxuICAgICAgICAgICAgICAgIGxhbWJkYUR1cmF0aW9uQWxhcm0sXG4gICAgICAgICAgICAgICAgbGFtYmRhVGhyb3R0bGVBbGFybSxcbiAgICAgICAgICAgICAgICBkbHFBbGFybSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgaGVpZ2h0OiA2LFxuICAgICAgICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG4gICAgKi9cbiAgICAvLyBFbmQgb2YgY29tbWVudGVkIGRhc2hib2FyZHNcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUmVjb21tZW5kYXRpb25zRW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogYCR7YXBpLnVybH1yZWNvbW1lbmRhdGlvbnNgLFxuICAgICAgZGVzY3JpcHRpb246ICdSZWNvbW1lbmRhdGlvbnMgQVBJIEVuZHBvaW50JyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcmNoaXRlY3R1cmUnLCB7XG4gICAgICB2YWx1ZTogJ0xpZ2h0c2FpbCBXb3JkUHJlc3Mgd2l0aCBOZXh0LmpzIEZyb250ZW5kIG9uIEFtcGxpZnknLFxuICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IEFyY2hpdGVjdHVyZScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV29yZFByZXNzVVJMJywge1xuICAgICAgdmFsdWU6ICdodHRwczovL2FwaS5jb3dib3lraW1vbm8uY29tJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnV29yZFByZXNzIFJFU1QgQVBJIFVSTCAoTGlnaHRzYWlsKScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV29yZFByZXNzQWRtaW5VUkwnLCB7XG4gICAgICB2YWx1ZTogJ2h0dHBzOi8vYWRtaW4uY293Ym95a2ltb25vLmNvbScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1dvcmRQcmVzcyBBZG1pbiBVUkwgKExpZ2h0c2FpbCknLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xhbWJkYUZ1bmN0aW9uTmFtZScsIHtcbiAgICAgIHZhbHVlOiByZWNvbW1lbmRhdGlvbnNMYW1iZGEuZnVuY3Rpb25OYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdSZWNvbW1lbmRhdGlvbnMgTGFtYmRhIEZ1bmN0aW9uIE5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xhbWJkYUZ1bmN0aW9uQXJuJywge1xuICAgICAgdmFsdWU6IHJlY29tbWVuZGF0aW9uc0xhbWJkYS5mdW5jdGlvbkFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVjb21tZW5kYXRpb25zIExhbWJkYSBGdW5jdGlvbiBBUk4nLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FsZXJ0VG9waWNBcm4nLCB7XG4gICAgICB2YWx1ZTogYWxlcnRUb3BpYy50b3BpY0FybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnU05TIFRvcGljIEFSTiBmb3IgYWxlcnRzJyxcbiAgICB9KTtcblxuICAgIC8vIERhc2hib2FyZCBvdXRwdXRzIHRlbXBvcmFyaWx5IGRpc2FibGVkXG4gICAgLypcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBwbGljYXRpb25EYXNoYm9hcmROYW1lJywge1xuICAgICAgdmFsdWU6IGFwcGxpY2F0aW9uRGFzaGJvYXJkLmRhc2hib2FyZE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FwcGxpY2F0aW9uIG1ldHJpY3MgZGFzaGJvYXJkIG5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0luZnJhc3RydWN0dXJlRGFzaGJvYXJkTmFtZScsIHtcbiAgICAgIHZhbHVlOiBpbmZyYXN0cnVjdHVyZURhc2hib2FyZC5kYXNoYm9hcmROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdJbmZyYXN0cnVjdHVyZSBoZWFsdGggZGFzaGJvYXJkIG5hbWUnLFxuICAgIH0pO1xuICAgICovXG4gIH1cbn1cbiJdfQ==