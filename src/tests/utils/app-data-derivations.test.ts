import {
  computeTeamHeroSummaryForMatches,
  computeTeamHiddenMatchesForDisplay,
  computeTeamHiddenPlayersForDisplay,
  computeTeamMatchFilters,
  computeTeamPerformanceSummary,
} from '@/frontend/lib/app-data-derivations';
import type { Hero, Match, MatchFilters, Player, PlayerMatchData, Team } from '@/frontend/lib/app-data-types';
import type { StoredMatchData, StoredPlayerData } from '@/frontend/lib/storage-manager';

function createPlayer(accountId: number, heroId: number): PlayerMatchData {
  return {
    accountId,
    playerName: `Player ${accountId}`,
    hero: {
      id: heroId,
      name: `npc_dota_hero_${heroId}`,
      localizedName: `Hero ${heroId}`,
      imageUrl: '',
    },
    role: undefined,
    stats: {
      kills: 0,
      deaths: 0,
      assists: 0,
      lastHits: 0,
      denies: 0,
      gpm: 0,
      xpm: 0,
      netWorth: 0,
      level: 0,
    },
    items: [],
    heroStats: {
      damageDealt: 0,
      healingDone: 0,
      towerDamage: 0,
    },
  };
}

function createMatch(id: number, overrides: Partial<Match> = {}): Match {
  const baseMatch: Match = {
    id,
    date: '2024-01-01T00:00:00.000Z',
    duration: 1800,
    radiant: { id: 1, name: 'Team Radiant' },
    dire: { id: 2, name: 'Team Dire' },
    draft: {
      radiantPicks: [],
      direPicks: [],
      radiantBans: [],
      direBans: [],
    },
    players: {
      radiant: [createPlayer(1, 1)],
      dire: [createPlayer(6, 6)],
    },
    statistics: {
      radiantScore: 20,
      direScore: 10,
      goldAdvantage: {
        times: [],
        radiantGold: [],
        direGold: [],
      },
      experienceAdvantage: {
        times: [],
        radiantExperience: [],
        direExperience: [],
      },
    },
    events: [],
    result: 'radiant',
    pickOrder: {
      radiant: 'first',
      dire: 'second',
    },
    processedDraft: undefined,
    processedEvents: undefined,
    teamFightStats: undefined,
    error: undefined,
    isLoading: false,
  };

  return { ...baseMatch, ...overrides };
}

function createStoredMatchData(matchId: number, overrides: Partial<StoredMatchData> = {}): StoredMatchData {
  return {
    matchId,
    result: 'won',
    opponentName: 'Opponents',
    side: 'radiant',
    duration: 1800,
    date: '2024-01-01T00:00:00.000Z',
    pickOrder: 'first',
    heroes: [],
    isManual: false,
    isHidden: false,
    ...overrides,
  };
}

const baseFilters: MatchFilters = {
  dateRange: 'all',
  customDateRange: { start: null, end: null },
  result: 'all',
  opponent: [],
  teamSide: 'all',
  pickOrder: 'all',
  heroesPlayed: [],
  highPerformersOnly: false,
};

describe('computeTeamMatchFilters', () => {
  it('filters matches by result', () => {
    const winMatch = createMatch(1, { result: 'radiant' });
    const lossMatch = createMatch(2, { result: 'dire' });

    const teamMatches = new Map<number, StoredMatchData>([
      [winMatch.id, createStoredMatchData(winMatch.id, { result: 'won', side: 'radiant' })],
      [lossMatch.id, createStoredMatchData(lossMatch.id, { result: 'lost', side: 'radiant' })],
    ]);

    const { filteredMatches, filterStats } = computeTeamMatchFilters({
      matches: [winMatch, lossMatch],
      teamMatches,
      filters: { ...baseFilters, result: 'wins' },
    });

    expect(filteredMatches).toHaveLength(1);
    expect(filteredMatches[0].id).toBe(winMatch.id);
    expect(filterStats.totalMatches).toBe(2);
    expect(filterStats.filteredMatches).toBe(1);
  });

  it('filters matches by heroes played using match player data', () => {
    const radiantHeroMatch = createMatch(3, {
      players: {
        radiant: [createPlayer(1, 99)],
        dire: [createPlayer(2, 7)],
      },
    });
    const otherHeroMatch = createMatch(4, {
      players: {
        radiant: [createPlayer(3, 55)],
        dire: [createPlayer(4, 42)],
      },
    });

    const teamMatches = new Map<number, StoredMatchData>([
      [radiantHeroMatch.id, createStoredMatchData(radiantHeroMatch.id, { result: 'won', side: 'radiant' })],
      [otherHeroMatch.id, createStoredMatchData(otherHeroMatch.id, { result: 'won', side: 'radiant' })],
    ]);

    const { filteredMatches } = computeTeamMatchFilters({
      matches: [radiantHeroMatch, otherHeroMatch],
      teamMatches,
      filters: { ...baseFilters, heroesPlayed: ['99'] },
    });

    expect(filteredMatches).toHaveLength(1);
    expect(filteredMatches[0].id).toBe(radiantHeroMatch.id);
  });
});

describe('computeTeamHeroSummaryForMatches', () => {
  const hero = (id: number, name: string): Hero => ({
    id,
    name: `npc_dota_hero_${id}`,
    localizedName: name,
    imageUrl: `${name.toLowerCase()}.png`,
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Mid'],
  });

  it('aggregates active and opponent hero picks with win rates', () => {
    const radiantHero = hero(77, 'Invoker');
    const direHero = hero(88, 'Juggernaut');

    const match = createMatch(11, {
      draft: {
        radiantPicks: [{ hero: radiantHero, order: 1, role: { role: 'Mid', lane: 2 } }],
        direPicks: [{ hero: direHero, order: 1 }],
        radiantBans: [],
        direBans: [],
      },
      result: 'radiant',
    });

    const teamMatches = new Map<number, StoredMatchData>([
      [match.id, createStoredMatchData(match.id, { result: 'won', side: 'radiant' })],
    ]);

    const heroesMap = new Map<number, Hero>([
      [radiantHero.id, radiantHero],
      [direHero.id, direHero],
    ]);

    const summary = computeTeamHeroSummaryForMatches({
      matches: [match],
      teamMatches,
      heroesMap,
    });

    expect(summary.matchesCount).toBe(1);
    expect(summary.activeTeamPicks).toEqual([
      expect.objectContaining({
        heroId: radiantHero.id.toString(),
        count: 1,
        winRate: 100,
        playedRoles: [{ role: 'Mid', count: 1 }],
      }),
    ]);
    expect(summary.opponentTeamPicks).toEqual([
      expect.objectContaining({
        heroId: direHero.id.toString(),
        count: 1,
        winRate: 100,
      }),
    ]);
  });

  it('aggregates hero bans for both teams', () => {
    const radiantBan = hero(13, 'Pudge');
    const direBan = hero(25, 'Lina');

    const match = createMatch(12, {
      draft: {
        radiantPicks: [],
        direPicks: [],
        radiantBans: [radiantBan],
        direBans: [direBan],
      },
      result: 'dire',
    });

    const teamMatches = new Map<number, StoredMatchData>([
      [match.id, createStoredMatchData(match.id, { result: 'lost', side: 'radiant' })],
    ]);

    const heroesMap = new Map<number, Hero>([
      [radiantBan.id, radiantBan],
      [direBan.id, direBan],
    ]);

    const summary = computeTeamHeroSummaryForMatches({
      matches: [match],
      teamMatches,
      heroesMap,
    });

    expect(summary.activeTeamBans).toEqual([
      expect.objectContaining({
        heroId: radiantBan.id.toString(),
        count: 1,
        winRate: 0,
      }),
    ]);
    expect(summary.opponentTeamBans).toEqual([
      expect.objectContaining({
        heroId: direBan.id.toString(),
        count: 1,
        winRate: 0,
      }),
    ]);
  });
});

describe('team utility derivations', () => {
  const createTeam = (overrides: Partial<Team> = {}): Team => {
    return {
      id: '1-1',
      teamId: 1,
      leagueId: 1,
      name: 'Test Team',
      leagueName: 'Test League',
      timeAdded: Date.now(),
      matches: new Map(),
      players: new Map(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLoading: false,
      highPerformingHeroes: new Set<string>(),
      ...overrides,
    };
  };

  it('returns hidden players using placeholders when full data missing', () => {
    const hiddenPlayer: StoredPlayerData = {
      accountId: 42,
      name: 'Hidden Player',
      rank: 'Unknown',
      rank_tier: 0,
      leaderboard_rank: undefined,
      games: 0,
      winRate: 0,
      topHeroes: [],
      avatar: '',
      isManual: false,
      isHidden: true,
    };

    const visiblePlayer: StoredPlayerData = {
      ...hiddenPlayer,
      accountId: 99,
      name: 'Visible Player',
      isHidden: false,
    };

    const team = createTeam({
      players: new Map([
        [hiddenPlayer.accountId, hiddenPlayer],
        [visiblePlayer.accountId, visiblePlayer],
      ]),
    });

    const playersMap = new Map<number, Player>();

    const hiddenForDisplay = computeTeamHiddenPlayersForDisplay({ team, playersMap });

    expect(hiddenForDisplay).toHaveLength(1);
    expect(hiddenForDisplay[0].accountId).toBe(hiddenPlayer.accountId);
    expect(hiddenForDisplay[0].profile.personaname).toBe('Hidden Player');
  });

  it('returns hidden matches using placeholders when full data missing', () => {
    const hiddenMatch: StoredMatchData = {
      matchId: 50,
      result: 'won',
      opponentName: 'Opponents',
      side: 'radiant',
      duration: 1234,
      date: '2024-01-01T00:00:00Z',
      pickOrder: 'first',
      heroes: [],
      isManual: false,
      isHidden: true,
    };

    const team = createTeam({ matches: new Map([[hiddenMatch.matchId, hiddenMatch]]) });
    const matchesMap = new Map<number, Match>();

    const hiddenMatches = computeTeamHiddenMatchesForDisplay({ team, matchesMap, heroes: new Map() });

    expect(hiddenMatches).toHaveLength(1);
    expect(hiddenMatches[0].id).toBe(hiddenMatch.matchId);
    expect(hiddenMatches[0].duration).toBe(hiddenMatch.duration);
  });

  it('calculates team performance summary with manual counts', () => {
    const matches = new Map<number, StoredMatchData>([
      [
        1,
        {
          matchId: 1,
          result: 'won',
          opponentName: 'Opponents',
          side: 'radiant',
          duration: 1800,
          date: '2024-01-01T00:00:00Z',
          pickOrder: 'first',
          heroes: [],
          isManual: true,
          isHidden: false,
        },
      ],
      [
        2,
        {
          matchId: 2,
          result: 'lost',
          opponentName: 'Opponents',
          side: 'dire',
          duration: 1900,
          date: '2024-01-02T00:00:00Z',
          pickOrder: 'second',
          heroes: [],
          isManual: false,
          isHidden: false,
        },
      ],
      [
        3,
        {
          matchId: 3,
          result: 'won',
          opponentName: 'Opponents',
          side: 'radiant',
          duration: 0,
          date: '2024-01-03T00:00:00Z',
          pickOrder: 'first',
          heroes: [],
          isManual: false,
          isHidden: true,
        },
      ],
    ]);

    const team = createTeam({
      matches,
      players: new Map<number, StoredPlayerData>([
        [
          7,
          {
            accountId: 7,
            name: 'Manual Player',
            rank: 'Unknown',
            rank_tier: 0,
            leaderboard_rank: undefined,
            games: 0,
            winRate: 0,
            topHeroes: [],
            avatar: '',
            isManual: true,
            isHidden: false,
          },
        ],
      ]),
    });

    const matchesMap = new Map<number, Match>([
      [
        1,
        {
          id: 1,
          date: '2024-01-01T00:00:00Z',
          duration: 1800,
          radiant: {},
          dire: {},
          draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
          players: { radiant: [], dire: [] },
          statistics: {
            radiantScore: 0,
            direScore: 0,
            goldAdvantage: { times: [], radiantGold: [], direGold: [] },
            experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
          },
          events: [],
          result: 'radiant',
        } as Match,
      ],
    ]);

    const summary = computeTeamPerformanceSummary({ team, matchesMap });

    expect(summary.manualMatchCount).toBe(1);
    expect(summary.totalMatches).toBe(2);
    expect(summary.totalWins).toBe(1);
    expect(summary.totalLosses).toBe(1);
    expect(summary.totalDurationSeconds).toBe(1800 + 1900);
    expect(summary.manualPlayerCount).toBe(1);
  });
});
