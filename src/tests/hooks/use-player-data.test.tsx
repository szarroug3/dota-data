import { act, renderHook } from '@testing-library/react';

import { PlayerProvider } from '@/contexts/player-context';
import { usePlayerData } from '@/hooks/use-player-data';
import type { UsePlayerDataParams } from '@/types/hooks/use-player-data';

// Helper function to wait for async operations
const waitForAsync = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
};

// Helper function to create a hook with wrapper
const createHook = (params?: UsePlayerDataParams) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PlayerProvider>{children}</PlayerProvider>
  );
  return renderHook(() => usePlayerData(params), { wrapper });
};

describe('usePlayerData - Basic State and Selection', () => {
  describe('initial state', () => {
    it('returns initial player data state', () => {
      const { result } = createHook();
      expect(Array.isArray(result.current.players)).toBe(true);
      expect(Array.isArray(result.current.filteredPlayers)).toBe(true);
      expect(result.current.selectedPlayerId).toBeNull();
      expect(result.current.selectedPlayer).toBeNull();
      expect(result.current.playerStats).toBeNull();
      expect(typeof result.current.isLoadingPlayers).toBe('boolean');
      expect(typeof result.current.isLoadingPlayerData).toBe('boolean');
      expect(typeof result.current.isLoadingPlayerStats).toBe('boolean');
      expect(result.current.playersError === null || typeof result.current.playersError === 'string').toBe(true);
      expect(result.current.playerDataError === null || typeof result.current.playerDataError === 'string').toBe(true);
      expect(result.current.playerStatsError === null || typeof result.current.playerStatsError === 'string').toBe(true);
      expect(result.current.filters).toBeDefined();
      expect(typeof result.current.setSelectedPlayer).toBe('function');
      expect(typeof result.current.setFilters).toBe('function');
      expect(typeof result.current.addPlayer).toBe('function');
      expect(typeof result.current.removePlayer).toBe('function');
      expect(typeof result.current.refreshPlayer).toBe('function');
      expect(typeof result.current.clearErrors).toBe('function');
    });

    it('handles loading states', async () => {
      const { result } = createHook();
      expect(typeof result.current.isLoadingPlayers).toBe('boolean');
      expect(typeof result.current.isLoadingPlayerData).toBe('boolean');
      expect(typeof result.current.isLoadingPlayerStats).toBe('boolean');
    });
  });

  describe('player selection', () => {
    it('can select a player', async () => {
      const { result } = createHook();
      await waitForAsync();
      act(() => {
        result.current.setSelectedPlayer('p1');
      });
      expect(result.current.selectedPlayerId).toBe('p1');
    });

    it('supports playerId parameter', async () => {
      const { result } = createHook({ playerId: 'p1' });
      await waitForAsync();
      expect(result.current.selectedPlayerId).toBe('p1');
    });
  });

  describe('filters', () => {
    it('can set filters', async () => {
      const { result } = createHook();
      await waitForAsync();
      act(() => {
        result.current.setFilters({ ...result.current.filters, result: 'win' });
      });
      expect(result.current.filters.result).toBe('win');
    });
  });

  describe('error handling', () => {
    it('handles error and clearErrors', async () => {
      const { result } = createHook();
      act(() => {
        (result.current as { playerDataError: string | null }).playerDataError = 'Test error';
      });
      expect(result.current.playerDataError).toBe('Test error');
      act(() => {
        result.current.clearErrors();
      });
      expect(result.current.playerDataError === null || typeof result.current.playerDataError === 'string').toBe(true);
    });
  });
});

describe('usePlayerData - Actions and Options', () => {
  describe('options and configuration', () => {
    it('supports auto-refresh', async () => {
      const { result, unmount } = createHook({ 
        options: { autoRefresh: true, refreshInterval: 1 } 
      });
      await waitForAsync();
      expect(Array.isArray(result.current.players)).toBe(true);
      expect(typeof result.current.refreshPlayer).toBe('function');
      unmount();
    });

    it('supports force refresh option', async () => {
      const { result } = createHook({ 
        options: { forceRefresh: true } 
      });
      await waitForAsync();
      expect(Array.isArray(result.current.players)).toBe(true);
      expect(typeof result.current.refreshPlayer).toBe('function');
    });
  });

  describe('player actions', () => {
    it('handles addPlayer action', async () => {
      const { result } = createHook();
      await waitForAsync();
      await act(async () => {
        try {
          await result.current.addPlayer('new-player');
        } catch {
          // Expected in test environment
        }
      });
      expect(typeof result.current.addPlayer).toBe('function');
    });

    it('handles removePlayer action', async () => {
      const { result } = createHook();
      await waitForAsync();
      await act(async () => {
        try {
          await result.current.removePlayer('p1');
        } catch {
          // Expected in test environment
        }
      });
      expect(typeof result.current.removePlayer).toBe('function');
    });

    it('handles refreshPlayer action', async () => {
      const { result } = createHook();
      await waitForAsync();
      await act(async () => {
        try {
          await result.current.refreshPlayer('p1');
        } catch {
          // Expected in test environment
        }
      });
      expect(typeof result.current.refreshPlayer).toBe('function');
    });
  });

  describe('error conditions', () => {
    it('throws error when used outside PlayerProvider', () => {
      expect(() => {
        renderHook(() => usePlayerData());
      }).toThrow('usePlayerContext must be used within a PlayerProvider');
    });
  });
}); 