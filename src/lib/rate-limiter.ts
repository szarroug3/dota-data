import { logWithTimestampToFile } from './server-logger';

if (typeof window !== 'undefined') {
  throw new Error('[rate-limiter.ts] Mocking logic should never run on the client!');
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  delayMs: number;
}

import RequestQueue from './request-queue';

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

    // Set rate limits for each service, using mock env var for that service or USE_MOCK_API
    const services = [
      { name: 'opendota', mockEnv: 'USE_MOCK_OPENDOTA', defaultLimit: 60, defaultDelay: 1000 },
      { name: 'dotabuff', mockEnv: 'USE_MOCK_DOTABUFF', defaultLimit: 30, defaultDelay: 2000 },
      { name: 'stratz', mockEnv: 'USE_MOCK_STRATZ', defaultLimit: 30, defaultDelay: 1000 },
      { name: 'd2pt', mockEnv: 'USE_MOCK_D2PT', defaultLimit: 30, defaultDelay: 1000 },
      { name: 'default', mockEnv: '', defaultLimit: 30, defaultDelay: 1000 },
    ];
    for (const svc of services) {
      const useMock = process.env.USE_MOCK_API === 'true' || (svc.mockEnv && process.env[svc.mockEnv] === 'true');
      logMockCheck('rate-limiter', String(svc.name), Boolean(useMock));
      if (useMock) {
        const mockRateLimit = parseInt(process.env.MOCK_RATE_LIMIT || '1000', 10);
        const delayMs = Math.floor(60000 / mockRateLimit);
        this.setRateLimit(svc.name, { maxRequests: mockRateLimit, windowMs: 60000, delayMs });
        logWithTimestampToFile('log', `[RateLimiter] Using mock rate limits for ${svc.name}: ${mockRateLimit} requests/minute, ${delayMs}ms delay`);
      } else {
        this.setRateLimit(svc.name, { maxRequests: svc.defaultLimit, windowMs: 60000, delayMs: svc.defaultDelay });
        logWithTimestampToFile('log', `[RateLimiter] Using normal rate limits for ${svc.name}`);
      }
    }
  }

  setRateLimit(service: string, config: RateLimitConfig) {
    logWithTimestampToFile('log', `[RateLimiter] setRateLimit called for ${service}:`, config);
    this.limits.set(service, config);
    logWithTimestampToFile('log', `[RateLimiter] Rate limit set for ${service}`);
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
      logWithTimestampToFile('log', `[RateLimiter] Cleaned up ${beforeCount - afterCount} old requests for ${service} (${beforeCount} -> ${afterCount})`);
    }
    
    this.requestCounts.set(service, filteredRequests);
  }

  async canMakeRequest(service: string): Promise<boolean> {
    logWithTimestampToFile('log', `[RateLimiter] canMakeRequest called for ${service}`);
    this.cleanupOldRequests(service);
    
    const config = this.limits.get(service) || this.limits.get('default')!;
    const requests = this.requestCounts.get(service) || [];
    const canMake = requests.length < config.maxRequests;
    
    logWithTimestampToFile('log', `[RateLimiter] Rate limit check for ${service}: ${requests.length}/${config.maxRequests} requests, can make: ${canMake}`);
    return canMake;
  }

  async recordRequest(service: string) {
    logWithTimestampToFile('log', `[RateLimiter] recordRequest called for ${service}`);
    this.cleanupOldRequests(service);
    
    const requests = this.requestCounts.get(service) || [];
    requests.push(Date.now());
    this.requestCounts.set(service, requests);
    
    // Update the last request time for this service
    this.lastRequestTimes.set(service, Date.now());
    
    logWithTimestampToFile('log', `[RateLimiter] Recorded request for ${service}, total requests in window: ${requests.length}, last request time: ${new Date().toISOString()}`);
  }

  async recordRateLimitHit(service: string, retryAfter?: number) {
    logWithTimestampToFile('log', `[RateLimiter] recordRateLimitHit called for ${service}, retryAfter: ${retryAfter || 'not specified'}`);
    
    const backoffTime = retryAfter ? retryAfter * 1000 : 60000; // Default to 1 minute
    this.backoffTimes.set(service, Date.now() + backoffTime);
    
    logWithTimestampToFile('log', `[RateLimiter] Set backoff for ${service} until ${new Date(Date.now() + backoffTime).toISOString()}`);
  }

  async getDelayNeeded(service: string): Promise<number> {
    logWithTimestampToFile('log', `[RateLimiter] getDelayNeeded called for ${service}`);
    
    const config = this.limits.get(service) || this.limits.get('default')!;
    const lastRequestTime = this.lastRequestTimes.get(service) || 0;
    const now = Date.now();
    
    // Check if we're in backoff
    const backoffTime = this.backoffTimes.get(service) || 0;
    if (backoffTime > now) {
      const backoffDelay = backoffTime - now;
      logWithTimestampToFile('log', `[RateLimiter] Service ${service} in backoff, delay needed: ${backoffDelay}ms`);
      return backoffDelay;
    }
    
    // Check if we need to wait between requests
    const timeSinceLastRequest = now - lastRequestTime;
    const delayNeeded = Math.max(0, config.delayMs - timeSinceLastRequest);
    
    logWithTimestampToFile('log', `[RateLimiter] Service ${service} delay check: ${timeSinceLastRequest}ms since last request, ${config.delayMs}ms required, delay needed: ${delayNeeded}ms`);
    return delayNeeded;
  }

  async waitForRateLimit(service: string): Promise<void> {
    logWithTimestampToFile('log', `[RateLimiter] waitForRateLimit called for ${service}`);
    
    const delay = await this.getDelayNeeded(service);
    if (delay > 0) {
      logWithTimestampToFile('log', `[RateLimiter] Waiting ${delay}ms for rate limit on ${service}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      logWithTimestampToFile('log', `[RateLimiter] Finished waiting for rate limit on ${service}`);
    } else {
      logWithTimestampToFile('log', `[RateLimiter] No delay needed for ${service}`);
    }
  }

  // New method to queue requests with rate limiting
  async queueRequest<T>(service: string, requestFn: () => Promise<T>, requestKey?: string): Promise<T> {
    logWithTimestampToFile('log', `[RateLimiter] queueRequest called for ${service}, requestKey: ${requestKey || 'none'}`);
    logWithTimestampToFile('log', `[RateLimiter] Delegating to RequestQueue for ${service}`);
    const result = await this.requestQueue.enqueue(service, requestFn, requestKey || '');
    logWithTimestampToFile('log', `[RateLimiter] RequestQueue completed for ${service}`);
    return result;
  }

  getStats() {
    logWithTimestampToFile('log', '[RateLimiter] getStats called');
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
      
      logWithTimestampToFile('log', `[RateLimiter] Stats for ${service}:`, stats[service]);
    }
    
    logWithTimestampToFile('log', '[RateLimiter] getStats completed, returning:', stats);
    return stats;
  }

  getQueueStats() {
    logWithTimestampToFile('log', '[RateLimiter] getQueueStats called');
    const stats = this.requestQueue.getQueueStats();
    logWithTimestampToFile('log', '[RateLimiter] getQueueStats completed, returning:', stats);
    return stats;
  }

  getActiveSignatures() {
    logWithTimestampToFile('log', '[RateLimiter] getActiveSignatures called');
    const signatures = this.requestQueue.getActiveSignatures();
    logWithTimestampToFile('log', '[RateLimiter] getActiveSignatures completed, returning:', signatures);
    return signatures;
  }

  clearQueue(service: string) {
    logWithTimestampToFile('log', `[RateLimiter] clearQueue called for ${service}`);
    this.requestQueue.clearQueue(service);
    logWithTimestampToFile('log', `[RateLimiter] clearQueue completed for ${service}`);
  }

  clearBackoff(service: string) {
    logWithTimestampToFile('log', `[RateLimiter] clearBackoff called for ${service}`);
    this.backoffTimes.delete(service);
    logWithTimestampToFile('log', `[RateLimiter] Backoff cleared for ${service}`);
  }

  clearAllBackoffs() {
    logWithTimestampToFile('log', '[RateLimiter] clearAllBackoffs called');
    const clearedCount = this.backoffTimes.size;
    this.backoffTimes.clear();
    logWithTimestampToFile('log', `[RateLimiter] Cleared ${clearedCount} backoffs`);
  }

  getRateLimitStats() {
    logWithTimestampToFile('log', '[RateLimiter] getRateLimitStats called');
    const stats = this.getStats();
    logWithTimestampToFile('log', '[RateLimiter] getRateLimitStats completed, returning:', stats);
    return stats;
  }
}

function logMockCheck(context: string, endpoint: string, isMock: boolean) {
  logWithTimestampToFile('log', `[${context}] USE_MOCK_API: ${process.env.USE_MOCK_API}, endpoint: ${endpoint}, isMock: ${isMock}`);
}

export default RateLimiter;
export const rateLimiter = new RateLimiter(); 