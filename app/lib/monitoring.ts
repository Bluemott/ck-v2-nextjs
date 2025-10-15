// Conditional imports to avoid Edge Runtime issues
import type {
  AWSError,
  CloudWatchLogsPutLogEventsCommandInput,
  MonitoringConfig,
  XRayPutTraceSegmentsCommandInput,
} from './types/aws';

let CloudWatchClient:
  | typeof import('@aws-sdk/client-cloudwatch').CloudWatchClient
  | null = null;
let PutMetricDataCommand:
  | typeof import('@aws-sdk/client-cloudwatch').PutMetricDataCommand
  | null = null;
let XRayClient: typeof import('@aws-sdk/client-xray').XRayClient | null = null;
let PutTraceSegmentsCommand:
  | typeof import('@aws-sdk/client-xray').PutTraceSegmentsCommand
  | null = null;
let CloudWatchLogsClient:
  | typeof import('@aws-sdk/client-cloudwatch-logs').CloudWatchLogsClient
  | null = null;
let PutLogEventsCommand:
  | typeof import('@aws-sdk/client-cloudwatch-logs').PutLogEventsCommand
  | null = null;

// Initialize AWS SDK clients
async function initializeAWSClients(): Promise<void> {
  if (typeof window === 'undefined') {
    try {
      // Convert CommonJS require() to ES Module imports
      const cloudwatch = await import('@aws-sdk/client-cloudwatch');
      const xray = await import('@aws-sdk/client-xray');
      const cloudwatchLogs = await import('@aws-sdk/client-cloudwatch-logs');

      CloudWatchClient = cloudwatch.CloudWatchClient;
      PutMetricDataCommand = cloudwatch.PutMetricDataCommand;
      XRayClient = xray.XRayClient;
      PutTraceSegmentsCommand = xray.PutTraceSegmentsCommand;
      CloudWatchLogsClient = cloudwatchLogs.CloudWatchLogsClient;
      PutLogEventsCommand = cloudwatchLogs.PutLogEventsCommand;
    } catch (error) {
      console.warn('AWS SDK not available in current environment:', error);
    }
  }
}

// Initialize clients immediately
initializeAWSClients().catch(console.error);

// Types for monitoring
export interface MetricData {
  namespace: string;
  metricName: string;
  value: number;
  unit:
    | 'Count'
    | 'Seconds'
    | 'Percent'
    | 'Bytes'
    | 'Count/Second'
    | 'Milliseconds'
    | 'None';
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface LogData {
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface TraceData {
  name: string;
  traceId: string;
  parentId?: string;
  startTime: number;
  endTime: number;
  metadata?: Record<string, unknown>;
}

export interface CoreWebVitalsMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
  FCP?: number;
  TTFB?: number;
  INP?: number;
  page?: string;
  userAgent?: string;
  timestamp?: Date;
}

// Monitoring class with proper AWS SDK types
export class Monitoring {
  private cloudwatch:
    | import('@aws-sdk/client-cloudwatch').CloudWatchClient
    | null = null;
  private xray: import('@aws-sdk/client-xray').XRayClient | null = null;
  private logs:
    | import('@aws-sdk/client-cloudwatch-logs').CloudWatchLogsClient
    | null = null;
  protected config: MonitoringConfig;
  private sequenceToken?: string;

  constructor(config: MonitoringConfig) {
    this.config = config;

    // Only initialize AWS clients if SDK is available and in server environment
    if (typeof window === 'undefined' && CloudWatchClient) {
      if (config.enableMetrics || config.enableLogs) {
        this.cloudwatch = new CloudWatchClient({
          region: config.region,
          maxAttempts: config.maxRetries || 3,
        });
      }

      if (config.enableXRay && XRayClient) {
        this.xray = new XRayClient({
          region: config.region,
          maxAttempts: config.maxRetries || 3,
        });
      }

      if (config.enableLogs && CloudWatchLogsClient) {
        this.logs = new CloudWatchLogsClient({
          region: config.region,
          maxAttempts: config.maxRetries || 3,
        });
      }
    }
  }

  // Metrics with proper AWS SDK types
  async putMetric(data: MetricData): Promise<void> {
    // Skip monitoring completely during builds
    if (process.env.CI) {
      return;
    }

    if (!this.config.enableMetrics) {
      // In development, just log to console
      if (this.config.environment === 'development') {
        console.warn(
          `[METRIC] ${data.namespace}/${data.metricName}: ${data.value} ${data.unit}`,
          data.dimensions || ''
        );
      }
      return;
    }

    // Skip if AWS SDK is not available
    if (!this.cloudwatch || !PutMetricDataCommand) {
      return; // Silent skip, no logging
    }

    try {
      const commandInput = {
        Namespace: data.namespace,
        MetricData: [
          {
            MetricName: data.metricName,
            Value: data.value,
            Unit: data.unit,
            Dimensions: Object.entries(data.dimensions || {}).map(
              ([Name, Value]) => ({ Name, Value })
            ),
            Timestamp: data.timestamp || new Date(),
          },
        ],
      };

      const command = new PutMetricDataCommand(commandInput);
      const response = await this.cloudwatch.send(command);

      // Check for failed metrics
      if (
        'FailedPutCount' in response &&
        typeof response.FailedPutCount === 'number' &&
        response.FailedPutCount > 0
      ) {
        console.warn(`Failed to put ${response.FailedPutCount} metrics`);
      }
    } catch (error) {
      console.error('Failed to put metric:', error);
      if (this.isAWSError(error)) {
        console.error('AWS Error details:', {
          code: error.code,
          message: error.message,
          requestId: error.requestId,
        });
      }
    }
  }

  // Application metrics
  async recordAPICall(
    endpoint: string,
    duration: number,
    statusCode: number
  ): Promise<void> {
    await this.putMetric({
      namespace: 'WordPress/API',
      metricName: 'APICallDuration',
      value: duration,
      unit: 'Seconds',
      dimensions: {
        Endpoint: endpoint,
        StatusCode: statusCode.toString(),
        Environment: this.config.environment,
      },
    });

    await this.putMetric({
      namespace: 'WordPress/API',
      metricName: 'APICallCount',
      value: 1,
      unit: 'Count',
      dimensions: {
        Endpoint: endpoint,
        StatusCode: statusCode.toString(),
        Environment: this.config.environment,
      },
    });
  }

  async recordLambdaAPICall(
    endpoint: string,
    duration: number,
    statusCode: number,
    source: 'lambda' | 'wordpress'
  ): Promise<void> {
    await this.putMetric({
      namespace: 'Lambda/API',
      metricName: 'ResponseTime',
      value: duration,
      unit: 'Seconds',
      dimensions: {
        Endpoint: endpoint,
        StatusCode: statusCode.toString(),
        Source: source,
        Environment: this.config.environment,
      },
    });

    await this.putMetric({
      namespace: 'Lambda/API',
      metricName: 'RequestCount',
      value: 1,
      unit: 'Count',
      dimensions: {
        Endpoint: endpoint,
        StatusCode: statusCode.toString(),
        Source: source,
        Environment: this.config.environment,
      },
    });
  }

  async recordCacheHit(cacheType: string): Promise<void> {
    await this.putMetric({
      namespace: 'WordPress/Cache',
      metricName: 'CacheHit',
      value: 1,
      unit: 'Count',
      dimensions: {
        CacheType: cacheType,
        Environment: this.config.environment,
      },
    });
  }

  async recordCacheMiss(cacheType: string): Promise<void> {
    await this.putMetric({
      namespace: 'WordPress/Cache',
      metricName: 'CacheMiss',
      value: 1,
      unit: 'Count',
      dimensions: {
        CacheType: cacheType,
        Environment: this.config.environment,
      },
    });
  }

  async recordDatabaseQuery(
    queryType: string,
    duration: number
  ): Promise<void> {
    await this.putMetric({
      namespace: 'WordPress/Database',
      metricName: 'QueryDuration',
      value: duration,
      unit: 'Seconds',
      dimensions: {
        QueryType: queryType,
        Environment: this.config.environment,
      },
    });
  }

  // Logging with proper AWS SDK types
  async putLog(data: LogData): Promise<void> {
    // Skip monitoring completely during builds
    if (process.env.CI) {
      return;
    }

    if (!this.config.enableLogs) {
      // In development, just log to console
      if (this.config.environment === 'development') {
        console.warn(
          `[${data.level.toUpperCase()}] ${data.message}`,
          data.metadata || ''
        );
      }
      return;
    }

    // Skip if AWS SDK is not available
    if (!this.logs || !PutLogEventsCommand) {
      return; // Silent skip, no logging
    }

    try {
      const logEvent = {
        timestamp: (data.timestamp || new Date()).getTime(),
        message: JSON.stringify({
          level: data.level,
          message: data.message,
          metadata: data.metadata,
          timestamp: new Date().toISOString(),
        }),
      };

      const commandInput: CloudWatchLogsPutLogEventsCommandInput = {
        logGroupName: this.config.logGroupName,
        logStreamName: `${this.config.environment}-${new Date().toISOString().split('T')[0]}`,
        logEvents: [logEvent],
        sequenceToken: this.sequenceToken,
      };

      const command = new PutLogEventsCommand(commandInput);
      const response = await this.logs.send(command);
      this.sequenceToken = response.nextSequenceToken;
    } catch (error) {
      console.error('Failed to put log:', error);
      if (this.isAWSError(error)) {
        console.error('AWS Error details:', {
          code: error.code,
          message: error.message,
          requestId: error.requestId,
        });
      }
    }
  }

  // Convenience logging methods
  async info(
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.putLog({ message, level: 'info', metadata });
  }

  async warn(
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.putLog({ message, level: 'warn', metadata });
  }

  async error(
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.putLog({ message, level: 'error', metadata });
  }

  async debug(
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.putLog({ message, level: 'debug', metadata });
  }

  // X-Ray tracing with proper AWS SDK types
  async putTrace(data: TraceData): Promise<void> {
    if (!this.config.enableXRay) return;

    // Skip if AWS SDK is not available
    if (!this.xray || !PutTraceSegmentsCommand) {
      console.warn('X-Ray not available, skipping trace');
      return;
    }

    try {
      const segment = {
        name: data.name,
        trace_id: data.traceId,
        parent_id: data.parentId,
        start_time: data.startTime,
        end_time: data.endTime,
        metadata: data.metadata,
      };

      const commandInput: XRayPutTraceSegmentsCommandInput = {
        TraceSegmentDocuments: [JSON.stringify(segment)],
      };

      const command = new PutTraceSegmentsCommand(commandInput);
      const response = await this.xray.send(command);

      // Check for unprocessed segments
      if (
        response.UnprocessedTraceSegments &&
        response.UnprocessedTraceSegments.length > 0
      ) {
        console.warn(
          `Failed to process ${response.UnprocessedTraceSegments.length} trace segments`
        );
      }
    } catch (error) {
      console.error('Failed to put trace:', error);
      if (this.isAWSError(error)) {
        console.error('AWS Error details:', {
          code: error.code,
          message: error.message,
          requestId: error.requestId,
        });
      }
    }
  }

  // Performance monitoring
  async measurePerformance<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    const traceId = this.generateTraceId();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      // Record metric
      await this.putMetric({
        namespace: 'WordPress/Performance',
        metricName: 'OperationDuration',
        value: duration,
        unit: 'Seconds',
        dimensions: {
          Operation: name,
          Environment: this.config.environment,
        },
      });

      // Record trace
      await this.putTrace({
        name,
        traceId,
        startTime,
        endTime: Date.now(),
        metadata: { ...metadata, duration },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record error metric
      await this.putMetric({
        namespace: 'WordPress/Performance',
        metricName: 'OperationError',
        value: 1,
        unit: 'Count',
        dimensions: {
          Operation: name,
          Environment: this.config.environment,
        },
      });

      // Record error trace
      await this.putTrace({
        name: `${name}-error`,
        traceId,
        startTime,
        endTime: Date.now(),
        metadata: { ...metadata, duration, error: (error as Error).message },
      });

      throw error;
    }
  }

  // Cache monitoring
  async measureCacheOperation<T>(
    cacheType: string,
    operation: () => Promise<T>,
    _key: string
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      await this.recordCacheHit(cacheType);
      await this.putMetric({
        namespace: 'WordPress/Cache',
        metricName: 'CacheOperationDuration',
        value: duration,
        unit: 'Seconds',
        dimensions: {
          CacheType: cacheType,
          Operation: 'hit',
          Environment: this.config.environment,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await this.recordCacheMiss(cacheType);
      await this.putMetric({
        namespace: 'WordPress/Cache',
        metricName: 'CacheOperationDuration',
        value: duration,
        unit: 'Seconds',
        dimensions: {
          CacheType: cacheType,
          Operation: 'miss',
          Environment: this.config.environment,
        },
      });

      throw error;
    }
  }

  // Utility methods
  private generateTraceId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // AWS Error type guard
  private isAWSError(error: unknown): error is AWSError {
    return error instanceof Error && 'code' in error && 'requestId' in error;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.info('Health check performed', {
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      await this.error('Health check failed', {
        error: (error as Error).message,
      });
      return false;
    }
  }
}

// Enhanced monitoring class with Core Web Vitals tracking
export class EnhancedMonitoring extends Monitoring {
  constructor(config: MonitoringConfig) {
    super(config);
  }

  async trackCoreWebVitals(metrics: CoreWebVitalsMetrics): Promise<void> {
    try {
      // Track each metric individually for better CloudWatch organization
      const metricData = Object.entries(metrics).map(([name, value]) => ({
        namespace: 'CowboyKimono/WebVitals',
        metricName: name,
        value: value || 0,
        unit: (name === 'CLS' ? 'None' : 'Milliseconds') as
          | 'None'
          | 'Milliseconds',
        dimensions: {
          Page: metrics.page || 'unknown',
          UserAgent: metrics.userAgent || 'unknown',
          Environment: this.config.environment,
        },
        timestamp: metrics.timestamp || new Date(),
      }));

      // Send all metrics in parallel
      await Promise.all(metricData.map((metric) => this.putMetric(metric)));

      // Log the metrics for debugging
      await this.info('Core Web Vitals tracked', {
        metrics,
        page: metrics.page,
        userAgent: metrics.userAgent,
      });
    } catch (error) {
      console.error('Failed to track Core Web Vitals:', error);
      await this.error('Core Web Vitals tracking failed', {
        error: (error as Error).message,
        metrics,
      });
    }
  }

  async trackPerformanceMetric(
    metricName: string,
    value: number,
    unit: 'Milliseconds' | 'None' | 'Count' = 'Milliseconds',
    dimensions?: Record<string, string>
  ): Promise<void> {
    await this.putMetric({
      namespace: 'CowboyKimono/Performance',
      metricName,
      value,
      unit,
      dimensions: {
        ...dimensions,
        Environment: this.config.environment,
      },
    });
  }

  async trackUserInteraction(
    interactionType: string,
    duration: number,
    page?: string
  ): Promise<void> {
    await this.putMetric({
      namespace: 'CowboyKimono/UserInteractions',
      metricName: 'InteractionDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions: {
        InteractionType: interactionType,
        Page: page || 'unknown',
        Environment: this.config.environment,
      },
    });
  }

  async trackPageLoad(
    page: string,
    loadTime: number,
    userAgent?: string
  ): Promise<void> {
    await this.putMetric({
      namespace: 'CowboyKimono/PageLoad',
      metricName: 'LoadTime',
      value: loadTime,
      unit: 'Milliseconds',
      dimensions: {
        Page: page,
        UserAgent: userAgent || 'unknown',
        Environment: this.config.environment,
      },
    });
  }
}

// Default monitoring instance
export const monitoring = new Monitoring({
  region: process.env.AWS_REGION || 'us-east-1',
  logGroupName: '/aws/wordpress/application',
  enableXRay: process.env.NODE_ENV === 'production',
  enableMetrics: process.env.NODE_ENV === 'production',
  enableLogs: process.env.NODE_ENV === 'production', // Only enable logs in production
  environment:
    (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
    'development',
  maxRetries: 3,
  timeout: 10000,
});

// Performance decorator for functions
export function monitorPerformance(name: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return monitoring.measurePerformance(name, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

// Cache decorator
export function monitorCache(cacheType: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const key = args[0] || 'default';
      return monitoring.measureCacheOperation(
        cacheType,
        () => originalMethod.apply(this, args),
        key as string
      );
    };

    return descriptor;
  };
}
