import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class WordPressBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
    auroraSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to Aurora'
    );

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

    // S3 Bucket for static content and media
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
        {
          id: 'MediaLifecycle',
          prefix: 'media/',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    // Grant Lambda functions access to S3 for media operations
    const s3MediaPolicy = new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetObjectVersion',
        's3:PutObjectAcl'
      ],
      resources: [
        staticContentBucket.bucketArn,
        `${staticContentBucket.bucketArn}/*`
      ]
    });

    graphqlLambda.addToRolePolicy(s3MediaPolicy);
    dataImportLambda.addToRolePolicy(s3MediaPolicy);

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
            originPath: '/prod', // Add the API Gateway stage path
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // Allow POST methods
        },
        '/media/*': {
          origin: new origins.S3Origin(staticContentBucket),
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
                    if (uri.startsWith('/media/')) {
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

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: cloudfrontDistribution.distributionId,
      description: 'CloudFront Distribution ID for media invalidation',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: cloudfrontDistribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });
  }
} 