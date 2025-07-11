import React, { createContext, useCallback, useContext, useState } from 'react';

export interface CacheManagementContextValue {
  loading: boolean;
  error: string | null;
  invalidateCache: (cacheKey: string) => Promise<void>;
  invalidateAllCache: () => Promise<void>;
  clearError: () => void;
}

const CacheManagementContext = createContext<CacheManagementContextValue | undefined>(undefined);

export const CacheManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidateCache = useCallback(async (cacheKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheKey }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to invalidate cache');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cache invalidation failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const invalidateAllCache = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to invalidate all cache');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cache invalidation failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: CacheManagementContextValue = {
    loading,
    error,
    invalidateCache,
    invalidateAllCache,
    clearError,
  };

  return (
    <CacheManagementContext.Provider value={value}>
      {children}
    </CacheManagementContext.Provider>
  );
};

export function useCacheManagementContext(): CacheManagementContextValue {
  const ctx = useContext(CacheManagementContext);
  if (!ctx) {
    throw new Error('useCacheManagementContext must be used within a CacheManagementProvider');
  }
  return ctx;
} 