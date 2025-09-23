'use client';

// Generic helper to fetch data with in-memory cache, persisted cache, and in-flight deduplication.

export type InFlightMap<K, T> = Map<K, Promise<T>>;

export interface FetchWithCacheParams<K, T> {
  id: K;
  force?: boolean;
  inMemoryMap: Map<K, T>;
  setInMemory: (updater: (prev: Map<K, T>) => Map<K, T>) => void;
  inFlight: InFlightMap<K, T>;
  getPersisted: (id: K) => T | null;
  setPersisted: (id: K, value: T) => void;
  loader: (id: K, force?: boolean) => Promise<T>;
}

export async function fetchWithMemoryAndStorage<K, T>(params: FetchWithCacheParams<K, T>): Promise<T> {
  const { id, force = false, inMemoryMap, setInMemory, inFlight, getPersisted, setPersisted, loader } = params;

  // 1) Memory cache
  if (!force && inMemoryMap.has(id)) {
    const cached = inMemoryMap.get(id);
    if (cached !== undefined) return cached as T;
  }

  // 2) Persisted cache
  if (!force) {
    const persisted = getPersisted(id);
    if (persisted) {
      setInMemory((prev) => new Map(prev).set(id, persisted));
      return persisted;
    }
  }

  // 3) In-flight deduplication
  const existing = inFlight.get(id);
  if (existing) return existing;

  const requestPromise = (async (): Promise<T> => {
    try {
      const value = await loader(id, force);
      setInMemory((prev) => new Map(prev).set(id, value));
      setPersisted(id, value);
      return value;
    } finally {
      inFlight.delete(id);
    }
  })();

  inFlight.set(id, requestPromise);
  return requestPromise;
}
