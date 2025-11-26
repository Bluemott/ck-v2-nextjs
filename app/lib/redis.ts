/**
 * Redis Client for Next.js
 * Connects to WordPress Lightsail Redis instance with automatic fallback
 */

import { createClient, RedisClientType } from 'redis';

// Redis configuration
const REDIS_CONFIG = {
  // Default to localhost for WordPress Lightsail Redis (same server)
  // Can be overridden via environment variable
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  // Connection timeout
  connectTimeout: 5000,
  // Command timeout
  commandTimeout: 3000,
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
  // Key prefix to avoid conflicts with WordPress Redis cache
  keyPrefix: 'nextjs:',
};

// Singleton Redis client
let redisClient: RedisClientType | null = null;
let isConnecting = false;
let connectionAttempts = 0;
let lastConnectionError: Error | null = null;
let isRedisAvailable = true;

// Circuit breaker for Redis
let circuitOpen = false;
let circuitOpenTime = 0;
const CIRCUIT_RESET_TIME = 30000; // 30 seconds

/**
 * Get or create Redis client with connection pooling
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  // Check circuit breaker
  if (circuitOpen) {
    if (Date.now() - circuitOpenTime > CIRCUIT_RESET_TIME) {
      // Try to reset circuit
      circuitOpen = false;
      console.warn('[Redis] Circuit breaker reset, attempting reconnection');
    } else {
      return null;
    }
  }

  // Return existing connected client
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise((resolve) => setTimeout(resolve, 100));
    return redisClient?.isOpen ? redisClient : null;
  }

  // Check if we've exceeded retry attempts
  if (connectionAttempts >= REDIS_CONFIG.maxRetries) {
    if (!circuitOpen) {
      circuitOpen = true;
      circuitOpenTime = Date.now();
      console.warn('[Redis] Circuit breaker opened after max retries');
    }
    return null;
  }

  isConnecting = true;
  connectionAttempts++;

  try {
    console.warn(`[Redis] Connecting to ${REDIS_CONFIG.url} (attempt ${connectionAttempts})`);

    redisClient = createClient({
      url: REDIS_CONFIG.url,
      socket: {
        connectTimeout: REDIS_CONFIG.connectTimeout,
        reconnectStrategy: (retries) => {
          if (retries > REDIS_CONFIG.maxRetries) {
            return new Error('Max retries exceeded');
          }
          return Math.min(retries * REDIS_CONFIG.retryDelay, 5000);
        },
      },
    });

    // Set up event handlers
    redisClient.on('error', (err) => {
      console.error('[Redis] Client error:', err.message);
      lastConnectionError = err;
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.warn('[Redis] Connected successfully');
      connectionAttempts = 0;
      isRedisAvailable = true;
      circuitOpen = false;
    });

    redisClient.on('reconnecting', () => {
      console.warn('[Redis] Reconnecting...');
    });

    redisClient.on('end', () => {
      console.warn('[Redis] Connection closed');
      isRedisAvailable = false;
    });

    await redisClient.connect();
    isConnecting = false;
    return redisClient;
  } catch (error) {
    isConnecting = false;
    lastConnectionError = error as Error;
    isRedisAvailable = false;
    console.error('[Redis] Connection failed:', (error as Error).message);

    // Open circuit breaker on connection failure
    if (connectionAttempts >= REDIS_CONFIG.maxRetries) {
      circuitOpen = true;
      circuitOpenTime = Date.now();
    }

    return null;
  }
}

/**
 * Get value from Redis with automatic key prefixing
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const prefixedKey = `${REDIS_CONFIG.keyPrefix}${key}`;
    const value = await client.get(prefixedKey);

    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[Redis] Get error:', (error as Error).message);
    return null;
  }
}

/**
 * Set value in Redis with automatic key prefixing and TTL
 */
export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 300
): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const prefixedKey = `${REDIS_CONFIG.keyPrefix}${key}`;
    const serialized = JSON.stringify(value);

    await client.setEx(prefixedKey, ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.error('[Redis] Set error:', (error as Error).message);
    return false;
  }
}

/**
 * Delete value from Redis
 */
export async function redisDel(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const prefixedKey = `${REDIS_CONFIG.keyPrefix}${key}`;
    await client.del(prefixedKey);
    return true;
  } catch (error) {
    console.error('[Redis] Delete error:', (error as Error).message);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    const prefixedPattern = `${REDIS_CONFIG.keyPrefix}${pattern}`;
    const keys = await client.keys(prefixedPattern);

    if (keys.length === 0) return 0;

    const deleted = await client.del(keys);
    return deleted;
  } catch (error) {
    console.error('[Redis] Delete pattern error:', (error as Error).message);
    return 0;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient?.isOpen === true;
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): {
  connected: boolean;
  circuitOpen: boolean;
  lastError: string | null;
  connectionAttempts: number;
} {
  return {
    connected: isRedisConnected(),
    circuitOpen,
    lastError: lastConnectionError?.message || null,
    connectionAttempts,
  };
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.warn('[Redis] Connection closed gracefully');
  }
}

/**
 * Reset connection state (for testing or manual recovery)
 */
export function resetRedisConnection(): void {
  connectionAttempts = 0;
  circuitOpen = false;
  lastConnectionError = null;
  isRedisAvailable = true;
  console.warn('[Redis] Connection state reset');
}

// Export config for debugging
export const redisConfig = REDIS_CONFIG;

