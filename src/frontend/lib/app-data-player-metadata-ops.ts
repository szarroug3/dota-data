import { processPlayerRank } from '@/utils/player-statistics';

import type { Hero, Match, Player, PlayerMatchData, Team } from './app-data-types';
import type { StoredHero, StoredPlayerData } from './storage-manager';

/**
 * Parse rank string to extract rank_tier and leaderboard_rank
 * Handles formats like "Legend 5", "Immortal #1493", "Ancient 3", etc.
 * Returns { rankTier: number, leaderboardRank?: number }
 */
function parseRankFromString(rank: string): { rankTier: number; leaderboardRank?: number } {
  const normalized = rank.toLowerCase().trim();

  // Base tier mapping
  const tiers: Record<string, number> = {
    herald: 10,
    guardian: 20,
    crusader: 30,
    archon: 40,
    legend: 50,
    ancient: 60,
    divine: 70,
    immortal: 80,
  };

  // Find the base tier
  const tier = Object.keys(tiers).find((key) => normalized.includes(key));
  if (!tier) {
    return { rankTier: 0 };
  }

  const baseTier = tiers[tier];

  // Handle immortal rank (e.g., "Immortal #1493" -> rank_tier: 80, leaderboard_rank: 1493)
  if (tier === 'immortal') {
    const rankMatch = normalized.match(/#(\d+)/);
    if (rankMatch) {
      const immortalRank = parseInt(rankMatch[1], 10);
      return { rankTier: 80, leaderboardRank: immortalRank };
    }
    return { rankTier: 80 };
  }

  // Handle other ranks with star count (e.g., "Legend 5" -> rank_tier: 54)
  const starMatch = normalized.match(/\b(\d+)\b/);
  if (starMatch) {
    const stars = parseInt(starMatch[1], 10);
    if (stars >= 1 && stars <= 5) {
      return { rankTier: baseTier + stars };
    }
  }

  return { rankTier: baseTier };
}

interface PlayerAggregate {
  metadata: StoredPlayerData;
  wins: number;
  games: number;
  heroCounts: Map<number, number>;
}

export interface AppDataPlayerMetadataContext {
  _players: Map<number, Player>;
  _matches: Map<number, Match>;
  heroes: Map<number, Hero>;
  getTeam(teamKey: string): Team | undefined;
  updateTeamsRef(): void;
  saveToStorage(): void;
}

export function updateTeamPlayersMetadata(
  appData: AppDataPlayerMetadataContext,
  teamKey: string,
  options?: { skipSave?: boolean },
): void {
  const team = appData.getTeam(teamKey);
  if (!team) return;

  team.players = buildTeamPlayerMetadata(appData, team);

  if (!options?.skipSave) {
    appData.updateTeamsRef();
    appData.saveToStorage();
  }
}

function buildTeamPlayerMetadata(appData: AppDataPlayerMetadataContext, team: Team): Map<number, StoredPlayerData> {
  const aggregates = new Map<number, PlayerAggregate>();

  addManualPlayersToAggregates(appData, team, aggregates);
  addMatchPlayersToAggregates(appData, team, aggregates);
  addFallbackPlayersFromStoredData(appData, team, aggregates);
  finalizePlayerAggregates(appData, aggregates);

  const updatedPlayers = new Map<number, StoredPlayerData>();
  aggregates.forEach((aggregate, playerId) => {
    updatedPlayers.set(playerId, {
      ...aggregate.metadata,
      topHeroes: aggregate.metadata.topHeroes.map((hero) => ({ ...hero })),
    });
  });

  return updatedPlayers;
}

function addManualPlayersToAggregates(
  appData: AppDataPlayerMetadataContext,
  team: Team,
  aggregates: Map<number, PlayerAggregate>,
): void {
  team.players.forEach((storedPlayer, playerId) => {
    if (playerId > 0 && storedPlayer.accountId > 0 && storedPlayer.isManual) {
      ensurePlayerAggregate(appData, aggregates, playerId, storedPlayer);
    }
  });
}

function addMatchPlayersToAggregates(
  appData: AppDataPlayerMetadataContext,
  team: Team,
  aggregates: Map<number, PlayerAggregate>,
): void {
  team.matches.forEach((matchMeta, matchId) => {
    const match = appData._matches.get(matchId);
    if (!match || !matchMeta.side) {
      return;
    }

    const didWin = matchMeta.result === 'won';
    const players = match.players?.[matchMeta.side] || [];

    players.forEach((playerMatchData) => {
      applyMatchPlayerToAggregates(appData, team, aggregates, playerMatchData, didWin);
    });
  });
}

function addFallbackPlayersFromStoredData(
  appData: AppDataPlayerMetadataContext,
  team: Team,
  aggregates: Map<number, PlayerAggregate>,
): void {
  team.players.forEach((storedPlayer, playerId) => {
    if (playerId <= 0 || storedPlayer.accountId <= 0) {
      return;
    }

    if (aggregates.has(playerId)) {
      return;
    }

    const aggregate = ensurePlayerAggregate(appData, aggregates, playerId, storedPlayer);
    aggregate.metadata.games = storedPlayer.games;
    aggregate.metadata.winRate = storedPlayer.winRate;
    aggregate.metadata.topHeroes = storedPlayer.topHeroes.map((hero) => ({ ...hero }));
    aggregate.metadata.isManual = storedPlayer.isManual;
    aggregate.metadata.isHidden = storedPlayer.isHidden;
  });
}

function finalizePlayerAggregates(
  appData: AppDataPlayerMetadataContext,
  aggregates: Map<number, PlayerAggregate>,
): void {
  for (const aggregate of aggregates.values()) {
    finalizeAggregate(appData, aggregate);
  }
}

function finalizeAggregate(appData: AppDataPlayerMetadataContext, aggregate: PlayerAggregate): void {
  const player = appData._players.get(aggregate.metadata.accountId);
  if (player) {
    aggregate.metadata.games = player.overallStats.totalGames;
    aggregate.metadata.winRate = Number(player.overallStats.winRate.toFixed(2));
    aggregate.metadata.topHeroes = player.heroStats
      .slice()
      .sort((a, b) => b.games - a.games)
      .slice(0, 5)
      .map((hero) => heroIdToStoredHero(hero.heroId, appData.heroes));
    hydrateAggregateFromPlayer(aggregate, player);
    return;
  }

  if (aggregate.games > 0) {
    aggregate.metadata.games = aggregate.games;
    aggregate.metadata.winRate = Number(((aggregate.wins / aggregate.games) * 100).toFixed(2));

    if (aggregate.heroCounts.size > 0) {
      aggregate.metadata.topHeroes = Array.from(aggregate.heroCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([heroId]) => heroIdToStoredHero(heroId, appData.heroes));
    }

    return;
  }
}

function applyMatchPlayerToAggregates(
  appData: AppDataPlayerMetadataContext,
  team: Team,
  aggregates: Map<number, PlayerAggregate>,
  playerMatchData: PlayerMatchData,
  didWin: boolean,
): void {
  const playerId = playerMatchData.accountId;
  if (!playerId || playerId <= 0) {
    return;
  }

  const existingStored = team.players.get(playerId);
  const aggregate = ensurePlayerAggregate(appData, aggregates, playerId, existingStored);

  if (
    playerMatchData.playerName &&
    (aggregate.metadata.name === 'Unknown Player' || aggregate.metadata.name === `Player ${playerId}`)
  ) {
    aggregate.metadata.name = playerMatchData.playerName;
  }

  aggregate.games += 1;
  if (didWin) {
    aggregate.wins += 1;
  }

  const heroId = playerMatchData.hero?.id;
  if (typeof heroId === 'number') {
    aggregate.heroCounts.set(heroId, (aggregate.heroCounts.get(heroId) ?? 0) + 1);
  }
}

function createPlayerAggregate(playerId: number, existingData?: StoredPlayerData): PlayerAggregate {
  return {
    metadata: buildPlayerMetadataSkeleton(playerId, existingData),
    wins: 0,
    games: 0,
    heroCounts: new Map<number, number>(),
  };
}

function buildPlayerMetadataSkeleton(playerId: number, existingData?: StoredPlayerData): StoredPlayerData {
  if (existingData) {
    // If existing data has rank_tier, use it; otherwise parse from rank string
    const rankInfo =
      existingData.rank_tier !== undefined
        ? { rankTier: existingData.rank_tier, leaderboardRank: existingData.leaderboard_rank }
        : parseRankFromString(existingData.rank);

    return {
      ...existingData,
      accountId: playerId,
      topHeroes: existingData.topHeroes.map((hero) => ({ ...hero })),
      rank_tier: rankInfo.rankTier,
      leaderboard_rank: rankInfo.leaderboardRank,
    };
  }

  return {
    accountId: playerId,
    name: 'Unknown Player',
    rank: 'Unknown',
    rank_tier: 0,
    leaderboard_rank: undefined,
    games: 0,
    winRate: 0,
    topHeroes: [],
    avatar: '',
    isManual: false,
    isHidden: false,
  };
}

function hydrateAggregateFromPlayer(aggregate: PlayerAggregate, player: Player): void {
  assignAvatarFromPlayer(aggregate, player);
  assignRankFromPlayer(aggregate, player);
  assignNameFromPlayer(aggregate, player);
}

function assignAvatarFromPlayer(aggregate: PlayerAggregate, player: Player): void {
  const avatar = player.profile.avatarfull || player.profile.avatar || '';
  if (avatar) {
    aggregate.metadata.avatar = avatar;
  }
}

function assignRankFromPlayer(aggregate: PlayerAggregate, player: Player): void {
  const rank = processPlayerRank(player.profile.rank_tier, player.profile.leaderboard_rank)?.displayText;
  if (rank) {
    aggregate.metadata.rank = rank;
    // Also set the parsed rank information
    aggregate.metadata.rank_tier = player.profile.rank_tier;
    aggregate.metadata.leaderboard_rank = player.profile.leaderboard_rank;
  }
}

function assignNameFromPlayer(aggregate: PlayerAggregate, player: Player): void {
  const preferredName = player.profile.personaname || player.profile.name;
  if (preferredName) {
    aggregate.metadata.name = preferredName;
  }
}

function ensurePlayerAggregate(
  appData: AppDataPlayerMetadataContext,
  aggregates: Map<number, PlayerAggregate>,
  playerId: number,
  existingData?: StoredPlayerData,
): PlayerAggregate {
  if (playerId <= 0 || (existingData && existingData.accountId <= 0)) {
    throw new Error('ensurePlayerAggregate called with invalid player id');
  }

  let aggregate = aggregates.get(playerId);
  if (!aggregate) {
    aggregate = createPlayerAggregate(playerId, existingData);
    aggregates.set(playerId, aggregate);
  }

  const player = appData._players.get(playerId);
  if (player) {
    hydrateAggregateFromPlayer(aggregate, player);
  }

  return aggregate;
}

function heroIdToStoredHero(heroId: number, heroesMap: Map<number, Hero>): StoredHero {
  const hero = heroesMap.get(heroId);
  return {
    id: heroId,
    name: hero?.name || `npc_dota_hero_${heroId}`,
    localizedName: hero?.localizedName || `Hero ${heroId}`,
    imageUrl: hero?.imageUrl || '',
  };
}
