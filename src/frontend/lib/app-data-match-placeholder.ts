import type {
  Hero,
  HeroPick,
  Match,
  PlayerMatchData,
  Team,
} from './app-data-types';
import type { StoredHero, StoredMatchData } from './storage-manager';

// eslint-disable-next-line complexity
export function createPlaceholderMatch(
  team: Team,
  matchId: number,
  metadata: StoredMatchData,
  heroesMap: Map<number, Hero>,
): Match {
  const side = metadata.side ?? 'radiant';
  const teamHeroes = metadata.heroes || [];
  const heroObjects = teamHeroes.map((stored) => resolveStoredHero(stored, heroesMap));

  const radiantName = side === 'radiant' ? team.name : metadata.opponentName;
  const direName = side === 'dire' ? team.name : metadata.opponentName;

  const radiantPicks: HeroPick[] =
    side === 'radiant'
      ? heroObjects.map((hero, index) => ({ hero, order: index }))
      : [];
  const direPicks: HeroPick[] =
    side === 'dire'
      ? heroObjects.map((hero, index) => ({ hero, order: index }))
      : [];

  const teamPlayers = heroObjects.map((hero, index) => createPlaceholderPlayer(hero, index, matchId));

  const players =
    side === 'radiant'
      ? { radiant: teamPlayers, dire: [] as PlayerMatchData[] }
      : { radiant: [] as PlayerMatchData[], dire: teamPlayers };

  const winningSide = determineWinningSide(side, metadata.result);

  const pickOrderValue =
    metadata.pickOrder === 'first' || metadata.pickOrder === 'second'
      ? metadata.pickOrder
      : null;
  const pickOrder = {
    radiant: side === 'radiant' ? pickOrderValue : invertPickOrder(pickOrderValue),
    dire: side === 'dire' ? pickOrderValue : invertPickOrder(pickOrderValue),
  };

  return {
    id: matchId,
    date: metadata.date,
    duration: metadata.duration,
    radiant: { id: undefined, name: radiantName },
    dire: { id: undefined, name: direName },
    draft: {
      radiantPicks,
      direPicks,
      radiantBans: [],
      direBans: [],
    },
    players,
    statistics: {
      radiantScore: winningSide === 'radiant' ? 1 : 0,
      direScore: winningSide === 'dire' ? 1 : 0,
      goldAdvantage: { times: [], radiantGold: [], direGold: [] },
      experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
    },
    events: [],
    result: winningSide,
    pickOrder,
  };
}

function createPlaceholderPlayer(hero: Hero, _index: number, _matchId: number): PlayerMatchData {
  return {
    accountId: 0,
    playerName: hero.localizedName || hero.name,
    hero,
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

function resolveStoredHero(stored: StoredHero, heroesMap: Map<number, Hero>): Hero {
  const reference = heroesMap.get(stored.id);
  if (reference) {
    return reference;
  }

  return {
    id: stored.id,
    name: stored.name,
    localizedName: stored.localizedName,
    imageUrl: stored.imageUrl,
  } as Hero;
}

function determineWinningSide(side: 'radiant' | 'dire', result: 'won' | 'lost'): 'radiant' | 'dire' {
  if (result === 'won') {
    return side;
  }
  return side === 'radiant' ? 'dire' : 'radiant';
}

function invertPickOrder(order: 'first' | 'second' | null): 'first' | 'second' | null {
  if (order === 'first') return 'second';
  if (order === 'second') return 'first';
  return null;
}
