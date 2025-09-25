import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  environment: string;
  applicationName: string;
  lambdaFunctionName?: string;
  apiGatewayId?: string;
  cloudFrontDistributionId?: string;
  wordpressApiUrl?: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const {
      environment,
      applicationName,
      lambdaFunctionName,
      apiGatewayId,
      cloudFrontDistributionId,
      wordpressApiUrl,
    } = props;

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `${applicationName}-${environment}-alerts`,
      displayName: `${applicationName} ${environment} Alerts`,
    });

    // Email notifications are now handled by AWS WorkMail
    // To receive alerts, configure WorkMail to forward to your desired email address

    // Lambda Function Alarms
    if (lambdaFunctionName) {
      // Lambda Error Rate Alarm
      const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            FunctionName: lambdaFunctionName,
          },
        }),
        threshold: 1,
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function errors exceeded threshold',
        alarmName: `${applicationName}-${environment}-lambda-errors`,
      });

      // Lambda Duration Alarm
      const lambdaDurationAlarm = new cloudwatch.Alarm(
        this,
        'LambdaDurationAlarm',
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              FunctionName: lambdaFunctionName,
            },
          }),
          threshold: 25000, // 25 seconds
          evaluationPeriods: 2,
          alarmDescription: 'Lambda function duration exceeded threshold',
          alarmName: `${applicationName}-${environment}-lambda-duration`,
        }
      );

      // Lambda Throttles Alarm
      const lambdaThrottleAlarm = new cloudwatch.Alarm(
        this,
        'LambdaThrottleAlarm',
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Throttles',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              FunctionName: lambdaFunctionName,
            },
          }),
          threshold: 1,
          evaluationPeriods: 2,
          alarmDescription: 'Lambda function throttles detected',
          alarmName: `${applicationName}-${environment}-lambda-throttles`,
        }
      );

      // Add alarms to SNS topic
      lambdaErrorAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
      lambdaDurationAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
      lambdaThrottleAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
    }

    // API Gateway Alarms
    if (apiGatewayId) {
      // API Gateway 5XX Errors
      const apiGateway5xxAlarm = new cloudwatch.Alarm(
        this,
        'APIGateway5xxAlarm',
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              ApiName: apiGatewayId,
            },
          }),
          threshold: 1,
          evaluationPeriods: 2,
          alarmDescription: 'API Gateway 5XX errors exceeded threshold',
          alarmName: `${applicationName}-${environment}-api-5xx-errors`,
        }
      );

      // API Gateway 4XX Errors
      const apiGateway4xxAlarm = new cloudwatch.Alarm(
        this,
        'APIGateway4xxAlarm',
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              ApiName: apiGatewayId,
            },
          }),
          threshold: 10,
          evaluationPeriods: 2,
          alarmDescription: 'API Gateway 4XX errors exceeded threshold',
          alarmName: `${applicationName}-${environment}-api-4xx-errors`,
        }
      );

      // API Gateway Latency
      const apiGatewayLatencyAlarm = new cloudwatch.Alarm(
        this,
        'APIGatewayLatencyAlarm',
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              ApiName: apiGatewayId,
            },
          }),
          threshold: 2000, // 2 seconds
          evaluationPeriods: 2,
          alarmDescription: 'API Gateway latency exceeded threshold',
          alarmName: `${applicationName}-${environment}-api-latency`,
        }
      );

      // Add alarms to SNS topic
      apiGateway5xxAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
      apiGateway4xxAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
      apiGatewayLatencyAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
    }

    // CloudFront Alarms
    if (cloudFrontDistributionId) {
      // CloudFront Error Rate
      const cloudFrontErrorAlarm = new cloudwatch.Alarm(
        this,
        'CloudFrontErrorAlarm',
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'ErrorRate',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              DistributionId: cloudFrontDistributionId,
              Region: 'Global',
            },
          }),
          threshold: 1, // 1% error rate
          evaluationPeriods: 2,
          alarmDescription: 'CloudFront error rate exceeded threshold',
          alarmName: `${applicationName}-${environment}-cloudfront-errors`,
        }
      );

      // CloudFront Cache Hit Rate
      const cloudFrontCacheHitAlarm = new cloudwatch.Alarm(
        this,
        'CloudFrontCacheHitAlarm',
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'CacheHitRate',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              DistributionId: cloudFrontDistributionId,
              Region: 'Global',
            },
          }),
          threshold: 80, // 80% cache hit rate
          evaluationPeriods: 2,
          comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
          alarmDescription: 'CloudFront cache hit rate below threshold',
          alarmName: `${applicationName}-${environment}-cloudfront-cache-hit`,
        }
      );

      // Add alarms to SNS topic
      cloudFrontErrorAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
      cloudFrontCacheHitAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
    }

    // Custom Application Metrics Dashboard
    const applicationDashboard = new cloudwatch.Dashboard(
      this,
      'ApplicationDashboard',
      {
        dashboardName: `${applicationName}-${environment}-application-metrics`,
        widgets: [
          // Lambda Metrics
          [
            new cloudwatch.GraphWidget({
              title: 'Lambda Function Metrics',
              left: lambdaFunctionName
                ? [
                    new cloudwatch.Metric({
                      namespace: 'AWS/Lambda',
                      metricName: 'Invocations',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: { FunctionName: lambdaFunctionName },
                    }),
                    new cloudwatch.Metric({
                      namespace: 'AWS/Lambda',
                      metricName: 'Errors',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: { FunctionName: lambdaFunctionName },
                    }),
                  ]
                : [],
              right: lambdaFunctionName
                ? [
                    new cloudwatch.Metric({
                      namespace: 'AWS/Lambda',
                      metricName: 'Duration',
                      statistic: 'Average',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: { FunctionName: lambdaFunctionName },
                    }),
                    new cloudwatch.Metric({
                      namespace: 'AWS/Lambda',
                      metricName: 'Throttles',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: { FunctionName: lambdaFunctionName },
                    }),
                  ]
                : [],
            }),
          ],
          // API Gateway Metrics
          [
            new cloudwatch.GraphWidget({
              title: 'API Gateway Metrics',
              left: apiGatewayId
                ? [
                    new cloudwatch.Metric({
                      namespace: 'AWS/ApiGateway',
                      metricName: 'Count',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: { ApiName: apiGatewayId },
                    }),
                    new cloudwatch.Metric({
                      namespace: 'AWS/ApiGateway',
                      metricName: '5XXError',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: { ApiName: apiGatewayId },
                    }),
                  ]
                : [],
              right: apiGatewayId
                ? [
                    new cloudwatch.Metric({
                      namespace: 'AWS/ApiGateway',
                      metricName: 'Latency',
                      statistic: 'Average',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: { ApiName: apiGatewayId },
                    }),
                    new cloudwatch.Metric({
                      namespace: 'AWS/ApiGateway',
                      metricName: '4XXError',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: { ApiName: apiGatewayId },
                    }),
                  ]
                : [],
            }),
          ],
          // CloudFront Metrics
          [
            new cloudwatch.GraphWidget({
              title: 'CloudFront Metrics',
              left: cloudFrontDistributionId
                ? [
                    new cloudwatch.Metric({
                      namespace: 'AWS/CloudFront',
                      metricName: 'Requests',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: {
                        DistributionId: cloudFrontDistributionId,
                        Region: 'Global',
                      },
                    }),
                    new cloudwatch.Metric({
                      namespace: 'AWS/CloudFront',
                      metricName: 'ErrorRate',
                      statistic: 'Average',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: {
                        DistributionId: cloudFrontDistributionId,
                        Region: 'Global',
                      },
                    }),
                  ]
                : [],
              right: cloudFrontDistributionId
                ? [
                    new cloudwatch.Metric({
                      namespace: 'AWS/CloudFront',
                      metricName: 'CacheHitRate',
                      statistic: 'Average',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: {
                        DistributionId: cloudFrontDistributionId,
                        Region: 'Global',
                      },
                    }),
                    new cloudwatch.Metric({
                      namespace: 'AWS/CloudFront',
                      metricName: 'BytesDownloaded',
                      statistic: 'Sum',
                      period: cdk.Duration.minutes(5),
                      dimensionsMap: {
                        DistributionId: cloudFrontDistributionId,
                        Region: 'Global',
                      },
                    }),
                  ]
                : [],
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
        dashboardName: `${applicationName}-${environment}-infrastructure-health`,
        widgets: [
          // System Overview
          [
            new cloudwatch.TextWidget({
              markdown: `
# ${applicationName} - ${environment} Environment

## Architecture Overview
- **Frontend:** Next.js on AWS Amplify
- **Backend:** WordPress on Lightsail
- **API:** REST API via WordPress
- **CDN:** CloudFront Distribution
- **Serverless:** Lambda Functions
- **Monitoring:** CloudWatch Dashboards & Alerts

## Key Endpoints
- **WordPress API:** ${wordpressApiUrl || 'api.cowboykimono.com'}
- **Lambda Function:** ${lambdaFunctionName || 'Not configured'}
- **CloudFront:** ${cloudFrontDistributionId || 'Not configured'}

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
              alarms: lambdaFunctionName
                ? [
                    new cloudwatch.Alarm(this, 'StatusLambdaError', {
                      metric: new cloudwatch.Metric({
                        namespace: 'AWS/Lambda',
                        metricName: 'Errors',
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                        dimensionsMap: { FunctionName: lambdaFunctionName },
                      }),
                      threshold: 1,
                      evaluationPeriods: 1,
                    }),
                  ]
                : [],
              height: 6,
              width: 12,
            }),
          ],
        ],
      }
    );

    // Outputs
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

    new cdk.CfnOutput(this, 'MonitoringStackArn', {
      value: this.stackId,
      description: 'Monitoring stack ARN',
    });
  }
}
