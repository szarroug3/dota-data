// Simple localStorage-backed cache with TTL and versioning.
// Frontend-only. Contexts should use this via config-context abstraction where appropriate.

export interface CacheEntry<T> {
  version: string;
  timestamp: number; // ms epoch
  value: T;
  etag?: string;
}

export interface CacheOptions {
  version: string; // CACHE_VERSION
  ttlMs?: number; // undefined = no TTL
}

export const CACHE_VERSION = '1';

// Family TTLs (ms). Undefined means no TTL (indefinite until manual refresh/version bump)
export const CacheTtl = {
  players: 24 * 60 * 60 * 1000,
  teams: 24 * 60 * 60 * 1000,
  matches: undefined as number | undefined,
};

export function getCacheKey(baseKey: string, version: string): string {
  return `${baseKey}:v${version}`;
}

export function setCacheItemUsing<T>(
  storage: Pick<Storage, 'setItem'>,
  key: string,
  value: T,
  options: CacheOptions,
): void {
  const entry: CacheEntry<T> = {
    version: options.version,
    timestamp: Date.now(),
    value,
  };
  try {
    storage.setItem(key, JSON.stringify(entry));
  } catch {
    // best-effort
  }
}

export function setCacheItem<T>(key: string, value: T, options: CacheOptions): void {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  setCacheItemUsing(window.localStorage, key, value, options);
}

export function getCacheItemUsing<T>(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  options: CacheOptions,
): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.version !== options.version) {
      storage.removeItem(key);
      return null;
    }
    if (typeof options.ttlMs === 'number') {
      const age = Date.now() - entry.timestamp;
      if (age > options.ttlMs) {
        storage.removeItem(key);
        return null;
      }
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function getCacheItem<T>(key: string, options: CacheOptions): T | null {
  if (typeof window === 'undefined' || !('localStorage' in window)) return null;
  return getCacheItemUsing<T>(window.localStorage, key, options);
}

export function clearCacheItemUsing(storage: Pick<Storage, 'removeItem'>, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // best-effort
  }
}

export function clearCacheItem(key: string): void {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  clearCacheItemUsing(window.localStorage, key);
}

export function clearCacheByPrefixUsing(storage: Pick<Storage, 'length' | 'key' | 'removeItem'>, prefix: string): void {
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const k = storage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => storage.removeItem(k));
}

export function clearCacheByPrefix(prefix: string): void {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  clearCacheByPrefixUsing(window.localStorage, prefix);
}
