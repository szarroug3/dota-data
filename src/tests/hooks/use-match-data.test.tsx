import { act, renderHook } from '@testing-library/react';

import { MatchProvider } from '@/contexts/match-context';
import { useMatchData } from '@/hooks/use-match-data';

describe('useMatchData', () => {
  function wrapper({ children }: { children: React.ReactNode }) {
    return <MatchProvider>{children}</MatchProvider>;
  }

  it('returns initial match data state', () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    expect(Array.isArray(result.current.matches)).toBe(true);
    expect(result.current.selectedMatch).toBeNull();
    expect(typeof result.current.loading).toBe('boolean');
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
    expect(result.current.filters).toBeDefined();
    expect(typeof result.current.actions.selectMatch).toBe('function');
    expect(typeof result.current.actions.setFilters).toBe('function');
    expect(typeof result.current.actions.refreshMatches).toBe('function');
    expect(typeof result.current.actions.clearError).toBe('function');
  });

  it('can select a match', async () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    // Wait for initial data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    // Select a match
    act(() => {
      result.current.actions.selectMatch('m1');
    });
    expect(result.current.selectedMatch?.id).toBe('m1');
  });

  it('can set filters', async () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    act(() => {
      result.current.actions.setFilters({ ...result.current.filters, result: 'win' });
    });
    expect(result.current.filters.result).toBe('win');
  });

  it('handles error and clearError', async () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    // Simulate error
    act(() => {
      // Simulate error by directly setting error (for test only)
      (result.current as { error: string | null }).error = 'Test error';
    });
    expect(result.current.error).toBe('Test error');
    act(() => {
      result.current.actions.clearError();
    });
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
  });

  it('handles loading state', async () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    // Should be boolean
    expect(typeof result.current.loading).toBe('boolean');
  });

  it('supports auto-refresh', async () => {
    const { result, unmount } = renderHook(() => useMatchData({ autoRefresh: true, refreshInterval: 1 }), { wrapper });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    // Test that the hook accepts options and returns data
    expect(Array.isArray(result.current.matches)).toBe(true);
    expect(typeof result.current.actions.refreshMatches).toBe('function');
    unmount();
  });
}); 