// Conditional imports to avoid Edge Runtime issues
let CloudWatchClient: any;
let PutMetricDataCommand: any;
let XRayClient: any;
let PutTraceSegmentsCommand: any;
let CloudWatchLogsClient: any;
let PutLogEventsCommand: any;

// Only import AWS SDK in server environment
if (typeof window === 'undefined') {
  try {
    const cloudwatch = require('@aws-sdk/client-cloudwatch');
    const xray = require('@aws-sdk/client-xray');
    const cloudwatchLogs = require('@aws-sdk/client-cloudwatch-logs');
    
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

// Types for monitoring
export interface MonitoringConfig {
  region: string;
  logGroupName: string;
  enableXRay: boolean;
  enableMetrics: boolean;
  enableLogs: boolean;
  environment: 'development' | 'production' | 'test';
}

export interface MetricData {
  namespace: string;
  metricName: string;
  value: number;
  unit: 'Count' | 'Seconds' | 'Percent' | 'Bytes' | 'Count/Second';
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface LogData {
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface TraceData {
  name: string;
  traceId: string;
  parentId?: string;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

// Monitoring class
export class Monitoring {
  private cloudwatch: CloudWatchClient;
  private xray: XRayClient;
  private logs: CloudWatchLogsClient;
  private config: MonitoringConfig;
  private sequenceToken?: string;

  constructor(config: MonitoringConfig) {
    this.config = config;
    
    // Only initialize AWS clients if SDK is available and in server environment
    if (typeof window === 'undefined' && CloudWatchClient) {
      if (config.enableMetrics || config.enableLogs) {
        this.cloudwatch = new CloudWatchClient({ region: config.region });
      }
      
      if (config.enableXRay && XRayClient) {
        this.xray = new XRayClient({ region: config.region });
      }
      
      if (config.enableLogs && CloudWatchLogsClient) {
        this.logs = new CloudWatchLogsClient({ region: config.region });
      }
    }
  }

  // Metrics
  async putMetric(data: MetricData): Promise<void> {
    if (!this.config.enableMetrics) {
      // In development, just log to console
      if (this.config.environment === 'development') {
        console.log(`[METRIC] ${data.namespace}/${data.metricName}: ${data.value} ${data.unit}`, data.dimensions || '');
      }
      return;
    }

    // Skip if AWS SDK is not available
    if (!this.cloudwatch || !PutMetricDataCommand) {
      console.warn('CloudWatch not available, skipping metric');
      return;
    }

    try {
      const command = new PutMetricDataCommand({
        Namespace: data.namespace,
        MetricData: [{
          MetricName: data.metricName,
          Value: data.value,
          Unit: data.unit,
          Dimensions: Object.entries(data.dimensions || {}).map(([Name, Value]) => ({ Name, Value })),
          Timestamp: data.timestamp || new Date(),
        }],
      });

      await this.cloudwatch.send(command);
    } catch (error) {
      console.error('Failed to put metric:', error);
    }
  }

  // Application metrics
  async recordAPICall(endpoint: string, duration: number, statusCode: number): Promise<void> {
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

  async recordDatabaseQuery(queryType: string, duration: number): Promise<void> {
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

  // Logging
  async putLog(data: LogData): Promise<void> {
    if (!this.config.enableLogs) {
      // In development, just log to console
      if (this.config.environment === 'development') {
        console.log(`[${data.level.toUpperCase()}] ${data.message}`, data.metadata || '');
      }
      return;
    }

    // Skip if AWS SDK is not available
    if (!this.logs || !PutLogEventsCommand) {
      console.warn('CloudWatch Logs not available, skipping log');
      return;
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

      const command = new PutLogEventsCommand({
        logGroupName: this.config.logGroupName,
        logStreamName: `${this.config.environment}-${new Date().toISOString().split('T')[0]}`,
        logEvents: [logEvent],
        sequenceToken: this.sequenceToken,
      });

      const response = await this.logs.send(command);
      this.sequenceToken = response.nextSequenceToken;
    } catch (error) {
      console.error('Failed to put log:', error);
    }
  }

  // Convenience logging methods
  async info(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.putLog({ message, level: 'info', metadata });
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.putLog({ message, level: 'warn', metadata });
  }

  async error(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.putLog({ message, level: 'error', metadata });
  }

  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.putLog({ message, level: 'debug', metadata });
  }

  // X-Ray tracing
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

      const command = new PutTraceSegmentsCommand({
        TraceSegmentDocuments: [JSON.stringify(segment)],
      });

      await this.xray.send(command);
    } catch (error) {
      console.error('Failed to put trace:', error);
    }
  }

  // Performance monitoring
  async measurePerformance<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
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
        metadata: { ...metadata, duration, error: error.message },
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
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.info('Health check performed', { timestamp: new Date().toISOString() });
      return true;
    } catch (error) {
      await this.error('Health check failed', { error: error.message });
      return false;
    }
  }
}

// Default monitoring instance
export const monitoring = new Monitoring({
  region: process.env.AWS_REGION || 'us-east-1',
  logGroupName: '/aws/wordpress/application',
  enableXRay: process.env.NODE_ENV === 'production',
  enableMetrics: process.env.NODE_ENV === 'production',
  enableLogs: process.env.NODE_ENV === 'production', // Only enable logs in production
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
});

// Performance decorator for functions
export function monitorPerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return monitoring.measurePerformance(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

// Cache decorator
export function monitorCache(cacheType: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = args[0] || 'default';
      return monitoring.measureCacheOperation(cacheType, () => originalMethod.apply(this, args), key);
    };

    return descriptor;
  };
} 