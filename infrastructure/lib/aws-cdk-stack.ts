import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class WordPressBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
        memorySize: 512, // Optimized from 1024 MB for cost savings
        // Use explicit logGroup instead of logRetention to avoid circular dependency
        logGroup: lambdaLogGroup,
        description: 'WordPress recommendations Lambda function using REST API',
        tracing: lambda.Tracing.ACTIVE,
        environmentEncryption: lambdaEnvKey, // Encrypt environment variables
        deadLetterQueue: lambdaDLQ, // Configure DLQ for error handling
      }
    );

    // Note: KMS permissions are automatically granted by CDK when using environmentEncryption
    // No manual grant needed - CDK handles this automatically

    // Add CloudWatch permissions for monitoring (least privilege - specific ARNs)
    // Use the explicit log group we created (no circular dependency)
    recommendationsLambda.addToRolePolicy(
      new iam.PolicyStatement({
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
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );
    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );
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
