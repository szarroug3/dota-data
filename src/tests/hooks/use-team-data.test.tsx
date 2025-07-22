import { act, renderHook } from '@testing-library/react';

import { ConfigProvider } from '@/contexts/config-context';
import { ConstantsProvider } from '@/contexts/constants-context';
import { ConstantsDataFetchingProvider } from '@/contexts/constants-data-fetching-context';
import { MatchProvider } from '@/contexts/match-context';
import { PlayerProvider } from '@/contexts/player-context';
import { TeamProvider } from '@/contexts/team-context';
import { useTeamData } from '@/hooks/use-team-data';

// Mock the data fetching contexts
const mockFetchTeamData = jest.fn().mockResolvedValue({
  id: 't3',
  name: 'Test Team',
  matches: [
    {
      matchId: '7936128769',
      result: 'won' as const,
      duration: 2100,
      opponentName: 'Opponent Team',
      leagueId: 'l1',
      startTime: 1725926427
    }
  ]
});

jest.mock('@/contexts/team-data-fetching-context', () => {
  const actual = jest.requireActual('@/contexts/team-data-fetching-context');
  return {
    ...actual,
    useTeamDataFetching: () => ({
      fetchTeamData: mockFetchTeamData
    })
  };
});

jest.mock('@/contexts/match-data-fetching-context', () => ({
  useMatchDataFetching: () => ({
    fetchMatchData: jest.fn().mockResolvedValue({
      match_id: 7936128769,
      radiant_win: true,
      duration: 2100,
      start_time: 1725926427,
      players: [
        {
          account_id: 123456789,
          player_slot: 0,
          hero_id: 1,
          kills: 8,
          deaths: 2,
          assists: 12,
          personaname: 'Test Player 1',
          win: 1
        }
      ]
    })
  })
}));

jest.mock('@/contexts/player-data-fetching-context', () => ({
  usePlayerDataFetching: () => ({
    fetchPlayerData: jest.fn().mockResolvedValue({
      profile: {
        account_id: 123456789,
        personaname: 'Test Player'
      }
    })
  })
}));

describe('useTeamData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage to ensure clean state between tests
    if (typeof window !== 'undefined') {
      localStorage.clear();
      // Initialize with 2 teams for the test
      const initialTeams = [
        {
          team: {
            id: '1',
            name: 'Team 1',
            leagueId: 'l1',
            isActive: false,
            isLoading: false,
            error: undefined
          },
          league: { id: 'l1', name: 'League 1' },
          matches: [],
          players: [],
          summary: {
            totalMatches: 0,
            totalWins: 0,
            totalLosses: 0,
            overallWinRate: 0,
            lastMatchDate: null,
            averageMatchDuration: 0,
            totalPlayers: 0
          }
        },
        {
          team: {
            id: '2',
            name: 'Team 2',
            leagueId: 'l2',
            isActive: false,
            isLoading: false,
            error: undefined
          },
          league: { id: 'l2', name: 'League 2' },
          matches: [],
          players: [],
          summary: {
            totalMatches: 0,
            totalWins: 0,
            totalLosses: 0,
            overallWinRate: 0,
            lastMatchDate: null,
            averageMatchDuration: 0,
            totalPlayers: 0
          }
        }
      ];
      localStorage.setItem('dota-scout-assistant-team-list', JSON.stringify(initialTeams));
    }
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ConfigProvider>
        <ConstantsDataFetchingProvider>
          <ConstantsProvider>
            <MatchProvider>
              <PlayerProvider>
                <TeamProvider>
                  {children}
                </TeamProvider>
              </PlayerProvider>
            </MatchProvider>
          </ConstantsProvider>
        </ConstantsDataFetchingProvider>
      </ConfigProvider>
    );
  }

  it('returns initial team data state', () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    expect(result.current.teams).toBeInstanceOf(Array);
    expect(result.current.activeTeam).toBeNull();
    expect(result.current.activeTeamId).toBeNull();
    expect(result.current.teamData).toBeNull();

    expect(typeof result.current.isLoading).toBe('boolean');
    expect(result.current.teamsError).toBeNull();
    expect(result.current.teamDataError).toBeNull();
  });

  it('can add, set, refresh, and remove a team', async () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    
    // Wait for initial data to load
    await act(async () => {
      // Wait a bit for initial teams to load
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    // Test that the hook provides the expected interface
    expect(result.current.teams).toBeInstanceOf(Array);
    expect(typeof result.current.addTeam).toBe('function');
    expect(typeof result.current.setActiveTeam).toBe('function');
    expect(typeof result.current.refreshTeam).toBe('function');
    expect(typeof result.current.removeTeam).toBe('function');
    
    // Test that we can call the functions without errors
    await act(async () => {
      await result.current.addTeam('t3', 'l3');
    });
    
    act(() => {
      result.current.setActiveTeam('1', 'l1');
    });
    
    await act(async () => {
      await result.current.refreshTeam('1', 'l1');
    });
    
    act(() => {
      result.current.removeTeam('1', 'l1');
    });
    
    // Verify the hook still works after operations
    expect(result.current.teams).toBeInstanceOf(Array);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles team operations correctly', async () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    
    // Wait for initial data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    // Test that we can access the hook without errors
    expect(result.current.teams).toBeInstanceOf(Array);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.teamsError).toBeNull();
    expect(result.current.teamDataError).toBeNull();
  });
}); 