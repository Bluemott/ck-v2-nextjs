// AWS SDK Type Definitions
// This file contains comprehensive type definitions for AWS SDK v3 compatibility

// AWS SDK Client Types
export interface AWSClientConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  maxAttempts?: number;
  requestHandler?: unknown;
  retryMode?: 'adaptive' | 'standard' | 'legacy';
  logger?: unknown;
  userAgent?: string | boolean;
  customUserAgent?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  useAccelerateEndpoint?: boolean;
  useDualstackEndpoint?: boolean;
  useGlobalEndpoint?: boolean;
  disableHostPrefix?: boolean;
  serviceId?: string;
}

// CloudWatch Types
export interface CloudWatchMetricData {
  Namespace: string;
  MetricData: Array<{
    MetricName: string;
    Value: number;
    Unit: 'Count' | 'Seconds' | 'Percent' | 'Bytes' | 'Count/Second' | 'Bits/Second' | 'Bits' | 'Terabits/Second' | 'Terabits' | 'Gigabits/Second' | 'Gigabits' | 'Megabits/Second' | 'Megabits' | 'Kilobits/Second' | 'Kilobits' | 'Terabytes/Second' | 'Terabytes' | 'Gigabytes/Second' | 'Gigabytes' | 'Megabytes/Second' | 'Megabytes' | 'Kilobytes/Second' | 'Kilobytes' | 'Microseconds' | 'Milliseconds';
    Dimensions?: Array<{
      Name: string;
      Value: string;
    }>;
    Timestamp?: Date;
    StatisticValues?: {
      SampleCount: number;
      Sum: number;
      Minimum: number;
      Maximum: number;
    };
    Values?: number[];
    Counts?: number[];
    StorageResolution?: number;
  }>;
}

export interface CloudWatchPutMetricDataCommandInput {
  Namespace: string;
  MetricData: Array<{
    MetricName: string;
    Value?: number;
    Unit?: string;
    Dimensions?: Array<{
      Name: string;
      Value: string;
    }>;
    Timestamp?: Date;
    StatisticValues?: {
      SampleCount: number;
      Sum: number;
      Minimum: number;
      Maximum: number;
    };
    Values?: number[];
    Counts?: number[];
    StorageResolution?: number;
  }>;
}

export interface CloudWatchPutMetricDataCommandOutput {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  FailedPutCount?: number;
  MetricDataResults?: Array<{
    Id?: string;
    ErrorCode?: string;
    ErrorMessage?: string;
  }>;
}

// CloudWatch Logs Types
export interface CloudWatchLogsPutLogEventsCommandInput {
  logGroupName: string;
  logStreamName: string;
  logEvents: Array<{
    timestamp: number;
    message: string;
  }>;
  sequenceToken?: string;
}

export interface CloudWatchLogsPutLogEventsCommandOutput {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  nextSequenceToken?: string;
  rejectedLogEventsInfo?: {
    tooNewLogEventStartIndex?: number;
    tooOldLogEventEndIndex?: number;
    expiredLogEventEndIndex?: number;
  };
}

// X-Ray Types
export interface XRayTraceSegment {
  name: string;
  trace_id: string;
  parent_id?: string;
  start_time: number;
  end_time: number;
  metadata?: Record<string, unknown>;
  subsegments?: XRayTraceSegment[];
  annotations?: Record<string, string | number | boolean>;
  cause?: {
    working_directory?: string;
    paths?: string[];
    exceptions?: Array<{
      id?: string;
      message?: string;
      type?: string;
      remote?: boolean;
      truncated?: number;
      skipped?: number;
      cause?: string;
      stack?: Array<{
        path?: string;
        line?: number;
        label?: string;
      }>;
    }>;
  };
}

export interface XRayPutTraceSegmentsCommandInput {
  TraceSegmentDocuments: string[];
}

export interface XRayPutTraceSegmentsCommandOutput {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  UnprocessedTraceSegments?: Array<{
    Id?: string;
    ErrorCode?: string;
    Message?: string;
  }>;
}

// S3 Types
export interface S3PutObjectCommandInput {
  Bucket: string;
  Key: string;
  Body: Buffer | Uint8Array | Blob | string;
  ContentType?: string;
  ContentLength?: number;
  ContentEncoding?: string;
  ContentLanguage?: string;
  ContentDisposition?: string;
  CacheControl?: string;
  Expires?: Date;
  Metadata?: Record<string, string>;
  ACL?: string;
  GrantRead?: string;
  GrantReadACP?: string;
  GrantWriteACP?: string;
  GrantFullControl?: string;
  ServerSideEncryption?: string;
  StorageClass?: string;
  WebsiteRedirectLocation?: string;
  SSECustomerAlgorithm?: string;
  SSECustomerKey?: string;
  SSECustomerKeyMD5?: string;
  SSEKMSKeyId?: string;
  SSEKMSEncryptionContext?: string;
  RequestPayer?: string;
  Tagging?: string;
  ObjectLockMode?: string;
  ObjectLockRetainUntilDate?: Date;
  ObjectLockLegalHoldStatus?: string;
}

export interface S3PutObjectCommandOutput {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  ETag?: string;
  Expiration?: string;
  RequestCharged?: string;
  SSECustomerAlgorithm?: string;
  SSECustomerKeyMD5?: string;
  SSEKMSEncryptionContext?: string;
  SSEKMSKeyId?: string;
  VersionId?: string;
}

// Lambda Types
export interface LambdaInvokeCommandInput {
  FunctionName: string;
  InvocationType?: 'Event' | 'RequestResponse' | 'DryRun';
  LogType?: 'None' | 'Tail';
  ClientContext?: string;
  Payload?: Buffer | Uint8Array | Blob | string;
  Qualifier?: string;
}

export interface LambdaInvokeCommandOutput {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  StatusCode?: number;
  FunctionError?: string;
  LogResult?: string;
  Payload?: Buffer | Uint8Array | Blob | string;
  ExecutedVersion?: string;
}

// Secrets Manager Types
export interface SecretsManagerGetSecretValueCommandInput {
  SecretId: string;
  VersionId?: string;
  VersionStage?: string;
}

export interface SecretsManagerGetSecretValueCommandOutput {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  ARN?: string;
  Name?: string;
  VersionId?: string;
  SecretBinary?: Buffer | Uint8Array | Blob;
  SecretString?: string;
  VersionStages?: string[];
  CreatedDate?: Date;
}

// CloudFront Types
export interface CloudFrontCreateInvalidationCommandInput {
  DistributionId: string;
  InvalidationBatch: {
    Paths: {
      Quantity: number;
      Items: string[];
    };
    CallerReference: string;
  };
}

export interface CloudFrontCreateInvalidationCommandOutput {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  Location?: string;
  Invalidation?: {
    Id?: string;
    Status?: string;
    CreateTime?: Date;
    InvalidationBatch?: {
      Paths?: {
        Quantity?: number;
        Items?: string[];
      };
      CallerReference?: string;
    };
  };
}

// AWS SDK Client Constructors
export interface AWSClientConstructor<T> {
  new (_config?: AWSClientConfig): T;
}

// AWS SDK Command Constructors
export interface AWSCommandConstructor<TInput, TOutput> {
  new (_input: TInput): {
    input: TInput;
    output: TOutput;
  };
}

// Monitoring Configuration Types
export interface MonitoringConfig {
  region: string;
  logGroupName: string;
  enableXRay: boolean;
  enableMetrics: boolean;
  enableLogs: boolean;
  environment: 'development' | 'production' | 'test';
  serviceName?: string;
  serviceVersion?: string;
  maxRetries?: number;
  timeout?: number;
}

// AWS SDK Error Types
export interface AWSError {
  name: string;
  message: string;
  code: string;
  statusCode?: number;
  requestId?: string;
  hostname?: string;
  region?: string;
  retryable?: boolean;
  retryDelay?: number;
  time?: Date;
  stack?: string;
}

// AWS SDK Response Metadata
export interface AWSResponseMetadata {
  httpStatusCode: number;
  requestId: string;
  extendedRequestId?: string;
  cfId?: string;
  attempts?: number;
  totalRetryDelay?: number;
}

// Type guards for AWS responses
export function isAWSError(error: unknown): error is AWSError {
  return error instanceof Error && 'code' in error && 'requestId' in error;
}

export function isAWSResponseMetadata(obj: unknown): obj is AWSResponseMetadata {
  return typeof obj === 'object' && obj !== null && 'httpStatusCode' in obj && 'requestId' in obj;
}

// AWS SDK utility types
export type AWSClientType = {
  send: <TCommand extends { input: unknown; output: unknown }>(
    _command: TCommand
  ) => Promise<TCommand['output']>;
};

export type AWSCommandType<TInput, TOutput> = {
  input: TInput;
  output: TOutput;
};

// AWS SDK configuration validation
export const awsClientConfigSchema = {
  region: (value: unknown): value is string => typeof value === 'string' && value.length > 0,
  credentials: (value: unknown): value is { accessKeyId: string; secretAccessKey: string; sessionToken?: string } => {
    return typeof value === 'object' && value !== null && 'accessKeyId' in value && 'secretAccessKey' in value;
  },
  maxAttempts: (value: unknown): value is number => typeof value === 'number' && value > 0 && value <= 10,
  timeout: (value: unknown): value is number => typeof value === 'number' && value > 0,
};

// AWS SDK error handling utilities
export function createAWSError(name: string, message: string, code: string, statusCode?: number): AWSError {
  const error = new Error(message) as AWSError;
  error.name = name;
  error.code = code;
  error.statusCode = statusCode;
  error.retryable = code === 'ThrottlingException' || code === 'ServiceUnavailable';
  error.time = new Date();
  return error;
}

export function isRetryableAWSError(error: AWSError): boolean {
  const retryableCodes = [
    'ThrottlingException',
    'ServiceUnavailable',
    'InternalFailure',
    'RequestTimeout',
    'NetworkingError',
    'CredentialsError',
  ];
  return error.retryable === true || retryableCodes.includes(error.code);
}

// AWS SDK response utilities
export function extractAWSResponseMetadata(response: { $metadata?: AWSResponseMetadata }): AWSResponseMetadata | undefined {
  return response.$metadata;
}

export function isSuccessfulAWSResponse(response: { $metadata?: AWSResponseMetadata }): boolean {
  const metadata = extractAWSResponseMetadata(response);
  return metadata ? metadata.httpStatusCode >= 200 && metadata.httpStatusCode < 300 : false;
} 