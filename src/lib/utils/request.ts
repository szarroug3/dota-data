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

async function getFromMock(mockFilename: string, service: keyof typeof mockServices): Promise<string | null> {
  if (mockServices[service]) {
    return await fs.readFile(mockFilename, 'utf-8');
  }
  return null;
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
  cacheTTL: number
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
  cacheKey: string
): Promise<T | null> {
  const cache = new CacheService();
  
  const cachedData = await getFromCache<T>(cache, cacheKey, force);
  if (cachedData) {
    return cachedData;
  }

  let data = await getFromMock(mockFilename, service);
  if (!data) {
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

  let response;
  let status;
  let statusText;
  for (let i = 0; i < retries; i++) {
    response = await fetch(url, request);

    if (response.ok) {
      return response;
    }

    const delay = Number(response.headers.get('Retry-After')) || retryDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
    status = response.status;
    statusText = response.statusText;
  }

  throw new Error(`Request failed: ${status} ${statusText}`);
}

