import { act, renderHook, waitFor } from '@testing-library/react';

import { CacheManagementProvider } from '@/contexts/cache-management-context';
import { useCacheManagement } from '@/hooks/use-cache-management';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CacheManagementProvider>{children}</CacheManagementProvider>
);

describe('useCacheManagement', () => {
  beforeEach(() => {
    // mocking global.fetch for test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useCacheManagement(), { wrapper });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.actions.invalidateCache).toBe('function');
    expect(typeof result.current.actions.invalidateAllCache).toBe('function');
    expect(typeof result.current.actions.clearError).toBe('function');
  });

  it('should invalidate cache successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useCacheManagement(), { wrapper });
    await act(async () => {
      await result.current.actions.invalidateCache('test-key');
    });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/cache/invalidate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ cacheKey: 'test-key' }),
      })
    );
  });

  it('should handle error on invalidateCache', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'fail' }) });
    const { result } = renderHook(() => useCacheManagement(), { wrapper });
    await act(async () => {
      await result.current.actions.invalidateCache('bad-key');
    });
    expect(result.current.error).toBe('fail');
    expect(result.current.loading).toBe(false);
  });

  it('should invalidate all cache successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useCacheManagement(), { wrapper });
    await act(async () => {
      await result.current.actions.invalidateAllCache();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/cache/invalidate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ all: true }),
      })
    );
  });

  it('should handle error on invalidateAllCache', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'fail all' }) });
    const { result } = renderHook(() => useCacheManagement(), { wrapper });
    await act(async () => {
      await result.current.actions.invalidateAllCache();
    });
    expect(result.current.error).toBe('fail all');
    expect(result.current.loading).toBe(false);
  });

  it('should clear error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'fail' }) });
    const { result } = renderHook(() => useCacheManagement(), { wrapper });
    await act(async () => {
      await result.current.actions.invalidateCache('bad-key');
    });
    expect(result.current.error).toBe('fail');
    act(() => {
      result.current.actions.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it('should set loading state during request', async () => {
    let resolveFetch: (() => void) | undefined;
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => {
        resolveFetch = () => resolve({ ok: true });
      })
    );
    const { result } = renderHook(() => useCacheManagement(), { wrapper });
    act(() => {
      result.current.actions.invalidateCache('test-key');
    });
    expect(result.current.loading).toBe(true);
    resolveFetch!();
    // Wait for state update using waitFor
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
}); 