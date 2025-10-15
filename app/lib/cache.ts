// Conditional monitoring import to avoid client-side bundling issues
let monitoring: typeof import('./monitoring').monitoring | null = null;

// Import types
import type {
  WPRestCategory,
  WPRestPagination,
  WPRestPost,
  WPRestTag,
} from './rest-api';

// Only import monitoring on the server side
if (typeof window === 'undefined') {
  try {
    // Dynamic import to avoid bundling issues
    import('./monitoring')
      .then((module) => {
        monitoring = module.monitoring;
      })
      .catch(() => {
        // Silently fail if monitoring is not available
        console.warn('Monitoring not available in current environment');
      });
  } catch {
    // Silently fail if monitoring is not available
  }
}

// Enhanced Cache Manager for WordPress API with Redis integration
export class CacheManager {
  private cache = new Map<
    string,
    { data: unknown; timestamp: number; ttl: number; accessCount: number }
  >();
  private maxSize = 2000; // Increased for better performance
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;
  private lastCleanup = Date.now();
  private cleanupInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start periodic cleanup
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  set(key: string, data: unknown, ttl: number = 300000): void {
    // Implement LRU eviction with access count tracking
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) {
      this.missCount++;
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access count for LRU
    item.accessCount++;
    this.hitCount++;
    return item.data;
  }

  // Enhanced eviction strategy
  private evictLRU(): void {
    let oldestKey = null;
    let oldestAccess = Infinity;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      const age = Date.now() - item.timestamp;
      const accessScore = item.accessCount;

      // Prioritize by access count, then by age
      if (
        accessScore < oldestAccess ||
        (accessScore === oldestAccess && age > oldestTime)
      ) {
        oldestKey = key;
        oldestAccess = accessScore;
        oldestTime = age;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictionCount++;
    }
  }

  // Periodic cleanup of expired entries
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.warn(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  // WordPress-specific caching methods with enhanced performance
  async getCachedPosts(params: Record<string, unknown>): Promise<{
    posts: WPRestPost[];
    pagination: WPRestPagination;
  }> {
    const cacheKey = `posts:${JSON.stringify(params)}`;
    const cached = this.get(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_posts');
      }
      return cached as {
        posts: WPRestPost[];
        pagination: WPRestPagination;
      };
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    const result = await restAPIClient.getPosts(params);

    // Cache with different TTL based on content type - increased for better performance
    const ttl = params.search ? 180000 : 300000; // 3 min for search, 5 min for regular
    this.set(cacheKey, result, ttl);

    if (monitoring) {
      await monitoring.recordCacheMiss('wordpress_posts');
    }

    return result;
  }

  async getCachedPost(slug: string): Promise<WPRestPost | null> {
    const cacheKey = `post:${slug}`;
    const cached = this.get(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_post');
      }
      return cached as WPRestPost;
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    const post = await restAPIClient.getPostBySlug(slug);

    if (post) {
      this.set(cacheKey, post, 300000); // 5 minutes cache for individual posts
      if (monitoring) {
        await monitoring.recordCacheMiss('wordpress_post');
      }
    }

    return post;
  }

  async getCachedCategories(): Promise<WPRestCategory[]> {
    const cacheKey = 'categories';
    const cached = this.get(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_categories');
      }
      return cached as WPRestCategory[];
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    const categories = await restAPIClient.getCategories();
    this.set(cacheKey, categories, 1800000); // 30 minutes cache for categories
    if (monitoring) {
      await monitoring.recordCacheMiss('wordpress_categories');
    }

    return categories;
  }

  async getCachedTags(): Promise<WPRestTag[]> {
    const cacheKey = 'tags';
    const cached = this.get(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_tags');
      }
      return cached as WPRestTag[];
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    const tags = await restAPIClient.getTags();
    this.set(cacheKey, tags, 1800000); // 30 minutes cache for tags
    if (monitoring) {
      await monitoring.recordCacheMiss('wordpress_tags');
    }

    return tags;
  }

  // Downloads-specific caching methods
  async getCachedDownloads(
    params: {
      category?: string;
      page?: number;
      per_page?: number;
    } = {}
  ): Promise<{
    downloads: unknown[];
    pagination: WPRestPagination;
  }> {
    const cacheKey = `downloads:${params.category || 'all'}:${params.page || 1}:${params.per_page || 100}`;
    const cached = this.get(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_downloads');
      }
      return cached as {
        downloads: unknown[];
        pagination: WPRestPagination;
      };
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    let result;

    if (params.category) {
      const downloads = await restAPIClient.getDownloadsByCategory(
        params.category
      );
      result = {
        downloads,
        pagination: {
          totalPosts: downloads.length,
          totalPages: 1,
          currentPage: 1,
          perPage: downloads.length,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    } else {
      result = await restAPIClient.getDownloads({
        page: params.page,
        per_page: params.per_page,
        _embed: true,
        status: 'publish',
        orderby: 'date',
        order: 'desc',
      });
    }

    // Cache downloads for 15 minutes (stable content)
    this.set(cacheKey, result, 900000); // 15 minutes

    if (monitoring) {
      await monitoring.recordCacheMiss('wordpress_downloads');
    }

    return result;
  }

  // Enhanced cache statistics
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate =
      totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
    const usagePercentage = (this.cache.size / this.maxSize) * 100;

    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      totalRequests,
      hitRate: `${hitRate.toFixed(2)}%`,
      cacheSize: this.cache.size,
      maxSize: this.maxSize,
      usagePercentage: `${usagePercentage.toFixed(2)}%`,
      evictionCount: this.evictionCount,
      lastCleanup: new Date(this.lastCleanup).toISOString(),
      memoryUsage: this.getMemoryUsage(),
    };
  }

  // Memory usage estimation
  private getMemoryUsage(): string {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        return `${Math.round(usage.heapUsed / 1024 / 1024)}MB`;
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
  }

  // Clear specific cache entries with pattern matching
  clearPosts(): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith('posts:')
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
    console.warn(`Cleared ${keysToDelete.length} post cache entries`);
  }

  // Clear downloads cache
  clearDownloads(): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith('downloads:')
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
    console.warn(`Cleared ${keysToDelete.length} downloads cache entries`);
  }

  clearPost(slug: string): void {
    this.cache.delete(`post:${slug}`);
  }

  clearCategories(): void {
    this.cache.delete('categories');
  }

  clearTags(): void {
    this.cache.delete('tags');
  }

  // Clear cache by pattern
  clearByPattern(pattern: RegExp): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      pattern.test(key)
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  // Cache warming for critical data with enhanced strategy
  async warmCache(): Promise<void> {
    try {
      console.warn('Warming cache with enhanced strategy...');

      // Warm categories and tags cache (high priority)
      await Promise.all([this.getCachedCategories(), this.getCachedTags()]);

      // Warm recent posts cache (medium priority)
      await this.getCachedPosts({ per_page: 10, _embed: true });

      // Warm featured posts if available
      await this.getCachedPosts({
        per_page: 5,
        orderby: 'date',
        order: 'desc',
        _embed: true,
      });

      // Warm downloads cache for each category (high priority for downloads page)
      const downloadCategories = [
        'coloring-pages',
        'craft-templates',
        'diy-tutorials',
      ];
      await Promise.all(
        downloadCategories.map((category) =>
          this.getCachedDownloads({ category, per_page: 100 })
        )
      );

      console.warn('Enhanced cache warming completed');
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  // Cache health check with enhanced metrics
  async checkCacheHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    stats: Record<string, unknown>;
    issues: string[];
    recommendations: string[];
  }> {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check hit rate
    const hitRate = parseFloat(stats.hitRate);
    if (hitRate < 50) {
      issues.push(`Low cache hit rate: ${stats.hitRate}`);
      recommendations.push(
        'Consider increasing cache TTL or implementing cache warming'
      );
    }

    // Check cache size
    const usagePercentage = parseFloat(stats.usagePercentage);
    if (usagePercentage > 80) {
      issues.push(`High cache usage: ${stats.usagePercentage}`);
      recommendations.push(
        'Consider increasing maxSize or implementing more aggressive eviction'
      );
    }

    // Check eviction rate
    if (stats.evictionCount > 100) {
      issues.push(`High eviction count: ${stats.evictionCount}`);
      recommendations.push(
        'Consider increasing maxSize or optimizing cache keys'
      );
    }

    // Check memory usage
    if (stats.memoryUsage !== 'N/A') {
      const memoryMB = parseInt(stats.memoryUsage.replace('MB', ''));
      if (memoryMB > 100) {
        issues.push(`High memory usage: ${stats.memoryUsage}`);
        recommendations.push(
          'Consider reducing cache size or implementing memory-based eviction'
        );
      }
    }

    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'error' : 'warning';
    }

    return {
      status,
      stats,
      issues,
      recommendations,
    };
  }
}

// Enhanced Cache Manager with Redis integration
export class EnhancedCacheManager extends CacheManager {
  private redisClient?: ReturnType<typeof import('redis').createClient>; // Redis client type

  constructor() {
    super();
    // Only initialize Redis on server side
    if (typeof window === 'undefined') {
      this.initializeRedis();
    }
  }

  private async initializeRedis() {
    try {
      // Skip Redis in development if not explicitly configured
      if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
        console.warn(
          'Redis not configured for development, using memory cache only'
        );
        return;
      }

      const { createClient } = await import('redis');
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      await this.redisClient.connect();
      console.warn('Redis connected successfully');
    } catch (error) {
      console.warn('Redis not available, falling back to memory cache:', error);
    }
  }

  async getWithRedis(key: string): Promise<unknown | null> {
    // Try memory cache first
    const memoryResult = this.get(key);
    if (memoryResult) return memoryResult;

    // Fall back to Redis
    if (this.redisClient) {
      try {
        const redisResult = await this.redisClient.get(key);
        if (redisResult) {
          const parsed = JSON.parse(redisResult);
          this.set(key, parsed); // Cache in memory
          return parsed;
        }
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }

    return null;
  }

  async setWithRedis(
    key: string,
    data: unknown,
    ttl: number = 300000
  ): Promise<void> {
    // Set in memory cache
    this.set(key, data, ttl);

    // Set in Redis
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(
          key,
          Math.floor(ttl / 1000),
          JSON.stringify(data)
        );
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }
  }

  // Enhanced WordPress-specific methods with Redis
  async getCachedPostsWithRedis(params: Record<string, unknown>): Promise<{
    posts: WPRestPost[];
    pagination: WPRestPagination;
  }> {
    const cacheKey = `posts:${JSON.stringify(params)}`;
    const cached = await this.getWithRedis(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_posts_redis');
      }
      return cached as {
        posts: WPRestPost[];
        pagination: WPRestPagination;
      };
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    const result = await restAPIClient.getPosts(params);

    // Cache with different TTL based on content type
    const ttl = params.search ? 180000 : 300000; // 3 min for search, 5 min for regular
    await this.setWithRedis(cacheKey, result, ttl);

    if (monitoring) {
      await monitoring.recordCacheMiss('wordpress_posts_redis');
    }

    return result;
  }

  async getCachedPostWithRedis(slug: string): Promise<WPRestPost | null> {
    const cacheKey = `post:${slug}`;
    const cached = await this.getWithRedis(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_post_redis');
      }
      return cached as WPRestPost;
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    const post = await restAPIClient.getPostBySlug(slug);

    if (post) {
      await this.setWithRedis(cacheKey, post, 900000); // 15 minutes cache for individual posts
      if (monitoring) {
        await monitoring.recordCacheMiss('wordpress_post_redis');
      }
    }

    return post;
  }

  async getCachedCategoriesWithRedis(): Promise<WPRestCategory[]> {
    const cacheKey = 'categories';
    const cached = await this.getWithRedis(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_categories_redis');
      }
      return cached as WPRestCategory[];
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    const categories = await restAPIClient.getCategories();
    await this.setWithRedis(cacheKey, categories, 1800000); // 30 minutes cache for categories
    if (monitoring) {
      await monitoring.recordCacheMiss('wordpress_categories_redis');
    }

    return categories;
  }

  async getCachedTagsWithRedis(): Promise<WPRestTag[]> {
    const cacheKey = 'tags';
    const cached = await this.getWithRedis(cacheKey);

    if (cached) {
      if (monitoring) {
        await monitoring.recordCacheHit('wordpress_tags_redis');
      }
      return cached as WPRestTag[];
    }

    // Import here to avoid circular dependencies
    const { restAPIClient } = await import('./rest-api');
    const tags = await restAPIClient.getTags();
    await this.setWithRedis(cacheKey, tags, 1800000); // 30 minutes cache for tags
    if (monitoring) {
      await monitoring.recordCacheMiss('wordpress_tags_redis');
    }

    return tags;
  }

  // Enhanced cache warming with Redis
  async warmCacheWithRedis(): Promise<void> {
    try {
      console.warn('Warming cache with Redis-enhanced strategy...');

      // Warm categories and tags cache (high priority)
      await Promise.all([
        this.getCachedCategoriesWithRedis(),
        this.getCachedTagsWithRedis(),
      ]);

      // Warm recent posts cache (medium priority)
      await this.getCachedPostsWithRedis({ per_page: 10, _embed: true });

      // Warm featured posts if available
      await this.getCachedPostsWithRedis({
        per_page: 5,
        orderby: 'date',
        order: 'desc',
        _embed: true,
      });

      console.warn('Redis-enhanced cache warming completed');
    } catch (error) {
      console.error('Redis cache warming failed:', error);
    }
  }

  // Enhanced cache health check with Redis metrics
  async checkCacheHealthWithRedis(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    stats: Record<string, unknown>;
    issues: string[];
    recommendations: string[];
    redisStatus: 'connected' | 'disconnected' | 'error';
  }> {
    const baseHealth = await this.checkCacheHealth();
    let redisStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';

    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        redisStatus = 'connected';
      } catch {
        redisStatus = 'error';
        baseHealth.issues.push('Redis connection failed');
        baseHealth.recommendations.push(
          'Check Redis server status and connection settings'
        );
      }
    } else {
      baseHealth.issues.push('Redis client not initialized');
      baseHealth.recommendations.push(
        'Check Redis configuration and environment variables'
      );
    }

    return {
      ...baseHealth,
      redisStatus,
    };
  }
}

// Export singleton instances
export const cacheManager = new CacheManager();
export const enhancedCache = new EnhancedCacheManager();

// Enhanced cache middleware for API routes
export function withCache<T>(
  cacheKey: string,
  ttl: number,
  operation: () => Promise<T>,
  _options: {
    staleWhileRevalidate?: boolean;
    staleTime?: number;
  } = {}
): Promise<T> {
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached as T);
  }

  return operation().then((result) => {
    cacheManager.set(cacheKey, result, ttl);
    return result;
  });
}

// Enhanced cache middleware with Redis
export async function withRedisCache<T>(
  cacheKey: string,
  ttl: number,
  operation: () => Promise<T>,
  _options: {
    staleWhileRevalidate?: boolean;
    staleTime?: number;
  } = {}
): Promise<T> {
  const cached = await enhancedCache.getWithRedis(cacheKey);
  if (cached) {
    return cached as T;
  }

  const result = await operation();
  await enhancedCache.setWithRedis(cacheKey, result, ttl);
  return result;
}

// Cache invalidation helpers with enhanced functionality
export function invalidatePostCache(slug: string): void {
  cacheManager.clearPost(slug);
  cacheManager.clearPosts(); // Clear posts list cache as well
}

export function invalidateDownloadsCache(): void {
  cacheManager.clearDownloads();
}

export function invalidateAllCache(): void {
  cacheManager.clear();
}

export function getCacheStats() {
  return cacheManager.getStats();
}

export function invalidateCacheByPattern(pattern: RegExp): void {
  cacheManager.clearByPattern(pattern);
}

// Enhanced cache invalidation with Redis
export async function invalidateRedisCache(key: string): Promise<void> {
  if (enhancedCache['redisClient']) {
    try {
      await enhancedCache['redisClient'].del(key);
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }
  }
}

export async function invalidateAllRedisCache(): Promise<void> {
  if (enhancedCache['redisClient']) {
    try {
      await enhancedCache['redisClient'].flushAll();
    } catch (error) {
      console.error('Redis cache flush error:', error);
    }
  }
}

// Cache health check with enhanced reporting
export async function checkCacheHealth(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  stats: Record<string, unknown>;
  issues: string[];
  recommendations: string[];
}> {
  return await cacheManager.checkCacheHealth();
}

// Enhanced cache health check with Redis
export async function checkCacheHealthWithRedis(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  stats: Record<string, unknown>;
  issues: string[];
  recommendations: string[];
  redisStatus: 'connected' | 'disconnected' | 'error';
}> {
  return await enhancedCache.checkCacheHealthWithRedis();
}
