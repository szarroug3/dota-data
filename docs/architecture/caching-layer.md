# Caching Layer Architecture

## Overview
The caching layer provides fast, reliable data access by storing frequently requested data in memory or distributed storage. It's the foundation for performance, reducing external API calls by 90%+ and enabling instant responses for cached data.

## Modern Architecture: Redis-First with Memory Fallback

### Why Redis + Memory Hybrid?
The backend uses a **Redis-first approach** with memory fallback to ensure optimal performance across all environments:

- **Production Performance:** Redis provides distributed caching across all serverless instances, ensuring cache hits regardless of which instance serves the request
- **Development Speed:** Memory cache provides instant access during development without Redis dependency
- **Cost Efficiency:** Redis free tier (500K commands/month) is sufficient for most projects, with memory fallback for emergencies
- **Reliability:** Automatic fallback ensures the app works even if Redis is temporarily unavailable
- **Scalability:** Redis scales with your app, while memory cache provides immediate local performance

### Problems with Single-Backend Approaches
- **Redis-only:** Single point of failure, development complexity, cost concerns
- **Memory-only:** No cross-instance sharing, lost on restart, doesn't scale
- **File-based:** Slow I/O, not suitable for high-frequency access patterns

## Key Features
- **Redis backend** for production with automatic JSON serialization
- **Memory backend** for development with TTL support
- **Automatic fallback** from Redis to memory if Redis is unavailable
- **Consistent cache keys** with utility functions for key generation
- **TTL support** for both backends with automatic expiration
- **Cache invalidation** with pattern matching support

## Module Structure
- `src/lib/cache-service.ts` — Main cache service with automatic backend selection
- `src/lib/cache-backends/redis.ts` — Redis backend implementation
- `src/lib/cache-backends/memory.ts` — In-memory backend implementation
- `src/lib/utils/cache-keys.ts` — Utility functions for consistent cache key generation

## Usage Example
```ts
import { CacheService } from '@/lib/cache-service';

// Automatic backend selection based on environment
const cache = new CacheService({
  useRedis: process.env.NODE_ENV === 'production',
  redisUrl: process.env.REDIS_URL,
  fallbackToMemory: true
});

// Set data with TTL (5 minutes)
await cache.set('hero:123', { id: 123, name: 'Anti-Mage' }, 300);
// Note: TTLs should be tuned based on data volatility. See [Best Practices](#best-practices).

// Get data (returns null if not found)
const hero = await cache.get('hero:123');
if (hero) {
  // Use cached data
} else {
  // Fetch from API and cache
}

// Invalidate specific key or pattern
await cache.invalidate('hero:123');
await cache.invalidate('hero:*'); // Pattern matching
```

## Integration with Other Layers

- **[Rate Limiting Layer](./rate-limiting-layer.md):** Cache stores rate limit counters and tokens for distributed enforcement
- **[Queueing Layer](./queueing-layer.md):** Cache stores job status and progress for user-facing updates
- **[Backend Data Flow](./backend-data-flow.md):** All API responses are cached before returning to clients
- **Mock Mode:** Memory cache provides instant access to mock data during development
- **Cache Keys:** Use consistent cache key generation utilities across all layers to avoid collisions and ensure predictable cache behavior.

## Recommended Usage Patterns

### 1. API Response Caching
```ts
// In API route handler
const cacheKey = `api:${endpoint}:${params}`;
let data = await cache.get(cacheKey);

if (!data) {
  data = await fetchFromExternalAPI();
  await cache.set(cacheKey, data, 300); // 5 min TTL
}

return data;
```

### 2. Rate Limit State Storage
```ts
// Store rate limit counters in cache
const counterKey = `rate:${service}:${identifier}`;
const currentCount = await cache.get(counterKey) || 0;

if (currentCount < limit) {
  await cache.set(counterKey, currentCount + 1, 60); // 1 min window
  return true; // Allow request
} else {
  return false; // Rate limited
}
```

### 3. Job Status Tracking
```ts
// Store job progress for user-facing updates
await cache.set(`job:${jobId}:status`, 'processing', 3600);
await cache.set(`job:${jobId}:progress`, 50, 3600);

// Update progress
await cache.set(`job:${jobId}:progress`, 75, 3600);
```

## Redis Free Tier Considerations

- **Upstash Free Tier:** 500,000 commands/month, 256 MB storage, 50 GB bandwidth
- **Typical Usage:** ~1,000-5,000 commands/day for small-medium projects
- **Cost Optimization:** Use appropriate TTLs, avoid unnecessary cache sets
- **Monitoring:** Track Redis usage in Upstash dashboard

### Usage Estimation
```
Daily commands: ~3,000 (cache hits + misses + rate limiting)
Monthly total: ~90,000 (30% of free tier limit)
Safety margin: 70% remaining for growth
```

## Fallback Strategy

### Automatic Redis → Memory Fallback
```ts
try {
  await redisCache.set(key, value, ttl);
} catch (error) {
  if (isRedisError(error)) {
    log('Redis unavailable, falling back to memory cache');
    await memoryCache.set(key, value, ttl);
  } else {
    throw error;
  }
}
```

### Best Practices
- Always implement fallback to memory cache for critical operations
- Monitor Redis connectivity and usage
- Use appropriate TTLs to balance performance and storage costs
- Implement cache warming for frequently accessed data

## Best Practices
- Use Redis for production and memory for development
- Implement automatic fallback from Redis to memory
- Set appropriate TTLs based on data volatility (5 min for API data, 1 hour for static data)
- Use consistent cache keys with utility functions
- Monitor Redis usage to stay within free tier limits
- Cache API responses, rate limit state, and job status

---

## Related Documentation

- **[Backend Data Flow](./backend-data-flow.md):** Complete backend data flow including caching, rate limiting, and queueing integration
- **[Rate Limiting Layer](./rate-limiting-layer.md):** Distributed rate limiting with Redis-backed counters
- **[Queueing Layer](./queueing-layer.md):** QStash-based queueing with job status tracking
- **[Project Structure](./project-structure.md):** Recommended folder structure for cache implementation
- **[Type Organization](./type-organization.md):** TypeScript type organization for cache-related types 