import { Redis } from '@upstash/redis';
import { logWithTimestamp } from './utils';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  ttl: number; // Default TTL in milliseconds
  maxAge: number; // Maximum age before refresh in milliseconds
}

interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
  delayMs: number; // Delay between requests in milliseconds
}

interface QueuedRequest {
  id: string;
  service: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  signature?: string; // Add signature for duplicate detection
}

class RequestQueue {
  private queues: Map<string, QueuedRequest[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private requestIdCounter = 0;
  private activeRequests: Set<string> = new Set(); // Track active request signatures
  private rateLimiter: RateLimiter; // Add reference to rate limiter

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  private generateRequestId(): string {
    const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;
    logWithTimestamp('log', `[RequestQueue] Generated request ID: ${requestId} (counter: ${this.requestIdCounter})`);
    return requestId;
  }

  private generateRequestSignature(service: string, execute: () => Promise<any>): string {
    // Create a signature based on the actual request data being fetched
    const funcStr = execute.toString();
    
    // Try to extract meaningful identifiers from the function content
    let identifier = '';
    
    // Match requests: /matches/{id} or api.opendota.com/api/matches/{id}
    const matchMatch = funcStr.match(/matches\/(\d+)/);
    if (matchMatch) {
      identifier = `match-${matchMatch[1]}`;
    }
    // Player requests: /players/{id}
    else if (funcStr.match(/players\/(\d+)/)) {
      const playerMatch = funcStr.match(/players\/(\d+)/);
      if (playerMatch) {
        identifier = `player-${playerMatch[1]}`;
      }
    }
    // Hero requests
    else if (funcStr.includes('heroes')) {
      identifier = 'heroes';
    }
    // Dotabuff team matches
    else if (funcStr.includes('dotabuff.com/esports/teams') && funcStr.includes('matches')) {
      const teamMatch = funcStr.match(/teams\/(\d+)/);
      if (teamMatch) {
        identifier = `dotabuff-team-${teamMatch[1]}-matches`;
      }
    }
    // Generic fallback - use timestamp to make it unique
    else {
      identifier = `generic-${Date.now()}-${Math.random()}`;
    }
    
    logWithTimestamp('log', `[RequestQueue] Generated signature for ${service}: ${identifier} from function content: ${funcStr.substring(0, 200)}...`);
    
    return `${service}-${identifier}`;
  }

  async enqueue<T>(service: string, execute: () => Promise<T>, requestKey?: string): Promise<T> {
    logWithTimestamp('log', `[RequestQueue] enqueue called for service: ${service}, requestKey: ${requestKey || 'none'}`);
    
    const requestId = this.generateRequestId();
    // Use requestKey as the signature if provided, otherwise fall back to function-based signature
    const signature = requestKey ? `${service}-${requestKey}` : this.generateRequestSignature(service, execute);
    
    logWithTimestamp('log', `[RequestQueue] Generated signature: ${signature} for request ${requestId}`);
    
    if (this.activeRequests.has(signature)) {
      logWithTimestamp('warn', `[RequestQueue] Duplicate request detected for signature: ${signature}. Request ID: ${requestId}. Skipping.`);
      return Promise.reject(new Error(`Duplicate request detected for signature: ${signature}`));
    }
    
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestId,
        service,
        execute,
        resolve,
        reject,
        timestamp: Date.now(),
        signature
      };

      // Initialize queue for service if it doesn't exist
      if (!this.queues.has(service)) {
        logWithTimestamp('log', `[RequestQueue] Initializing new queue for service: ${service}`);
        this.queues.set(service, []);
        this.processing.set(service, false);
      }

      const queue = this.queues.get(service)!;
      const wasProcessing = this.processing.get(service) || false;
      queue.push(queuedRequest);
      
      // Mark this signature as active
      this.activeRequests.add(signature);
      
      logWithTimestamp('log', `[RequestQueue] Enqueued request ${requestId} for ${service}. Queue length: ${queue.length}. Signature: ${signature}. Was processing: ${wasProcessing}`);
      
      // Log current queue stats for all services
      const allQueueStats = this.getQueueStats();
      logWithTimestamp('log', `[RequestQueue] Current queue stats after enqueue:`, allQueueStats);
      
      // Start processing if not already processing
      if (!this.processing.get(service)) {
        logWithTimestamp('log', `[RequestQueue] Starting queue processing for ${service}`);
        this.processQueue(service);
      } else {
        logWithTimestamp('log', `[RequestQueue] Queue already processing for ${service}, request ${requestId} will be processed when current request completes`);
      }
    });
  }

  private async processQueue(service: string): Promise<void> {
    logWithTimestamp('log', `[RequestQueue] processQueue called for ${service}`);
    
    if (this.processing.get(service)) {
      logWithTimestamp('log', `[RequestQueue] Already processing queue for ${service}, skipping`);
      return; // Already processing
    }

    logWithTimestamp('log', `[RequestQueue] Setting processing flag to true for ${service}`);
    this.processing.set(service, true);
    const queue = this.queues.get(service)!;

    logWithTimestamp('log', `[RequestQueue] Starting to process queue for ${service}. Queue length: ${queue.length}`);

    while (queue.length > 0) {
      const request = queue.shift()!;
      logWithTimestamp('log', `[RequestQueue] Processing next request in queue for ${service}. Remaining in queue: ${queue.length}`);
      
      // Log current queue stats for all services
      const allQueueStats = this.getQueueStats();
      logWithTimestamp('log', `[RequestQueue] Current queue stats during processing:`, allQueueStats);
      
      try {
        // Apply rate limiting delay before executing the request
        logWithTimestamp('log', `[RequestQueue] Applying rate limit delay for ${service} before request ${request.id}`);
        await this.rateLimiter.waitForRateLimit(service);
        logWithTimestamp('log', `[RequestQueue] Rate limit delay completed for ${service}, executing request ${request.id}`);
        
        logWithTimestamp('log', `[RequestQueue] Processing request ${request.id} for ${service}. Signature: ${request.signature}`);
        logWithTimestamp('log', `[RequestQueue] About to execute request ${request.id} for ${service}`);
        logWithTimestamp('log', `[RequestQueue] Calling request.execute() for ${request.id}`);
        const result = await request.execute();
        logWithTimestamp('log', `[RequestQueue] Request ${request.id} executed successfully, resolving`);
        
        // Record the request in the rate limiter
        await this.rateLimiter.recordRequest(service);
        logWithTimestamp('log', `[RequestQueue] Recorded request ${request.id} in rate limiter for ${service}`);
        
        request.resolve(result);
        logWithTimestamp('log', `[RequestQueue] Completed request ${request.id} for ${service}`);
      } catch (error) {
        logWithTimestamp('error', `[RequestQueue] Failed request ${request.id} for ${service}:`, error);
        request.reject(error);
      } finally {
        // Remove the signature from active requests
        if (request.signature) {
          this.activeRequests.delete(request.signature);
          logWithTimestamp('log', `[RequestQueue] Removed signature ${request.signature} from active requests`);
        }
      }
    }

    logWithTimestamp('log', `[RequestQueue] Queue empty for ${service}, setting processing flag to false`);
    this.processing.set(service, false);
    logWithTimestamp('log', `[RequestQueue] Finished processing queue for ${service}`);
  }

  getQueueStats(): Record<string, { length: number; processing: boolean; activeSignatures: number }> {
    logWithTimestamp('log', '[RequestQueue] getQueueStats called');
    const stats: Record<string, { length: number; processing: boolean; activeSignatures: number }> = {};
    
    for (const [service, queue] of this.queues) {
      const processing = this.processing.get(service) || false;
      const activeSignatures = this.activeRequests.size;
      stats[service] = {
        length: queue.length,
        processing,
        activeSignatures
      };
      logWithTimestamp('log', `[RequestQueue] Stats for ${service}: ${queue.length} queued, processing: ${processing}, active signatures: ${activeSignatures}`);
    }
    
    logWithTimestamp('log', '[RequestQueue] getQueueStats completed, returning:', stats);
    return stats;
  }

  clearQueue(service: string): void {
    logWithTimestamp('log', `[RequestQueue] clearQueue called for ${service}`);
    const queue = this.queues.get(service);
    if (queue) {
      const clearedCount = queue.length;
      logWithTimestamp('log', `[RequestQueue] Found ${clearedCount} requests to clear for ${service}`);
      
      // Remove signatures for all requests being cleared
      let signatureCount = 0;
      queue.forEach(request => {
        if (request.signature) {
          this.activeRequests.delete(request.signature);
          signatureCount++;
          logWithTimestamp('log', `[RequestQueue] Removed signature ${request.signature} from active requests`);
        }
      });
      
      queue.splice(0, queue.length);
      logWithTimestamp('log', `[RequestQueue] Cleared ${clearedCount} requests and ${signatureCount} signatures from ${service} queue`);
    } else {
      logWithTimestamp('log', `[RequestQueue] No queue found for ${service}, nothing to clear`);
    }
  }

  // Method to get active signatures for debugging
  getActiveSignatures(): string[] {
    logWithTimestamp('log', '[RequestQueue] getActiveSignatures called');
    const signatures = Array.from(this.activeRequests);
    logWithTimestamp('log', `[RequestQueue] Found ${signatures.length} active signatures:`, signatures);
    return signatures;
  }
}

class RateLimiter {
  private limits: Map<string, RateLimitConfig>;
  private requestCounts: Map<string, number[]>;
  private lastRequestTimes: Map<string, number>;
  private backoffTimes: Map<string, number>;
  private requestQueue: RequestQueue;

  constructor() {
    this.limits = new Map();
    this.requestCounts = new Map();
    this.lastRequestTimes = new Map();
    this.backoffTimes = new Map();
    this.requestQueue = new RequestQueue(this);

    // Check if we're using mock data
    const isUsingMockData = process.env.USE_MOCK_API === 'true' || 
                           process.env.USE_MOCK_OPENDOTA === 'true' || 
                           process.env.USE_MOCK_DOTABUFF === 'true' || 
                           process.env.USE_MOCK_STRATZ === 'true' || 
                           process.env.USE_MOCK_D2PT === 'true';

    if (isUsingMockData) {
      // Use MOCK_RATE_LIMIT environment variable for requests per minute, default to 1000
      const mockRateLimit = parseInt(process.env.MOCK_RATE_LIMIT || '1000', 10);
      const delayMs = Math.floor(60000 / mockRateLimit); // Calculate delay based on requests per minute
      
      this.setRateLimit('opendota', { maxRequests: mockRateLimit, windowMs: 60000, delayMs });
      this.setRateLimit('dotabuff', { maxRequests: mockRateLimit, windowMs: 60000, delayMs });
      this.setRateLimit('default', { maxRequests: mockRateLimit, windowMs: 60000, delayMs });
      logWithTimestamp('log', `[RateLimiter] Using mock rate limits: ${mockRateLimit} requests/minute, ${delayMs}ms delay`);
    } else {
      // Normal rate limits for real APIs
      this.setRateLimit('opendota', { maxRequests: 60, windowMs: 60000, delayMs: 1000 }); // 60 requests per minute, 1s delay
      this.setRateLimit('dotabuff', { maxRequests: 30, windowMs: 60000, delayMs: 2000 }); // 30 requests per minute, 2s delay
      this.setRateLimit('default', { maxRequests: 30, windowMs: 60000, delayMs: 1000 }); // Default limits
      logWithTimestamp('log', '[RateLimiter] Using normal rate limits for real APIs');
    }
  }

  setRateLimit(service: string, config: RateLimitConfig) {
    logWithTimestamp('log', `[RateLimiter] setRateLimit called for ${service}:`, config);
    this.limits.set(service, config);
    logWithTimestamp('log', `[RateLimiter] Rate limit set for ${service}`);
  }

  private cleanupOldRequests(service: string) {
    const config = this.limits.get(service);
    if (!config) return;

    const now = Date.now();
    const requests = this.requestCounts.get(service) || [];
    const cutoff = now - config.windowMs;
    
    const beforeCount = requests.length;
    const filteredRequests = requests.filter(timestamp => timestamp > cutoff);
    const afterCount = filteredRequests.length;
    
    if (beforeCount !== afterCount) {
      logWithTimestamp('log', `[RateLimiter] Cleaned up ${beforeCount - afterCount} old requests for ${service} (${beforeCount} -> ${afterCount})`);
    }
    
    this.requestCounts.set(service, filteredRequests);
  }

  async canMakeRequest(service: string): Promise<boolean> {
    logWithTimestamp('log', `[RateLimiter] canMakeRequest called for ${service}`);
    this.cleanupOldRequests(service);
    
    const config = this.limits.get(service) || this.limits.get('default')!;
    const requests = this.requestCounts.get(service) || [];
    const canMake = requests.length < config.maxRequests;
    
    logWithTimestamp('log', `[RateLimiter] Rate limit check for ${service}: ${requests.length}/${config.maxRequests} requests, can make: ${canMake}`);
    return canMake;
  }

  async recordRequest(service: string) {
    logWithTimestamp('log', `[RateLimiter] recordRequest called for ${service}`);
    this.cleanupOldRequests(service);
    
    const requests = this.requestCounts.get(service) || [];
    requests.push(Date.now());
    this.requestCounts.set(service, requests);
    
    // Update the last request time for this service
    this.lastRequestTimes.set(service, Date.now());
    
    logWithTimestamp('log', `[RateLimiter] Recorded request for ${service}, total requests in window: ${requests.length}, last request time: ${new Date().toISOString()}`);
  }

  async recordRateLimitHit(service: string, retryAfter?: number) {
    logWithTimestamp('log', `[RateLimiter] recordRateLimitHit called for ${service}, retryAfter: ${retryAfter || 'not specified'}`);
    
    const backoffTime = retryAfter ? retryAfter * 1000 : 60000; // Default to 1 minute
    this.backoffTimes.set(service, Date.now() + backoffTime);
    
    logWithTimestamp('log', `[RateLimiter] Set backoff for ${service} until ${new Date(Date.now() + backoffTime).toISOString()}`);
  }

  async getDelayNeeded(service: string): Promise<number> {
    logWithTimestamp('log', `[RateLimiter] getDelayNeeded called for ${service}`);
    
    const config = this.limits.get(service) || this.limits.get('default')!;
    const lastRequestTime = this.lastRequestTimes.get(service) || 0;
    const now = Date.now();
    
    // Check if we're in backoff
    const backoffTime = this.backoffTimes.get(service) || 0;
    if (backoffTime > now) {
      const backoffDelay = backoffTime - now;
      logWithTimestamp('log', `[RateLimiter] Service ${service} in backoff, delay needed: ${backoffDelay}ms`);
      return backoffDelay;
    }
    
    // Check if we need to wait between requests
    const timeSinceLastRequest = now - lastRequestTime;
    const delayNeeded = Math.max(0, config.delayMs - timeSinceLastRequest);
    
    logWithTimestamp('log', `[RateLimiter] Service ${service} delay check: ${timeSinceLastRequest}ms since last request, ${config.delayMs}ms required, delay needed: ${delayNeeded}ms`);
    return delayNeeded;
  }

  async waitForRateLimit(service: string): Promise<void> {
    logWithTimestamp('log', `[RateLimiter] waitForRateLimit called for ${service}`);
    
    const delay = await this.getDelayNeeded(service);
    if (delay > 0) {
      logWithTimestamp('log', `[RateLimiter] Waiting ${delay}ms for rate limit on ${service}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      logWithTimestamp('log', `[RateLimiter] Finished waiting for rate limit on ${service}`);
    } else {
      logWithTimestamp('log', `[RateLimiter] No delay needed for ${service}`);
    }
  }

  // New method to queue requests with rate limiting
  async queueRequest<T>(service: string, requestFn: () => Promise<T>, requestKey?: string): Promise<T> {
    logWithTimestamp('log', `[RateLimiter] queueRequest called for ${service}, requestKey: ${requestKey || 'none'}`);
    logWithTimestamp('log', `[RateLimiter] Delegating to RequestQueue for ${service}`);
    const result = await this.requestQueue.enqueue(service, requestFn, requestKey);
    logWithTimestamp('log', `[RateLimiter] RequestQueue completed for ${service}`);
    return result;
  }

  getStats() {
    logWithTimestamp('log', '[RateLimiter] getStats called');
    const stats: Record<string, { current: number; limit: number; windowMs: number; backoffMs: number; queueLength: number; processing: boolean }> = {};
    
    for (const [service, config] of this.limits) {
      this.cleanupOldRequests(service);
      const requests = this.requestCounts.get(service) || [];
      const backoffTime = this.backoffTimes.get(service) || 0;
      const queueStats = this.requestQueue.getQueueStats()[service] || { length: 0, processing: false };
      
      stats[service] = {
        current: requests.length,
        limit: config.maxRequests,
        windowMs: config.windowMs,
        backoffMs: backoffTime,
        queueLength: queueStats.length,
        processing: queueStats.processing
      };
      
      logWithTimestamp('log', `[RateLimiter] Stats for ${service}:`, stats[service]);
    }
    
    logWithTimestamp('log', '[RateLimiter] getStats completed, returning:', stats);
    return stats;
  }

  getQueueStats() {
    logWithTimestamp('log', '[RateLimiter] getQueueStats called');
    const stats = this.requestQueue.getQueueStats();
    logWithTimestamp('log', '[RateLimiter] getQueueStats completed, returning:', stats);
    return stats;
  }

  getActiveSignatures() {
    logWithTimestamp('log', '[RateLimiter] getActiveSignatures called');
    const signatures = this.requestQueue.getActiveSignatures();
    logWithTimestamp('log', '[RateLimiter] getActiveSignatures completed, returning:', signatures);
    return signatures;
  }

  clearQueue(service: string) {
    logWithTimestamp('log', `[RateLimiter] clearQueue called for ${service}`);
    this.requestQueue.clearQueue(service);
    logWithTimestamp('log', `[RateLimiter] clearQueue completed for ${service}`);
  }

  clearBackoff(service: string) {
    logWithTimestamp('log', `[RateLimiter] clearBackoff called for ${service}`);
    this.backoffTimes.delete(service);
    logWithTimestamp('log', `[RateLimiter] Backoff cleared for ${service}`);
  }

  clearAllBackoffs() {
    logWithTimestamp('log', '[RateLimiter] clearAllBackoffs called');
    const clearedCount = this.backoffTimes.size;
    this.backoffTimes.clear();
    logWithTimestamp('log', `[RateLimiter] Cleared ${clearedCount} backoffs`);
  }

  getRateLimitStats() {
    logWithTimestamp('log', '[RateLimiter] getRateLimitStats called');
    const stats = this.getStats();
    logWithTimestamp('log', '[RateLimiter] getRateLimitStats completed, returning:', stats);
    return stats;
  }
}

class CacheService {
  private config: CacheConfig;
  private redis: Redis | null = null;
  private rateLimiter: RateLimiter;

  constructor(config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes default TTL
    maxAge: 24 * 60 * 60 * 1000 // 24 hours max age
  }) {
    this.config = config;
    this.rateLimiter = new RateLimiter();
    
    // Initialize Redis on server-side
    if (this.isServer()) {
      try {
        this.redis = Redis.fromEnv();
      } catch (error) {
        logWithTimestamp('warn', 'Failed to initialize Redis:', error);
        this.redis = null;
      }
    }
  }

  private getCacheKey(type: string, id?: string | number, params?: Record<string, any>): string {
    logWithTimestamp('log', `[CacheService] getCacheKey called for type: ${type}, id: ${id}, params:`, params);
    
    let key = `dota-cache-${type}`;
    if (id !== undefined) {
      key += `-${id}`;
    }
    if (params && Object.keys(params).length > 0) {
      const paramStr = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('-');
      key += `-${paramStr}`;
    }
    
    logWithTimestamp('log', `[CacheService] Generated cache key: ${key}`);
    return key;
  }

  private isServer(): boolean {
    const isServer = typeof window === 'undefined';
    logWithTimestamp('log', `[CacheService] isServer check: ${isServer} (typeof window: ${typeof window})`);
    return isServer;
  }

  // Rate limiting methods
  async waitForRateLimit(service: string): Promise<void> {
    logWithTimestamp('log', `[CacheService] waitForRateLimit called for ${service}`);
    await this.rateLimiter.waitForRateLimit(service);
    logWithTimestamp('log', `[CacheService] waitForRateLimit completed for ${service}`);
  }

  async canMakeRequest(service: string): Promise<boolean> {
    logWithTimestamp('log', `[CacheService] canMakeRequest called for ${service}`);
    const result = await this.rateLimiter.canMakeRequest(service);
    logWithTimestamp('log', `[CacheService] canMakeRequest result for ${service}: ${result}`);
    return result;
  }

  async recordRateLimitHit(service: string, retryAfter?: number): Promise<void> {
    logWithTimestamp('log', `[CacheService] recordRateLimitHit called for ${service}, retryAfter: ${retryAfter || 'not specified'}`);
    await this.rateLimiter.recordRateLimitHit(service, retryAfter);
    logWithTimestamp('log', `[CacheService] recordRateLimitHit completed for ${service}`);
  }

  // Queue methods
  async queueRequest<T>(service: string, requestFn: () => Promise<T>, requestKey?: string): Promise<T> {
    logWithTimestamp('log', `[CacheService] queueRequest called for ${service}, requestKey: ${requestKey || 'none'}`);
    logWithTimestamp('log', `[CacheService] Delegating to RateLimiter for ${service}`);
    const result = await this.rateLimiter.queueRequest(service, requestFn, requestKey);
    logWithTimestamp('log', `[CacheService] RateLimiter completed for ${service}`);
    return result;
  }

  getQueueStats() {
    logWithTimestamp('log', '[CacheService] getQueueStats called');
    const stats = this.rateLimiter.getQueueStats();
    logWithTimestamp('log', '[CacheService] getQueueStats completed, returning:', stats);
    return stats;
  }

  getActiveSignatures() {
    logWithTimestamp('log', '[CacheService] getActiveSignatures called');
    const signatures = this.rateLimiter.getActiveSignatures();
    logWithTimestamp('log', '[CacheService] getActiveSignatures completed, returning:', signatures);
    return signatures;
  }

  clearQueue(service: string) {
    logWithTimestamp('log', `[CacheService] clearQueue called for ${service}`);
    this.rateLimiter.clearQueue(service);
    logWithTimestamp('log', `[CacheService] clearQueue completed for ${service}`);
  }

  clearBackoff(service: string) {
    logWithTimestamp('log', `[CacheService] clearBackoff called for ${service}`);
    this.rateLimiter.clearBackoff(service);
    logWithTimestamp('log', `[CacheService] clearBackoff completed for ${service}`);
  }

  clearAllBackoffs() {
    logWithTimestamp('log', '[CacheService] clearAllBackoffs called');
    this.rateLimiter.clearAllBackoffs();
    logWithTimestamp('log', '[CacheService] clearAllBackoffs completed');
  }

  getRateLimitStats() {
    logWithTimestamp('log', '[CacheService] getRateLimitStats called');
    const stats = this.rateLimiter.getRateLimitStats();
    logWithTimestamp('log', '[CacheService] getRateLimitStats completed, returning:', stats);
    return stats;
  }

  async get<T>(type: string, id?: string | number, params?: Record<string, any>): Promise<T | null> {
    try {
      logWithTimestamp('log', `[CacheService] GET called for type: ${type}, id: ${id}, params:`, params);
      
      // If using mock data, do not cache in Redis or localStorage
      const isMock = process.env.USE_MOCK_API === 'true' || 
                     process.env.USE_MOCK_OPENDOTA === 'true' || 
                     process.env.USE_MOCK_DOTABUFF === 'true' || 
                     process.env.USE_MOCK_STRATZ === 'true' || 
                     process.env.USE_MOCK_D2PT === 'true';
      if (isMock) {
        logWithTimestamp('log', `[CacheService] Skipping cache get for mock data - type: ${type}, id: ${id}`);
        return null;
      }

      if (this.isServer()) {
        // Server-side: Use Redis
        if (!this.redis) {
          logWithTimestamp('warn', '[CacheService] Redis not available, skipping cache get');
          return null;
        }

        const key = this.getCacheKey(type, id, params);
        logWithTimestamp('log', `[CacheService] Server-side cache get for key: ${key}`);
        const cached = await this.redis.get(key);
        
        if (!cached) {
          logWithTimestamp('log', `[CacheService] No cached data found for key: ${key}`);
          return null;
        }

        const cacheData: CacheEntry = cached as CacheEntry;
        const now = Date.now();

        // Check if cache is expired
        if (now - cacheData.timestamp > cacheData.ttl) {
          // Cache expired, but check if it's still within max age for background refresh
          if (now - cacheData.timestamp > this.config.maxAge) {
            // Too old, remove cache entry
            logWithTimestamp('log', `[CacheService] Cache expired and too old, removing key: ${key}`);
            await this.redis.del(key);
            return null;
          }
          // Return stale data but mark for refresh
          logWithTimestamp('log', `[CacheService] Returning stale cache data for key: ${key}`);
          return cacheData.data;
        }

        logWithTimestamp('log', `[CacheService] Returning fresh cache data for key: ${key}`);
        return cacheData.data;
      } else {
        // Client-side: Use localStorage
        const key = this.getCacheKey(type, id, params);
        logWithTimestamp('log', `[CacheService] Client-side cache get for key: ${key}`);
        const cached = localStorage.getItem(key);
        
        if (!cached) {
          logWithTimestamp('log', `[CacheService] No cached data found for key: ${key}`);
          return null;
        }

        const cacheData: CacheEntry = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is expired
        if (now - cacheData.timestamp > cacheData.ttl) {
          // Cache expired, but check if it's still within max age for background refresh
          if (now - cacheData.timestamp > this.config.maxAge) {
            // Too old, remove cache entry
            logWithTimestamp('log', `[CacheService] Cache expired and too old, removing key: ${key}`);
            localStorage.removeItem(key);
            return null;
          }
          // Return stale data but mark for refresh
          logWithTimestamp('log', `[CacheService] Returning stale cache data for key: ${key}`);
          return cacheData.data;
        }

        logWithTimestamp('log', `[CacheService] Returning fresh cache data for key: ${key}`);
        return cacheData.data;
      }
    } catch (error) {
      logWithTimestamp('error', '[CacheService] Cache get error:', error);
      return null;
    }
  }

  async set<T>(type: string, data: T, id?: string | number, params?: Record<string, any>, ttl?: number): Promise<void> {
    try {
      logWithTimestamp('log', `[CacheService] SET called for type: ${type}, id: ${id}, params:`, params, `ttl: ${ttl}`);
      
      // If using mock data, do not cache in Redis or localStorage
      const isMock = process.env.USE_MOCK_API === 'true' || 
                     process.env.USE_MOCK_OPENDOTA === 'true' || 
                     process.env.USE_MOCK_DOTABUFF === 'true' || 
                     process.env.USE_MOCK_STRATZ === 'true' || 
                     process.env.USE_MOCK_D2PT === 'true';
      if (isMock) {
        // Optionally log for debug
        logWithTimestamp('log', `[CacheService] Skipping cache set for mock data - type: ${type}, id: ${id}`);
        return;
      }

      const key = this.getCacheKey(type, id, params);
      const now = Date.now();
      const cacheTTL = ttl || this.config.ttl;

      const cacheEntry: CacheEntry = {
        data,
        timestamp: now,
        ttl: cacheTTL
      };

      if (this.isServer()) {
        // Server-side: Use Redis
        if (!this.redis) {
          logWithTimestamp('warn', '[CacheService] Redis not available, skipping cache set');
          return;
        }

        // Convert TTL to seconds for Redis
        const redisTTL = Math.ceil(cacheTTL / 1000);
        logWithTimestamp('log', `[CacheService] Server-side cache set for key: ${key}, ttl: ${redisTTL}s`);
        await this.redis.setex(key, redisTTL, JSON.stringify(cacheEntry));
        logWithTimestamp('log', `[CacheService] Successfully cached data for key: ${key}`);
      } else {
        // Client-side: Use localStorage
        logWithTimestamp('log', `[CacheService] Client-side cache set for key: ${key}, ttl: ${cacheTTL}ms`);
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        logWithTimestamp('log', `[CacheService] Successfully cached data for key: ${key}`);
      }
    } catch (error) {
      logWithTimestamp('error', '[CacheService] Cache set error:', error);
    }
  }

  async invalidate(type: string, id?: string | number, params?: Record<string, any>): Promise<void> {
    try {
      logWithTimestamp('log', `[CacheService] INVALIDATE called for type: ${type}, id: ${id}, params:`, params);
      
      const key = this.getCacheKey(type, id, params);
      logWithTimestamp('log', `[CacheService] Invalidating cache key: ${key}`);

      if (this.isServer()) {
        // Server-side: Use Redis
        if (!this.redis) {
          logWithTimestamp('warn', '[CacheService] Redis not available, skipping cache invalidate');
          return;
        }
        
        logWithTimestamp('log', `[CacheService] Server-side cache invalidate for key: ${key}`);
        const result = await this.redis.del(key);
        logWithTimestamp('log', `[CacheService] Redis invalidate result for key ${key}: ${result} (1 = deleted, 0 = not found)`);
      } else {
        // Client-side: Use localStorage
        logWithTimestamp('log', `[CacheService] Client-side cache invalidate for key: ${key}`);
        const existed = localStorage.getItem(key) !== null;
        localStorage.removeItem(key);
        logWithTimestamp('log', `[CacheService] localStorage invalidate for key ${key}: ${existed ? 'deleted' : 'not found'}`);
      }
      
      logWithTimestamp('log', `[CacheService] Cache invalidate completed for key: ${key}`);
    } catch (error) {
      logWithTimestamp('error', '[CacheService] Cache invalidate error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      logWithTimestamp('log', '[CacheService] CLEAR called');
      
      if (this.isServer()) {
        // Server-side: Use Redis
        if (!this.redis) {
          logWithTimestamp('warn', '[CacheService] Redis not available, skipping cache clear');
          return;
        }
        
        logWithTimestamp('log', '[CacheService] Server-side cache clear');
        // Get all keys matching the pattern and delete them
        const keys = await this.redis.keys('dota-cache-*');
        logWithTimestamp('log', `[CacheService] Found ${keys.length} cache keys to clear`);
        if (keys.length > 0) {
          const result = await this.redis.del(...keys);
          logWithTimestamp('log', `[CacheService] Cleared ${result} cache keys from Redis`);
        }
      } else {
        // Client-side: Use localStorage
        logWithTimestamp('log', '[CacheService] Client-side cache clear');
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith('dota-cache-'));
        logWithTimestamp('log', `[CacheService] Found ${cacheKeys.length} cache keys to clear`);
        for (const key of cacheKeys) {
          localStorage.removeItem(key);
        }
        logWithTimestamp('log', `[CacheService] Cleared ${cacheKeys.length} cache keys from localStorage`);
      }
      
      logWithTimestamp('log', '[CacheService] Cache clear completed');
    } catch (error) {
      logWithTimestamp('error', '[CacheService] Cache clear error:', error);
    }
  }

  async getStats(): Promise<{ totalEntries: number; totalSize: number }> {
    try {
      logWithTimestamp('log', '[CacheService] getStats called');
      
      if (this.isServer()) {
        // Server-side: Use Redis
        if (!this.redis) {
          logWithTimestamp('log', '[CacheService] Redis not available, returning empty stats');
          return { totalEntries: 0, totalSize: 0 };
        }
        
        logWithTimestamp('log', '[CacheService] Getting server-side cache stats from Redis');
        const keys = await this.redis.keys('dota-cache-*');
        let totalSize = 0;

        for (const key of keys) {
          const value = await this.redis.get(key);
          if (value) {
            totalSize += JSON.stringify(value).length;
          }
        }

        logWithTimestamp('log', `[CacheService] Server-side stats: ${keys.length} entries, ${totalSize} bytes`);
        return { totalEntries: keys.length, totalSize };
      } else {
        // Client-side: Use localStorage
        logWithTimestamp('log', '[CacheService] Getting client-side cache stats from localStorage');
        const keys = Object.keys(localStorage).filter(key => key.startsWith('dota-cache-'));
        let totalSize = 0;

        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }

        logWithTimestamp('log', `[CacheService] Client-side stats: ${keys.length} entries, ${totalSize} bytes`);
        return { totalEntries: keys.length, totalSize };
      }
    } catch (error) {
      logWithTimestamp('error', '[CacheService] Cache stats error:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Cache configurations for different endpoints
export const CACHE_CONFIGS = {
  PLAYER_DATA: { ttl: 60 * 60 * 1000, maxAge: 24 * 60 * 60 * 1000 }, // 1 hour TTL, 1 day max age
  PLAYER_MATCHES: { ttl: 60 * 60 * 1000, maxAge: 24 * 60 * 60 * 1000 }, // 1 hour TTL, 1 day max age
  HEROES: { ttl: Infinity, maxAge: 7 * 24 * 60 * 60 * 1000 }, // No TTL, 1 week max age - only refresh on unrecognized heroes
  MATCH_DETAILS: { ttl: Infinity, maxAge: Infinity }, // No TTL, no max age - only refresh on parsing or explicit request
  TEAM_DATA: { ttl: 24 * 60 * 60 * 1000, maxAge: 30 * 24 * 60 * 60 * 1000 }, // 1 day TTL, 1 month max age
} as const;

export default cacheService; 