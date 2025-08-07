// Type Definitions Index
// This file exports all type definitions for easier imports

// API Types
export type {
  HealthCheckResponse,
  CacheHealthStats,
  WordPressHealthStatus,
  WPRestAPIResponse,
  WPRestPaginationMeta,
  WPRestPostsResponse,
  WordPressWebhookPayload,
  WebhookValidationError,
  WebhookResponse,
  APIErrorResponse,
  APISuccessResponse,
  RateLimitInfo,
  MonitoringMetric,
  MonitoringLog,
  APIHandlerParams,
  APIHandlerFunction,
} from './api';

// WordPress Types
export type {
  WPRestPost,
  WPRestCategory,
  WPRestTag,
  WPRestAuthor,
  WPRestMedia,
  WPRestQueryParams,
  WPRestResponseHeaders,
  WPRestPagination,
  WPRestErrorResponse,
  WPRestSearchResponse,
  WPRestSearchResult,
} from './wordpress';

// AWS Types
export type {
  AWSClientConfig,
  CloudWatchMetricData,
  CloudWatchPutMetricDataCommandInput,
  CloudWatchPutMetricDataCommandOutput,
  CloudWatchLogsPutLogEventsCommandInput,
  CloudWatchLogsPutLogEventsCommandOutput,
  XRayTraceSegment,
  XRayPutTraceSegmentsCommandInput,
  XRayPutTraceSegmentsCommandOutput,
  S3PutObjectCommandInput,
  S3PutObjectCommandOutput,
  LambdaInvokeCommandInput,
  LambdaInvokeCommandOutput,
  SecretsManagerGetSecretValueCommandInput,
  SecretsManagerGetSecretValueCommandOutput,
  CloudFrontCreateInvalidationCommandInput,
  CloudFrontCreateInvalidationCommandOutput,
  AWSClientConstructor,
  AWSCommandConstructor,
  MonitoringConfig,
  AWSError,
  AWSResponseMetadata,
  AWSClientType,
  AWSCommandType,
} from './aws';

// Validation Schemas
export {
  healthCheckResponseSchema,
  webhookPayloadSchema,
  wpRestPostSchema,
  wpRestCategorySchema,
  wpRestTagSchema,
} from './api';

export {
  WP_REST_ENDPOINTS,
  WP_POST_STATUSES,
  WP_POST_TYPES,
} from './wordpress';

// Type Guards
export {
  isHealthCheckResponse,
  isWebhookPayload,
  isWPRestPost,
  isWPRestCategory,
  isWPRestTag,
  isAWSError,
  isAWSResponseMetadata,
} from './api';

// Utility Functions
export {
  createAWSError,
  isRetryableAWSError,
  extractAWSResponseMetadata,
  isSuccessfulAWSResponse,
} from './aws';

export {
  validateWPRestPost,
  validateWPRestCategory,
  validateWPRestTag,
} from './wordpress'; 