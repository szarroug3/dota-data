import { createPlaceholderMatch } from '@/frontend/lib/app-data/app-data-match-placeholder';
import type { Hero, Team } from '@/frontend/lib/app-data/app-data-types';
import type { StoredHero, StoredMatchData } from '@/frontend/lib/storage/storage-manager';

const baseTeam: Team = {
  id: '1-1',
  teamId: 1,
  leagueId: 1,
  name: 'Radiant Team',
  leagueName: 'League',
  timeAdded: 0,
  matches: new Map(),
  players: new Map(),
  createdAt: 0,
  updatedAt: 0,
  isLoading: false,
  highPerformingHeroes: new Set(),
};

function createStoredHero(id: number): StoredHero {
  return {
    id,
    name: `stored_${id}`,
    localizedName: `Stored ${id}`,
    imageUrl: `/stored/${id}.png`,
  };
}

function createStoredMatchData(overrides: Partial<StoredMatchData>): StoredMatchData {
  return {
    matchId: 123,
    result: 'won',
    opponentName: 'Opponent',
    side: 'radiant',
    duration: 1800,
    date: '2025-01-01T00:00:00.000Z',
    pickOrder: 'first',
    heroes: [createStoredHero(1)],
    isManual: false,
    isHidden: false,
    ...overrides,
  };
}

function createHeroReference(id: number): Hero {
  return {
    id,
    name: `ref_${id}`,
    localizedName: `Ref ${id}`,
    imageUrl: `/ref/${id}.png`,
  };
}

describe('createPlaceholderMatch', () => {
  it('builds a radiant placeholder with picks, players, and pick order', () => {
    const metadata = createStoredMatchData({
      side: 'radiant',
      result: 'won',
      pickOrder: 'first',
    });
    const heroRef = createHeroReference(1);
    const heroesMap = new Map<number, Hero>([[1, heroRef]]);

    const placeholder = createPlaceholderMatch(baseTeam, metadata.matchId, metadata, heroesMap);

    expect(placeholder.radiant.name).toBe(baseTeam.name);
    expect(placeholder.dire.name).toBe(metadata.opponentName);
    expect(placeholder.pickOrder).toEqual({ radiant: 'first', dire: 'second' });
    expect(placeholder.result).toBe('radiant');

    const radiantPicks = placeholder.draft?.radiantPicks ?? [];
    expect(radiantPicks).toHaveLength(1);
    expect(radiantPicks[0]?.hero).toEqual(heroRef);

    expect(placeholder.players.radiant).toHaveLength(1);
    expect(placeholder.players.dire).toHaveLength(0);
  });

  it('builds a dire placeholder with inverted names and null pick order', () => {
    const metadata = createStoredMatchData({
      matchId: 456,
      side: 'dire',
      result: 'lost',
      pickOrder: 'third',
      heroes: [createStoredHero(2), createStoredHero(3)],
    });
    const heroesMap = new Map<number, Hero>();

    const placeholder = createPlaceholderMatch(baseTeam, metadata.matchId, metadata, heroesMap);

    expect(placeholder.radiant.name).toBe(metadata.opponentName);
    expect(placeholder.dire.name).toBe(baseTeam.name);
    expect(placeholder.pickOrder).toEqual({ radiant: null, dire: null });
    expect(placeholder.result).toBe('radiant');

    expect(placeholder.players.radiant).toHaveLength(0);
    expect(placeholder.players.dire).toHaveLength(2);

    const direPicks = placeholder.draft?.direPicks ?? [];
    expect(direPicks).toHaveLength(2);
  });
});
