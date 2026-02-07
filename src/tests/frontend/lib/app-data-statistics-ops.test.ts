/**
 * Tests for app-data-statistics-ops
 */

import {
  getPlayerRecentHeroRows,
  getPlayerHeroStatsForMatches,
  getPlayerParticipatedMatches,
  getTeamPlayerStats,
  getPlayerTopHeroesSummary,
  getTeamRoleStats,
  getTeamPlayerDetailStats,
} from '@/frontend/lib/app-data-statistics-ops';
import type { AppDataStatisticsOpsContext } from '@/frontend/lib/app-data-statistics-ops';
import type {
  Hero,
  LeagueMatchInfo,
  LeagueMatchesCache,
  Match,
  Player,
  PlayerMatchData,
  Team,
} from '@/frontend/lib/app-data-types';
import type { StoredMatchData } from '@/frontend/lib/storage-manager';

const createHero = (id: number, localizedName: string): Hero => ({
  id,
  name: `npc_dota_hero_${id}`,
  localizedName,
  imageUrl: '',
});

const createPlayerMatchData = (accountId: number, hero: Hero, role?: string): PlayerMatchData => ({
  accountId,
  playerName: `Player ${accountId}`,
  hero,
  role: role ? { role, lane: 0 } : undefined,
  stats: {
    kills: 1,
    deaths: 1,
    assists: 1,
    lastHits: 0,
    denies: 0,
    gpm: 0,
    xpm: 0,
    netWorth: 0,
    level: 1,
  },
  items: [],
  heroStats: {
    damageDealt: 0,
    healingDone: 0,
    towerDamage: 0,
  },
});

const createMatchWithPlayer = (
  matchId: number,
  playerId: number,
  hero: Hero,
  side: 'radiant' | 'dire',
  result: 'radiant' | 'dire',
  teamIds?: { radiantTeamId?: number; direTeamId?: number },
  role?: string,
): Match => ({
  id: matchId,
  date: '2024-01-01',
  duration: 2400,
  radiant: { id: teamIds?.radiantTeamId },
  dire: { id: teamIds?.direTeamId },
  draft: {
    radiantPicks: [],
    direPicks: [],
    radiantBans: [],
    direBans: [],
  },
  players: {
    radiant: side === 'radiant' ? [createPlayerMatchData(playerId, hero, role)] : [],
    dire: side === 'dire' ? [createPlayerMatchData(playerId, hero, role)] : [],
  },
  statistics: {
    radiantScore: 0,
    direScore: 0,
    goldAdvantage: { times: [], radiantGold: [], direGold: [] },
    experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
  },
  events: [],
  result,
});

const createStoredMatchData = (matchId: number, overrides: Partial<StoredMatchData> = {}): StoredMatchData => ({
  matchId,
  result: 'won',
  opponentName: 'Opponent',
  side: 'radiant',
  duration: 2400,
  date: '2024-01-01',
  pickOrder: 'unknown',
  heroes: [],
  isManual: false,
  isHidden: false,
  ...overrides,
});

const createPlayer = (accountId: number, recentMatchIds: number[] = []): Player => ({
  accountId,
  profile: {
    name: `Player ${accountId}`,
    personaname: `Player ${accountId}`,
    rank_tier: 0,
  },
  heroStats: [],
  overallStats: {
    wins: 0,
    losses: 0,
    totalGames: 0,
    winRate: 0,
  },
  recentMatchIds,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const createPlayerWithRecentMatches = (
  accountId: number,
  recentMatches: NonNullable<Player['recentMatches']>,
): Player => ({
  ...createPlayer(accountId),
  recentMatches,
});

const createPlayerWithHeroStats = (accountId: number, heroStats: Player['heroStats']): Player => ({
  ...createPlayer(accountId),
  heroStats,
});

const createTeam = (teamId: number, leagueId: number, matches: Map<number, StoredMatchData>): Team => ({
  id: `${teamId}-${leagueId}`,
  teamId,
  leagueId,
  name: 'Test Team',
  leagueName: 'Test League',
  timeAdded: Date.now(),
  matches,
  players: new Map(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isLoading: false,
  highPerformingHeroes: new Set(),
});

const createLeagueMatchesCache = (
  teamId: number,
  matchIds: number[],
  matchInfo: Map<number, LeagueMatchInfo>,
): LeagueMatchesCache => ({
  matches: matchInfo,
  matchIdsByTeam: new Map([[teamId, matchIds]]),
  fetchedAt: Date.now(),
});

const createMockAppData = (heroes: Hero[]): AppDataStatisticsOpsContext => {
  const heroesMap = new Map<number, Hero>();
  heroes.forEach((hero) => heroesMap.set(hero.id, hero));

  return {
    _teams: new Map(),
    heroes: heroesMap,
    leagueMatchesCache: new Map(),
    getPlayer: () => undefined,
    getMatch: () => undefined,
    getTeam: () => undefined,
  };
};

describe('app-data-statistics-ops', () => {
  describe('getPlayerHeroStatsForMatches', () => {
    it('returns hero stats sorted by games desc', () => {
      const playerId = 42;
      const heroOne = createHero(1, 'Alpha');
      const heroTwo = createHero(2, 'Beta');
      const appData = createMockAppData([heroOne, heroTwo]);

      const matches: Match[] = [
        createMatchWithPlayer(101, playerId, heroTwo, 'radiant', 'radiant'),
        createMatchWithPlayer(102, playerId, heroOne, 'dire', 'dire'),
        createMatchWithPlayer(103, playerId, heroOne, 'radiant', 'dire'),
      ];

      const result = getPlayerHeroStatsForMatches(appData, playerId, matches);

      expect(result.map((entry) => entry.hero.id)).toEqual([1, 2]);
      expect(result.map((entry) => entry.games)).toEqual([2, 1]);
    });
  });

  describe('team-scoped stats', () => {
    it('uses team match scope and ignores unloaded matches', () => {
      const playerId = 7;
      const teamId = 1;
      const leagueId = 2;
      const teamKey = `${teamId}-${leagueId}`;
      const hero = createHero(1, 'Alpha');

      const match101 = createMatchWithPlayer(101, playerId, hero, 'radiant', 'radiant', {
        radiantTeamId: teamId,
        direTeamId: 99,
      });
      const match102 = createMatchWithPlayer(102, playerId, hero, 'dire', 'radiant', {
        radiantTeamId: 99,
        direTeamId: teamId,
      });

      const storedMatches = new Map<number, StoredMatchData>([
        [101, createStoredMatchData(101, { side: 'radiant', result: 'won' })],
      ]);
      const team = createTeam(teamId, leagueId, storedMatches);
      const player = createPlayer(playerId, []);

      const matchesMap = new Map<number, Match>([
        [101, match101],
        [102, match102],
      ]);

      const matchInfo = new Map<number, LeagueMatchInfo>([
        [102, { matchId: 102, radiantTeamId: 99, direTeamId: teamId, radiantPlayerIds: [], direPlayerIds: [] }],
        [103, { matchId: 103, radiantTeamId: 99, direTeamId: teamId, radiantPlayerIds: [], direPlayerIds: [] }],
      ]);
      const leagueCache = createLeagueMatchesCache(teamId, [102, 103], matchInfo);

      const appData: AppDataStatisticsOpsContext = {
        _teams: new Map([[teamKey, team]]),
        heroes: new Map(),
        leagueMatchesCache: new Map([[leagueId, leagueCache]]),
        getPlayer: (id) => (id === playerId ? player : undefined),
        getMatch: (id) => matchesMap.get(id),
        getTeam: (key) => (key === teamKey ? team : undefined),
      };

      const stats = getTeamPlayerStats(appData, playerId, teamKey);

      expect(stats.totalGames).toBe(2);
      expect(stats.totalWins).toBe(1);
      expect(stats.winRate).toBe(50);
    });

    it('returns participated matches from team scope', () => {
      const playerId = 7;
      const teamId = 1;
      const leagueId = 2;
      const teamKey = `${teamId}-${leagueId}`;
      const hero = createHero(1, 'Alpha');

      const match101 = createMatchWithPlayer(101, playerId, hero, 'radiant', 'radiant', {
        radiantTeamId: teamId,
        direTeamId: 99,
      });
      const match102 = createMatchWithPlayer(102, playerId, hero, 'dire', 'radiant', {
        radiantTeamId: 99,
        direTeamId: teamId,
      });

      const storedMatches = new Map<number, StoredMatchData>([
        [101, createStoredMatchData(101, { side: 'radiant', result: 'won' })],
      ]);
      const team = createTeam(teamId, leagueId, storedMatches);
      const player = createPlayer(playerId, []);

      const matchesMap = new Map<number, Match>([
        [101, match101],
        [102, match102],
      ]);

      const matchInfo = new Map<number, LeagueMatchInfo>([
        [102, { matchId: 102, radiantTeamId: 99, direTeamId: teamId, radiantPlayerIds: [], direPlayerIds: [] }],
        [103, { matchId: 103, radiantTeamId: 99, direTeamId: teamId, radiantPlayerIds: [], direPlayerIds: [] }],
      ]);
      const leagueCache = createLeagueMatchesCache(teamId, [102, 103], matchInfo);

      const appData: AppDataStatisticsOpsContext = {
        _teams: new Map([[teamKey, team]]),
        heroes: new Map(),
        leagueMatchesCache: new Map([[leagueId, leagueCache]]),
        getPlayer: (id) => (id === playerId ? player : undefined),
        getMatch: (id) => matchesMap.get(id),
        getTeam: (key) => (key === teamKey ? team : undefined),
      };

      const matches = getPlayerParticipatedMatches(appData, playerId, teamKey);
      const matchIds = matches.map((match) => match.id).sort((a, b) => a - b);

      expect(matchIds).toEqual([101, 102]);
    });

    it('returns team role stats with win rates sorted by games', () => {
      const playerId = 21;
      const teamId = 1;
      const leagueId = 2;
      const teamKey = `${teamId}-${leagueId}`;
      const hero = createHero(1, 'Alpha');

      const match101 = createMatchWithPlayer(
        101,
        playerId,
        hero,
        'radiant',
        'radiant',
        { radiantTeamId: teamId, direTeamId: 99 },
        'Carry',
      );
      const match102 = createMatchWithPlayer(
        102,
        playerId,
        hero,
        'dire',
        'radiant',
        { radiantTeamId: 99, direTeamId: teamId },
        'Support',
      );
      const match103 = createMatchWithPlayer(
        103,
        playerId,
        hero,
        'radiant',
        'radiant',
        { radiantTeamId: teamId, direTeamId: 99 },
        'Carry',
      );

      const storedMatches = new Map<number, StoredMatchData>([
        [101, createStoredMatchData(101, { side: 'radiant', result: 'won' })],
      ]);
      const team = createTeam(teamId, leagueId, storedMatches);
      const player = createPlayer(playerId, []);

      const matchesMap = new Map<number, Match>([
        [101, match101],
        [102, match102],
        [103, match103],
      ]);

      const matchInfo = new Map<number, LeagueMatchInfo>([
        [102, { matchId: 102, radiantTeamId: 99, direTeamId: teamId, radiantPlayerIds: [], direPlayerIds: [] }],
        [103, { matchId: 103, radiantTeamId: teamId, direTeamId: 99, radiantPlayerIds: [], direPlayerIds: [] }],
      ]);
      const leagueCache = createLeagueMatchesCache(teamId, [102, 103], matchInfo);

      const appData: AppDataStatisticsOpsContext = {
        _teams: new Map([[teamKey, team]]),
        heroes: new Map([[hero.id, hero]]),
        leagueMatchesCache: new Map([[leagueId, leagueCache]]),
        getPlayer: (id) => (id === playerId ? player : undefined),
        getMatch: (id) => matchesMap.get(id),
        getTeam: (key) => (key === teamKey ? team : undefined),
      };

      const roles = getTeamRoleStats(appData, playerId, teamKey);

      expect(roles.map((role) => role.role)).toEqual(['Carry', 'Support']);
      expect(roles.map((role) => role.games)).toEqual([2, 1]);
      expect(roles.find((role) => role.role === 'Carry')?.winRate).toBe(100);
      expect(roles.find((role) => role.role === 'Support')?.winRate).toBe(0);
    });

    it('returns team detail stats with heroes sorted by games', () => {
      const playerId = 31;
      const teamId = 3;
      const leagueId = 4;
      const teamKey = `${teamId}-${leagueId}`;
      const heroOne = createHero(1, 'Alpha');
      const heroTwo = createHero(2, 'Beta');

      const match101 = createMatchWithPlayer(
        101,
        playerId,
        heroOne,
        'radiant',
        'radiant',
        { radiantTeamId: teamId, direTeamId: 99 },
        'Carry',
      );
      const match102 = createMatchWithPlayer(
        102,
        playerId,
        heroTwo,
        'dire',
        'dire',
        { radiantTeamId: 99, direTeamId: teamId },
        'Support',
      );
      const match103 = createMatchWithPlayer(
        103,
        playerId,
        heroOne,
        'radiant',
        'dire',
        { radiantTeamId: teamId, direTeamId: 99 },
        'Carry',
      );

      const storedMatches = new Map<number, StoredMatchData>([
        [101, createStoredMatchData(101, { side: 'radiant', result: 'won' })],
      ]);
      const team = createTeam(teamId, leagueId, storedMatches);
      const player = createPlayer(playerId, []);

      const matchesMap = new Map<number, Match>([
        [101, match101],
        [102, match102],
        [103, match103],
      ]);

      const matchInfo = new Map<number, LeagueMatchInfo>([
        [102, { matchId: 102, radiantTeamId: 99, direTeamId: teamId, radiantPlayerIds: [], direPlayerIds: [] }],
        [103, { matchId: 103, radiantTeamId: teamId, direTeamId: 99, radiantPlayerIds: [], direPlayerIds: [] }],
      ]);
      const leagueCache = createLeagueMatchesCache(teamId, [102, 103], matchInfo);

      const appData: AppDataStatisticsOpsContext = {
        _teams: new Map([[teamKey, team]]),
        heroes: new Map([
          [heroOne.id, heroOne],
          [heroTwo.id, heroTwo],
        ]),
        leagueMatchesCache: new Map([[leagueId, leagueCache]]),
        getPlayer: (id) => (id === playerId ? player : undefined),
        getMatch: (id) => matchesMap.get(id),
        getTeam: (key) => (key === teamKey ? team : undefined),
      };

      const details = getTeamPlayerDetailStats(appData, playerId, teamKey);

      expect(details.teamHeroes.map((entry) => entry.hero.id)).toEqual([1, 2]);
      expect(details.teamHeroes.map((entry) => entry.games)).toEqual([2, 1]);
      expect(details.teamRoles.map((role) => role.role)).toEqual(['Carry', 'Support']);
    });
  });

  describe('getPlayerTopHeroesSummary', () => {
    it('calculates win rate and orders heroes deterministically', () => {
      const playerId = 99;
      const heroAlpha = createHero(1, 'Alpha');
      const heroBeta = createHero(2, 'Beta');
      const heroGamma = createHero(3, 'Gamma');
      const heroDelta = createHero(4, 'Delta');
      const appData = createMockAppData([heroAlpha, heroBeta, heroGamma, heroDelta]);
      const player = createPlayerWithHeroStats(playerId, [
        { heroId: heroBeta.id, games: 10, wins: 8, lastPlayed: 0 },
        { heroId: heroAlpha.id, games: 10, wins: 8, lastPlayed: 0 },
        { heroId: heroDelta.id, games: 10, wins: 5, lastPlayed: 0 },
        { heroId: heroGamma.id, games: 8, wins: 6, lastPlayed: 0 },
      ]);

      appData.getPlayer = () => player;

      const result = getPlayerTopHeroesSummary(appData, playerId);

      expect(result.map((entry) => entry.hero.id)).toEqual([1, 2, 4, 3]);
      expect(result[0].winRate).toBeCloseTo(80, 5);
      expect(result[2].winRate).toBeCloseTo(50, 5);
    });

    it('respects the provided limit', () => {
      const playerId = 77;
      const heroAlpha = createHero(1, 'Alpha');
      const heroBeta = createHero(2, 'Beta');
      const heroGamma = createHero(3, 'Gamma');
      const appData = createMockAppData([heroAlpha, heroBeta, heroGamma]);
      const player = createPlayerWithHeroStats(playerId, [
        { heroId: heroAlpha.id, games: 6, wins: 3, lastPlayed: 0 },
        { heroId: heroBeta.id, games: 5, wins: 2, lastPlayed: 0 },
        { heroId: heroGamma.id, games: 4, wins: 2, lastPlayed: 0 },
      ]);

      appData.getPlayer = () => player;

      const result = getPlayerTopHeroesSummary(appData, playerId, 2);

      expect(result).toHaveLength(2);
      expect(result.map((entry) => entry.hero.id)).toEqual([1, 2]);
    });
  });

  describe('getPlayerRecentHeroRows', () => {
    it('returns sorted hero rows and total games', () => {
      const playerId = 9;
      const heroOne = createHero(1, 'Alpha');
      const heroTwo = createHero(2, 'Beta');

      const recentMatches = [
        {
          match_id: 1,
          player_slot: 0,
          radiant_win: true,
          hero_id: 1,
          start_time: 1,
        },
        {
          match_id: 2,
          player_slot: 0,
          radiant_win: false,
          hero_id: 1,
          start_time: 2,
        },
        {
          match_id: 3,
          player_slot: 130,
          radiant_win: false,
          hero_id: 2,
          start_time: 3,
        },
      ];

      const player = createPlayerWithRecentMatches(playerId, recentMatches);
      const appData: AppDataStatisticsOpsContext = {
        _teams: new Map(),
        heroes: new Map([
          [heroOne.id, heroOne],
          [heroTwo.id, heroTwo],
        ]),
        leagueMatchesCache: new Map(),
        getPlayer: (id) => (id === playerId ? player : undefined),
        getMatch: () => undefined,
        getTeam: () => undefined,
      };

      const result = getPlayerRecentHeroRows(appData, playerId, 'all', { start: null, end: null }, 'games', 'desc');

      expect(result.totalGames).toBe(3);
      expect(result.rows.map((row) => row.hero.id)).toEqual([1, 2]);
      expect(result.rows.map((row) => row.games)).toEqual([2, 1]);
      expect(result.rows.map((row) => Math.round(row.winRate))).toEqual([50, 100]);
    });

    it('filters recent matches by custom range inclusively', () => {
      const playerId = 11;
      const heroOne = createHero(1, 'Alpha');

      const startDate = new Date(2024, 0, 1, 0, 0, 0);
      const endDate = new Date(2024, 0, 2, 23, 59, 59);
      const beforeDate = new Date(2023, 11, 31, 23, 59, 59);

      const recentMatches = [
        {
          match_id: 1,
          player_slot: 0,
          radiant_win: true,
          hero_id: 1,
          start_time: Math.floor(startDate.getTime() / 1000),
        },
        {
          match_id: 2,
          player_slot: 0,
          radiant_win: true,
          hero_id: 1,
          start_time: Math.floor(endDate.getTime() / 1000),
        },
        {
          match_id: 3,
          player_slot: 0,
          radiant_win: true,
          hero_id: 1,
          start_time: Math.floor(beforeDate.getTime() / 1000),
        },
      ];

      const player = createPlayerWithRecentMatches(playerId, recentMatches);
      const appData: AppDataStatisticsOpsContext = {
        _teams: new Map(),
        heroes: new Map([[heroOne.id, heroOne]]),
        leagueMatchesCache: new Map(),
        getPlayer: (id) => (id === playerId ? player : undefined),
        getMatch: () => undefined,
        getTeam: () => undefined,
      };

      const result = getPlayerRecentHeroRows(
        appData,
        playerId,
        'custom',
        { start: '2024-01-01', end: '2024-01-02' },
        'games',
        'desc',
      );

      expect(result.totalGames).toBe(2);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].games).toBe(2);
    });
  });
});
