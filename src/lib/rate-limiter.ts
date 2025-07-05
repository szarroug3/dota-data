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
      if (useMock) {
        const mockRateLimit = parseInt(process.env.MOCK_RATE_LIMIT || '1000', 10);
        const delayMs = Math.floor(60000 / mockRateLimit);
        this.setRateLimit(svc.name, { maxRequests: mockRateLimit, windowMs: 60000, delayMs });
      } else {
        this.setRateLimit(svc.name, { maxRequests: svc.defaultLimit, windowMs: 60000, delayMs: svc.defaultDelay });
      }
    }
  }

  setRateLimit(service: string, config: RateLimitConfig) {
    this.limits.set(service, config);
  }

  private cleanupOldRequests(service: string) {
    const config = this.limits.get(service);
    if (!config) return;

    const now = Date.now();
    const requests = this.requestCounts.get(service) || [];
    const cutoff = now - config.windowMs;
    
    const filteredRequests = requests.filter(timestamp => timestamp > cutoff);
    
    this.requestCounts.set(service, filteredRequests);
  }

  async canMakeRequest(service: string): Promise<boolean> {
    logWithTimestampToFile('log', `[RateLimiter] canMakeRequest called for ${service}`);
    this.cleanupOldRequests(service);
    
    const config = this.limits.get(service) || this.limits.get('default')!;
    const requests = this.requestCounts.get(service) || [];
    return requests.length < config.maxRequests;
  }

  async recordRequest(service: string) {
    this.cleanupOldRequests(service);
    
    const requests = this.requestCounts.get(service) || [];
    requests.push(Date.now());
    this.requestCounts.set(service, requests);
    
    // Update the last request time for this service
    this.lastRequestTimes.set(service, Date.now());
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
      return backoffTime - now;
    }
    
    // Check if we need to wait between requests
    const timeSinceLastRequest = now - lastRequestTime;
    return Math.max(0, config.delayMs - timeSinceLastRequest);
  }

  async waitForRateLimit(service: string): Promise<void> {
    logWithTimestampToFile('log', `[RateLimiter] waitForRateLimit called for ${service}`);
    
    const delay = await this.getDelayNeeded(service);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // New method to queue requests with rate limiting
  async queueRequest<T>(service: string, requestFn: () => Promise<T>, requestKey?: string): Promise<T> {
    const result = await this.requestQueue.enqueue(service, requestFn, requestKey || '');
    return result as T;
  }

  clearQueue(service: string) {
    logWithTimestampToFile('log', `[RateLimiter] clearQueue called for ${service}`);
    this.requestQueue.clearQueue(service);
  }
}

export default RateLimiter;
export const rateLimiter = new RateLimiter(); 