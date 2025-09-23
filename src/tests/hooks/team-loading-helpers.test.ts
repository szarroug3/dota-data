/**
 * Team Loading Helpers Tests
 *
 * Tests for the team loading helper functions that determine when teams
 * are fully loaded, including proper handling of errors.
 */

import { areAllTeamMatchesLoaded, areAllTeamPlayersLoaded, isTeamFullyLoaded } from '@/hooks/team-loading-helpers';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockMatch = (id: number, isLoading = false, error?: string) => ({
  id,
  date: '2024-01-01T00:00:00.000Z',
  duration: 1800,
  radiant: { id: 12345, name: 'Radiant Team' },
  dire: { id: 67890, name: 'Dire Team' },
  draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
  players: { radiant: [], dire: [] },
  statistics: {
    radiantScore: 0,
    direScore: 0,
    goldAdvantage: { times: [], radiantGold: [], direGold: [] },
    experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
  },
  events: [],
  result: 'radiant' as const,
  isLoading,
  error,
});

const createMockPlayer = (accountId: number, isLoading = false, error?: string) => ({
  accountId,
  playerName: `Player ${accountId}`,
  isLoading,
  error,
});

const createMockMatchContext = (matches: Map<number, any>): MatchContextValue => ({
  matches,
  selectedMatchId: null,
  setSelectedMatchId: jest.fn(),
  isLoading: false,
  addMatch: jest.fn(),
  refreshMatch: jest.fn(),
  parseMatch: jest.fn(),
  removeMatch: jest.fn(),
  getMatch: (id: number) => matches.get(id),
  getMatches: jest.fn(),
  setMatches: jest.fn(),
  matchDataFetching: {
    fetchMatchData: jest.fn(),
    clearMatchCache: jest.fn(),
    clearAllCache: jest.fn(),
    isMatchCached: jest.fn(),
  },
  highPerformingHeroes: new Set(),
});

const createMockPlayerContext = (players: Map<number, any>): PlayerContextValue => ({
  players,
  selectedPlayerId: null,
  setSelectedPlayerId: jest.fn(),
  isLoading: false,
  addPlayer: jest.fn(),
  refreshPlayer: jest.fn(),
  removePlayer: jest.fn(),
  getPlayer: (id: number) => players.get(id),
  getPlayers: jest.fn(),
});

// ============================================================================
// TESTS
// ============================================================================

describe('areAllTeamMatchesLoaded', () => {
  it('should return true when no matches are provided', () => {
    const matchContext = createMockMatchContext(new Map());
    expect(areAllTeamMatchesLoaded(12345, [], matchContext)).toBe(true);
  });

  it('should return true when all matches are successfully loaded', () => {
    const matches = new Map([
      [1, createMockMatch(1, false)],
      [2, createMockMatch(2, false)],
    ]);
    const matchContext = createMockMatchContext(matches);
    expect(areAllTeamMatchesLoaded(12345, [1, 2], matchContext)).toBe(true);
  });

  it('should return true when all matches have errors (failed to load)', () => {
    const matches = new Map([
      [1, createMockMatch(1, false, 'Failed to load match 1')],
      [2, createMockMatch(2, false, 'Failed to load match 2')],
    ]);
    const matchContext = createMockMatchContext(matches);
    expect(areAllTeamMatchesLoaded(12345, [1, 2], matchContext)).toBe(true);
  });

  it('should return false when any match is still loading', () => {
    const matches = new Map([
      [1, createMockMatch(1, false)],
      [2, createMockMatch(2, true)], // Still loading
    ]);
    const matchContext = createMockMatchContext(matches);
    expect(areAllTeamMatchesLoaded(12345, [1, 2], matchContext)).toBe(false);
  });

  it('should return false when any match does not exist', () => {
    const matches = new Map([
      [1, createMockMatch(1, false)],
      // Match 2 doesn't exist
    ]);
    const matchContext = createMockMatchContext(matches);
    expect(areAllTeamMatchesLoaded(12345, [1, 2], matchContext)).toBe(false);
  });

  it('should return true when some matches have errors and others are loaded', () => {
    const matches = new Map([
      [1, createMockMatch(1, false)], // Successfully loaded
      [2, createMockMatch(2, false, 'Failed to load match 2')], // Failed to load
    ]);
    const matchContext = createMockMatchContext(matches);
    expect(areAllTeamMatchesLoaded(12345, [1, 2], matchContext)).toBe(true);
  });
});

describe('areAllTeamPlayersLoaded', () => {
  it('should return true when all players are successfully loaded', () => {
    const players = new Map([[111, createMockPlayer(111, false)]]);
    const playerContext = createMockPlayerContext(players);

    expect(areAllTeamPlayersLoaded(12345, [111], playerContext)).toBe(true);
  });

  it('should return true when all players have errors (failed to load)', () => {
    const players = new Map([[111, createMockPlayer(111, false, 'Failed to load player')]]);
    const playerContext = createMockPlayerContext(players);

    expect(areAllTeamPlayersLoaded(12345, [111], playerContext)).toBe(true);
  });

  it('should return false when any player is still loading', () => {
    const players = new Map([
      [111, createMockPlayer(111, true)], // Still loading
    ]);
    const playerContext = createMockPlayerContext(players);

    expect(areAllTeamPlayersLoaded(12345, [111], playerContext)).toBe(false);
  });
});

describe('isTeamFullyLoaded', () => {
  it('should return true when both matches and players are loaded', () => {
    const matches = new Map([[1, createMockMatch(1, false)]]);
    const players = new Map([[111, createMockPlayer(111, false)]]);
    const matchContext = createMockMatchContext(matches);
    const playerContext = createMockPlayerContext(players);

    expect(isTeamFullyLoaded(12345, [1], matchContext, playerContext)).toBe(true);
  });

  it('should return false when matches are not loaded', () => {
    const matches = new Map([
      [1, createMockMatch(1, true)], // Still loading
    ]);
    const players = new Map([[111, createMockPlayer(111, false)]]);
    const matchContext = createMockMatchContext(matches);
    const playerContext = createMockPlayerContext(players);

    expect(isTeamFullyLoaded(12345, [1], matchContext, playerContext)).toBe(false);
  });

  it('should return true when matches have errors but players are loaded', () => {
    const matches = new Map([[1, createMockMatch(1, false, 'Failed to load match')]]);
    const players = new Map([[111, createMockPlayer(111, false)]]);
    const matchContext = createMockMatchContext(matches);
    const playerContext = createMockPlayerContext(players);

    expect(isTeamFullyLoaded(12345, [1], matchContext, playerContext)).toBe(true);
  });
});

describe('Team Performance Calculation Logic', () => {
  it('should calculate 0 matches, 0% win rate when no matches are successfully loaded', () => {
    // Test the logic that would be used in the team loading watcher
    const matchesArray: any[] = []; // Empty array - no successfully loaded matches

    const totalWins = matchesArray.filter((m) => m.result === 'won').length;
    const totalLosses = matchesArray.filter((m) => m.result === 'lost').length;
    const averageMatchDuration =
      matchesArray.reduce((sum: number, m) => sum + (m.duration || 0), 0) / (matchesArray.length || 1);

    expect(matchesArray).toHaveLength(0);
    expect(totalWins).toBe(0);
    expect(totalLosses).toBe(0);
    expect(averageMatchDuration).toBe(0);

    const overallWinRate = matchesArray.length > 0 ? (totalWins / matchesArray.length) * 100 : 0;
    expect(overallWinRate).toBe(0);
  });

  it('should calculate correct stats when some matches are successfully loaded', () => {
    // Test the logic with some successfully loaded matches
    const matchesArray = [
      { result: 'won', duration: 1800 },
      { result: 'lost', duration: 2100 },
      { result: 'won', duration: 1650 },
    ];

    const totalWins = matchesArray.filter((m) => m.result === 'won').length;
    const totalLosses = matchesArray.filter((m) => m.result === 'lost').length;
    const averageMatchDuration =
      matchesArray.reduce((sum: number, m) => sum + (m.duration || 0), 0) / (matchesArray.length || 1);

    expect(matchesArray).toHaveLength(3);
    expect(totalWins).toBe(2);
    expect(totalLosses).toBe(1);
    expect(averageMatchDuration).toBe(1850); // (1800 + 2100 + 1650) / 3

    const overallWinRate = matchesArray.length > 0 ? (totalWins / matchesArray.length) * 100 : 0;
    expect(overallWinRate).toBe(66.66666666666666); // 2/3 * 100
  });
});
