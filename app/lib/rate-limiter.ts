import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

export class RateLimiter {
  private tokenCache: LRUCache<string, number[]>;

  constructor(options?: RateLimitConfig) {
    this.tokenCache = new LRUCache({
      max: options?.uniqueTokenPerInterval || 500,
      ttl: options?.interval || 60000,
    });
  }

  async check(token: string, limit: number, duration: number): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const key = token;
    const now = Date.now();
    const windowStart = now - duration;

    const tokenCount = this.tokenCache.get(key) || [];
    const recentTokens = tokenCount.filter(timestamp => timestamp > windowStart);
    recentTokens.push(now);

    this.tokenCache.set(key, recentTokens);

    const isRateLimited = recentTokens.length > limit;
    const remaining = Math.max(0, limit - recentTokens.length);

    return {
      success: !isRateLimited,
      limit,
      remaining,
      reset: windowStart + duration,
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(); 