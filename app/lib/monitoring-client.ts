// Client-safe monitoring module for browser environments
// This module provides monitoring functionality without AWS SDK dependencies

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

// Client-safe monitoring class
export class ClientMonitoring {
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  // Metrics - client-side fallback
  async putMetric(data: MetricData): Promise<void> {
    // In client environment, just log to console
    if (this.config.environment === 'development') {
      console.warn(`[CLIENT METRIC] ${data.namespace}/${data.metricName}: ${data.value} ${data.unit}`, data.dimensions || '');
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
  }

  async recordLambdaAPICall(endpoint: string, duration: number, statusCode: number, source: 'lambda' | 'wordpress'): Promise<void> {
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

  // Logging - client-side fallback
  async putLog(data: LogData): Promise<void> {
    // In client environment, just log to console
    if (this.config.environment === 'development') {
      console.warn(`[CLIENT ${data.level.toUpperCase()}] ${data.message}`, data.metadata || '');
    }
  }

  // Convenience logging methods
  async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.putLog({ message, level: 'info', metadata });
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.putLog({ message, level: 'warn', metadata });
  }

  async error(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.putLog({ message, level: 'error', metadata });
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.putLog({ message, level: 'debug', metadata });
  }

  // X-Ray tracing - client-side fallback
  async putTrace(data: TraceData): Promise<void> {
    // In client environment, just log to console
    if (this.config.environment === 'development') {
      console.warn(`[CLIENT TRACE] ${data.name}: ${data.traceId}`, data.metadata || '');
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
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.info('Health check performed', { timestamp: new Date().toISOString() });
      return true;
    } catch (error) {
      await this.error('Health check failed', { error: (error as Error).message });
      return false;
    }
  }
}

// Default client monitoring instance
export const clientMonitoring = new ClientMonitoring({
  region: process.env.AWS_REGION || 'us-east-1',
  logGroupName: '/aws/wordpress/application',
  enableXRay: false, // Disabled for client
  enableMetrics: false, // Disabled for client
  enableLogs: false, // Disabled for client
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
});

// Performance decorator for functions
export function monitorPerformance(name: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return clientMonitoring.measurePerformance(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

// Cache decorator
export function monitorCache(cacheType: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const key = args[0] || 'default';
      return clientMonitoring.measureCacheOperation(cacheType, () => originalMethod.apply(this, args), key as string);
    };

    return descriptor;
  };
} 