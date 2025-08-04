import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as xray from 'aws-cdk-lib/aws-xray';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  wordpressApiUrl: string;
  cloudfrontDistributionId: string;
  auroraClusterName: string;
  lambdaFunctionNames: string[];
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alarms
    const alarmTopic = new sns.Topic(this, 'MonitoringAlarms', {
      displayName: 'WordPress Monitoring Alarms',
      topicName: 'wordpress-monitoring-alarms',
    });

    // Add email subscription (replace with your email)
    // alarmTopic.addSubscription(new subscriptions.EmailSubscription('your-email@example.com'));

    // CloudWatch Log Groups with proper retention
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogs', {
      logGroupName: '/aws/wordpress/application',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiLogGroup = new logs.LogGroup(this, 'APILogs', {
      logGroupName: '/aws/wordpress/api',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogs', {
      logGroupName: '/aws/wordpress/lambda',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const databaseLogGroup = new logs.LogGroup(this, 'DatabaseLogs', {
      logGroupName: '/aws/wordpress/database',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // X-Ray Tracing
    const tracingGroup = new xray.CfnGroup(this, 'WordPressTracingGroup', {
      groupName: 'WordPress-Application',
      filterExpression: 'service("wordpress")',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'WordPressDashboard', {
      dashboardName: 'WordPress-Monitoring-Dashboard',
      widgets: [
        // Application Performance
        [
          new cloudwatch.GraphWidget({
            title: 'Application Response Time',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                metricName: 'TargetResponseTime',
                statistic: 'Average',
                period: cdk.Duration.minutes(1),
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Request Count',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                metricName: 'RequestCount',
                statistic: 'Sum',
                period: cdk.Duration.minutes(1),
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        // API Gateway Metrics
        [
          new cloudwatch.GraphWidget({
            title: 'API Gateway 4XX Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '4XXError',
                statistic: 'Sum',
                period: cdk.Duration.minutes(1),
              }),
            ],
            width: 8,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway 5XX Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                statistic: 'Sum',
                period: cdk.Duration.minutes(1),
              }),
            ],
            width: 8,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway Latency',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Latency',
                statistic: 'Average',
                period: cdk.Duration.minutes(1),
              }),
            ],
            width: 8,
            height: 6,
          }),
        ],
        // CloudFront Metrics
        [
          new cloudwatch.GraphWidget({
            title: 'CloudFront Requests',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'Requests',
                statistic: 'Sum',
                period: cdk.Duration.minutes(5),
                dimensionsMap: {
                  DistributionId: props.cloudfrontDistributionId,
                  Region: 'Global',
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'CloudFront Cache Hit Rate',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'CacheHitRate',
                statistic: 'Average',
                period: cdk.Duration.minutes(5),
                dimensionsMap: {
                  DistributionId: props.cloudfrontDistributionId,
                  Region: 'Global',
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        // Database Metrics
        [
          new cloudwatch.GraphWidget({
            title: 'Aurora CPU Utilization',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'CPUUtilization',
                statistic: 'Average',
                period: cdk.Duration.minutes(1),
                dimensionsMap: {
                  DBClusterIdentifier: props.auroraClusterName,
                },
              }),
            ],
            width: 8,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Aurora Connections',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'DatabaseConnections',
                statistic: 'Average',
                period: cdk.Duration.minutes(1),
                dimensionsMap: {
                  DBClusterIdentifier: props.auroraClusterName,
                },
              }),
            ],
            width: 8,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Aurora Freeable Memory',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'FreeableMemory',
                statistic: 'Average',
                period: cdk.Duration.minutes(1),
                dimensionsMap: {
                  DBClusterIdentifier: props.auroraClusterName,
                },
              }),
            ],
            width: 8,
            height: 6,
          }),
        ],
        // Lambda Metrics
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Duration',
            left: props.lambdaFunctionNames.map(name => 
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Duration',
                statistic: 'Average',
                period: cdk.Duration.minutes(1),
                dimensionsMap: {
                  FunctionName: name,
                },
              })
            ),
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Errors',
            left: props.lambdaFunctionNames.map(name => 
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                statistic: 'Sum',
                period: cdk.Duration.minutes(1),
                dimensionsMap: {
                  FunctionName: name,
                },
              })
            ),
            width: 12,
            height: 6,
          }),
        ],
        // Cost Metrics
        [
          new cloudwatch.GraphWidget({
            title: 'Estimated Charges',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Billing',
                metricName: 'EstimatedCharges',
                statistic: 'Maximum',
                period: cdk.Duration.hours(1),
                dimensionsMap: {
                  Currency: 'USD',
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });

    // CloudWatch Alarms
    // High Error Rate Alarm
    const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRate', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'High 5XX error rate detected',
      alarmName: 'WordPress-High-Error-Rate',
    });

    // High Latency Alarm
    const highLatencyAlarm = new cloudwatch.Alarm(this, 'HighLatency', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 2,
      alarmDescription: 'High API latency detected',
      alarmName: 'WordPress-High-Latency',
    });

    // Database CPU Alarm
    const databaseCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseHighCPU', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          DBClusterIdentifier: props.auroraClusterName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'High database CPU utilization',
      alarmName: 'WordPress-Database-High-CPU',
    });

    // Lambda Error Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrors', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function errors detected',
      alarmName: 'WordPress-Lambda-Errors',
    });

    // Connect alarms to SNS topic
    highErrorRateAlarm.addAlarmAction(new cloudwatch.SnsAction(alarmTopic));
    highLatencyAlarm.addAlarmAction(new cloudwatch.SnsAction(alarmTopic));
    databaseCpuAlarm.addAlarmAction(new cloudwatch.SnsAction(alarmTopic));
    lambdaErrorAlarm.addAlarmAction(new cloudwatch.SnsAction(alarmTopic));

    // Outputs
    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=WordPress-Monitoring-Dashboard`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicARN', {
      value: alarmTopic.topicArn,
      description: 'SNS Topic ARN for alarms',
    });

    new cdk.CfnOutput(this, 'ApplicationLogGroup', {
      value: applicationLogGroup.logGroupName,
      description: 'Application Log Group Name',
    });

    new cdk.CfnOutput(this, 'APILogGroup', {
      value: apiLogGroup.logGroupName,
      description: 'API Log Group Name',
    });
  }
} 