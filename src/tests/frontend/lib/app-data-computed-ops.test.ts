/**
 * Tests for app-data-computed-ops
 */

import {
  getAddManualPlayerDuplicateError,
  getEditManualPlayerDuplicateError,
  getMatchHeroesForTeam,
  getMatchHeroesForTeamWithStored,
  getMatchManualMetadata,
  getMatchHistoryData,
  getMatchPickOrderLabel,
  getMatchResultBadgeData,
  getMatchResultLabel,
  getPlayerListViewEntries,
  getTeamPlayersViewData,
  getTeamManualPlayerIds,
  parsePlayerIdInput,
  validatePlayerIdInput,
} from '@/frontend/lib/app-data-computed-ops';
import type { AppDataComputedOpsContext } from '@/frontend/lib/app-data-computed-ops';
import type { Hero, Match, MatchFilters, Player, Team } from '@/frontend/lib/app-data-types';
import type { StoredMatchData } from '@/frontend/lib/storage-manager';

const createMockAppData = (
  teams: Team[],
  options?: { matches?: Map<number, Match>; heroes?: Map<number, Hero> },
): AppDataComputedOpsContext => {
  const teamsMap = new Map<string, Team>();
  teams.forEach((team) => {
    teamsMap.set(team.id, team);
  });

  return {
    _teams: teamsMap,
    _matches: options?.matches ?? new Map(),
    leagueMatchesCache: new Map(),
    heroes: options?.heroes ?? new Map(),
  };
};

const createMockTeam = (
  id: string,
  teamId: number,
  leagueId: number,
  players: Array<{ accountId: number; isManual: boolean }>,
): Team => {
  const now = Date.now();
  const playersMap = new Map<
    number,
    {
      accountId: number;
      isManual: boolean;
      name: string;
      rank: string;
      rank_tier: number;
      games: number;
      winRate: number;
      topHeroes: never[];
      avatar: string;
      isHidden: boolean;
    }
  >();
  players.forEach((player) => {
    playersMap.set(player.accountId, {
      ...player,
      name: `Player ${player.accountId}`,
      rank: 'Immortal',
      rank_tier: 80,
      games: 100,
      winRate: 0.5,
      topHeroes: [],
      avatar: '',
      isHidden: false,
    });
  });

  return {
    id,
    teamId,
    leagueId,
    name: `Team ${teamId}`,
    leagueName: `League ${leagueId}`,
    timeAdded: now,
    matches: new Map(),
    players: playersMap,
    createdAt: now,
    updatedAt: now,
    isLoading: false,
    highPerformingHeroes: new Set(),
    isGlobal: false,
  };
};

const createDefaultMatchFilters = (): MatchFilters => ({
  dateRange: 'all',
  customDateRange: { start: null, end: null },
  result: 'all',
  opponent: [],
  teamSide: 'all',
  pickOrder: 'all',
  heroesPlayed: [],
  highPerformersOnly: false,
});

const createMinimalMatch = (id: number, radiantHeroIds: number[], direHeroIds: number[]): Match => {
  const hero = (heroId: number): Hero => ({
    id: heroId,
    name: `hero_${heroId}`,
    localizedName: `Hero ${heroId}`,
    imageUrl: '',
  });
  return {
    id,
    date: '2024-01-01',
    duration: 2400,
    radiant: {},
    dire: {},
    draft: {
      radiantPicks: radiantHeroIds.map((hid, i) => ({ hero: hero(hid), order: i, accountId: 0 })),
      direPicks: direHeroIds.map((hid, i) => ({ hero: hero(hid), order: i, accountId: 0 })),
      radiantBans: [],
      direBans: [],
    },
    players: {
      radiant: radiantHeroIds.map((hid) => ({
        accountId: 0,
        playerName: '',
        hero: hero(hid),
        stats: { kills: 0, deaths: 0, assists: 0, lastHits: 0, denies: 0, gpm: 0, xpm: 0, netWorth: 0, level: 1 },
        items: [],
        heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
      })),
      dire: direHeroIds.map((hid) => ({
        accountId: 0,
        playerName: '',
        hero: hero(hid),
        stats: { kills: 0, deaths: 0, assists: 0, lastHits: 0, denies: 0, gpm: 0, xpm: 0, netWorth: 0, level: 1 },
        items: [],
        heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
      })),
    },
    statistics: {
      radiantScore: 0,
      direScore: 0,
      goldAdvantage: { times: [], radiantGold: [], direGold: [] },
      experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
    },
    events: [],
    result: 'radiant',
  };
};

const createPlayer = (accountId: number, name: string): Player => ({
  accountId,
  profile: {
    name,
    personaname: name,
    rank_tier: 80,
  },
  heroStats: [],
  overallStats: { wins: 0, losses: 0, totalGames: 0, winRate: 0 },
  recentMatchIds: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe('app-data-computed-ops', () => {
  describe('getTeamManualPlayerIds', () => {
    it('should return empty set for non-existent team', () => {
      const appData = createMockAppData([]);
      const result = getTeamManualPlayerIds(appData, 'non-existent');
      expect(result).toEqual(new Set());
    });

    it('should return empty set for team with no players', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      const appData = createMockAppData([team]);
      const result = getTeamManualPlayerIds(appData, '1-1');
      expect(result).toEqual(new Set());
    });

    it('should return only manual player IDs', () => {
      const team = createMockTeam('1-1', 1, 1, [
        { accountId: 100, isManual: true },
        { accountId: 200, isManual: false },
        { accountId: 300, isManual: true },
        { accountId: 400, isManual: false },
      ]);
      const appData = createMockAppData([team]);
      const result = getTeamManualPlayerIds(appData, '1-1');
      expect(result).toEqual(new Set([100, 300]));
    });

    it('should exclude players with accountId <= 0', () => {
      const team = createMockTeam('1-1', 1, 1, [
        { accountId: 100, isManual: true },
        { accountId: 0, isManual: true },
        { accountId: -1, isManual: true },
        { accountId: 200, isManual: true },
      ]);
      const appData = createMockAppData([team]);
      const result = getTeamManualPlayerIds(appData, '1-1');
      expect(result).toEqual(new Set([100, 200]));
    });

    it('should return all manual players when all are manual', () => {
      const team = createMockTeam('1-1', 1, 1, [
        { accountId: 100, isManual: true },
        { accountId: 200, isManual: true },
        { accountId: 300, isManual: true },
      ]);
      const appData = createMockAppData([team]);
      const result = getTeamManualPlayerIds(appData, '1-1');
      expect(result).toEqual(new Set([100, 200, 300]));
    });

    it('should return empty set when no players are manual', () => {
      const team = createMockTeam('1-1', 1, 1, [
        { accountId: 100, isManual: false },
        { accountId: 200, isManual: false },
        { accountId: 300, isManual: false },
      ]);
      const appData = createMockAppData([team]);
      const result = getTeamManualPlayerIds(appData, '1-1');
      expect(result).toEqual(new Set());
    });
  });

  describe('player ID input validation', () => {
    it('validates player ID input', () => {
      expect(validatePlayerIdInput('')).toEqual({ isValid: false, error: 'Player ID is required' });
      expect(validatePlayerIdInput('abc')).toEqual({ isValid: false, error: 'Player ID must be a positive number' });
      expect(validatePlayerIdInput('123')).toEqual({ isValid: true });
    });

    it('parses valid player ID input', () => {
      expect(parsePlayerIdInput('456')).toBe(456);
    });

    it('throws when parsing invalid player ID input', () => {
      expect(() => parsePlayerIdInput('1000000000000')).toThrow('Player ID must be between 1 and 999,999,999,999');
    });
  });

  describe('manual player duplicate checks', () => {
    it('returns duplicate error when adding an existing player', () => {
      const team = createMockTeam('1-1', 1, 1, [{ accountId: 101, isManual: true }]);
      const appData = createMockAppData([team]);

      expect(getAddManualPlayerDuplicateError(appData, '1-1', '101')).toBe(
        'Player 101 is already present for the selected team',
      );
    });

    it('returns undefined when adding a new player', () => {
      const team = createMockTeam('1-1', 1, 1, [{ accountId: 101, isManual: true }]);
      const appData = createMockAppData([team]);

      expect(getAddManualPlayerDuplicateError(appData, '1-1', '202')).toBeUndefined();
    });

    it('ignores invalid inputs when adding a player', () => {
      const team = createMockTeam('1-1', 1, 1, [{ accountId: 101, isManual: true }]);
      const appData = createMockAppData([team]);

      expect(getAddManualPlayerDuplicateError(appData, '1-1', 'abc')).toBeUndefined();
    });

    it('returns duplicate error when editing to an existing player', () => {
      const team = createMockTeam('1-1', 1, 1, [
        { accountId: 101, isManual: true },
        { accountId: 202, isManual: true },
      ]);
      const appData = createMockAppData([team]);

      expect(getEditManualPlayerDuplicateError(appData, '1-1', '202', 101)).toBe(
        'Player 202 is already present for the selected team',
      );
    });

    it('returns undefined when editing to the same player', () => {
      const team = createMockTeam('1-1', 1, 1, [{ accountId: 101, isManual: true }]);
      const appData = createMockAppData([team]);

      expect(getEditManualPlayerDuplicateError(appData, '1-1', '101', 101)).toBeUndefined();
    });
  });

  describe('getMatchManualMetadata', () => {
    it('returns isManual false and null side for non-existent team', () => {
      const appData = createMockAppData([]);
      expect(getMatchManualMetadata(appData, 100, '1-1')).toEqual({
        isManual: false,
        side: null,
      });
    });

    it('returns isManual false and null side when team has no match metadata', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      const appData = createMockAppData([team]);
      expect(getMatchManualMetadata(appData, 100, '1-1')).toEqual({
        isManual: false,
        side: null,
      });
    });

    it('returns metadata from team match when present', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      const matchData: StoredMatchData = {
        matchId: 100,
        result: 'won',
        opponentName: 'Opp',
        side: 'dire',
        duration: 2400,
        date: '2024-01-01',
        pickOrder: 'first',
        heroes: [],
        isManual: true,
        isHidden: false,
      };
      team.matches.set(100, matchData);
      const appData = createMockAppData([team]);
      expect(getMatchManualMetadata(appData, 100, '1-1')).toEqual({
        isManual: true,
        side: 'dire',
      });
    });
  });

  describe('getMatchHeroesForTeam', () => {
    it('returns empty array for non-existent match', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'won',
        opponentName: '',
        side: 'radiant',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const appData = createMockAppData([team], { matches: new Map() });
      expect(getMatchHeroesForTeam(appData, 999, '1-1')).toEqual([]);
    });

    it('returns empty array for non-existent team', () => {
      const matches = new Map<number, Match>();
      matches.set(100, createMinimalMatch(100, [1, 2, 3], [4, 5, 6]));
      const appData = createMockAppData([], { matches });
      expect(getMatchHeroesForTeam(appData, 100, '1-1')).toEqual([]);
    });

    it('returns heroes from match players for team side', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'won',
        opponentName: '',
        side: 'radiant',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const matches = new Map<number, Match>();
      matches.set(100, createMinimalMatch(100, [10, 20, 30, 40, 50], [60, 70, 80, 90, 100]));
      const appData = createMockAppData([team], { matches });
      const heroes = getMatchHeroesForTeam(appData, 100, '1-1');
      expect(heroes).toHaveLength(5);
      expect(heroes.map((h) => h.id)).toEqual([10, 20, 30, 40, 50]);
    });

    it('returns heroes for dire side when team match side is dire', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'lost',
        opponentName: '',
        side: 'dire',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const matches = new Map<number, Match>();
      matches.set(100, createMinimalMatch(100, [10, 20, 30], [60, 70, 80, 90, 100]));
      const appData = createMockAppData([team], { matches });
      const heroes = getMatchHeroesForTeam(appData, 100, '1-1');
      expect(heroes.map((h) => h.id)).toEqual([60, 70, 80, 90, 100]);
    });
  });

  describe('getMatchHeroesForTeamWithStored', () => {
    it('returns match heroes when available even with stored heroes', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'won',
        opponentName: '',
        side: 'radiant',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const matches = new Map<number, Match>();
      matches.set(100, createMinimalMatch(100, [10, 20, 30, 40, 50], [60, 70, 80, 90, 100]));
      const appData = createMockAppData([team], { matches });

      const storedHeroes = [
        { id: 1, name: 'stored_1', localizedName: 'Stored 1', imageUrl: '' },
        { id: 2, name: 'stored_2', localizedName: 'Stored 2', imageUrl: '' },
      ];

      const heroes = getMatchHeroesForTeamWithStored(appData, 100, '1-1', storedHeroes);
      expect(heroes.map((hero) => hero.id)).toEqual([10, 20, 30, 40, 50]);
    });

    it('falls back to stored heroes when match data is missing', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      const appData = createMockAppData([team]);

      const storedHeroes = [
        { id: 101, name: 'stored_101', localizedName: 'Stored 101', imageUrl: '' },
        { id: 202, name: 'stored_202', localizedName: 'Stored 202', imageUrl: '' },
      ];

      const heroes = getMatchHeroesForTeamWithStored(appData, 999, '1-1', storedHeroes);
      expect(heroes.map((hero) => hero.id)).toEqual([101, 202]);
    });

    it('uses stored hero fields when reference data is missing', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      const appData = createMockAppData([team]);

      const storedHeroes = [{ id: 303, name: 'stored_303', localizedName: 'Stored 303', imageUrl: 'img' }];

      const heroes = getMatchHeroesForTeamWithStored(appData, 999, '1-1', storedHeroes);
      expect(heroes).toEqual([{ id: 303, name: 'stored_303', localizedName: 'Stored 303', imageUrl: 'img' }]);
    });
  });

  describe('getMatchPickOrderLabel', () => {
    it('returns null when match has no pick order data', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'won',
        opponentName: '',
        side: 'radiant',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const matches = new Map<number, Match>();
      matches.set(100, createMinimalMatch(100, [1, 2, 3, 4, 5], [6, 7, 8, 9, 10]));
      const appData = createMockAppData([team], { matches });
      expect(getMatchPickOrderLabel(appData, 100, '1-1')).toBeNull();
    });

    it('returns pick order label for team side', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'won',
        opponentName: '',
        side: 'dire',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const match = createMinimalMatch(100, [10, 20, 30], [60, 70, 80]);
      match.pickOrder = { radiant: 'first', dire: 'second' };
      const matches = new Map<number, Match>([[100, match]]);
      const appData = createMockAppData([team], { matches });
      expect(getMatchPickOrderLabel(appData, 100, '1-1')).toBe('Second Pick');
    });
  });

  describe('getMatchResultLabel', () => {
    it('returns Victory when team result is won', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'won',
        opponentName: '',
        side: 'radiant',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const appData = createMockAppData([team]);
      expect(getMatchResultLabel(appData, 100, '1-1')).toBe('Victory');
    });

    it('returns Defeat when team result is lost', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'lost',
        opponentName: '',
        side: 'dire',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const appData = createMockAppData([team]);
      expect(getMatchResultLabel(appData, 100, '1-1')).toBe('Defeat');
    });

    it('returns Unknown when team metadata is missing', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      const appData = createMockAppData([team]);
      expect(getMatchResultLabel(appData, 100, '1-1')).toBe('Unknown');
    });
  });

  describe('getMatchResultBadgeData', () => {
    it('returns win/side data from team match metadata', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      team.matches.set(100, {
        matchId: 100,
        result: 'won',
        opponentName: '',
        side: 'radiant',
        duration: 0,
        date: '',
        pickOrder: '',
        heroes: [],
        isManual: false,
        isHidden: false,
      });
      const appData = createMockAppData([team]);
      expect(getMatchResultBadgeData(appData, 100, '1-1')).toEqual({ teamWon: true, teamSide: 'radiant' });
    });

    it('defaults to false/undefined when team is missing', () => {
      const appData = createMockAppData([]);
      expect(getMatchResultBadgeData(appData, 100, '1-1')).toEqual({ teamWon: false, teamSide: undefined });
    });
  });

  describe('getMatchHistoryData', () => {
    it('returns empty data when no team is selected', () => {
      const appData = createMockAppData([]);
      const result = getMatchHistoryData(appData, null, createDefaultMatchFilters(), new Set(), null);

      expect(result.activeTeamMatches).toEqual([]);
      expect(result.filteredMatches).toEqual([]);
      expect(result.visibleMatches).toEqual([]);
      expect(result.unhiddenMatches).toEqual([]);
      expect(result.selectedMatch).toBeNull();
      expect(result.teamMatches.size).toBe(0);
      expect(result.filterStats.totalMatches).toBe(0);
    });

    it('returns filtered and hidden match data for a team', () => {
      const team = createMockTeam('1-1', 1, 1, []);
      const matchDataOne: StoredMatchData = {
        matchId: 1,
        result: 'won',
        opponentName: 'Opp',
        side: 'radiant',
        duration: 2400,
        date: '2024-01-01',
        pickOrder: 'first',
        heroes: [],
        isManual: false,
        isHidden: false,
      };
      const matchDataTwo: StoredMatchData = {
        matchId: 2,
        result: 'lost',
        opponentName: 'Opp2',
        side: 'dire',
        duration: 2400,
        date: '2024-01-02',
        pickOrder: 'second',
        heroes: [],
        isManual: false,
        isHidden: false,
      };
      team.matches.set(1, matchDataOne);
      team.matches.set(2, matchDataTwo);

      const matches = new Map<number, Match>();
      matches.set(1, createMinimalMatch(1, [1, 2, 3, 4, 5], [6, 7, 8, 9, 10]));
      matches.set(2, createMinimalMatch(2, [11, 12, 13, 14, 15], [16, 17, 18, 19, 20]));

      const appData = createMockAppData([team], { matches });
      const result = getMatchHistoryData(appData, '1-1', createDefaultMatchFilters(), new Set([2]), 1);

      expect(result.activeTeamMatches).toHaveLength(2);
      expect(result.filteredMatches).toHaveLength(2);
      expect(result.visibleMatches.map((match) => match.id)).toEqual([1]);
      expect(result.unhiddenMatches.map((match) => match.id)).toEqual([1]);
      expect(result.selectedMatch?.id).toBe(1);
      expect(result.teamMatches.size).toBe(2);
      expect(result.filterStats.totalMatches).toBe(2);
      expect(result.filterStats.filteredMatches).toBe(2);
    });
  });

  describe('getTeamPlayersViewData', () => {
    it('returns team-scoped player data', () => {
      const team = createMockTeam('1-1', 1, 1, [
        { accountId: 101, isManual: true },
        { accountId: 202, isManual: false },
      ]);
      const appData = createMockAppData([team]);
      const players = [createPlayer(101, 'Alpha'), createPlayer(202, 'Beta'), createPlayer(303, 'Gamma')];

      const result = getTeamPlayersViewData(appData, players, '1-1');

      expect(result.teamPlayerIds).toEqual(new Set([101, 202]));
      expect(result.teamPlayers.map((player) => player.accountId)).toEqual([101, 202]);
      expect(result.sortedPlayers.map((player) => player.accountId)).toEqual([101, 202]);
      expect(result.manualPlayerIds).toEqual(new Set([101]));
    });

    it('returns empty team data when no team is selected', () => {
      const appData = createMockAppData([]);
      const players = [createPlayer(101, 'Alpha')];

      const result = getTeamPlayersViewData(appData, players, null);

      expect(result.teamPlayerIds.size).toBe(0);
      expect(result.teamPlayers).toEqual(players);
      expect(result.sortedPlayers).toEqual(players);
      expect(result.manualPlayerIds.size).toBe(0);
    });
  });

  describe('getPlayerListViewEntries', () => {
    it('returns top heroes sorted by games with rank display', () => {
      const heroes = new Map<number, Hero>([
        [1, { id: 1, name: 'hero_1', localizedName: 'Hero 1', imageUrl: '' }],
        [2, { id: 2, name: 'hero_2', localizedName: 'Hero 2', imageUrl: '' }],
        [3, { id: 3, name: 'hero_3', localizedName: 'Hero 3', imageUrl: '' }],
      ]);
      const player = createPlayer(42, 'Legendary');
      player.profile.rank_tier = 55;
      player.heroStats = [
        { heroId: 2, games: 8, wins: 4, lastPlayed: 0 },
        { heroId: 1, games: 12, wins: 7, lastPlayed: 0 },
        { heroId: 3, games: 5, wins: 2, lastPlayed: 0 },
      ];

      const appData = createMockAppData([], { heroes });
      const [entry] = getPlayerListViewEntries(appData, [player]);

      expect(entry.topHeroes.map((hero) => hero.id)).toEqual([1, 2, 3]);
      expect(entry.rank?.displayText).toBe('Legend');
    });

    it('filters heroes that are missing from reference data', () => {
      const heroes = new Map<number, Hero>([[1, { id: 1, name: 'hero_1', localizedName: 'Hero 1', imageUrl: '' }]]);
      const player = createPlayer(7, 'MissingHero');
      player.profile.rank_tier = 0;
      player.heroStats = [
        { heroId: 1, games: 3, wins: 2, lastPlayed: 0 },
        { heroId: 999, games: 9, wins: 6, lastPlayed: 0 },
      ];

      const appData = createMockAppData([], { heroes });
      const [entry] = getPlayerListViewEntries(appData, [player]);

      expect(entry.topHeroes.map((hero) => hero.id)).toEqual([1]);
      expect(entry.rank).toBeNull();
    });
  });
});
