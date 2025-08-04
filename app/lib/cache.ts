import { monitoring } from './monitoring';

// Cache interfaces
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items
  enableMonitoring: boolean;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Memory cache implementation
export class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: CacheConfig) {
    this.config = config;
    
    // Cleanup expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      if (this.config.enableMonitoring) {
        await monitoring.recordCacheMiss('memory');
      }
      return null;
    }

    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      if (this.config.enableMonitoring) {
        await monitoring.recordCacheMiss('memory');
      }
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();

    if (this.config.enableMonitoring) {
      await monitoring.recordCacheHit('memory');
    }

    return item.data;
  }

  async set(key: string, data: T, ttl?: number): Promise<void> {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, item);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async keys(): Promise<string[]> {
    this.cleanup(); // Clean up before returning keys
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Redis-like cache implementation (for future use)
export class RedisCache<T> {
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  async get(_key: string): Promise<T | null> {
    // This would integrate with Redis in production
    // For now, return null to indicate cache miss
    if (this.config.enableMonitoring) {
      await monitoring.recordCacheMiss('redis');
    }
    return null;
  }

  async set(_key: string, _data: T, _ttl?: number): Promise<void> {
    // This would integrate with Redis in production
    if (this.config.enableMonitoring) {
      await monitoring.recordCacheHit('redis');
    }
  }

  async delete(_key: string): Promise<void> {
    // This would integrate with Redis in production
  }

  async clear(): Promise<void> {
    // This would integrate with Redis in production
  }
}

// Cache manager for different types of data
export class CacheManager {
  private caches = new Map<string, MemoryCache<any>>();
  private configs: Record<string, CacheConfig> = {
    posts: {
      ttl: 300, // 5 minutes
      maxSize: 1000,
      enableMonitoring: true,
    },
    categories: {
      ttl: 3600, // 1 hour
      maxSize: 100,
      enableMonitoring: true,
    },
    tags: {
      ttl: 3600, // 1 hour
      maxSize: 500,
      enableMonitoring: true,
    },
    media: {
      ttl: 1800, // 30 minutes
      maxSize: 2000,
      enableMonitoring: true,
    },
    search: {
      ttl: 600, // 10 minutes
      maxSize: 500,
      enableMonitoring: true,
    },
  };

  getCache<T>(type: string): MemoryCache<T> {
    if (!this.caches.has(type)) {
      const config = this.configs[type] || {
        ttl: 300,
        maxSize: 100,
        enableMonitoring: true,
      };
      
      this.caches.set(type, new MemoryCache<T>(config));
    }
    
    return this.caches.get(type)!;
  }

  async clearAll(): Promise<void> {
    for (const cache of this.caches.values()) {
      await cache.clear();
    }
  }

  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    
    for (const [type, cache] of this.caches.entries()) {
      stats[type] = await cache.size();
    }
    
    return stats;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Cache decorator for functions
export function cached(type: string, keyGenerator?: (..._args: any[]) => string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = cacheManager.getCache(type);

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      // Try to get from cache first
      let result = await cache.get(key);
      
      if (result === null) {
        // Cache miss, execute original method
        result = await originalMethod.apply(this, args);
        
        // Store in cache
        await cache.set(key, result);
      }
      
      return result;
    };

    return descriptor;
  };
}

// Cache utilities
export class CacheUtils {
  static generateKey(...parts: any[]): string {
    return parts.map(part => 
      typeof part === 'string' ? part : JSON.stringify(part)
    ).join(':');
  }

  static async withCache<T>(
    type: string,
    key: string,
    operation: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cache = cacheManager.getCache<T>(type);
    
    // Try to get from cache
    let result = await cache.get(key);
    
    if (result === null) {
      // Cache miss, execute operation
      result = await operation();
      
      // Store in cache
      await cache.set(key, result, ttl);
    }
    
    return result;
  }

  static async invalidateCache(type: string, pattern?: string): Promise<void> {
    const cache = cacheManager.getCache(type);
    
    if (pattern) {
      const keys = await cache.keys();
      for (const key of keys) {
        if (key.includes(pattern)) {
          await cache.delete(key);
        }
      }
    } else {
      await cache.clear();
    }
  }
}

// WordPress-specific cache helpers
export class WordPressCache {
  static async getPosts(page: number = 1, perPage: number = 10): Promise<any> {
    return CacheUtils.withCache(
      'posts',
      `posts:${page}:${perPage}`,
      async () => {
        // This would call your WordPress API
        const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_REST_URL}/wp/v2/posts?page=${page}&per_page=${perPage}`);
        return response.json();
      },
      300 // 5 minutes TTL
    );
  }

  static async getPost(slug: string): Promise<any> {
    return CacheUtils.withCache(
      'posts',
      `post:${slug}`,
      async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_REST_URL}/wp/v2/posts?slug=${slug}`);
        const posts = await response.json();
        return posts[0] || null;
      },
      600 // 10 minutes TTL
    );
  }

  static async getCategories(): Promise<any> {
    return CacheUtils.withCache(
      'categories',
      'categories:all',
      async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_REST_URL}/wp/v2/categories`);
        return response.json();
      },
      3600 // 1 hour TTL
    );
  }

  static async getTags(): Promise<any> {
    return CacheUtils.withCache(
      'tags',
      'tags:all',
      async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_REST_URL}/wp/v2/tags`);
        return response.json();
      },
      3600 // 1 hour TTL
    );
  }

  static async searchPosts(query: string): Promise<any> {
    return CacheUtils.withCache(
      'search',
      `search:${query}`,
      async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_REST_URL}/wp/v2/posts?search=${encodeURIComponent(query)}`);
        return response.json();
      },
      600 // 10 minutes TTL
    );
  }

  static async invalidatePostCache(slug?: string): Promise<void> {
    if (slug) {
      await CacheUtils.invalidateCache('posts', `post:${slug}`);
    } else {
      await CacheUtils.invalidateCache('posts');
    }
  }

  static async invalidateCategoryCache(): Promise<void> {
    await CacheUtils.invalidateCache('categories');
  }

  static async invalidateTagCache(): Promise<void> {
    await CacheUtils.invalidateCache('tags');
  }
} 