# Rate Limiting Layer Architecture

## Overview
The rate limiting layer protects external APIs and backend resources from abuse by enforcing intelligent request limits. It's critical for maintaining API relationships, controlling costs, and ensuring fair resource usage across all serverless instances.

## Modern Architecture: Distributed Rate Limiting with Graceful Degradation

### Why Distributed Rate Limiting?
The backend uses **Redis-backed distributed rate limiting** with memory fallback to ensure consistent limits across all serverless instances:

- **Cross-Instance Consistency:** Redis ensures rate limits are enforced globally, not just per-instance
- **External API Protection:** Prevents 429 errors and maintains good relationships with OpenDota, Dotabuff, etc.
- **Cost Control:** Prevents runaway API usage that could exceed free tier limits
- **Graceful Degradation:** Memory fallback ensures the app works even if Redis is temporarily unavailable
- **Intelligent Backoff:** Automatic retry delays based on API response headers

### Problems with Instance-Local Rate Limiting
- **Inconsistent Limits:** Each serverless instance has its own counter, allowing 10x the intended limit
- **API Abuse:** Can trigger 429 errors and get your IP blocked by external services
- **Cost Explosion:** Uncontrolled API usage can exceed free tier limits quickly
- **Poor User Experience:** Random failures due to rate limit violations

## Key Features
- **Redis-backed counters** for distributed rate limiting across all instances
- **Memory fallback** for development and Redis outages
- **Sliding window algorithm** for smooth, accurate limiting
- **Per-service limits** (OpenDota: 60/min, Dotabuff: 30/min, etc.)
- **Automatic retry logic** with exponential backoff
- **429 response handling** with retry-after header parsing
- **Comprehensive logging** for monitoring and debugging

## Module Structure
- `src/lib/rate-limiter.ts` — Main rate limiting service with automatic backend selection
- `src/lib/rate-limit-backends/redis.ts` — Redis-backed implementation
- `src/lib/rate-limit-backends/memory.ts` — In-memory implementation for dev/mock
- `src/lib/types/rate-limit.ts` — Shared types and interfaces

## Usage Example
```ts
import { RateLimiter } from '@/lib/rate-limiter';

const limiter = new RateLimiter({
  useRedis: process.env.NODE_ENV === 'production',
  redisUrl: process.env.REDIS_URL,
  fallbackToMemory: true
});

// Check if request is allowed
const result = await limiter.checkLimit('opendota:user:123', {
  window: 60,    // 60 second window
  max: 100,      // 100 requests per window
  service: 'opendota'
});

if (result.allowed) {
  // Proceed with API call
  const data = await fetchFromOpenDota();
} else {
  // Handle rate limit - queue request or return cached data
  const retryAfter = result.retryAfter; // seconds
  return { error: 'Rate limited', retryAfter };
}
```

## Integration with Other Layers

- **[Caching Layer](./caching-layer.md):** Rate limit counters stored in Redis cache for persistence
- **[Queueing Layer](./queueing-layer.md):** Rate-limited requests are queued for later processing
- **[Backend Data Flow](./backend-data-flow.md):** All external API calls go through rate limiting
- **Error Handling:** 429 responses trigger automatic retry logic

## Recommended Usage Patterns

### 1. External API Rate Limiting
```ts
// In API service
const rateLimitKey = `${service}:${identifier}`;
const result = await limiter.checkLimit(rateLimitKey, {
  window: 60,
  max: getServiceLimit(service), // 60 for OpenDota, 30 for Dotabuff
  service
});

if (!result.allowed) {
  // Return cached data or queue for later
  return await getCachedData(key) || queueRequest(key);
}
```

### 2. Automatic Retry Logic
```ts
// Handle 429 responses with retry-after
if (response.status === 429) {
  const retryAfter = response.headers.get('retry-after') || 60;
  await limiter.setRetryDelay(service, retryAfter);
  
  // Queue request for later processing
  await queue.enqueue(`retry:${service}:${key}`, {
    endpoint: '/api/retry-request',
    payload: { service, key, retryAfter }
  });
}
```

### 3. Per-Service Configuration
```ts
const SERVICE_LIMITS = {
  opendota: { window: 60, max: 60 },    // 1 request/second (generous API)
  dotabuff: { window: 60, max: 60 },    // 1 request/second (web scraping)
  stratz: { window: 60, max: 20 },      // 1 request/3 seconds (web scraping)
  d2pt: { window: 60, max: 30 }         // 1 request/2 seconds (web scraping)
};
```

**Note:** These values can also be set via environment variables. See [Environment Variables](../development/environment-variables.md#rate-limiting-configuration) for details.

### Rate Limit Recommendations

#### OpenDota API
- **Current**: 60 requests/minute (1 req/sec)
- **Reasoning**: No strict documented limits, but we respect their resources
- **Notes**: Very generous API, can potentially increase if needed
- **Recommendation**: Keep current limit, monitor for 429 responses
- **Environment Variable**: `RATE_LIMIT_OPENDOTA=60`

#### Dotabuff (Web Scraping)
- **Current**: 60 requests/minute (1 req/sec)
- **Reasoning**: Web scraping approach, increased from 30 to 60 for better performance
- **Notes**: Conservative but functional limit, monitor for blocks
- **Recommendation**: Monitor for blocks, can increase gradually if stable
- **Environment Variable**: `RATE_LIMIT_DOTABUFF=60`

#### Dota2ProTracker (Web Scraping)
- **Current**: 30 requests/minute (1 req/2sec)
- **Reasoning**: Web scraping approach, increased from 10 to 30 based on site analysis
- **Notes**: External meta data, not critical for core functionality
- **Recommendation**: Conservative limit, monitor for blocks
- **Environment Variable**: `RATE_LIMIT_D2PT=30`

### Rate Limit Configuration

All rate limits can be configured via environment variables:

```bash
# Development with higher limits
RATE_LIMIT_OPENDOTA=120  # 2 req/sec for development
RATE_LIMIT_DOTABUFF=90   # 1.5 req/sec for development
RATE_LIMIT_D2PT=60       # 1 req/sec for development

# Production with conservative limits
RATE_LIMIT_OPENDOTA=60   # 1 req/sec
RATE_LIMIT_DOTABUFF=60   # 1 req/sec
RATE_LIMIT_D2PT=30       # 1 req/2sec
```

See [Environment Variables](../development/environment-variables.md) for complete configuration options.

---

#### When to Adjust Limits
- If you see frequent 429 errors from an external API, lower the limit.
- If Dotabuff or another site blocks or throttles you, lower the limit.
- If you need faster data fetching for development, you can temporarily increase the limit, but monitor for errors.
- Always respect the terms of service and fair use policies of external APIs.

## Redis Free Tier Considerations

- **Upstash Free Tier:** 500,000 commands/month, 256 MB storage, 50 GB bandwidth
- **Rate Limiting Usage:** ~1,000-2,000 commands/day for typical projects
- **Cost Optimization:** Use appropriate window sizes, avoid excessive counter updates
- **Monitoring:** Track rate limit hits and Redis usage

### Usage Estimation
```
Daily rate limit checks: ~1,500 (across all services)
Monthly total: ~45,000 (9% of free tier limit)
Safety margin: 91% remaining for caching and queueing
```

## Fallback Strategy

### Automatic Redis → Memory Fallback
```ts
try {
  const result = await redisLimiter.checkLimit(key, config);
  return result;
} catch (error) {
  if (isRedisError(error)) {
    log('Redis unavailable, falling back to memory rate limiting');
    return await memoryLimiter.checkLimit(key, config);
  } else {
    throw error;
  }
}
```

### Graceful Degradation
```ts
// If rate limiting fails entirely, allow request but log warning
try {
  return await limiter.checkLimit(key, config);
} catch (error) {
  log('Rate limiting failed, allowing request', error);
  return { allowed: true, fallback: true };
}
```

## Best Practices
- Use Redis for production and memory for development
- Implement automatic fallback from Redis to memory
- Set appropriate limits for each external service
- Handle 429 responses with retry-after headers
- Monitor rate limit hits and Redis usage
- Use sliding window algorithm for accurate limiting
- Log all rate limit events for monitoring

---

## Related Documentation

- **[Backend Data Flow](./backend-data-flow.md):** Complete backend data flow including rate limiting integration
- **[Caching Layer](./caching-layer.md):** Redis-first caching with rate limit counter storage
- **[Queueing Layer](./queueing-layer.md):** QStash-based queueing for rate-limited requests
- **[Project Structure](./project-structure.md):** Recommended folder structure for rate limiting implementation
- **[Type Organization](./type-organization.md):** TypeScript type organization for rate limiting types 