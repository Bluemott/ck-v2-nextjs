import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface MonitoringStackProps extends cdk.StackProps {
    environment: string;
    applicationName: string;
    lambdaFunctionName?: string;
    apiGatewayId?: string;
    cloudFrontDistributionId?: string;
    wordpressApiUrl?: string;
}
export declare class MonitoringStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: MonitoringStackProps);
}
