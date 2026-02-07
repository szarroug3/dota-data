import type { Hero, HeroPick, Match, PlayerMatchData, Team } from '@/frontend/lib/app-data/app-data-types';
import type { StoredHero, StoredMatchData } from '@/frontend/lib/storage/storage-manager';

export function createPlaceholderMatch(
  team: Team,
  matchId: number,
  metadata: StoredMatchData,
  heroesMap: Map<number, Hero>,
): Match {
  const side = metadata.side ?? 'radiant';
  const heroObjects = resolveTeamHeroes(metadata, heroesMap);
  const { radiantName, direName } = resolveTeamNames(side, team.name, metadata.opponentName);
  const { radiantPicks, direPicks } = buildHeroPicks(side, heroObjects);
  const players = buildPlaceholderPlayers(side, heroObjects);
  const winningSide = determineWinningSide(side, metadata.result);
  const pickOrder = buildPickOrder(side, metadata.pickOrder);

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

function resolveTeamHeroes(metadata: StoredMatchData, heroesMap: Map<number, Hero>): Hero[] {
  const teamHeroes = metadata.heroes || [];
  return teamHeroes.map((stored) => resolveStoredHero(stored, heroesMap));
}

function resolveTeamNames(
  side: 'radiant' | 'dire',
  teamName: string,
  opponentName: string,
): { radiantName: string; direName: string } {
  return {
    radiantName: side === 'radiant' ? teamName : opponentName,
    direName: side === 'dire' ? teamName : opponentName,
  };
}

function buildHeroPicks(side: 'radiant' | 'dire', heroes: Hero[]): { radiantPicks: HeroPick[]; direPicks: HeroPick[] } {
  if (side === 'radiant') {
    return {
      radiantPicks: heroes.map((hero, index) => ({ hero, order: index })),
      direPicks: [],
    };
  }
  return {
    radiantPicks: [],
    direPicks: heroes.map((hero, index) => ({ hero, order: index })),
  };
}

function buildPlaceholderPlayers(side: 'radiant' | 'dire', heroes: Hero[]): Match['players'] {
  const teamPlayers = heroes.map((hero) => createPlaceholderPlayer(hero));
  if (side === 'radiant') {
    return { radiant: teamPlayers, dire: [] };
  }
  return { radiant: [], dire: teamPlayers };
}

function buildPickOrder(side: 'radiant' | 'dire', pickOrder: StoredMatchData['pickOrder']): Match['pickOrder'] {
  const pickOrderValue = pickOrder === 'first' || pickOrder === 'second' ? pickOrder : null;
  return {
    radiant: side === 'radiant' ? pickOrderValue : invertPickOrder(pickOrderValue),
    dire: side === 'dire' ? pickOrderValue : invertPickOrder(pickOrderValue),
  };
}

function createPlaceholderPlayer(hero: Hero): PlayerMatchData {
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
