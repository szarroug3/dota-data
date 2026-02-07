import {
  computeTeamfightTotals,
  deriveTeamfightRowData,
  getHeroesPlayedOptionsForTeam,
  getMatchPlayerKda,
} from '@/frontend/lib/app-data-match-derivations';
import type { Hero, Match } from '@/frontend/lib/app-data-types';
import type { StoredMatchData } from '@/frontend/lib/storage-manager';

type MatchWithOptionalDraft = Omit<Match, 'draft'> & { draft?: Match['draft'] | null };

const createHero = (id: number): Hero => ({
  id,
  name: `hero_${id}`,
  localizedName: `Hero ${id}`,
  imageUrl: '',
});

const createMatchWithDraft = (id: number, radiantHeroIds: number[], direHeroIds: number[]): Match => ({
  id,
  date: '2024-01-01',
  duration: 2400,
  radiant: {},
  dire: {},
  draft: {
    radiantPicks: radiantHeroIds.map((hid, i) => ({ hero: createHero(hid), order: i, accountId: 0 })),
    direPicks: direHeroIds.map((hid, i) => ({ hero: createHero(hid), order: i, accountId: 0 })),
    radiantBans: [],
    direBans: [],
  },
  players: {
    radiant: radiantHeroIds.map((hid) => ({
      accountId: 0,
      playerName: '',
      hero: createHero(hid),
      stats: { kills: 0, deaths: 0, assists: 0, lastHits: 0, denies: 0, gpm: 0, xpm: 0, netWorth: 0, level: 1 },
      items: [],
      heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
    })),
    dire: direHeroIds.map((hid) => ({
      accountId: 0,
      playerName: '',
      hero: createHero(hid),
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
});

const createMatchWithoutDraft = (
  id: number,
  radiantHeroIds: number[],
  direHeroIds: number[],
): MatchWithOptionalDraft => ({
  id,
  date: '2024-01-01',
  duration: 2400,
  radiant: {},
  dire: {},
  players: {
    radiant: radiantHeroIds.map((hid) => ({
      accountId: 0,
      playerName: '',
      hero: createHero(hid),
      stats: { kills: 0, deaths: 0, assists: 0, lastHits: 0, denies: 0, gpm: 0, xpm: 0, netWorth: 0, level: 1 },
      items: [],
      heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
    })),
    dire: direHeroIds.map((hid) => ({
      accountId: 0,
      playerName: '',
      hero: createHero(hid),
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
});

const createStoredMatchData = (matchId: number, side: 'radiant' | 'dire', heroes: Hero[]): StoredMatchData => ({
  matchId,
  result: 'won',
  opponentName: 'Opp',
  side,
  duration: 2400,
  date: '2024-01-01',
  pickOrder: 'first',
  heroes,
  isManual: false,
  isHidden: false,
});

const createPlayerWithStats = (stats: {
  kills?: number;
  deaths?: number;
  assists?: number;
}): Match['players']['radiant'][number] => ({
  accountId: 0,
  playerName: '',
  hero: createHero(1),
  stats: {
    kills: stats.kills ?? 0,
    deaths: stats.deaths ?? 0,
    assists: stats.assists ?? 0,
    lastHits: 0,
    denies: 0,
    gpm: 0,
    xpm: 0,
    netWorth: 0,
    level: 1,
  },
  items: [],
  heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
});

describe('app-data-match-derivations', () => {
  describe('computeTeamfightTotals', () => {
    it('totals radiant and dire gold/xp by player index', () => {
      const playerDetails = [
        { playerIndex: 0, deaths: 0, buybacks: 0, goldDelta: 120, xpDelta: 300, damage: 0, healing: 0 },
        { playerIndex: 4, deaths: 0, buybacks: 0, goldDelta: 80, xpDelta: 200, damage: 0, healing: 0 },
        { playerIndex: 5, deaths: 0, buybacks: 0, goldDelta: -50, xpDelta: 100, damage: 0, healing: 0 },
        { playerIndex: 9, deaths: 0, buybacks: 0, goldDelta: 20, xpDelta: 0, damage: 0, healing: 0 },
      ];

      const totals = computeTeamfightTotals(playerDetails);

      expect(totals.radiant).toEqual({ gold: 200, xp: 500 });
      expect(totals.dire).toEqual({ gold: -30, xp: 100 });
    });
  });

  describe('deriveTeamfightRowData', () => {
    const createTeamfightMatch = (): Match => ({
      id: 1,
      date: '2024-01-01',
      duration: 2400,
      radiant: {},
      dire: {},
      draft: {
        radiantPicks: [],
        direPicks: [],
        radiantBans: [],
        direBans: [],
      },
      players: {
        radiant: [
          {
            accountId: 0,
            playerName: '',
            hero: createHero(1),
            stats: { kills: 0, deaths: 0, assists: 0, lastHits: 0, denies: 0, gpm: 0, xpm: 0, netWorth: 0, level: 1 },
            items: [],
            heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
          },
        ],
        dire: [
          {
            accountId: 0,
            playerName: '',
            hero: createHero(2),
            stats: { kills: 0, deaths: 0, assists: 0, lastHits: 0, denies: 0, gpm: 0, xpm: 0, netWorth: 0, level: 1 },
            items: [],
            heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
          },
        ],
      },
      statistics: {
        radiantScore: 0,
        direScore: 0,
        goldAdvantage: { times: [], radiantGold: [], direGold: [] },
        experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
      },
      events: [],
      result: 'radiant',
    });

    it('resolves hero data from match players', () => {
      const match = createTeamfightMatch();

      const row = deriveTeamfightRowData(
        { playerIndex: 0, deaths: 0, buybacks: 0, goldDelta: 100, xpDelta: 200, damage: 2500, healing: 0 },
        match,
      );

      expect(row.heroName).toBe('Hero 1');
      expect(row.heroImageUrl).toBe('');
      expect(row.isDead).toBe(false);
      expect(row.damageText).toBe('2,500');
    });

    it('falls back to player index when hero is missing', () => {
      const match = createTeamfightMatch();

      const row = deriveTeamfightRowData(
        { playerIndex: 3, deaths: 1, buybacks: 0, goldDelta: 0, xpDelta: 0, damage: 0, healing: 0 },
        match,
      );

      expect(row.heroName).toBe('Player 3');
      expect(row.heroImageUrl).toBeUndefined();
      expect(row.isDead).toBe(true);
    });

    it('resolves dire hero by offset index', () => {
      const match = createTeamfightMatch();

      const row = deriveTeamfightRowData(
        { playerIndex: 5, deaths: 0, buybacks: 0, goldDelta: 10, xpDelta: 20, damage: 100, healing: 0 },
        match,
      );

      expect(row.heroName).toBe('Hero 2');
      expect(row.heroImageUrl).toBe('');
    });
  });

  describe('getHeroesPlayedOptionsForTeam', () => {
    it('returns draft picks when draft data exists', () => {
      const match = createMatchWithDraft(1, [1, 2, 3], [4, 5, 6]);
      const teamMatches = new Map<number, StoredMatchData>([[1, createStoredMatchData(1, 'radiant', [createHero(9)])]]);

      const options = getHeroesPlayedOptionsForTeam([match], teamMatches);

      expect(options.map((option) => option.value)).toEqual(['1', '2', '3']);
    });

    it('falls back to team players when draft data is missing', () => {
      const match = createMatchWithoutDraft(1, [10, 20], [30, 40]);
      const teamMatches = new Map<number, StoredMatchData>([[1, createStoredMatchData(1, 'radiant', [])]]);

      const options = getHeroesPlayedOptionsForTeam([match], teamMatches);

      expect(options.map((option) => option.value)).toEqual(['10', '20']);
    });

    it('falls back to stored heroes when players are missing', () => {
      const match = createMatchWithoutDraft(1, [], []);
      const teamMatches = new Map<number, StoredMatchData>([
        [1, createStoredMatchData(1, 'radiant', [createHero(30), createHero(40)])],
      ]);

      const options = getHeroesPlayedOptionsForTeam([match], teamMatches);

      expect(options.map((option) => option.value)).toEqual(['30', '40']);
    });

    it('deduplicates heroes across matches and sources', () => {
      const matchOne = createMatchWithoutDraft(1, [1, 2], []);
      const matchTwo = createMatchWithoutDraft(2, [2], []);
      const teamMatches = new Map<number, StoredMatchData>([
        [1, createStoredMatchData(1, 'radiant', [])],
        [2, createStoredMatchData(2, 'radiant', [createHero(3), createHero(2)])],
      ]);

      const options = getHeroesPlayedOptionsForTeam([matchOne, matchTwo], teamMatches);

      expect(options.map((option) => option.value)).toEqual(['1', '2', '3']);
    });
  });

  describe('getMatchPlayerKda', () => {
    it('calculates KDA ratio when deaths are greater than 0', () => {
      const player = createPlayerWithStats({ kills: 8, deaths: 4, assists: 6 });

      expect(getMatchPlayerKda(player)).toBeCloseTo(3.5, 5);
    });

    it('returns kills plus assists when deaths are 0', () => {
      const player = createPlayerWithStats({ kills: 10, deaths: 0, assists: 2 });

      expect(getMatchPlayerKda(player)).toBe(12);
    });

    it('handles missing player data safely', () => {
      expect(getMatchPlayerKda(undefined)).toBe(0);
      expect(
        getMatchPlayerKda(createPlayerWithStats({ kills: undefined, deaths: undefined, assists: undefined })),
      ).toBe(0);
    });
  });
});
