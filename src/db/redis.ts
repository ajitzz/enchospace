import { Redis } from '@upstash/redis';

// Use environment variables for Upstash Redis
// Fallback to mock if not provided in preview
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || 'https://mock-redis.upstash.io';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token';

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Helper to safely get from cache
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (redisUrl.includes('mock')) return null;
    return await redis.get<T>(key);
  } catch (e) {
    console.error('Redis get error:', e);
    return null;
  }
}

// Helper to safely set cache
export async function setCached(key: string, value: any, exSeconds: number = 3600) {
  try {
    if (redisUrl.includes('mock')) return;
    await redis.set(key, value, { ex: exSeconds });
  } catch (e) {
    console.error('Redis set error:', e);
  }
}
