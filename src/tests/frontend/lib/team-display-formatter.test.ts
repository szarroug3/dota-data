import type { Team } from '@/frontend/lib/app-data-types';
import type { StoredMatchData } from '@/frontend/lib/storage-manager';
import { formatTeamForDisplay } from '@/frontend/lib/team-display-formatter';

const createStoredMatch = (matchId: number, result: 'won' | 'lost'): StoredMatchData => ({
  matchId,
  result,
  opponentName: 'Opponent',
  side: 'radiant',
  duration: 1800,
  date: new Date(1700000000000 + matchId * 1000).toISOString(),
  pickOrder: 'first',
  heroes: [],
  isManual: false,
  isHidden: false,
});

const createTeam = (matches: StoredMatchData[]): Team => {
  const now = Date.now();
  const matchesMap = new Map<number, StoredMatchData>();
  matches.forEach((match) => matchesMap.set(match.matchId, match));

  return {
    id: '1-2',
    teamId: 1,
    leagueId: 2,
    name: 'Team One',
    leagueName: 'League Two',
    timeAdded: now,
    matches: matchesMap,
    players: new Map(),
    createdAt: now,
    updatedAt: now,
    isLoading: false,
    highPerformingHeroes: new Set(),
  };
};

describe('formatTeamForDisplay', () => {
  it('computes win/loss totals and win rate from stored matches', () => {
    const team = createTeam([createStoredMatch(1, 'won'), createStoredMatch(2, 'lost'), createStoredMatch(3, 'won')]);

    const display = formatTeamForDisplay(team);

    expect(display.performance.totalMatches).toBe(3);
    expect(display.performance.totalWins).toBe(2);
    expect(display.performance.totalLosses).toBe(1);
    expect(display.performance.overallWinRate).toBeCloseTo(66.67, 2);
  });

  it('defaults to zeros when there are no matches', () => {
    const team = createTeam([]);

    const display = formatTeamForDisplay(team);

    expect(display.performance.totalMatches).toBe(0);
    expect(display.performance.totalWins).toBe(0);
    expect(display.performance.totalLosses).toBe(0);
    expect(display.performance.overallWinRate).toBe(0);
  });
});
