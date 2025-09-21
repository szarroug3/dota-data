import { CacheService } from '@/lib/cache-service';
import type { CacheValue } from '@/types/cache';

// Ensure a true singleton across Jest module registries by using globalThis
const globalKey = '__dota_share_cache__';
// Augment globalThis to store singleton instances keyed by strings
// Use a weakly-typed global bag for singletons
type GlobalBag = { [key: string]: CacheService | ShareStore } & typeof globalThis;
const globalAny = globalThis as GlobalBag;

export const cache: CacheService = (globalAny[globalKey] as CacheService) || new CacheService();
globalAny[globalKey] = cache;

// In-process share store to ensure stability in tests/dev, while still writing to CacheService
// This mirrors values so that separate module instances in tests can observe the same state.
const shareStoreKey = '__api_share_store__';
type ShareStore = Map<string, CacheValue>;
export const shareStore: ShareStore = (globalAny[shareStoreKey] as ShareStore) || new Map<string, CacheValue>();
globalAny[shareStoreKey] = shareStore;

export async function setSharedPayload(key: string, payload: Record<string, CacheValue>): Promise<void> {
  shareStore.set(key, payload);
  await cache.set(key, payload);
}

export async function getSharedPayload<T>(key: string): Promise<T | null> {
  if (shareStore.has(key)) {
    return shareStore.get(key) as T;
  }
  return await cache.get<T>(key);
}
