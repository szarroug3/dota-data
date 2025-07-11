import { useCacheManagementContext } from '@/contexts/cache-management-context';
import type { UseCacheManagementReturn } from '@/types/hooks/use-cache-management';

export function useCacheManagement(): UseCacheManagementReturn {
  const ctx = useCacheManagementContext();
  return {
    loading: ctx.loading,
    error: ctx.error,
    actions: {
      invalidateCache: ctx.invalidateCache,
      invalidateAllCache: ctx.invalidateAllCache,
      clearError: ctx.clearError,
    },
  };
} 