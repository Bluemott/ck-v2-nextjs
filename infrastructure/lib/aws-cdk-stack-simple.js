"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordPressBlogStackSimple = void 0;
const cdk = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
class WordPressBlogStackSimple extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // API Gateway for Lambda functions only
        const api = new apigateway.RestApi(this, 'WordPressAPI', {
            restApiName: 'WordPress REST API',
            description: 'API Gateway for Lambda functions (WordPress API handled directly by Lightsail)',
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
        // Outputs
        new cdk.CfnOutput(this, 'Architecture', {
            value: 'Lightsail WordPress with Next.js Frontend (Direct API Access)',
            description: 'Current Architecture',
        });
        new cdk.CfnOutput(this, 'WordPressURL', {
            value: 'https://api.cowboykimono.com',
            description: 'WordPress REST API URL (Lightsail - Direct Access)',
        });
        new cdk.CfnOutput(this, 'WordPressAdminURL', {
            value: 'https://admin.cowboykimono.com',
            description: 'WordPress Admin URL (Lightsail - Direct Access)',
        });
        new cdk.CfnOutput(this, 'APIEndpoint', {
            value: api.url,
            description: 'API Gateway Endpoint (Lambda Functions Only)',
        });
        new cdk.CfnOutput(this, 'CachingStrategy', {
            value: 'WordPress Redis + REST API Caching (No CloudFront)',
            description: 'Current Caching Strategy',
        });
    }
}
exports.WordPressBlogStackSimple = WordPressBlogStackSimple;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNkay1zdGFjay1zaW1wbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhd3MtY2RrLXN0YWNrLXNpbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseURBQXlEO0FBR3pELE1BQWEsd0JBQXlCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix3Q0FBd0M7UUFDeEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDdkQsV0FBVyxFQUFFLG9CQUFvQjtZQUNqQyxXQUFXLEVBQ1QsZ0ZBQWdGO1lBQ2xGLDJCQUEyQixFQUFFO2dCQUMzQixZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXO2dCQUN6QyxZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXO2dCQUN6QyxZQUFZLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixDQUFDO2dCQUNuRSxnQkFBZ0IsRUFBRSxJQUFJO2FBQ3ZCO1lBQ0QsYUFBYSxFQUFFO2dCQUNiLFNBQVMsRUFBRSxNQUFNO2dCQUNqQixZQUFZLEVBQUUsVUFBVSxDQUFDLGtCQUFrQixDQUFDLElBQUk7Z0JBQ2hELGdCQUFnQixFQUFFLEtBQUs7Z0JBQ3ZCLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixvQkFBb0IsRUFBRSxHQUFHO2dCQUN6QixtQkFBbUIsRUFBRSxFQUFFO2FBQ3hCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3RDLEtBQUssRUFBRSwrREFBK0Q7WUFDdEUsV0FBVyxFQUFFLHNCQUFzQjtTQUNwQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsOEJBQThCO1lBQ3JDLFdBQVcsRUFBRSxvREFBb0Q7U0FDbEUsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsZ0NBQWdDO1lBQ3ZDLFdBQVcsRUFBRSxpREFBaUQ7U0FDL0QsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHO1lBQ2QsV0FBVyxFQUFFLDhDQUE4QztTQUM1RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3pDLEtBQUssRUFBRSxvREFBb0Q7WUFDM0QsV0FBVyxFQUFFLDBCQUEwQjtTQUN4QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFuREQsNERBbURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFdvcmRQcmVzc0Jsb2dTdGFja1NpbXBsZSBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy8gQVBJIEdhdGV3YXkgZm9yIExhbWJkYSBmdW5jdGlvbnMgb25seVxyXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnV29yZFByZXNzQVBJJywge1xyXG4gICAgICByZXN0QXBpTmFtZTogJ1dvcmRQcmVzcyBSRVNUIEFQSScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOlxyXG4gICAgICAgICdBUEkgR2F0ZXdheSBmb3IgTGFtYmRhIGZ1bmN0aW9ucyAoV29yZFByZXNzIEFQSSBoYW5kbGVkIGRpcmVjdGx5IGJ5IExpZ2h0c2FpbCknLFxyXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcclxuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcclxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcclxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1SZXF1ZXN0ZWQtV2l0aCddLFxyXG4gICAgICAgIGFsbG93Q3JlZGVudGlhbHM6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcclxuICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcclxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXHJcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDEwMCxcclxuICAgICAgICB0aHJvdHRsaW5nUmF0ZUxpbWl0OiA1MCxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE91dHB1dHNcclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcmNoaXRlY3R1cmUnLCB7XHJcbiAgICAgIHZhbHVlOiAnTGlnaHRzYWlsIFdvcmRQcmVzcyB3aXRoIE5leHQuanMgRnJvbnRlbmQgKERpcmVjdCBBUEkgQWNjZXNzKScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBBcmNoaXRlY3R1cmUnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dvcmRQcmVzc1VSTCcsIHtcclxuICAgICAgdmFsdWU6ICdodHRwczovL2FwaS5jb3dib3lraW1vbm8uY29tJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdXb3JkUHJlc3MgUkVTVCBBUEkgVVJMIChMaWdodHNhaWwgLSBEaXJlY3QgQWNjZXNzKScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV29yZFByZXNzQWRtaW5VUkwnLCB7XHJcbiAgICAgIHZhbHVlOiAnaHR0cHM6Ly9hZG1pbi5jb3dib3lraW1vbm8uY29tJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdXb3JkUHJlc3MgQWRtaW4gVVJMIChMaWdodHNhaWwgLSBEaXJlY3QgQWNjZXNzKScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQVBJRW5kcG9pbnQnLCB7XHJcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IEVuZHBvaW50IChMYW1iZGEgRnVuY3Rpb25zIE9ubHkpJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDYWNoaW5nU3RyYXRlZ3knLCB7XHJcbiAgICAgIHZhbHVlOiAnV29yZFByZXNzIFJlZGlzICsgUkVTVCBBUEkgQ2FjaGluZyAoTm8gQ2xvdWRGcm9udCknLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgQ2FjaGluZyBTdHJhdGVneScsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19