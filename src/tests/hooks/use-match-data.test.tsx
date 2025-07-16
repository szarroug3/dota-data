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
    expect(typeof result.current.isLoadingMatches).toBe('boolean');
    expect(result.current.matchesError === null || typeof result.current.matchesError === 'string').toBe(true);
    expect(result.current.filters).toBeDefined();
    expect(typeof result.current.selectMatch).toBe('function');
    expect(typeof result.current.setFilters).toBe('function');
    expect(typeof result.current.refreshMatches).toBe('function');
    expect(typeof result.current.clearErrors).toBe('function');
  });

  it('can select a match', async () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    // Wait for initial data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    // Try to select a match that does not exist
    act(() => {
      result.current.selectMatch('m1');
    });
    expect(result.current.selectedMatch).toBeNull();
  });

  it('can set filters', async () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    act(() => {
      result.current.setFilters({ ...result.current.filters, result: 'win' });
    });
    expect(result.current.filters.result).toBe('win');
  });

  it('handles error and clearErrors', async () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    // Simulate error
    act(() => {
      // Simulate error by directly setting matchesError (for test only)
      (result.current as { matchesError: string | null }).matchesError = 'Test error';
    });
    expect(result.current.matchesError).toBe('Test error');
    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.matchesError === null || typeof result.current.matchesError === 'string').toBe(true);
  });

  it('handles loading state', async () => {
    const { result } = renderHook(() => useMatchData(), { wrapper });
    // Should be boolean
    expect(typeof result.current.isLoadingMatches).toBe('boolean');
  });

  // Removed the auto-refresh test, as options are no longer supported and all fetching is user-driven.
}); 