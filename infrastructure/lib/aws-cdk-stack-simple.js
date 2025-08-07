"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordPressBlogStackSimple = void 0;
const cdk = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
class WordPressBlogStackSimple extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // API Gateway
        const api = new apigateway.RestApi(this, 'WordPressAPI', {
            restApiName: 'WordPress REST API',
            description: 'API Gateway for WordPress REST API (Lightsail-based)',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
                allowCredentials: true,
            },
            deployOptions: {
                stageName: 'prod',
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: false,
                metricsEnabled: true,
                throttlingBurstLimit: 100,
                throttlingRateLimit: 50,
            },
        });
        // CloudFront Distribution (for media delivery from Lightsail)
        const cloudfrontDistribution = new cloudfront.Distribution(this, 'WordPressDistribution', {
            defaultBehavior: {
                origin: new origins.HttpOrigin('api.cowboykimono.com', {
                    protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                    originShieldRegion: this.region,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
            },
            additionalBehaviors: {
                '/wp-content/uploads/*': {
                    origin: new origins.HttpOrigin('api.cowboykimono.com', {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                        originShieldRegion: this.region,
                    }),
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
                    if (uri.startsWith('/wp-content/uploads/')) {
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
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            enableLogging: false,
            comment: 'Cowboy Kimono WordPress Distribution',
        });
        // Outputs
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
        new cdk.CfnOutput(this, 'APIEndpoint', {
            value: api.url,
            description: 'API Gateway Endpoint',
        });
    }
}
exports.WordPressBlogStackSimple = WordPressBlogStackSimple;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNkay1zdGFjay1zaW1wbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhd3MtY2RrLXN0YWNrLXNpbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseURBQXlEO0FBRXpELHlEQUF5RDtBQUN6RCw4REFBOEQ7QUFLOUQsTUFBYSx3QkFBeUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGNBQWM7UUFDZCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN2RCxXQUFXLEVBQUUsb0JBQW9CO1lBQ2pDLFdBQVcsRUFBRSxzREFBc0Q7WUFDbkUsMkJBQTJCLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRSxDQUFDLGNBQWMsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLENBQUM7Z0JBQ25FLGdCQUFnQixFQUFFLElBQUk7YUFDdkI7WUFDRCxhQUFhLEVBQUU7Z0JBQ2IsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLFlBQVksRUFBRSxVQUFVLENBQUMsa0JBQWtCLENBQUMsSUFBSTtnQkFDaEQsZ0JBQWdCLEVBQUUsS0FBSztnQkFDdkIsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLG9CQUFvQixFQUFFLEdBQUc7Z0JBQ3pCLG1CQUFtQixFQUFFLEVBQUU7YUFDeEI7U0FDRixDQUFDLENBQUM7UUFFSCw4REFBOEQ7UUFDOUQsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQ3hGLGVBQWUs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RSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHO1lBQ2QsV0FBVyxFQUFFLHNCQUFzQjtTQUNwQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE5R0QsNERBOEdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XHJcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XHJcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xyXG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFdvcmRQcmVzc0Jsb2dTdGFja1NpbXBsZSBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy8gQVBJIEdhdGV3YXlcclxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1dvcmRQcmVzc0FQSScsIHtcclxuICAgICAgcmVzdEFwaU5hbWU6ICdXb3JkUHJlc3MgUkVTVCBBUEknLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IGZvciBXb3JkUHJlc3MgUkVTVCBBUEkgKExpZ2h0c2FpbC1iYXNlZCknLFxyXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcclxuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcclxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcclxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1SZXF1ZXN0ZWQtV2l0aCddLFxyXG4gICAgICAgIGFsbG93Q3JlZGVudGlhbHM6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcclxuICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcclxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXHJcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDEwMCxcclxuICAgICAgICB0aHJvdHRsaW5nUmF0ZUxpbWl0OiA1MCxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIChmb3IgbWVkaWEgZGVsaXZlcnkgZnJvbSBMaWdodHNhaWwpXHJcbiAgICBjb25zdCBjbG91ZGZyb250RGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdXb3JkUHJlc3NEaXN0cmlidXRpb24nLCB7XHJcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xyXG4gICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuSHR0cE9yaWdpbignYXBpLmNvd2JveWtpbW9uby5jb20nLCB7XHJcbiAgICAgICAgICBwcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQU19PTkxZLFxyXG4gICAgICAgICAgb3JpZ2luU2hpZWxkUmVnaW9uOiB0aGlzLnJlZ2lvbixcclxuICAgICAgICB9KSxcclxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcclxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcclxuICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RQb2xpY3kuQUxMX1ZJRVdFUixcclxuICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19HRVRfSEVBRCxcclxuICAgICAgICBjYWNoZWRNZXRob2RzOiBjbG91ZGZyb250LkNhY2hlZE1ldGhvZHMuQ0FDSEVfR0VUX0hFQUQsXHJcbiAgICAgIH0sXHJcbiAgICAgIGFkZGl0aW9uYWxCZWhhdmlvcnM6IHtcclxuICAgICAgICAnL3dwLWNvbnRlbnQvdXBsb2Fkcy8qJzoge1xyXG4gICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKCdhcGkuY293Ym95a2ltb25vLmNvbScsIHtcclxuICAgICAgICAgICAgcHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUFNfT05MWSxcclxuICAgICAgICAgICAgb3JpZ2luU2hpZWxkUmVnaW9uOiB0aGlzLnJlZ2lvbixcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXHJcbiAgICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRF9GT1JfVU5DT01QUkVTU0VEX09CSkVDVFMsXHJcbiAgICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RQb2xpY3kuQ09SU19TM19PUklHSU4sXHJcbiAgICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgZnVuY3Rpb246IG5ldyBjbG91ZGZyb250LkZ1bmN0aW9uKHRoaXMsICdNZWRpYVVSTFJld3JpdGUnLCB7XHJcbiAgICAgICAgICAgICAgICBjb2RlOiBjbG91ZGZyb250LkZ1bmN0aW9uQ29kZS5mcm9tSW5saW5lKGBcclxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gZXZlbnQucmVxdWVzdDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXJpID0gcmVxdWVzdC51cmk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV3cml0ZSBtZWRpYSBVUkxzIHRvIGluY2x1ZGUgcHJvcGVyIGhlYWRlcnNcclxuICAgICAgICAgICAgICAgICAgICBpZiAodXJpLnN0YXJ0c1dpdGgoJy93cC1jb250ZW50L3VwbG9hZHMvJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snY2FjaGUtY29udHJvbCddID0geyB2YWx1ZTogJ3B1YmxpYywgbWF4LWFnZT0zMTUzNjAwMCcgfTtcclxuICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVyc1snYWNjZXNzLWNvbnRyb2wtYWxsb3ctb3JpZ2luJ10gPSB7IHZhbHVlOiAnKicgfTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGApLFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIGV2ZW50VHlwZTogY2xvdWRmcm9udC5GdW5jdGlvbkV2ZW50VHlwZS5WSUVXRVJfUkVRVUVTVCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcclxuICAgICAgZW5hYmxlTG9nZ2luZzogZmFsc2UsXHJcbiAgICAgIGNvbW1lbnQ6ICdDb3dib3kgS2ltb25vIFdvcmRQcmVzcyBEaXN0cmlidXRpb24nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gT3V0cHV0c1xyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Nsb3VkRnJvbnRVUkwnLCB7XHJcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke2Nsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIFVSTCcsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2xvdWRGcm9udERpc3RyaWJ1dGlvbklkJywge1xyXG4gICAgICB2YWx1ZTogY2xvdWRmcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZCxcclxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBJRCBmb3IgbWVkaWEgaW52YWxpZGF0aW9uJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250RG9tYWluTmFtZScsIHtcclxuICAgICAgdmFsdWU6IGNsb3VkZnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZSxcclxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBEb21haW4gTmFtZScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXJjaGl0ZWN0dXJlJywge1xyXG4gICAgICB2YWx1ZTogJ0xpZ2h0c2FpbCBXb3JkUHJlc3Mgd2l0aCBOZXh0LmpzIEZyb250ZW5kJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IEFyY2hpdGVjdHVyZScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV29yZFByZXNzVVJMJywge1xyXG4gICAgICB2YWx1ZTogJ2h0dHBzOi8vYXBpLmNvd2JveWtpbW9uby5jb20nLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1dvcmRQcmVzcyBSRVNUIEFQSSBVUkwgKExpZ2h0c2FpbCknLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dvcmRQcmVzc0FkbWluVVJMJywge1xyXG4gICAgICB2YWx1ZTogJ2h0dHBzOi8vYWRtaW4uY293Ym95a2ltb25vLmNvbScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnV29yZFByZXNzIEFkbWluIFVSTCAoTGlnaHRzYWlsKScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQVBJRW5kcG9pbnQnLCB7XHJcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IEVuZHBvaW50JyxcclxuICAgIH0pO1xyXG4gIH1cclxufSAiXX0=