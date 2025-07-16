import { act, renderHook } from '@testing-library/react';

import { ConfigProvider } from '@/contexts/config-context';
import { TeamProvider } from '@/contexts/team-context';
import { TeamDataFetchingProvider } from '@/contexts/team-data-fetching-context';
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
        <TeamDataFetchingProvider>
          <TeamProvider>{children}</TeamProvider>
        </TeamDataFetchingProvider>
      </ConfigProvider>
    );
  }

  it('returns initial team data state', () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    expect(result.current.teams).toBeInstanceOf(Array);
    expect(result.current.activeTeam).toBeNull();
    expect(result.current.activeTeamId).toBeNull();
    expect(result.current.teamData).toBeNull();
    expect(result.current.teamStats).toBeNull();
    expect(typeof result.current.isLoadingTeams).toBe('boolean');
    expect(typeof result.current.isLoadingTeamData).toBe('boolean');
    expect(typeof result.current.isLoadingTeamStats).toBe('boolean');
    expect(result.current.teamsError).toBeNull();
    expect(result.current.teamDataError).toBeNull();
    expect(result.current.teamStatsError).toBeNull();
  });

  it('can add, set, refresh, update, and remove a team', async () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    
    // Wait for initial data to load
    await act(async () => {
      // Wait a bit for initial teams to load
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    // Add a team
    await act(async () => {
      await result.current.addTeam('t3', 'l3');
    });
    expect(result.current.teams).toHaveLength(3);
    // Set active team
    act(() => {
      result.current.setActiveTeam('1');
    });
    expect(result.current.activeTeamId).toBe('1');
    // Refresh team
    await act(async () => {
      await result.current.refreshTeam('1');
    });
    // Update team
    await act(async () => {
      await result.current.updateTeam('1');
    });
    // Remove team
    await act(async () => {
      await result.current.removeTeam('1');
    });
    expect(result.current.teams).toHaveLength(2);
  });

  it('clears errors', async () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.teamsError).toBeNull();
    expect(result.current.teamDataError).toBeNull();
    expect(result.current.teamStatsError).toBeNull();
  });

  // Removed the auto-refresh test, as options are no longer supported and all fetching is user-driven.
}); 