import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
// @ts-expect-error - Node.js TextDecoder is compatible with browser TextDecoder
global.TextDecoder = TextDecoder;

/**
 * Player Data Fetching Context Tests
 * 
 * Tests the player data fetching context functionality including:
 * - Cache management
 * - Error handling
 * - API interactions
 * - Force fetch functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import fetch from 'node-fetch';

import { PlayerDataFetchingProvider, usePlayerDataFetching } from '@/contexts/player-data-fetching-context';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// @ts-expect-error - node-fetch v2 types are compatible with global fetch
global.fetch = fetch;
// @ts-expect-error - node-fetch v2 types are compatible with global Request
global.Request = fetch.Request;
// @ts-expect-error - node-fetch v2 types are compatible with global Response
global.Response = fetch.Response;

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPlayer: OpenDotaPlayerComprehensive = {
  profile: {
    profile: {
      account_id: 123456789,
      personaname: 'TestPlayer',
      name: 'Test Player',
      plus: true,
      cheese: 0,
      steamid: '76561198012345678',
      avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/default.jpg',
      avatarmedium: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/default_medium.jpg',
      avatarfull: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/default_full.jpg',
      profileurl: 'https://steamcommunity.com/id/testplayer',
      last_login: '2024-01-01T00:00:00.000Z',
      loccountrycode: 'US',
      status: 'online',
      fh_unavailable: false,
      is_contributor: false,
      is_subscriber: false
    },
    rank_tier: 80,
    leaderboard_rank: 1000
  },
  counts: {
    leaver_status: { 0: { games: 100, win: 60 } },
    game_mode: { 1: { games: 50, win: 30 }, 2: { games: 50, win: 30 } },
    lobby_type: { 7: { games: 100, win: 60 } },
    lane_role: { 1: { games: 40, win: 24 }, 2: { games: 30, win: 18 }, 3: { games: 30, win: 18 } },
    region: { 1: { games: 100, win: 60 } },
    patch: { 50: { games: 100, win: 60 } }
  },
  heroes: [
    {
      hero_id: 1,
      last_played: 1640995200,
      games: 20,
      win: 12,
      with_games: 5,
      with_win: 3,
      against_games: 5,
      against_win: 2
    }
  ],
  rankings: [
    {
      hero_id: 1,
      score: 85.5,
      percent_rank: 0.75,
      card: 1
    }
  ],
  ratings: [
    {
      account_id: 123456789,
      match_id: 8054301932,
      solo_competitive_rank: 5000,
      competitive_rank: 6000,
      time: '2024-01-01T00:00:00.000Z'
    }
  ],
  recentMatches: [
    {
      match_id: 8054301932,
      player_slot: 0,
      radiant_win: true,
      duration: 1800,
      game_mode: 1,
      lobby_type: 7,
      hero_id: 1,
      start_time: 1640995200,
      version: 50,
      kills: 8,
      deaths: 2,
      assists: 12,
      skill: 2,
      average_rank: 80,
      xp_per_min: 720,
      gold_per_min: 650,
      hero_damage: 25000,
      tower_damage: 5000,
      hero_healing: 0,
      last_hits: 185,
      lane: 1,
      lane_role: 1,
      is_roaming: false,
      cluster: 1,
      leaver_status: 0,
      party_size: 1
    }
  ],
  totals: {
    np: 100,
    fantasy: 50,
    cosmetic: 25,
    all_time: 1000,
    ranked: 800,
    turbo: 200,
    matched: 1000
  },
  wl: {
    win: 600,
    lose: 400
  },
  wardMap: {
    obs: { '1': { '1': 10 } },
    sen: { '1': { '1': 5 } }
  }
};

// ============================================================================
// MSW SERVER SETUP
// ============================================================================

const server = setupServer(
  // Success case
  rest.get('/api/players/123456789', (req, res, ctx) => {
    return res(ctx.json(mockPlayer));
  }) as any,
  
  // Player not found
  rest.get('/api/players/999999999', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Player not found' }));
  }) as any,
  
  // Server error
  rest.get('/api/players/500000000', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
  }) as any
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ============================================================================
// TEST COMPONENT
// ============================================================================

const TestComponent = () => {
  const { 
    fetchPlayerData, 
    clearPlayerCache, 
    clearAllCache,
    clearPlayerError, 
    clearAllErrors,
    isPlayerCached, 
    getPlayerError
  } = usePlayerDataFetching();
  
  const handleFetchPlayer = async () => {
    const result = await fetchPlayerData('123456789');
    return result;
  };
  
  const handleFetchPlayerForce = async () => {
    const result = await fetchPlayerData('123456789', true);
    return result;
  };
  
  const handleFetchPlayerError = async () => {
    const result = await fetchPlayerData('999999999');
    return result;
  };
  
  const handleFetchServerError = async () => {
    const result = await fetchPlayerData('500000000');
    return result;
  };
  
  return (
    <div>
      <div data-testid="player-error">{getPlayerError('123456789') || getPlayerError('999999999') || getPlayerError('500000000') || 'no-error'}</div>
      <div data-testid="player-cached">{isPlayerCached('123456789').toString()}</div>
      <button data-testid="fetch-player" onClick={handleFetchPlayer}>Fetch Player</button>
      <button data-testid="fetch-player-force" onClick={handleFetchPlayerForce}>Force Fetch Player</button>
      <button data-testid="fetch-player-error" onClick={handleFetchPlayerError}>Fetch Player Error</button>
      <button data-testid="fetch-server-error" onClick={handleFetchServerError}>Fetch Server Error</button>
      <button data-testid="clear-player-cache" onClick={() => clearPlayerCache('123456789')}>Clear Player Cache</button>
      <button data-testid="clear-all-cache" onClick={clearAllCache}>Clear All Cache</button>
      <button data-testid="clear-player-error" onClick={() => clearPlayerError('999999999')}>Clear Player Error</button>
      <button data-testid="clear-all-errors" onClick={clearAllErrors}>Clear All Errors</button>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('PlayerDataFetchingContext', () => {
  beforeEach(() => {
    render(
      <PlayerDataFetchingProvider>
        <TestComponent />
      </PlayerDataFetchingProvider>
    );
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(screen.getByTestId('player-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('player-cached')).toHaveTextContent('false');
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch player data successfully', async () => {
      const fetchButton = screen.getByTestId('fetch-player');
      await waitFor(() => fetchButton.click());
      
      // Should complete successfully
      await waitFor(() => {
        expect(screen.getByTestId('player-error')).toHaveTextContent('no-error');
      });
      
      // Should be cached after successful fetch
      expect(screen.getByTestId('player-cached')).toHaveTextContent('true');
    });

    it('should return cached data on subsequent fetches', async () => {
      // First fetch
      const fetchButton = screen.getByTestId('fetch-player');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('player-error')).toHaveTextContent('no-error');
      });
      
      // Second fetch should use cache
      fetchButton.click();
      
      // Should return immediately and still be cached
      expect(screen.getByTestId('player-cached')).toHaveTextContent('true');
    });

    it('should force fetch when force parameter is true', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-player');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('player-cached')).toHaveTextContent('true');
      });
      
      // Force fetch should still work
      const forceFetchButton = screen.getByTestId('fetch-player-force');
      await waitFor(() => forceFetchButton.click());
      
      // Should still be cached after force fetch
      expect(screen.getByTestId('player-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('player-error')).toHaveTextContent('no-error');
    });
  });

  describe('Error Handling', () => {
    it('should handle player not found errors', async () => {
      const fetchButton = screen.getByTestId('fetch-player-error');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('player-error')).toHaveTextContent('Player not found');
      });
      
      // Should not be cached after error
      expect(screen.getByTestId('player-cached')).toHaveTextContent('false');
    });

    it('should handle server errors', async () => {
      const fetchButton = screen.getByTestId('fetch-server-error');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('player-error')).toHaveTextContent('Internal server error');
      });
      
      // Should not be cached after error
      expect(screen.getByTestId('player-cached')).toHaveTextContent('false');
    });
  });

  describe('Cache Management', () => {
    it('should clear specific player cache', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-player');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('player-cached')).toHaveTextContent('true');
      });
      
      // Clear specific cache
      const clearButton = screen.getByTestId('clear-player-cache');
      await waitFor(() => clearButton.click());
      
      // Should not be cached anymore
      await waitFor(() => {
        expect(screen.getByTestId('player-cached')).toHaveTextContent('false');
      });
    });

    it('should clear all cache', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-player');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('player-cached')).toHaveTextContent('true');
      });
      
      // Clear all cache
      const clearAllButton = screen.getByTestId('clear-all-cache');
      await waitFor(() => clearAllButton.click());
      
      // Should not be cached anymore
      await waitFor(() => {
        expect(screen.getByTestId('player-cached')).toHaveTextContent('false');
      });
    });
  });

  describe('Error Management', () => {
    it('should clear specific player error', async () => {
      // First fetch to create error
      const fetchButton = screen.getByTestId('fetch-player-error');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('player-error')).toHaveTextContent('Player not found');
      });
      
      // Clear specific error
      const clearErrorButton = screen.getByTestId('clear-player-error');
      await waitFor(() => clearErrorButton.click());
      
      // Should not have error anymore
      await waitFor(() => {
        expect(screen.getByTestId('player-error')).toHaveTextContent('no-error');
      });
    });

    it('should clear all errors', async () => {
      // First fetch to create error
      const fetchButton = screen.getByTestId('fetch-player-error');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('player-error')).toHaveTextContent('Player not found');
      });
      
      // Clear all errors
      const clearAllErrorsButton = screen.getByTestId('clear-all-errors');
      await waitFor(() => clearAllErrorsButton.click());
      
      // Should not have error anymore
      await waitFor(() => {
        expect(screen.getByTestId('player-error')).toHaveTextContent('no-error');
      });
    });
  });

  describe('Context Provider', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('usePlayerDataFetching must be used within a PlayerDataFetchingProvider');

      consoleSpy.mockRestore();
    });
  });
}); 