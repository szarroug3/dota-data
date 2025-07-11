import type { } from '@/types/cache';

export interface UseCacheManagementReturn {
  loading: boolean;
  error: string | null;
  actions: {
    invalidateCache: (cacheKey: string) => Promise<void>;
    invalidateAllCache: () => Promise<void>;
    clearError: () => void;
  };
} 