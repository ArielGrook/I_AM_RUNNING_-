/**
 * Redis Client Configuration
 * 
 * Creates and exports Redis client for caching and rate limiting.
 * 
 * Fixes Critical Error #6 from BIG REVIEW.md
 */

import Redis from 'ioredis';

// Redis configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client with connection options
let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance (singleton pattern)
 * Reuses existing connection if available
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      // Connection options
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Enable offline queue for better resilience
      enableOfflineQueue: true,
      // Lazy connect - connect only when needed
      lazyConnect: true,
    });

    // Error handling
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      // Don't throw - allow app to continue without cache
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });
  }

  return redisClient;
}

/**
 * Close Redis connection (useful for cleanup)
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

// Export default client instance
export const redis = getRedisClient();


