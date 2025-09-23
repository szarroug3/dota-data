/**
 * Tests for useTeamRefreshCore hook
 */

import { renderHook } from '@testing-library/react';

import type { TeamDataFetchingContextValue } from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import { processTeamMatchesAndUpdateTeam } from '@/hooks/team-operations-helpers';
import { useRefreshTeamCore } from '@/hooks/use-team-refresh-core';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';

// Mock the team operations helpers
jest.mock('@/hooks/team-operations-helpers', () => ({
  processTeamMatchesAndUpdateTeam: jest.fn(),
  seedOptimisticMatchesInMatchContext: jest.fn(),
  seedOptimisticTeamMatchesInTeamsMap: jest.fn(),
}));

// Mock dependencies
const mockTeamDataFetching: TeamDataFetchingContextValue = {
  fetchTeamData: jest.fn(),
  fetchLeagueData: jest.fn(),
  findTeamMatchesInLeague: jest.fn(),
} as any;

const mockMatchContext: MatchContextValue = {
  matches: new Map(),
  selectedMatchId: null,
  setSelectedMatchId: jest.fn(),
  isLoading: false,
  addMatch: jest.fn(),
  refreshMatch: jest.fn(),
  parseMatch: jest.fn(),
  removeMatch: jest.fn(),
  getMatch: jest.fn(),
  getMatches: jest.fn(),
  setMatches: jest.fn(),
  highPerformingHeroes: new Set(),
} as any;

const mockPlayerContext: PlayerContextValue = {
  players: new Map(),
  isLoading: false,
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
  getPlayer: jest.fn(),
  getPlayers: jest.fn(),
  setPlayers: jest.fn(),
} as any;

const mockHandleTeamSummaryOperation = jest.fn();

describe('useRefreshTeamCore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should refresh errored matches when team has matches with errors', async () => {
    const teams = new Map<string, TeamData>();
    const setTeams = jest.fn();
    const setTeamsForLoading = jest.fn();

    // Mock team data with errored matches
    const teamData: TeamData = {
      team: { id: 1, name: 'Test Team' },
      league: { id: 1, name: 'Test League' },
      timeAdded: new Date().toISOString(),
      matches: {
        123: {
          matchId: 123,
          result: 'won',
          duration: 1000,
          opponentName: 'Opponent',
          leagueId: '1',
          startTime: Date.now(),
          side: 'radiant',
          pickOrder: 'first',
          error: 'Match failed to load',
        },
        456: {
          matchId: 456,
          result: 'lost',
          duration: 2000,
          opponentName: 'Opponent 2',
          leagueId: '1',
          startTime: Date.now(),
          side: 'dire',
          pickOrder: 'second',
        },
      },
      manualMatches: {},
      manualPlayers: [],
      players: [],
      performance: {
        totalMatches: 2,
        totalWins: 1,
        totalLosses: 1,
        overallWinRate: 50,
        erroredMatches: 1,
        heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
        draftStats: {
          firstPickCount: 1,
          secondPickCount: 1,
          firstPickWinRate: 100,
          secondPickWinRate: 0,
          uniqueHeroesPicked: 0,
          uniqueHeroesBanned: 0,
          mostPickedHero: '',
          mostBannedHero: '',
        },
        currentWinStreak: 0,
        currentLoseStreak: 0,
        averageMatchDuration: 1500,
        averageKills: 0,
        averageDeaths: 0,
        averageGold: 0,
        averageExperience: 0,
      },
    };

    teams.set('1-1', teamData);

    // Mock match context to return matches with errors
    mockMatchContext.getMatch = jest.fn((matchId: number) => {
      if (matchId === 123) {
        return {
          id: 123,
          error: 'Match failed to load',
        } as any;
      }
      return null;
    });

    // Mock team data fetching
    mockTeamDataFetching.findTeamMatchesInLeague = jest.fn().mockReturnValue([
      { matchId: 123, side: 'radiant' },
      { matchId: 456, side: 'dire' },
    ]);

    // Mock handleTeamSummaryOperation to return successful team data
    mockHandleTeamSummaryOperation.mockResolvedValue(teamData);

    // Mock processTeamMatchesAndUpdateTeam
    (processTeamMatchesAndUpdateTeam as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useRefreshTeamCore(
        teams,
        setTeams,
        setTeamsForLoading,
        mockTeamDataFetching,
        mockMatchContext,
        mockPlayerContext,
        mockHandleTeamSummaryOperation,
      ),
    );

    // Call refreshTeam
    await result.current(1, 1);

    expect(mockMatchContext.setMatches).toHaveBeenCalled();
    expect(processTeamMatchesAndUpdateTeam).toHaveBeenCalled();
  });

  it('should not refresh matches when no errors are present', async () => {
    const teams = new Map<string, TeamData>();
    const setTeams = jest.fn();
    const setTeamsForLoading = jest.fn();

    // Mock team data without errored matches
    const teamData: TeamData = {
      team: { id: 1, name: 'Test Team' },
      league: { id: 1, name: 'Test League' },
      timeAdded: new Date().toISOString(),
      matches: {
        123: {
          matchId: 123,
          result: 'won',
          duration: 1000,
          opponentName: 'Opponent',
          leagueId: '1',
          startTime: Date.now(),
          side: 'radiant',
          pickOrder: 'first',
        },
      },
      manualMatches: {},
      manualPlayers: [],
      players: [],
      performance: {
        totalMatches: 1,
        totalWins: 1,
        totalLosses: 0,
        overallWinRate: 100,
        erroredMatches: 0,
        heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
        draftStats: {
          firstPickCount: 1,
          secondPickCount: 0,
          firstPickWinRate: 100,
          secondPickWinRate: 0,
          uniqueHeroesPicked: 0,
          uniqueHeroesBanned: 0,
          mostPickedHero: '',
          mostBannedHero: '',
        },
        currentWinStreak: 1,
        currentLoseStreak: 0,
        averageMatchDuration: 1000,
        averageKills: 0,
        averageDeaths: 0,
        averageGold: 0,
        averageExperience: 0,
      },
    };

    teams.set('1-1', teamData);

    // Mock match context to return matches without errors
    mockMatchContext.getMatch = jest.fn((matchId: number) => {
      if (matchId === 123) {
        return {
          id: 123,
          // No error property
        } as any;
      }
      return null;
    });

    // Mock team data fetching
    mockTeamDataFetching.findTeamMatchesInLeague = jest.fn().mockReturnValue([{ matchId: 123, side: 'radiant' }]);

    // Mock handleTeamSummaryOperation to return successful team data
    mockHandleTeamSummaryOperation.mockResolvedValue(teamData);

    // Mock processTeamMatchesAndUpdateTeam
    (processTeamMatchesAndUpdateTeam as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useRefreshTeamCore(
        teams,
        setTeams,
        setTeamsForLoading,
        mockTeamDataFetching,
        mockMatchContext,
        mockPlayerContext,
        mockHandleTeamSummaryOperation,
      ),
    );

    // Call refreshTeam
    await result.current(1, 1);

    expect(processTeamMatchesAndUpdateTeam).toHaveBeenCalled();
  });

  it('should set and clear loading state correctly', async () => {
    const teams = new Map<string, TeamData>();
    const setTeams = jest.fn();
    const setTeamsForLoading = jest.fn();

    // Mock team data
    const teamData: TeamData = {
      team: { id: 1, name: 'Test Team' },
      league: { id: 1, name: 'Test League' },
      timeAdded: new Date().toISOString(),
      matches: {},
      manualMatches: {},
      manualPlayers: [],
      players: [],
      performance: {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        overallWinRate: 0,
        erroredMatches: 0,
        heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
        draftStats: {
          firstPickCount: 0,
          secondPickCount: 0,
          firstPickWinRate: 0,
          secondPickWinRate: 0,
          uniqueHeroesPicked: 0,
          uniqueHeroesBanned: 0,
          mostPickedHero: '',
          mostBannedHero: '',
        },
        currentWinStreak: 0,
        currentLoseStreak: 0,
        averageMatchDuration: 0,
        averageKills: 0,
        averageDeaths: 0,
        averageGold: 0,
        averageExperience: 0,
      },
    };

    teams.set('1-1', teamData);

    // Mock team data fetching
    mockTeamDataFetching.findTeamMatchesInLeague = jest.fn().mockReturnValue([]);

    // Mock handleTeamSummaryOperation to return successful team data
    mockHandleTeamSummaryOperation.mockResolvedValue(teamData);

    // Mock processTeamMatchesAndUpdateTeam
    (processTeamMatchesAndUpdateTeam as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useRefreshTeamCore(
        teams,
        setTeams,
        setTeamsForLoading,
        mockTeamDataFetching,
        mockMatchContext,
        mockPlayerContext,
        mockHandleTeamSummaryOperation,
      ),
    );

    // Call refreshTeam
    await result.current(1, 1);

    // Verify that loading state was set and cleared
    expect(setTeamsForLoading).toHaveBeenCalledWith(expect.any(Function));
    expect(setTeamsForLoading).toHaveBeenCalledTimes(2); // Once for set, once for clear
  });
});
