"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordPressBlogStack = void 0;
const cdk = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const rds = require("aws-cdk-lib/aws-rds");
const ec2 = require("aws-cdk-lib/aws-ec2");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const s3 = require("aws-cdk-lib/aws-s3");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const logs = require("aws-cdk-lib/aws-logs");
class WordPressBlogStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // VPC for RDS Aurora
        const vpc = new ec2.Vpc(this, 'WordPressVPC', {
            maxAzs: 2,
            natGateways: 1, // Cost optimization: single NAT gateway
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'private',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    cidrMask: 24,
                    name: 'isolated',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });
        // Security Group for Aurora
        const auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
            vpc,
            description: 'Security group for Aurora Serverless',
            allowAllOutbound: true,
        });
        // Aurora Serverless v2 Cluster
        const auroraCluster = new rds.DatabaseCluster(this, 'WordPressAurora', {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_15_4,
            }),
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            securityGroups: [auroraSecurityGroup],
            writer: rds.ClusterInstance.serverlessV2('Writer'),
            serverlessV2MinCapacity: 0.5, // Cost optimization: minimum capacity
            serverlessV2MaxCapacity: 2, // Cost optimization: reasonable max capacity
            storageEncrypted: true,
            backup: {
                retention: cdk.Duration.days(7), // Cost optimization: shorter retention
                preferredWindow: '03:00-04:00',
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
        });
        // Lambda Layer for database connection pooling (optional - removing for simplicity)
        // const dbLayer = new lambda.LayerVersion(this, 'DatabaseLayer', {
        //   code: lambda.Code.fromAsset('../lambda-layers/database'),
        //   compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
        //   description: 'Database connection pooling and utilities',
        // });
        // Lambda Security Group
        const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
            vpc,
            description: 'Security group for GraphQL Lambda function',
            allowAllOutbound: true,
        });
        // Database Setup Lambda Function
        const databaseSetupLambda = new lambda.Function(this, 'DatabaseSetup', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/setup-database'),
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: [lambdaSecurityGroup],
            environment: {
                DB_HOST: auroraCluster.clusterEndpoint.hostname,
                DB_PORT: auroraCluster.clusterEndpoint.port.toString(),
                DB_NAME: 'wordpress',
                DB_USER: 'postgres',
                DB_PASSWORD: '6RbRnDBG61b7R26o8YDeKBFD=cRI_7', // Should use Secrets Manager in production
                NODE_ENV: 'production',
            },
            timeout: cdk.Duration.seconds(60),
            memorySize: 512,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Data Import Lambda Function
        const dataImportLambda = new lambda.Function(this, 'DataImport', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/import-data'),
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: [lambdaSecurityGroup],
            environment: {
                DB_HOST: auroraCluster.clusterEndpoint.hostname,
                DB_PORT: auroraCluster.clusterEndpoint.port.toString(),
                DB_NAME: 'wordpress',
                DB_USER: 'postgres',
                DB_PASSWORD: '6RbRnDBG61b7R26o8YDeKBFD=cRI_7', // Should use Secrets Manager in production
                NODE_ENV: 'production',
            },
            timeout: cdk.Duration.seconds(300), // 5 minutes for data import
            memorySize: 1024, // More memory for data processing
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // GraphQL Lambda Function
        const graphqlLambda = new lambda.Function(this, 'WordPressGraphQL', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/graphql'),
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: [lambdaSecurityGroup],
            environment: {
                DB_HOST: auroraCluster.clusterEndpoint.hostname,
                DB_PORT: auroraCluster.clusterEndpoint.port.toString(),
                DB_NAME: 'wordpress',
                DB_USER: 'postgres',
                DB_PASSWORD: '6RbRnDBG61b7R26o8YDeKBFD=cRI_7', // Actual Aurora password from Secrets Manager
                NODE_ENV: 'production',
            },
            // layers: [dbLayer], // Removed layer dependency
            timeout: cdk.Duration.seconds(30),
            memorySize: 512, // Cost optimization: reasonable memory
            logRetention: logs.RetentionDays.ONE_WEEK, // Cost optimization: shorter logs
        });
        // Allow Lambda to connect to Aurora
        auroraSecurityGroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432), 'Allow Lambda to connect to Aurora');
        // Grant Lambda access to Aurora
        auroraCluster.grantDataApiAccess(graphqlLambda);
        // Grant Lambda functions access to Secrets Manager for Aurora credentials
        const secretsPolicy = new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
                'secretsmanager:GetSecretValue'
            ],
            resources: [
                `arn:aws:secretsmanager:${this.region}:${this.account}:secret:WordPressAuroraSecret*`
            ]
        });
        databaseSetupLambda.addToRolePolicy(secretsPolicy);
        dataImportLambda.addToRolePolicy(secretsPolicy);
        // API Gateway
        const api = new apigateway.RestApi(this, 'WordPressAPI', {
            restApiName: 'WordPress GraphQL API',
            description: 'API Gateway for WordPress GraphQL',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'Authorization'],
            },
            deployOptions: {
                stageName: 'prod',
                loggingLevel: apigateway.MethodLoggingLevel.OFF, // Disable logging to avoid CloudWatch role issues
                dataTraceEnabled: false, // Cost optimization: disable data tracing
                metricsEnabled: true,
            },
        });
        // Database setup endpoint
        const setupResource = api.root.addResource('setup-database');
        setupResource.addMethod('POST', new apigateway.LambdaIntegration(databaseSetupLambda, {
            proxy: true,
        }), {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Headers': true,
                    },
                },
            ],
        });
        // Data import endpoint
        const importResource = api.root.addResource('import-data');
        importResource.addMethod('POST', new apigateway.LambdaIntegration(dataImportLambda, {
            proxy: true,
        }), {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Headers': true,
                    },
                },
            ],
        });
        // GraphQL endpoint
        const graphqlResource = api.root.addResource('graphql');
        graphqlResource.addMethod('POST', new apigateway.LambdaIntegration(graphqlLambda, {
            proxy: true,
        }), {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                        'method.response.header.Access-Control-Allow-Headers': true,
                    },
                },
            ],
        });
        // S3 Bucket for static content
        const staticContentBucket = new s3.Bucket(this, 'StaticContentBucket', {
            bucketName: `wordpress-static-${this.account}-${this.region}`,
            versioned: false, // Cost optimization: disable versioning
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    id: 'DeleteOldVersions',
                    noncurrentVersionExpiration: cdk.Duration.days(30),
                },
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
        });
        // CloudFront Distribution
        const cloudfrontDistribution = new cloudfront.Distribution(this, 'WordPressDistribution', {
            defaultBehavior: {
                origin: new origins.S3Origin(staticContentBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
            },
            additionalBehaviors: {
                '/api/*': {
                    origin: new origins.HttpOrigin(`${api.restApiId}.execute-api.${this.region}.amazonaws.com`, {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                },
            },
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Cost optimization: use only North America and Europe
            enableLogging: false, // Disable logging to avoid ACL issues
        });
        // Outputs
        new cdk.CfnOutput(this, 'GraphQLEndpoint', {
            value: `${api.url}graphql`,
            description: 'GraphQL API Endpoint',
        });
        new cdk.CfnOutput(this, 'CloudFrontURL', {
            value: `https://${cloudfrontDistribution.distributionDomainName}`,
            description: 'CloudFront Distribution URL',
        });
        new cdk.CfnOutput(this, 'StaticContentBucketName', {
            value: staticContentBucket.bucketName,
            description: 'S3 Bucket for Static Content',
        });
        new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
            value: auroraCluster.clusterEndpoint.hostname,
            description: 'Aurora Cluster Endpoint',
        });
        new cdk.CfnOutput(this, 'DatabaseSetupEndpoint', {
            value: `${api.url}setup-database`,
            description: 'Database Setup API Endpoint',
        });
        new cdk.CfnOutput(this, 'DataImportEndpoint', {
            value: `${api.url}import-data`,
            description: 'Data Import API Endpoint',
        });
    }
}
exports.WordPressBlogStack = WordPressBlogStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNkay1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF3cy1jZGstc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUN6RCxpREFBaUQ7QUFDakQsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyx5REFBeUQ7QUFDekQseUNBQXlDO0FBQ3pDLDhEQUE4RDtBQUM5RCw2Q0FBNkM7QUFHN0MsTUFBYSxrQkFBbUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMvQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHFCQUFxQjtRQUNyQixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUM1QyxNQUFNLEVBQUUsQ0FBQztZQUNULFdBQVcsRUFBRSxDQUFDLEVBQUUsd0NBQXdDO1lBQ3hELG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNsQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsU0FBUztvQkFDZixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUI7aUJBQy9DO2dCQUNEO29CQUNFLFFBQVEsRUFBRSxFQUFFO29CQUNaLElBQUksRUFBRSxVQUFVO29CQUNoQixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7aUJBQzVDO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCw0QkFBNEI7UUFDNUIsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFF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QkFBc0IsQ0FBQyxzQkFBc0IsRUFBRTtZQUNqRSxXQUFXLEVBQUUsNkJBQTZCO1NBQzNDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDakQsS0FBSyxFQUFFLG1CQUFtQixDQUFDLFVBQVU7WUFDckMsV0FBVyxFQUFFLDhCQUE4QjtTQUM1QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQy9DLEtBQUssRUFBRSxhQUFhLENBQUMsZUFBZSxDQUFDLFFBQVE7WUFDN0MsV0FBVyxFQUFFLHlCQUF5QjtTQUN2QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQy9DLEtBQUssRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLGdCQUFnQjtZQUNqQyxXQUFXLEVBQUUsNkJBQTZCO1NBQzNDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDNUMsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsYUFBYTtZQUM5QixXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXhTRCxnREF3U0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgKiBhcyByZHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJkcyc7XHJcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcclxuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XHJcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XHJcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XHJcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBXb3JkUHJlc3NCbG9nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vIFZQQyBmb3IgUkRTIEF1cm9yYVxyXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgJ1dvcmRQcmVzc1ZQQycsIHtcclxuICAgICAgbWF4QXpzOiAyLFxyXG4gICAgICBuYXRHYXRld2F5czogMSwgLy8gQ29zdCBvcHRpbWl6YXRpb246IHNpbmdsZSBOQVQgZ2F0ZXdheVxyXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxyXG4gICAgICAgICAgbmFtZTogJ3B1YmxpYycsXHJcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBjaWRyTWFzazogMjQsXHJcbiAgICAgICAgICBuYW1lOiAncHJpdmF0ZScsXHJcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxyXG4gICAgICAgICAgbmFtZTogJ2lzb2xhdGVkJyxcclxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNlY3VyaXR5IEdyb3VwIGZvciBBdXJvcmFcclxuICAgIGNvbnN0IGF1cm9yYVNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0F1cm9yYVNlY3VyaXR5R3JvdXAnLCB7XHJcbiAgICAgIHZwYyxcclxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgQXVyb3JhIFNlcnZlcmxlc3MnLFxyXG4gICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQXVyb3JhIFNlcnZlcmxlc3MgdjIgQ2x1c3RlclxyXG4gICAgY29uc3QgYXVyb3JhQ2x1c3RlciA9IG5ldyByZHMuRGF0YWJhc2VDbHVzdGVyKHRoaXMsICdXb3JkUHJlc3NBdXJvcmEnLCB7XHJcbiAgICAgIGVuZ2luZTogcmRzLkRhdGFiYXNlQ2x1c3RlckVuZ2luZS5hdXJvcmFQb3N0Z3Jlcyh7XHJcbiAgICAgICAgdmVyc2lvbjogcmRzLkF1cm9yYVBvc3RncmVzRW5naW5lVmVyc2lvbi5WRVJfMTVfNCxcclxuICAgICAgfSksXHJcbiAgICAgIHZwYyxcclxuICAgICAgdnBjU3VibmV0czoge1xyXG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQsXHJcbiAgICAgIH0sXHJcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbYXVyb3JhU2VjdXJpdHlHcm91cF0sXHJcbiAgICAgIHdyaXRlcjogcmRzLkNsdXN0ZXJJbnN0YW5jZS5zZXJ2ZXJsZXNzVjIoJ1dyaXRlcicpLFxyXG4gICAgICBzZXJ2ZXJsZXNzVjJNaW5DYXBhY2l0eTogMC41LCAvLyBDb3N0IG9wdGltaXphdGlvbjogbWluaW11bSBjYXBhY2l0eVxyXG4gICAgICBzZXJ2ZXJsZXNzVjJNYXhDYXBhY2l0eTogMiwgLy8gQ29zdCBvcHRpbWl6YXRpb246IHJlYXNvbmFibGUgbWF4IGNhcGFjaXR5XHJcbiAgICAgIHN0b3JhZ2VFbmNyeXB0ZWQ6IHRydWUsXHJcbiAgICAgIGJhY2t1cDoge1xyXG4gICAgICAgIHJldGVudGlvbjogY2RrLkR1cmF0aW9uLmRheXMoNyksIC8vIENvc3Qgb3B0aW1pemF0aW9uOiBzaG9ydGVyIHJldGVudGlvblxyXG4gICAgICAgIHByZWZlcnJlZFdpbmRvdzogJzAzOjAwLTA0OjAwJyxcclxuICAgICAgfSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMYW1iZGEgTGF5ZXIgZm9yIGRhdGFiYXNlIGNvbm5lY3Rpb24gcG9vbGluZyAob3B0aW9uYWwgLSByZW1vdmluZyBmb3Igc2ltcGxpY2l0eSlcclxuICAgIC8vIGNvbnN0IGRiTGF5ZXIgPSBuZXcgbGFtYmRhLkxheWVyVmVyc2lvbih0aGlzLCAnRGF0YWJhc2VMYXllcicsIHtcclxuICAgIC8vICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9sYW1iZGEtbGF5ZXJzL2RhdGFiYXNlJyksXHJcbiAgICAvLyAgIGNvbXBhdGlibGVSdW50aW1lczogW2xhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YXSxcclxuICAgIC8vICAgZGVzY3JpcHRpb246ICdEYXRhYmFzZSBjb25uZWN0aW9uIHBvb2xpbmcgYW5kIHV0aWxpdGllcycsXHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyBMYW1iZGEgU2VjdXJpdHkgR3JvdXBcclxuICAgIGNvbnN0IGxhbWJkYVNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0xhbWJkYVNlY3VyaXR5R3JvdXAnLCB7XHJcbiAgICAgIHZwYyxcclxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgR3JhcGhRTCBMYW1iZGEgZnVuY3Rpb24nLFxyXG4gICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRGF0YWJhc2UgU2V0dXAgTGFtYmRhIEZ1bmN0aW9uXHJcbiAgICBjb25zdCBkYXRhYmFzZVNldHVwTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnRGF0YWJhc2VTZXR1cCcsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXHJcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9sYW1iZGEvc2V0dXAtZGF0YWJhc2UnKSxcclxuICAgICAgdnBjLFxyXG4gICAgICB2cGNTdWJuZXRzOiB7XHJcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyxcclxuICAgICAgfSxcclxuICAgICAgc2VjdXJpdHlHcm91cHM6IFtsYW1iZGFTZWN1cml0eUdyb3VwXSxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBEQl9IT1NUOiBhdXJvcmFDbHVzdGVyLmNsdXN0ZXJFbmRwb2ludC5ob3N0bmFtZSxcclxuICAgICAgICBEQl9QT1JUOiBhdXJvcmFDbHVzdGVyLmNsdXN0ZXJFbmRwb2ludC5wb3J0LnRvU3RyaW5nKCksXHJcbiAgICAgICAgREJfTkFNRTogJ3dvcmRwcmVzcycsXHJcbiAgICAgICAgREJfVVNFUjogJ3Bvc3RncmVzJyxcclxuICAgICAgICBEQl9QQVNTV09SRDogJzZSYlJuREJHNjFiN1IyNm84WURlS0JGRD1jUklfNycsIC8vIFNob3VsZCB1c2UgU2VjcmV0cyBNYW5hZ2VyIGluIHByb2R1Y3Rpb25cclxuICAgICAgICBOT0RFX0VOVjogJ3Byb2R1Y3Rpb24nLFxyXG4gICAgICB9LFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg2MCksXHJcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcclxuICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEYXRhIEltcG9ydCBMYW1iZGEgRnVuY3Rpb25cclxuICAgIGNvbnN0IGRhdGFJbXBvcnRMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdEYXRhSW1wb3J0Jywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcclxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2xhbWJkYS9pbXBvcnQtZGF0YScpLFxyXG4gICAgICB2cGMsXHJcbiAgICAgIHZwY1N1Ym5ldHM6IHtcclxuICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTLFxyXG4gICAgICB9LFxyXG4gICAgICBzZWN1cml0eUdyb3VwczogW2xhbWJkYVNlY3VyaXR5R3JvdXBdLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIERCX0hPU1Q6IGF1cm9yYUNsdXN0ZXIuY2x1c3RlckVuZHBvaW50Lmhvc3RuYW1lLFxyXG4gICAgICAgIERCX1BPUlQ6IGF1cm9yYUNsdXN0ZXIuY2x1c3RlckVuZHBvaW50LnBvcnQudG9TdHJpbmcoKSxcclxuICAgICAgICBEQl9OQU1FOiAnd29yZHByZXNzJyxcclxuICAgICAgICBEQl9VU0VSOiAncG9zdGdyZXMnLFxyXG4gICAgICAgIERCX1BBU1NXT1JEOiAnNlJiUm5EQkc2MWI3UjI2bzhZRGVLQkZEPWNSSV83JywgLy8gU2hvdWxkIHVzZSBTZWNyZXRzIE1hbmFnZXIgaW4gcHJvZHVjdGlvblxyXG4gICAgICAgIE5PREVfRU5WOiAncHJvZHVjdGlvbicsXHJcbiAgICAgIH0sXHJcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwMCksIC8vIDUgbWludXRlcyBmb3IgZGF0YSBpbXBvcnRcclxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCwgLy8gTW9yZSBtZW1vcnkgZm9yIGRhdGEgcHJvY2Vzc2luZ1xyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEdyYXBoUUwgTGFtYmRhIEZ1bmN0aW9uXHJcbiAgICBjb25zdCBncmFwaHFsTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnV29yZFByZXNzR3JhcGhRTCcsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXHJcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9sYW1iZGEvZ3JhcGhxbCcpLFxyXG4gICAgICB2cGMsXHJcbiAgICAgIHZwY1N1Ym5ldHM6IHtcclxuICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTLFxyXG4gICAgICB9LFxyXG4gICAgICBzZWN1cml0eUdyb3VwczogW2xhbWJkYVNlY3VyaXR5R3JvdXBdLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIERCX0hPU1Q6IGF1cm9yYUNsdXN0ZXIuY2x1c3RlckVuZHBvaW50Lmhvc3RuYW1lLFxyXG4gICAgICAgIERCX1BPUlQ6IGF1cm9yYUNsdXN0ZXIuY2x1c3RlckVuZHBvaW50LnBvcnQudG9TdHJpbmcoKSxcclxuICAgICAgICBEQl9OQU1FOiAnd29yZHByZXNzJyxcclxuICAgICAgICBEQl9VU0VSOiAncG9zdGdyZXMnLFxyXG4gICAgICAgIERCX1BBU1NXT1JEOiAnNlJiUm5EQkc2MWI3UjI2bzhZRGVLQkZEPWNSSV83JywgLy8gQWN0dWFsIEF1cm9yYSBwYXNzd29yZCBmcm9tIFNlY3JldHMgTWFuYWdlclxyXG4gICAgICAgIE5PREVfRU5WOiAncHJvZHVjdGlvbicsXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIGxheWVyczogW2RiTGF5ZXJdLCAvLyBSZW1vdmVkIGxheWVyIGRlcGVuZGVuY3lcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxyXG4gICAgICBtZW1vcnlTaXplOiA1MTIsIC8vIENvc3Qgb3B0aW1pemF0aW9uOiByZWFzb25hYmxlIG1lbW9yeVxyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSywgLy8gQ29zdCBvcHRpbWl6YXRpb246IHNob3J0ZXIgbG9nc1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQWxsb3cgTGFtYmRhIHRvIGNvbm5lY3QgdG8gQXVyb3JhXHJcbiAgICBhdXJvcmFTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxyXG4gICAgICBsYW1iZGFTZWN1cml0eUdyb3VwLFxyXG4gICAgICBlYzIuUG9ydC50Y3AoNTQzMiksXHJcbiAgICAgICdBbGxvdyBMYW1iZGEgdG8gY29ubmVjdCB0byBBdXJvcmEnXHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdyYW50IExhbWJkYSBhY2Nlc3MgdG8gQXVyb3JhXHJcbiAgICBhdXJvcmFDbHVzdGVyLmdyYW50RGF0YUFwaUFjY2VzcyhncmFwaHFsTGFtYmRhKTtcclxuICAgIFxyXG4gICAgLy8gR3JhbnQgTGFtYmRhIGZ1bmN0aW9ucyBhY2Nlc3MgdG8gU2VjcmV0cyBNYW5hZ2VyIGZvciBBdXJvcmEgY3JlZGVudGlhbHNcclxuICAgIGNvbnN0IHNlY3JldHNQb2xpY3kgPSBuZXcgY2RrLmF3c19pYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgZWZmZWN0OiBjZGsuYXdzX2lhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAnc2VjcmV0c21hbmFnZXI6R2V0U2VjcmV0VmFsdWUnXHJcbiAgICAgIF0sXHJcbiAgICAgIHJlc291cmNlczogW1xyXG4gICAgICAgIGBhcm46YXdzOnNlY3JldHNtYW5hZ2VyOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpzZWNyZXQ6V29yZFByZXNzQXVyb3JhU2VjcmV0KmBcclxuICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgZGF0YWJhc2VTZXR1cExhbWJkYS5hZGRUb1JvbGVQb2xpY3koc2VjcmV0c1BvbGljeSk7XHJcbiAgICBkYXRhSW1wb3J0TGFtYmRhLmFkZFRvUm9sZVBvbGljeShzZWNyZXRzUG9saWN5KTtcclxuXHJcbiAgICAvLyBBUEkgR2F0ZXdheVxyXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnV29yZFByZXNzQVBJJywge1xyXG4gICAgICByZXN0QXBpTmFtZTogJ1dvcmRQcmVzcyBHcmFwaFFMIEFQSScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgZm9yIFdvcmRQcmVzcyBHcmFwaFFMJyxcclxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XHJcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXHJcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXHJcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJ10sXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcclxuICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcclxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLk9GRiwgLy8gRGlzYWJsZSBsb2dnaW5nIHRvIGF2b2lkIENsb3VkV2F0Y2ggcm9sZSBpc3N1ZXNcclxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBmYWxzZSwgLy8gQ29zdCBvcHRpbWl6YXRpb246IGRpc2FibGUgZGF0YSB0cmFjaW5nXHJcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEYXRhYmFzZSBzZXR1cCBlbmRwb2ludFxyXG4gICAgY29uc3Qgc2V0dXBSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdzZXR1cC1kYXRhYmFzZScpO1xyXG4gICAgc2V0dXBSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihkYXRhYmFzZVNldHVwTGFtYmRhLCB7XHJcbiAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgfSksIHtcclxuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXHJcbiAgICAgICAgICByZXNwb25zZVBhcmFtZXRlcnM6IHtcclxuICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogdHJ1ZSxcclxuICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6IHRydWUsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEYXRhIGltcG9ydCBlbmRwb2ludFxyXG4gICAgY29uc3QgaW1wb3J0UmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnaW1wb3J0LWRhdGEnKTtcclxuICAgIGltcG9ydFJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGRhdGFJbXBvcnRMYW1iZGEsIHtcclxuICAgICAgcHJveHk6IHRydWUsXHJcbiAgICB9KSwge1xyXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcclxuICAgICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiB0cnVlLFxyXG4gICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogdHJ1ZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEdyYXBoUUwgZW5kcG9pbnRcclxuICAgIGNvbnN0IGdyYXBocWxSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdncmFwaHFsJyk7XHJcbiAgICBncmFwaHFsUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ3JhcGhxbExhbWJkYSwge1xyXG4gICAgICBwcm94eTogdHJ1ZSxcclxuICAgIH0pLCB7XHJcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxyXG4gICAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IHRydWUsXHJcbiAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiB0cnVlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUzMgQnVja2V0IGZvciBzdGF0aWMgY29udGVudFxyXG4gICAgY29uc3Qgc3RhdGljQ29udGVudEJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1N0YXRpY0NvbnRlbnRCdWNrZXQnLCB7XHJcbiAgICAgIGJ1Y2tldE5hbWU6IGB3b3JkcHJlc3Mtc3RhdGljLSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAsXHJcbiAgICAgIHZlcnNpb25lZDogZmFsc2UsIC8vIENvc3Qgb3B0aW1pemF0aW9uOiBkaXNhYmxlIHZlcnNpb25pbmdcclxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxyXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxyXG4gICAgICBsaWZlY3ljbGVSdWxlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAnRGVsZXRlT2xkVmVyc2lvbnMnLFxyXG4gICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cygzMCksXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDbG91ZEZyb250IERpc3RyaWJ1dGlvblxyXG4gICAgY29uc3QgY2xvdWRmcm9udERpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnV29yZFByZXNzRGlzdHJpYnV0aW9uJywge1xyXG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcclxuICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLlMzT3JpZ2luKHN0YXRpY0NvbnRlbnRCdWNrZXQpLFxyXG4gICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxyXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxyXG4gICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5DT1JTX1MzX09SSUdJTixcclxuICAgICAgfSxcclxuICAgICAgYWRkaXRpb25hbEJlaGF2aW9yczoge1xyXG4gICAgICAgICcvYXBpLyonOiB7XHJcbiAgICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLkh0dHBPcmlnaW4oYCR7YXBpLnJlc3RBcGlJZH0uZXhlY3V0ZS1hcGkuJHt0aGlzLnJlZ2lvbn0uYW1hem9uYXdzLmNvbWAsIHtcclxuICAgICAgICAgICAgcHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUFNfT05MWSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXHJcbiAgICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX0RJU0FCTEVELFxyXG4gICAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5SZXF1ZXN0UG9saWN5LkFMTF9WSUVXRVIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCwgLy8gQ29zdCBvcHRpbWl6YXRpb246IHVzZSBvbmx5IE5vcnRoIEFtZXJpY2EgYW5kIEV1cm9wZVxyXG4gICAgICBlbmFibGVMb2dnaW5nOiBmYWxzZSwgLy8gRGlzYWJsZSBsb2dnaW5nIHRvIGF2b2lkIEFDTCBpc3N1ZXNcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE91dHB1dHNcclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHcmFwaFFMRW5kcG9pbnQnLCB7XHJcbiAgICAgIHZhbHVlOiBgJHthcGkudXJsfWdyYXBocWxgLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0dyYXBoUUwgQVBJIEVuZHBvaW50JyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250VVJMJywge1xyXG4gICAgICB2YWx1ZTogYGh0dHBzOi8vJHtjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcclxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBVUkwnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1N0YXRpY0NvbnRlbnRCdWNrZXROYW1lJywge1xyXG4gICAgICB2YWx1ZTogc3RhdGljQ29udGVudEJ1Y2tldC5idWNrZXROYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEJ1Y2tldCBmb3IgU3RhdGljIENvbnRlbnQnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0F1cm9yYUNsdXN0ZXJFbmRwb2ludCcsIHtcclxuICAgICAgdmFsdWU6IGF1cm9yYUNsdXN0ZXIuY2x1c3RlckVuZHBvaW50Lmhvc3RuYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0F1cm9yYSBDbHVzdGVyIEVuZHBvaW50JyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhYmFzZVNldHVwRW5kcG9pbnQnLCB7XHJcbiAgICAgIHZhbHVlOiBgJHthcGkudXJsfXNldHVwLWRhdGFiYXNlYCxcclxuICAgICAgZGVzY3JpcHRpb246ICdEYXRhYmFzZSBTZXR1cCBBUEkgRW5kcG9pbnQnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RhdGFJbXBvcnRFbmRwb2ludCcsIHtcclxuICAgICAgdmFsdWU6IGAke2FwaS51cmx9aW1wb3J0LWRhdGFgLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0RhdGEgSW1wb3J0IEFQSSBFbmRwb2ludCcsXHJcbiAgICB9KTtcclxuICB9XHJcbn0gIl19