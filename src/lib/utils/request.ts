import fs from 'fs/promises';
import path from 'path';

import { CacheService } from '@/lib/cache-service';
import { getEnv } from '@/lib/config/environment';
import { CacheValue } from '@/types/cache';

const mockServices = {
  dotabuff: getEnv.USE_MOCK_API() || getEnv.USE_MOCK_DOTABUFF(),
  opendota: getEnv.USE_MOCK_API() || getEnv.USE_MOCK_OPENDOTA(),
  d2pt: getEnv.USE_MOCK_API() || getEnv.USE_MOCK_D2PT(),
};

async function getFromCache<T>(cache: CacheService, cacheKey: string, force: boolean): Promise<T | null> {
  if (force) {
    return null;
  }
  return await cache.get<T>(cacheKey);
}

async function getFromMock(mockFilename: string): Promise<string> {
  return await fs.readFile(mockFilename, 'utf-8');
}

async function getFromAPI(requestFn: () => Promise<string>, mockFilename: string): Promise<string> {
  const response = await requestFn();
  if (getEnv.WRITE_REAL_DATA_TO_MOCK()) {
    const folder = path.dirname(mockFilename);
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(mockFilename, response, 'utf-8');
  }
  return response;
}

async function processData<T>(
  data: string,
  processingFn: (data: string) => T,
  cache: CacheService,
  cacheKey: string,
  cacheTTL: number,
): Promise<T> {
  const processed = await processingFn(data);
  // Ensure the processed data is compatible with CacheValue
  await cache.set(cacheKey, processed as CacheValue, cacheTTL);
  return processed;
}

export async function request<T>(
  service: keyof typeof mockServices,
  requestFn: () => Promise<string>,
  processingFn: (data: string) => T,
  mockFilename: string,
  force: boolean = false,
  cacheTTL: number = 60 * 60,
  cacheKey: string,
): Promise<T | null> {
  const cache = new CacheService();

  const cachedData = await getFromCache<T>(cache, cacheKey, force);
  if (cachedData) {
    return cachedData;
  }

  let data: string | null = null;
  if (mockServices[service]) {
    data = await getFromMock(mockFilename);
  } else {
    data = await getFromAPI(requestFn, mockFilename);
  }
  return await processData(data, processingFn, cache, cacheKey, cacheTTL);
}

export async function requestWithRetry(
  method: 'GET' | 'POST',
  url: string,
  body?: object,
  headers?: Record<string, string>,
  retries: number = 3,
  retryDelay: number = 1000,
): Promise<Response> {
  const request = { method, body: body ? JSON.stringify(body) : undefined, headers };

  function shouldRetry(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
  }

  function computeBackoffMs(retryAfter: string | null, attempt: number): number {
    const backoffMs = retryDelay * Math.pow(2, attempt);
    if (!retryAfter) return backoffMs;
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds)) return Math.max(backoffMs, seconds * 1000);
    const dateMs = Date.parse(retryAfter);
    if (!Number.isNaN(dateMs)) return Math.max(backoffMs, dateMs - Date.now());
    return backoffMs;
  }

  let lastStatus: number | undefined;
  let lastStatusText: string | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, request);
    if (response.ok) return response;

    lastStatus = response.status;
    lastStatusText = response.statusText;

    if (!shouldRetry(response.status)) break;

    const backoffMs = computeBackoffMs(response.headers.get('Retry-After'), attempt);
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, backoffMs)));
  }

  throw new Error(`Request failed: ${lastStatus} ${lastStatusText}`);
}
