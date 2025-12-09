"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringStack = void 0;
const cdk = require("aws-cdk-lib");
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const cloudwatchActions = require("aws-cdk-lib/aws-cloudwatch-actions");
const sns = require("aws-cdk-lib/aws-sns");
class MonitoringStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environment, applicationName, lambdaFunctionName, apiGatewayId, cloudFrontDistributionId, wordpressApiUrl, } = props;
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
            const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
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
            });
            // Lambda Throttles Alarm
            const lambdaThrottleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
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
            });
            // Add alarms to SNS topic
            lambdaErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
            lambdaDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
            lambdaThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        }
        // API Gateway Alarms
        if (apiGatewayId) {
            // API Gateway 5XX Errors
            const apiGateway5xxAlarm = new cloudwatch.Alarm(this, 'APIGateway5xxAlarm', {
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
            });
            // API Gateway 4XX Errors
            const apiGateway4xxAlarm = new cloudwatch.Alarm(this, 'APIGateway4xxAlarm', {
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
            });
            // API Gateway Latency
            const apiGatewayLatencyAlarm = new cloudwatch.Alarm(this, 'APIGatewayLatencyAlarm', {
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
            });
            // Add alarms to SNS topic
            apiGateway5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
            apiGateway4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
            apiGatewayLatencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        }
        // CloudFront Alarms
        if (cloudFrontDistributionId) {
            // CloudFront Error Rate
            const cloudFrontErrorAlarm = new cloudwatch.Alarm(this, 'CloudFrontErrorAlarm', {
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
            });
            // CloudFront Cache Hit Rate
            const cloudFrontCacheHitAlarm = new cloudwatch.Alarm(this, 'CloudFrontCacheHitAlarm', {
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
            });
            // Add alarms to SNS topic
            cloudFrontErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
            cloudFrontCacheHitAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
        }
        // Custom Application Metrics Dashboard
        const applicationDashboard = new cloudwatch.Dashboard(this, 'ApplicationDashboard', {
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
        });
        // Infrastructure Health Dashboard
        const infrastructureDashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
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
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3Jpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUN6RCx3RUFBd0U7QUFDeEUsMkNBQTJDO0FBWTNDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFDSixXQUFXLEVBQ1gsZUFBZSxFQUNmLGtCQUFrQixFQUNsQixZQUFZLEVBQ1osd0JBQXdCLEVBQ3hCLGVBQWUsR0FDaEIsR0FBRyxLQUFLLENBQUM7UUFFVix1QkFBdUI7UUFDdkIsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbkQsU0FBUyxFQUFFLEdBQUcsZUFBZSxJQUFJLFdBQVcsU0FBUztZQUNyRCxXQUFXLEVBQUUsR0FBRyxlQUFlLElBQUksV0FBVyxTQUFTO1NBQ3hELENBQUMsQ0FBQztRQUVILHNEQUFzRDtRQUN0RCxpRkFBaUY7UUFFakYseUJBQXlCO1FBQ3pCLElBQUksa0JBQWtCLEVBQUUsQ0FBQztZQUN2QiwwQkFBMEI7WUFDMUIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO2dCQUN0RSxNQUFNLEVBQUUsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUM1QixTQUFTLEVBQUUsWUFBWTtvQkFDdkIsVUFBVSxFQUFFLFFBQVE7b0JBQ3BCLFNBQVMsRUFBRSxLQUFLO29CQUNoQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUMvQixhQUFhLEVBQUU7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QixDQUFDOzZCQUNIOzRCQUNILENBQUMsQ0FBQyxFQUFFO3dCQUNOLE1BQU0sRUFBRSxDQUFDO3dCQUNULEtBQUssRUFBRSxFQUFFO3FCQUNWLENBQUM7aUJBQ0g7YUFDRjtTQUNGLENBQ0YsQ0FBQztRQUVGLFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsVUFBVSxDQUFDLFFBQVE7WUFDMUIsV0FBVyxFQUFFLDBCQUEwQjtTQUN4QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ2xELEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxhQUFhO1lBQ3pDLFdBQVcsRUFBRSxvQ0FBb0M7U0FDbEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSw2QkFBNkIsRUFBRTtZQUNyRCxLQUFLLEVBQUUsdUJBQXVCLENBQUMsYUFBYTtZQUM1QyxXQUFXLEVBQUUsc0NBQXNDO1NBQ3BELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDNUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPO1lBQ25CLFdBQVcsRUFBRSxzQkFBc0I7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbmhCRCwwQ0FtaEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaEFjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gtYWN0aW9ucyc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBNb25pdG9yaW5nU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgYXBwbGljYXRpb25OYW1lOiBzdHJpbmc7XG4gIGxhbWJkYUZ1bmN0aW9uTmFtZT86IHN0cmluZztcbiAgYXBpR2F0ZXdheUlkPzogc3RyaW5nO1xuICBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQ/OiBzdHJpbmc7XG4gIHdvcmRwcmVzc0FwaVVybD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIE1vbml0b3JpbmdTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBNb25pdG9yaW5nU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qge1xuICAgICAgZW52aXJvbm1lbnQsXG4gICAgICBhcHBsaWNhdGlvbk5hbWUsXG4gICAgICBsYW1iZGFGdW5jdGlvbk5hbWUsXG4gICAgICBhcGlHYXRld2F5SWQsXG4gICAgICBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQsXG4gICAgICB3b3JkcHJlc3NBcGlVcmwsXG4gICAgfSA9IHByb3BzO1xuXG4gICAgLy8gU05TIFRvcGljIGZvciBhbGVydHNcbiAgICBjb25zdCBhbGVydFRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQWxlcnRUb3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1hbGVydHNgLFxuICAgICAgZGlzcGxheU5hbWU6IGAke2FwcGxpY2F0aW9uTmFtZX0gJHtlbnZpcm9ubWVudH0gQWxlcnRzYCxcbiAgICB9KTtcblxuICAgIC8vIEVtYWlsIG5vdGlmaWNhdGlvbnMgYXJlIG5vdyBoYW5kbGVkIGJ5IEFXUyBXb3JrTWFpbFxuICAgIC8vIFRvIHJlY2VpdmUgYWxlcnRzLCBjb25maWd1cmUgV29ya01haWwgdG8gZm9yd2FyZCB0byB5b3VyIGRlc2lyZWQgZW1haWwgYWRkcmVzc1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uIEFsYXJtc1xuICAgIGlmIChsYW1iZGFGdW5jdGlvbk5hbWUpIHtcbiAgICAgIC8vIExhbWJkYSBFcnJvciBSYXRlIEFsYXJtXG4gICAgICBjb25zdCBsYW1iZGFFcnJvckFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0xhbWJkYUVycm9yQWxhcm0nLCB7XG4gICAgICAgIG1ldHJpYzogbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JzJyxcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgRnVuY3Rpb25OYW1lOiBsYW1iZGFGdW5jdGlvbk5hbWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIHRocmVzaG9sZDogMSxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZXJyb3JzIGV4Y2VlZGVkIHRocmVzaG9sZCcsXG4gICAgICAgIGFsYXJtTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1sYW1iZGEtZXJyb3JzYCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBMYW1iZGEgRHVyYXRpb24gQWxhcm1cbiAgICAgIGNvbnN0IGxhbWJkYUR1cmF0aW9uQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgJ0xhbWJkYUR1cmF0aW9uQWxhcm0nLFxuICAgICAgICB7XG4gICAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnRHVyYXRpb24nLFxuICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBGdW5jdGlvbk5hbWU6IGxhbWJkYUZ1bmN0aW9uTmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGhyZXNob2xkOiAyNTAwMCwgLy8gMjUgc2Vjb25kc1xuICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZHVyYXRpb24gZXhjZWVkZWQgdGhyZXNob2xkJyxcbiAgICAgICAgICBhbGFybU5hbWU6IGAke2FwcGxpY2F0aW9uTmFtZX0tJHtlbnZpcm9ubWVudH0tbGFtYmRhLWR1cmF0aW9uYCxcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgLy8gTGFtYmRhIFRocm90dGxlcyBBbGFybVxuICAgICAgY29uc3QgbGFtYmRhVGhyb3R0bGVBbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKFxuICAgICAgICB0aGlzLFxuICAgICAgICAnTGFtYmRhVGhyb3R0bGVBbGFybScsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdUaHJvdHRsZXMnLFxuICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgIEZ1bmN0aW9uTmFtZTogbGFtYmRhRnVuY3Rpb25OYW1lLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0xhbWJkYSBmdW5jdGlvbiB0aHJvdHRsZXMgZGV0ZWN0ZWQnLFxuICAgICAgICAgIGFsYXJtTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1sYW1iZGEtdGhyb3R0bGVzYCxcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgLy8gQWRkIGFsYXJtcyB0byBTTlMgdG9waWNcbiAgICAgIGxhbWJkYUVycm9yQWxhcm0uYWRkQWxhcm1BY3Rpb24oXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYylcbiAgICAgICk7XG4gICAgICBsYW1iZGFEdXJhdGlvbkFsYXJtLmFkZEFsYXJtQWN0aW9uKFxuICAgICAgICBuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKGFsZXJ0VG9waWMpXG4gICAgICApO1xuICAgICAgbGFtYmRhVGhyb3R0bGVBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBBUEkgR2F0ZXdheSBBbGFybXNcbiAgICBpZiAoYXBpR2F0ZXdheUlkKSB7XG4gICAgICAvLyBBUEkgR2F0ZXdheSA1WFggRXJyb3JzXG4gICAgICBjb25zdCBhcGlHYXRld2F5NXh4QWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgJ0FQSUdhdGV3YXk1eHhBbGFybScsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnNVhYRXJyb3InLFxuICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgIEFwaU5hbWU6IGFwaUdhdGV3YXlJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSA1WFggZXJyb3JzIGV4Y2VlZGVkIHRocmVzaG9sZCcsXG4gICAgICAgICAgYWxhcm1OYW1lOiBgJHthcHBsaWNhdGlvbk5hbWV9LSR7ZW52aXJvbm1lbnR9LWFwaS01eHgtZXJyb3JzYCxcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgLy8gQVBJIEdhdGV3YXkgNFhYIEVycm9yc1xuICAgICAgY29uc3QgYXBpR2F0ZXdheTR4eEFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdBUElHYXRld2F5NHh4QWxhcm0nLFxuICAgICAgICB7XG4gICAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJzRYWEVycm9yJyxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBBcGlOYW1lOiBhcGlHYXRld2F5SWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IDRYWCBlcnJvcnMgZXhjZWVkZWQgdGhyZXNob2xkJyxcbiAgICAgICAgICBhbGFybU5hbWU6IGAke2FwcGxpY2F0aW9uTmFtZX0tJHtlbnZpcm9ubWVudH0tYXBpLTR4eC1lcnJvcnNgLFxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICAvLyBBUEkgR2F0ZXdheSBMYXRlbmN5XG4gICAgICBjb25zdCBhcGlHYXRld2F5TGF0ZW5jeUFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdBUElHYXRld2F5TGF0ZW5jeUFsYXJtJyxcbiAgICAgICAge1xuICAgICAgICAgIG1ldHJpYzogbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdMYXRlbmN5JyxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgQXBpTmFtZTogYXBpR2F0ZXdheUlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0aHJlc2hvbGQ6IDIwMDAsIC8vIDIgc2Vjb25kc1xuICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSBsYXRlbmN5IGV4Y2VlZGVkIHRocmVzaG9sZCcsXG4gICAgICAgICAgYWxhcm1OYW1lOiBgJHthcHBsaWNhdGlvbk5hbWV9LSR7ZW52aXJvbm1lbnR9LWFwaS1sYXRlbmN5YCxcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgLy8gQWRkIGFsYXJtcyB0byBTTlMgdG9waWNcbiAgICAgIGFwaUdhdGV3YXk1eHhBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKVxuICAgICAgKTtcbiAgICAgIGFwaUdhdGV3YXk0eHhBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbihhbGVydFRvcGljKVxuICAgICAgKTtcbiAgICAgIGFwaUdhdGV3YXlMYXRlbmN5QWxhcm0uYWRkQWxhcm1BY3Rpb24oXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYylcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2xvdWRGcm9udCBBbGFybXNcbiAgICBpZiAoY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkKSB7XG4gICAgICAvLyBDbG91ZEZyb250IEVycm9yIFJhdGVcbiAgICAgIGNvbnN0IGNsb3VkRnJvbnRFcnJvckFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdDbG91ZEZyb250RXJyb3JBbGFybScsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JSYXRlJyxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgRGlzdHJpYnV0aW9uSWQ6IGNsb3VkRnJvbnREaXN0cmlidXRpb25JZCxcbiAgICAgICAgICAgICAgUmVnaW9uOiAnR2xvYmFsJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGhyZXNob2xkOiAxLCAvLyAxJSBlcnJvciByYXRlXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgZXJyb3IgcmF0ZSBleGNlZWRlZCB0aHJlc2hvbGQnLFxuICAgICAgICAgIGFsYXJtTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1jbG91ZGZyb250LWVycm9yc2AsXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIC8vIENsb3VkRnJvbnQgQ2FjaGUgSGl0IFJhdGVcbiAgICAgIGNvbnN0IGNsb3VkRnJvbnRDYWNoZUhpdEFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdDbG91ZEZyb250Q2FjaGVIaXRBbGFybScsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ2FjaGVIaXRSYXRlJyxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgRGlzdHJpYnV0aW9uSWQ6IGNsb3VkRnJvbnREaXN0cmlidXRpb25JZCxcbiAgICAgICAgICAgICAgUmVnaW9uOiAnR2xvYmFsJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGhyZXNob2xkOiA4MCwgLy8gODAlIGNhY2hlIGhpdCByYXRlXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5MRVNTX1RIQU5fVEhSRVNIT0xELFxuICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdDbG91ZEZyb250IGNhY2hlIGhpdCByYXRlIGJlbG93IHRocmVzaG9sZCcsXG4gICAgICAgICAgYWxhcm1OYW1lOiBgJHthcHBsaWNhdGlvbk5hbWV9LSR7ZW52aXJvbm1lbnR9LWNsb3VkZnJvbnQtY2FjaGUtaGl0YCxcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgLy8gQWRkIGFsYXJtcyB0byBTTlMgdG9waWNcbiAgICAgIGNsb3VkRnJvbnRFcnJvckFsYXJtLmFkZEFsYXJtQWN0aW9uKFxuICAgICAgICBuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKGFsZXJ0VG9waWMpXG4gICAgICApO1xuICAgICAgY2xvdWRGcm9udENhY2hlSGl0QWxhcm0uYWRkQWxhcm1BY3Rpb24oXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxlcnRUb3BpYylcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3VzdG9tIEFwcGxpY2F0aW9uIE1ldHJpY3MgRGFzaGJvYXJkXG4gICAgY29uc3QgYXBwbGljYXRpb25EYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQoXG4gICAgICB0aGlzLFxuICAgICAgJ0FwcGxpY2F0aW9uRGFzaGJvYXJkJyxcbiAgICAgIHtcbiAgICAgICAgZGFzaGJvYXJkTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1hcHBsaWNhdGlvbi1tZXRyaWNzYCxcbiAgICAgICAgd2lkZ2V0czogW1xuICAgICAgICAgIC8vIExhbWJkYSBNZXRyaWNzXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgICAgICB0aXRsZTogJ0xhbWJkYSBGdW5jdGlvbiBNZXRyaWNzJyxcbiAgICAgICAgICAgICAgbGVmdDogbGFtYmRhRnVuY3Rpb25OYW1lXG4gICAgICAgICAgICAgICAgPyBbXG4gICAgICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXG4gICAgICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0ludm9jYXRpb25zJyxcbiAgICAgICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBGdW5jdGlvbk5hbWU6IGxhbWJkYUZ1bmN0aW9uTmFtZSB9LFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcbiAgICAgICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JzJyxcbiAgICAgICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBGdW5jdGlvbk5hbWU6IGxhbWJkYUZ1bmN0aW9uTmFtZSB9LFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICA6IFtdLFxuICAgICAgICAgICAgICByaWdodDogbGFtYmRhRnVuY3Rpb25OYW1lXG4gICAgICAgICAgICAgICAgPyBbXG4gICAgICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXG4gICAgICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0R1cmF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgRnVuY3Rpb25OYW1lOiBsYW1iZGFGdW5jdGlvbk5hbWUgfSxcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXG4gICAgICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ1Rocm90dGxlcycsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgRnVuY3Rpb25OYW1lOiBsYW1iZGFGdW5jdGlvbk5hbWUgfSxcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgOiBbXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLy8gQVBJIEdhdGV3YXkgTWV0cmljc1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdBUEkgR2F0ZXdheSBNZXRyaWNzJyxcbiAgICAgICAgICAgICAgbGVmdDogYXBpR2F0ZXdheUlkXG4gICAgICAgICAgICAgICAgPyBbXG4gICAgICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDb3VudCcsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQXBpTmFtZTogYXBpR2F0ZXdheUlkIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnNVhYRXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaUdhdGV3YXlJZCB9LFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICA6IFtdLFxuICAgICAgICAgICAgICByaWdodDogYXBpR2F0ZXdheUlkXG4gICAgICAgICAgICAgICAgPyBbXG4gICAgICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdMYXRlbmN5JyxcbiAgICAgICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQXBpTmFtZTogYXBpR2F0ZXdheUlkIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnNFhYRXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IEFwaU5hbWU6IGFwaUdhdGV3YXlJZCB9LFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICA6IFtdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgICAvLyBDbG91ZEZyb250IE1ldHJpY3NcbiAgICAgICAgICBbXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgICAgIHRpdGxlOiAnQ2xvdWRGcm9udCBNZXRyaWNzJyxcbiAgICAgICAgICAgICAgbGVmdDogY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkXG4gICAgICAgICAgICAgICAgPyBbXG4gICAgICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0Nsb3VkRnJvbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXF1ZXN0cycsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcbiAgICAgICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JSYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIDogW10sXG4gICAgICAgICAgICAgIHJpZ2h0OiBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWRcbiAgICAgICAgICAgICAgICA/IFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NhY2hlSGl0UmF0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBEaXN0cmlidXRpb25JZDogY2xvdWRGcm9udERpc3RyaWJ1dGlvbklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVnaW9uOiAnR2xvYmFsJyxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0J5dGVzRG93bmxvYWRlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWdpb246ICdHbG9iYWwnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIDogW10sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIEN1c3RvbSBBcHBsaWNhdGlvbiBNZXRyaWNzXG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgICAgICB0aXRsZTogJ0N1c3RvbSBBcHBsaWNhdGlvbiBNZXRyaWNzJyxcbiAgICAgICAgICAgICAgbGVmdDogW1xuICAgICAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdXb3JkUHJlc3MvQVBJJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdBUElDYWxsQ291bnQnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9BUEknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0FQSUNhbGxEdXJhdGlvbicsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHJpZ2h0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0xhbWJkYS9BUEknLFxuICAgICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ1JlcXVlc3RDb3VudCcsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnTGFtYmRhL0FQSScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnUmVzcG9uc2VUaW1lJyxcbiAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLy8gQ2FjaGUgTWV0cmljc1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdDYWNoZSBQZXJmb3JtYW5jZScsXG4gICAgICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0NhY2hlJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZUhpdCcsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnV29yZFByZXNzL0NhY2hlJyxcbiAgICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDYWNoZU1pc3MnLFxuICAgICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHJpZ2h0OiBbXG4gICAgICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogJ1dvcmRQcmVzcy9DYWNoZScsXG4gICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ2FjaGVPcGVyYXRpb25EdXJhdGlvbicsXG4gICAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBJbmZyYXN0cnVjdHVyZSBIZWFsdGggRGFzaGJvYXJkXG4gICAgY29uc3QgaW5mcmFzdHJ1Y3R1cmVEYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQoXG4gICAgICB0aGlzLFxuICAgICAgJ0luZnJhc3RydWN0dXJlRGFzaGJvYXJkJyxcbiAgICAgIHtcbiAgICAgICAgZGFzaGJvYXJkTmFtZTogYCR7YXBwbGljYXRpb25OYW1lfS0ke2Vudmlyb25tZW50fS1pbmZyYXN0cnVjdHVyZS1oZWFsdGhgLFxuICAgICAgICB3aWRnZXRzOiBbXG4gICAgICAgICAgLy8gU3lzdGVtIE92ZXJ2aWV3XG4gICAgICAgICAgW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guVGV4dFdpZGdldCh7XG4gICAgICAgICAgICAgIG1hcmtkb3duOiBgXG4jICR7YXBwbGljYXRpb25OYW1lfSAtICR7ZW52aXJvbm1lbnR9IEVudmlyb25tZW50XG5cbiMjIEFyY2hpdGVjdHVyZSBPdmVydmlld1xuLSAqKkZyb250ZW5kOioqIE5leHQuanMgb24gQVdTIEFtcGxpZnlcbi0gKipCYWNrZW5kOioqIFdvcmRQcmVzcyBvbiBMaWdodHNhaWxcbi0gKipBUEk6KiogUkVTVCBBUEkgdmlhIFdvcmRQcmVzc1xuLSAqKkNETjoqKiBDbG91ZEZyb250IERpc3RyaWJ1dGlvblxuLSAqKlNlcnZlcmxlc3M6KiogTGFtYmRhIEZ1bmN0aW9uc1xuLSAqKk1vbml0b3Jpbmc6KiogQ2xvdWRXYXRjaCBEYXNoYm9hcmRzICYgQWxlcnRzXG5cbiMjIEtleSBFbmRwb2ludHNcbi0gKipXb3JkUHJlc3MgQVBJOioqICR7d29yZHByZXNzQXBpVXJsIHx8ICdhcGkuY293Ym95a2ltb25vLmNvbSd9XG4tICoqTGFtYmRhIEZ1bmN0aW9uOioqICR7bGFtYmRhRnVuY3Rpb25OYW1lIHx8ICdOb3QgY29uZmlndXJlZCd9XG4tICoqQ2xvdWRGcm9udDoqKiAke2Nsb3VkRnJvbnREaXN0cmlidXRpb25JZCB8fCAnTm90IGNvbmZpZ3VyZWQnfVxuXG4jIyBBbGVydCBDb25maWd1cmF0aW9uXG4tIExhbWJkYSBlcnJvcnMsIGR1cmF0aW9uLCBhbmQgdGhyb3R0bGVzXG4tIEFQSSBHYXRld2F5IDRYWC81WFggZXJyb3JzIGFuZCBsYXRlbmN5XG4tIENsb3VkRnJvbnQgZXJyb3IgcmF0ZSBhbmQgY2FjaGUgcGVyZm9ybWFuY2Vcbi0gQ3VzdG9tIGFwcGxpY2F0aW9uIG1ldHJpY3NcblxuIyMgUmVzcG9uc2UgVGltZSBUYXJnZXRzXG4tICoqQVBJIENhbGxzOioqIDwgMiBzZWNvbmRzXG4tICoqTGFtYmRhIEZ1bmN0aW9uczoqKiA8IDI1IHNlY29uZHNcbi0gKipQYWdlIExvYWQ6KiogPCAzIHNlY29uZHNcbi0gKipDYWNoZSBIaXQgUmF0ZToqKiA+IDgwJVxuXG5MYXN0IFVwZGF0ZWQ6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxuICAgICAgICAgICAgYCxcbiAgICAgICAgICAgICAgaGVpZ2h0OiA4LFxuICAgICAgICAgICAgICB3aWR0aDogMjQsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIEFsYXJtIFN0YXR1c1xuICAgICAgICAgIFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkFsYXJtU3RhdHVzV2lkZ2V0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdBbGFybSBTdGF0dXMnLFxuICAgICAgICAgICAgICBhbGFybXM6IGxhbWJkYUZ1bmN0aW9uTmFtZVxuICAgICAgICAgICAgICAgID8gW1xuICAgICAgICAgICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnU3RhdHVzTGFtYmRhRXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBGdW5jdGlvbk5hbWU6IGxhbWJkYUZ1bmN0aW9uTmFtZSB9LFxuICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgIHRocmVzaG9sZDogMSxcbiAgICAgICAgICAgICAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgOiBbXSxcbiAgICAgICAgICAgICAgaGVpZ2h0OiA2LFxuICAgICAgICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FsZXJ0VG9waWNBcm4nLCB7XG4gICAgICB2YWx1ZTogYWxlcnRUb3BpYy50b3BpY0FybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnU05TIFRvcGljIEFSTiBmb3IgYWxlcnRzJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcHBsaWNhdGlvbkRhc2hib2FyZE5hbWUnLCB7XG4gICAgICB2YWx1ZTogYXBwbGljYXRpb25EYXNoYm9hcmQuZGFzaGJvYXJkTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQXBwbGljYXRpb24gbWV0cmljcyBkYXNoYm9hcmQgbmFtZScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSW5mcmFzdHJ1Y3R1cmVEYXNoYm9hcmROYW1lJywge1xuICAgICAgdmFsdWU6IGluZnJhc3RydWN0dXJlRGFzaGJvYXJkLmRhc2hib2FyZE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0luZnJhc3RydWN0dXJlIGhlYWx0aCBkYXNoYm9hcmQgbmFtZScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTW9uaXRvcmluZ1N0YWNrQXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMuc3RhY2tJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTW9uaXRvcmluZyBzdGFjayBBUk4nLFxuICAgIH0pO1xuICB9XG59XG4iXX0=