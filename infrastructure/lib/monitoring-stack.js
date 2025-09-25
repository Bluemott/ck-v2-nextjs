'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MonitoringStack = void 0;
const cdk = require('aws-cdk-lib');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const cloudwatchActions = require('aws-cdk-lib/aws-cloudwatch-actions');
const sns = require('aws-cdk-lib/aws-sns');
class MonitoringStack extends cdk.Stack {
  constructor(scope, id, props) {
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
exports.MonitoringStack = MonitoringStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3Jpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUN6RCx3RUFBd0U7QUFDeEUsMkNBQTJDO0FBYzNDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxlQUFlLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFNUgsdUJBQXVCO1FBQ3ZCLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ25ELFNBQVMsRUFBRSxHQUFHLGVBQWUsSUFBSSxXQUFXLFNBQVM7WUFDckQsV0FBVyxFQUFFLEdBQUcsZUFBZSxJQUFJLFdBQVcsU0FBUztTQUN4RCxDQUFDLENBQUM7UUFFSCxrREFBa0Q7UUFDbEQsNkZBQTZGO1FBRTdGLHlCQUF5QjtRQUN6QixJQUFJLGtCQUFrQixFQUFFLENBQUM7WUFDdkIsMEJBQTBCO1lBQzFCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtnQkFDdEUsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztvQkFDNUIsU0FBUyxFQUFFLFlBQVk7b0JBQ3ZCLFVBQVUsRUFBRSxRQUFRO29CQUNwQixTQUFTLEVBQUUsS0FBSztvQkFDaEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDL0IsYUFBYSxFQUFFO3dC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LENBQUM7d0JBQ1QsS0FBSyxFQUFFLEVBQUU7cUJBQ1YsQ0FBQztpQkFDSDthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxVQUFVLENBQUMsUUFBUTtZQUMxQixXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDbEQsS0FBSyxFQUFFLG9CQUFvQixDQUFDLGFBQWE7WUFDekMsV0FBVyxFQUFFLG9DQUFvQztTQUNsRCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDZCQUE2QixFQUFFO1lBQ3JELEtBQUssRUFBRSx1QkFBdUIsQ0FBQyxhQUFhO1lBQzVDLFdBQVcsRUFBRSxzQ0FBc0M7U0FDcEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU87WUFDbkIsV0FBVyxFQUFFLHNCQUFzQjtTQUNwQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE5YkQsMENBOGJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XHJcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2hBY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xyXG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XHJcbmltcG9ydCAqIGFzIHN1YnNjcmlwdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJztcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTW9uaXRvcmluZ1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XHJcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcclxuICBhcHBsaWNhdGlvbk5hbWU6IHN0cmluZztcclxuICBsYW1iZGFGdW5jdGlvbk5hbWU/OiBzdHJpbmc7XHJcbiAgYXBpR2F0ZXdheUlkPzogc3RyaW5nO1xyXG4gIGNsb3VkRnJvbnREaXN0cmlidXRpb25JZD86IHN0cmluZztcclxuICB3b3JkcHJlc3NBcGlVcmw/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNb25pdG9yaW5nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBNb25pdG9yaW5nU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCwgYXBwbGljYXRpb25OYW1lLCBsYW1iZGFGdW5jdGlvbk5hbWUsIGFwaUdhdGV3YXlJZCwgY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkLCB3b3JkcHJlc3NBcGlVcmwgfSA9IHByb3BzO1xyXG5cclxuICAgIC8vIFNOUyBUb3BpYyBmb3IgYWxlcnRzXHJcbiAgICBjb25zdCBhbGVydFRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQWxlcnRUb3BpYycsIHtcclxuICAgICAgdG9waWNOYW1lOiBgJHthcHBsaWNhdGlvbk5hbWV9LSR7ZW52aXJvbm1lbnR9LWFsZXJ0c2AsXHJcbiAgICAgIGRpc3BsYXlOYW1lOiBgJHthcHBsaWNhdGlvbk5hbWV9ICR7ZW52aXJvbm1lbnR9IEFsZXJ0c2AsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBZGQgZW1haWwgc3Vic2NyaXB0aW9uICh1cGRhdGUgd2l0aCB5b3VyIGVtYWlsKVxyXG4gICAgLy8gYWxlcnRUb3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnNjcmlwdGlvbnMuRW1haWxTdWJzY3JpcHRpb24oJ3lvdXItZW1haWxAZXhhbXBsZS5jb20nKSk7XHJcblxyXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uIEFsYXJtc1xyXG4gICAgaWYgKGxhbWJkYUZ1bmN0aW9uTmFtZSkge1xyXG4gICAgICAvLyBMYW1iZGEgRXJyb3IgUmF0ZSBBbGFybVxyXG4gICAgICBjb25zdCBsYW1iZGFFcnJvckFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0xhbWJkYUVycm9yQWxhcm0nLCB7XHJcbiAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXHJcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JzJyxcclxuICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xyXG4gICAgICAgICAgICBGdW5jdGlvbk5hbWU6IGxhbWJkYUZ1bmN0aW9uTmFtZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgdGhyZXNob2xkOiAxLFxyXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxyXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZXJyb3JzIGV4Y2VlZGVkIHRocmVzaG9sZCcsXHJcbiAgICAgICAgYWxhcm1OYW1lOiBgJHthcHBsaWNhdGlvbk5hbWV9LSR7ZW52aXJvbm1lbnR9LWxhbWJkYS1lcnJvcnNgLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIExhbWJkYSBEdXJhdGlvbiBBbGFybVxyXG4gICAgICBjb25zdCBsYW1iZGFEdXJhdGlvbkFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0xhbWJkYUR1cmF0aW9uQWxhcm0nLCB7XHJcbiAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXHJcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnRHVyYXRpb24nLFxyXG4gICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXHJcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xyXG4gICAgICAgICAgICBGdW5jdGlvbk5hbWU6IGxhbWJkYUZ1bmN0aW9uTmFtZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgdGhyZXNob2xkOiAyNTAwMCwgLy8gMjUgc2Vjb25kc1xyXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxyXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZHVyYXRpb24gZXhjZWVkZWQgdGhyZXNob2xkJyxcclxuICAgICAgICBhbGFybU5hbWU6IGAke2FwcGxpY2F0aW9uTmFtZX0tJHtlbnZpcm9ubWVudH0tbGFtYmRhLWR1cmF0aW9uYCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBMYW1iZGEgVGhyb3R0bGVzIEFsYXJtXHJcbiAgICAgIGNvbnN0IGxhbWJkYVRocm90dGxlQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnTGFtYmRhVGhyb3R0bGVBbGFybScsIHtcclxuICAgICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcclxuICAgICAgICAgIG1ldHJpY05hbWU6ICdUaHJvdHRsZXMnLFxyXG4gICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcclxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XHJcbiAgICAgICAgICAgIEZ1bmN0aW9uTmFtZTogbGFtYmRhRnVuY3Rpb25OYW1lLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9KSxcclxuICAgICAgICB0aHJlc2hvbGQ6IDEsXHJcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXHJcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0xhbWJkYSBmdW5jdGlvbiB0aHJvdHRsZXMgZGV0ZWN0ZWQnLFxyXG4gICAgICAgIGFsYXJtTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1sYW1iZGEtdGhyb3R0bGVzYCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBBZGQgYWxhcm1zIHRvIFNOUyB0b3BpY1xyXG4gICAgICBsYW1iZGFFcnJvckFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYykpO1xyXG4gICAgICBsYW1iZGFEdXJhdGlvbkFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYykpO1xyXG4gICAgICBsYW1iZGFUaHJvdHRsZUFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYykpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFQSSBHYXRld2F5IEFsYXJtc1xyXG4gICAgaWYgKGFwaUdhdGV3YXlJZCkge1xyXG4gICAgICAvLyBBUEkgR2F0ZXdheSA1WFggRXJyb3JzXHJcbiAgICAgIGNvbnN0IGFwaUdhdGV3YXk1eHhBbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdBUElHYXRld2F5NXh4QWxhcm0nLCB7XHJcbiAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxyXG4gICAgICAgICAgbWV0cmljTmFtZTogJzVYWEVycm9yJyxcclxuICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xyXG4gICAgICAgICAgICBBcGlOYW1lOiBhcGlHYXRld2F5SWQsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHRocmVzaG9sZDogMSxcclxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcclxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgNVhYIGVycm9ycyBleGNlZWRlZCB0aHJlc2hvbGQnLFxyXG4gICAgICAgIGFsYXJtTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1hcGktNXh4LWVycm9yc2AsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gQVBJIEdhdGV3YXkgNFhYIEVycm9yc1xyXG4gICAgICBjb25zdCBhcGlHYXRld2F5NHh4QWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnQVBJR2F0ZXdheTR4eEFsYXJtJywge1xyXG4gICAgICAgIG1ldHJpYzogbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcclxuICAgICAgICAgIG1ldHJpY05hbWU6ICc0WFhFcnJvcicsXHJcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcclxuICAgICAgICAgICAgQXBpTmFtZTogYXBpR2F0ZXdheUlkLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9KSxcclxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxyXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxyXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSA0WFggZXJyb3JzIGV4Y2VlZGVkIHRocmVzaG9sZCcsXHJcbiAgICAgICAgYWxhcm1OYW1lOiBgJHthcHBsaWNhdGlvbk5hbWV9LSR7ZW52aXJvbm1lbnR9LWFwaS00eHgtZXJyb3JzYCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBBUEkgR2F0ZXdheSBMYXRlbmN5XHJcbiAgICAgIGNvbnN0IGFwaUdhdGV3YXlMYXRlbmN5QWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnQVBJR2F0ZXdheUxhdGVuY3lBbGFybScsIHtcclxuICAgICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXHJcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnTGF0ZW5jeScsXHJcbiAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XHJcbiAgICAgICAgICAgIEFwaU5hbWU6IGFwaUdhdGV3YXlJZCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgdGhyZXNob2xkOiAyMDAwLCAvLyAyIHNlY29uZHNcclxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcclxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgbGF0ZW5jeSBleGNlZWRlZCB0aHJlc2hvbGQnLFxyXG4gICAgICAgIGFsYXJtTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1hcGktbGF0ZW5jeWAsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gQWRkIGFsYXJtcyB0byBTTlMgdG9waWNcclxuICAgICAgYXBpR2F0ZXdheTV4eEFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYykpO1xyXG4gICAgICBhcGlHYXRld2F5NHh4QWxhcm0uYWRkQWxhcm1BY3Rpb24obmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKSk7XHJcbiAgICAgIGFwaUdhdGV3YXlMYXRlbmN5QWxhcm0uYWRkQWxhcm1BY3Rpb24obmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2xvdWRGcm9udCBBbGFybXNcclxuICAgIGlmIChjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQpIHtcclxuICAgICAgLy8gQ2xvdWRGcm9udCBFcnJvciBSYXRlXHJcbiAgICAgIGNvbnN0IGNsb3VkRnJvbnRFcnJvckFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0Nsb3VkRnJvbnRFcnJvckFsYXJtJywge1xyXG4gICAgICAgIG1ldHJpYzogbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcclxuICAgICAgICAgIG1ldHJpY05hbWU6ICdFcnJvclJhdGUnLFxyXG4gICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXHJcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xyXG4gICAgICAgICAgICBEaXN0cmlidXRpb25JZDogY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkLFxyXG4gICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9KSxcclxuICAgICAgICB0aHJlc2hvbGQ6IDEsIC8vIDElIGVycm9yIHJhdGVcclxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcclxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBlcnJvciByYXRlIGV4Y2VlZGVkIHRocmVzaG9sZCcsXHJcbiAgICAgICAgYWxhcm1OYW1lOiBgJHthcHBsaWNhdGlvbk5hbWV9LSR7ZW52aXJvbm1lbnR9LWNsb3VkZnJvbnQtZXJyb3JzYCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBDbG91ZEZyb250IENhY2hlIEhpdCBSYXRlXHJcbiAgICAgIGNvbnN0IGNsb3VkRnJvbnRDYWNoZUhpdEFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0Nsb3VkRnJvbnRDYWNoZUhpdEFsYXJtJywge1xyXG4gICAgICAgIG1ldHJpYzogbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcclxuICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZUhpdFJhdGUnLFxyXG4gICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXHJcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xyXG4gICAgICAgICAgICBEaXN0cmlidXRpb25JZDogY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkLFxyXG4gICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9KSxcclxuICAgICAgICB0aHJlc2hvbGQ6IDgwLCAvLyA4MCUgY2FjaGUgaGl0IHJhdGVcclxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcclxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6IGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkxFU1NfVEhBTl9USFJFU0hPTEQsXHJcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgY2FjaGUgaGl0IHJhdGUgYmVsb3cgdGhyZXNob2xkJyxcclxuICAgICAgICBhbGFybU5hbWU6IGAke2FwcGxpY2F0aW9uTmFtZX0tJHtlbnZpcm9ubWVudH0tY2xvdWRmcm9udC1jYWNoZS1oaXRgLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEFkZCBhbGFybXMgdG8gU05TIHRvcGljXHJcbiAgICAgIGNsb3VkRnJvbnRFcnJvckFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYykpO1xyXG4gICAgICBjbG91ZEZyb250Q2FjaGVIaXRBbGFybS5hZGRBbGFybUFjdGlvbihuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKGFsZXJ0VG9waWMpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDdXN0b20gQXBwbGljYXRpb24gTWV0cmljcyBEYXNoYm9hcmRcclxuICAgIGNvbnN0IGFwcGxpY2F0aW9uRGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdBcHBsaWNhdGlvbkRhc2hib2FyZCcsIHtcclxuICAgICAgZGFzaGJvYXJkTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1hcHBsaWNhdGlvbi1tZXRyaWNzYCxcclxuICAgICAgd2lkZ2V0czogW1xyXG4gICAgICAgIC8vIExhbWJkYSBNZXRyaWNzXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xyXG4gICAgICAgICAgICB0aXRsZTogJ0xhbWJkYSBGdW5jdGlvbiBNZXRyaWNzJyxcclxuICAgICAgICAgICAgbGVmdDogbGFtYmRhRnVuY3Rpb25OYW1lID8gW1xyXG4gICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcclxuICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdJbnZvY2F0aW9ucycsXHJcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgRnVuY3Rpb25OYW1lOiBsYW1iZGFGdW5jdGlvbk5hbWUgfSxcclxuICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JzJyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBGdW5jdGlvbk5hbWU6IGxhbWJkYUZ1bmN0aW9uTmFtZSB9LFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBdIDogW10sXHJcbiAgICAgICAgICAgIHJpZ2h0OiBsYW1iZGFGdW5jdGlvbk5hbWUgPyBbXHJcbiAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9MYW1iZGEnLFxyXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0R1cmF0aW9uJyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxyXG4gICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgRnVuY3Rpb25OYW1lOiBsYW1iZGFGdW5jdGlvbk5hbWUgfSxcclxuICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnVGhyb3R0bGVzJyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBGdW5jdGlvbk5hbWU6IGxhbWJkYUZ1bmN0aW9uTmFtZSB9LFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBdIDogW10sXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIC8vIEFQSSBHYXRld2F5IE1ldHJpY3NcclxuICAgICAgICBbXHJcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnQVBJIEdhdGV3YXkgTWV0cmljcycsXHJcbiAgICAgICAgICAgIGxlZnQ6IGFwaUdhdGV3YXlJZCA/IFtcclxuICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxyXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NvdW50JyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlOYW1lOiBhcGlHYXRld2F5SWQgfSxcclxuICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxyXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJzVYWEVycm9yJyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBBcGlOYW1lOiBhcGlHYXRld2F5SWQgfSxcclxuICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgXSA6IFtdLFxyXG4gICAgICAgICAgICByaWdodDogYXBpR2F0ZXdheUlkID8gW1xyXG4gICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnTGF0ZW5jeScsXHJcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaUdhdGV3YXlJZCB9LFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnNFhYRXJyb3InLFxyXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcclxuICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaUdhdGV3YXlJZCB9LFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBdIDogW10sXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIC8vIENsb3VkRnJvbnQgTWV0cmljc1xyXG4gICAgICAgIFtcclxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcclxuICAgICAgICAgICAgdGl0bGU6ICdDbG91ZEZyb250IE1ldHJpY3MnLFxyXG4gICAgICAgICAgICBsZWZ0OiBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQgPyBbXHJcbiAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcclxuICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXF1ZXN0cycsXHJcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgRGlzdHJpYnV0aW9uSWQ6IGNsb3VkRnJvbnREaXN0cmlidXRpb25JZCwgUmVnaW9uOiAnR2xvYmFsJyB9LFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JSYXRlJyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxyXG4gICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgRGlzdHJpYnV0aW9uSWQ6IGNsb3VkRnJvbnREaXN0cmlidXRpb25JZCwgUmVnaW9uOiAnR2xvYmFsJyB9LFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBdIDogW10sXHJcbiAgICAgICAgICAgIHJpZ2h0OiBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQgPyBbXHJcbiAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcclxuICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZUhpdFJhdGUnLFxyXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBEaXN0cmlidXRpb25JZDogY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkLCBSZWdpb246ICdHbG9iYWwnIH0sXHJcbiAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcclxuICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdCeXRlc0Rvd25sb2FkZWQnLFxyXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcclxuICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IERpc3RyaWJ1dGlvbklkOiBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQsIFJlZ2lvbjogJ0dsb2JhbCcgfSxcclxuICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgXSA6IFtdLFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgXSxcclxuICAgICAgICAvLyBDdXN0b20gQXBwbGljYXRpb24gTWV0cmljc1xyXG4gICAgICAgIFtcclxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcclxuICAgICAgICAgICAgdGl0bGU6ICdDdXN0b20gQXBwbGljYXRpb24gTWV0cmljcycsXHJcbiAgICAgICAgICAgIGxlZnQ6IFtcclxuICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0FQSScsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQVBJQ2FsbENvdW50JyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdXb3JkUHJlc3MvQVBJJyxcclxuICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdBUElDYWxsRHVyYXRpb24nLFxyXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICByaWdodDogW1xyXG4gICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdMYW1iZGEvQVBJJyxcclxuICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXF1ZXN0Q291bnQnLFxyXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcclxuICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0xhbWJkYS9BUEknLFxyXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ1Jlc3BvbnNlVGltZScsXHJcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcclxuICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIC8vIENhY2hlIE1ldHJpY3NcclxuICAgICAgICBbXHJcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnQ2FjaGUgUGVyZm9ybWFuY2UnLFxyXG4gICAgICAgICAgICBsZWZ0OiBbXHJcbiAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9DYWNoZScsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ2FjaGVIaXQnLFxyXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcclxuICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9DYWNoZScsXHJcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ2FjaGVNaXNzJyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICByaWdodDogW1xyXG4gICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdXb3JkUHJlc3MvQ2FjaGUnLFxyXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NhY2hlT3BlcmF0aW9uRHVyYXRpb24nLFxyXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXHJcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgXSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluZnJhc3RydWN0dXJlIEhlYWx0aCBEYXNoYm9hcmRcclxuICAgIGNvbnN0IGluZnJhc3RydWN0dXJlRGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdJbmZyYXN0cnVjdHVyZURhc2hib2FyZCcsIHtcclxuICAgICAgZGFzaGJvYXJkTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1pbmZyYXN0cnVjdHVyZS1oZWFsdGhgLFxyXG4gICAgICB3aWRnZXRzOiBbXHJcbiAgICAgICAgLy8gU3lzdGVtIE92ZXJ2aWV3XHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guVGV4dFdpZGdldCh7XHJcbiAgICAgICAgICAgIG1hcmtkb3duOiBgXHJcbiMgJHthcHBsaWNhdGlvbk5hbWV9IC0gJHtlbnZpcm9ubWVudH0gRW52aXJvbm1lbnRcclxuXHJcbiMjIEFyY2hpdGVjdHVyZSBPdmVydmlld1xyXG4tICoqRnJvbnRlbmQ6KiogTmV4dC5qcyBvbiBBV1MgQW1wbGlmeVxyXG4tICoqQmFja2VuZDoqKiBXb3JkUHJlc3Mgb24gTGlnaHRzYWlsXHJcbi0gKipBUEk6KiogUkVTVCBBUEkgdmlhIFdvcmRQcmVzc1xyXG4tICoqQ0ROOioqIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uXHJcbi0gKipTZXJ2ZXJsZXNzOioqIExhbWJkYSBGdW5jdGlvbnNcclxuLSAqKk1vbml0b3Jpbmc6KiogQ2xvdWRXYXRjaCBEYXNoYm9hcmRzICYgQWxlcnRzXHJcblxyXG4jIyBLZXkgRW5kcG9pbnRzXHJcbi0gKipXb3JkUHJlc3MgQVBJOioqICR7d29yZHByZXNzQXBpVXJsIHx8ICdhcGkuY293Ym95a2ltb25vLmNvbSd9XHJcbi0gKipMYW1iZGEgRnVuY3Rpb246KiogJHtsYW1iZGFGdW5jdGlvbk5hbWUgfHwgJ05vdCBjb25maWd1cmVkJ31cclxuLSAqKkNsb3VkRnJvbnQ6KiogJHtjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQgfHwgJ05vdCBjb25maWd1cmVkJ31cclxuXHJcbiMjIEFsZXJ0IENvbmZpZ3VyYXRpb25cclxuLSBMYW1iZGEgZXJyb3JzLCBkdXJhdGlvbiwgYW5kIHRocm90dGxlc1xyXG4tIEFQSSBHYXRld2F5IDRYWC81WFggZXJyb3JzIGFuZCBsYXRlbmN5XHJcbi0gQ2xvdWRGcm9udCBlcnJvciByYXRlIGFuZCBjYWNoZSBwZXJmb3JtYW5jZVxyXG4tIEN1c3RvbSBhcHBsaWNhdGlvbiBtZXRyaWNzXHJcblxyXG4jIyBSZXNwb25zZSBUaW1lIFRhcmdldHNcclxuLSAqKkFQSSBDYWxsczoqKiA8IDIgc2Vjb25kc1xyXG4tICoqTGFtYmRhIEZ1bmN0aW9uczoqKiA8IDI1IHNlY29uZHNcclxuLSAqKlBhZ2UgTG9hZDoqKiA8IDMgc2Vjb25kc1xyXG4tICoqQ2FjaGUgSGl0IFJhdGU6KiogPiA4MCVcclxuXHJcbkxhc3QgVXBkYXRlZDogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XHJcbiAgICAgICAgICAgIGAsXHJcbiAgICAgICAgICAgIGhlaWdodDogOCxcclxuICAgICAgICAgICAgd2lkdGg6IDI0LFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgXSxcclxuICAgICAgICAvLyBBbGFybSBTdGF0dXNcclxuICAgICAgICBbXHJcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5BbGFybVN0YXR1c1dpZGdldCh7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnQWxhcm0gU3RhdHVzJyxcclxuICAgICAgICAgICAgYWxhcm1zOiBsYW1iZGFGdW5jdGlvbk5hbWUgPyBbXHJcbiAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ1N0YXR1c0xhbWJkYUVycm9yJywge1xyXG4gICAgICAgICAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcclxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0Vycm9ycycsXHJcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXHJcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgRnVuY3Rpb25OYW1lOiBsYW1iZGFGdW5jdGlvbk5hbWUgfSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgdGhyZXNob2xkOiAxLFxyXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXHJcbiAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIF0gOiBbXSxcclxuICAgICAgICAgICAgaGVpZ2h0OiA2LFxyXG4gICAgICAgICAgICB3aWR0aDogMTIsXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICBdLFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gT3V0cHV0c1xyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FsZXJ0VG9waWNBcm4nLCB7XHJcbiAgICAgIHZhbHVlOiBhbGVydFRvcGljLnRvcGljQXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1NOUyBUb3BpYyBBUk4gZm9yIGFsZXJ0cycsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBwbGljYXRpb25EYXNoYm9hcmROYW1lJywge1xyXG4gICAgICB2YWx1ZTogYXBwbGljYXRpb25EYXNoYm9hcmQuZGFzaGJvYXJkTmFtZSxcclxuICAgICAgZGVzY3JpcHRpb246ICdBcHBsaWNhdGlvbiBtZXRyaWNzIGRhc2hib2FyZCBuYW1lJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdJbmZyYXN0cnVjdHVyZURhc2hib2FyZE5hbWUnLCB7XHJcbiAgICAgIHZhbHVlOiBpbmZyYXN0cnVjdHVyZURhc2hib2FyZC5kYXNoYm9hcmROYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0luZnJhc3RydWN0dXJlIGhlYWx0aCBkYXNoYm9hcmQgbmFtZScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTW9uaXRvcmluZ1N0YWNrQXJuJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy5zdGFja0lkLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ01vbml0b3Jpbmcgc3RhY2sgQVJOJyxcclxuICAgIH0pO1xyXG4gIH1cclxufSAiXX0=
