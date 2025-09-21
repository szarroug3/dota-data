import type { Hero, Item } from '@/types/contexts/constants-context-value';
import type { PlayerMatchData } from '@/types/contexts/match-context-value';
import type { PlayerRole } from '@/types/contexts/team-context-value';
import type { OpenDotaMatchPlayer } from '@/types/external-apis';

export function getPlayerItems(player: OpenDotaMatchPlayer, items: Record<number, Item>): Item[] {
  const itemIds = [player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5];
  return itemIds
    .filter((itemId) => itemId !== 0)
    .map((itemId) => {
      const item = items[itemId];
      return item;
    })
    .filter(Boolean);
}

function getBasicStats(player: OpenDotaMatchPlayer) {
  return {
    kills: player.kills || 0,
    deaths: player.deaths || 0,
    assists: player.assists || 0,
  };
}

function getFarmingStats(player: OpenDotaMatchPlayer) {
  return {
    lastHits: player.last_hits || 0,
    denies: player.denies || 0,
    gpm: player.gold_per_min || 0,
    xpm: player.xp_per_min || 0,
  };
}

function getEconomicStats(player: OpenDotaMatchPlayer) {
  return {
    netWorth: player.net_worth || player.total_gold || 0,
    level: player.level || 1,
  };
}

function createPlayerStats(player: OpenDotaMatchPlayer): PlayerMatchData['stats'] {
  const basicStats = getBasicStats(player);
  const farmingStats = getFarmingStats(player);
  const economicStats = getEconomicStats(player);
  return { ...basicStats, ...farmingStats, ...economicStats };
}

function createHeroStats(player: OpenDotaMatchPlayer): PlayerMatchData['heroStats'] {
  return {
    damageDealt: player.hero_damage || 0,
    healingDone: player.hero_healing || 0,
    towerDamage: player.tower_damage || 0,
  };
}

export function convertPlayer(
  player: OpenDotaMatchPlayer,
  roleMap: Record<string, PlayerRole>,
  items: Record<string, Item>,
  heroes: Record<string, Hero>,
): PlayerMatchData {
  const hero = heroes[player.hero_id?.toString() as keyof typeof heroes];
  const playerHero: Hero = hero || {
    id: String(player.hero_id ?? ''),
    name: '',
    localizedName: `Hero ${player.hero_id ?? ''}`,
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: [],
    imageUrl: '',
  };

  // Convert string-keyed items to number-keyed for lookup
  const numberKeyedItems: Record<number, Item> = Object.keys(items).reduce(
    (acc, key) => {
      const num = Number(key);
      if (Number.isFinite(num)) acc[num] = items[key as keyof typeof items] as Item;
      return acc;
    },
    {} as Record<number, Item>,
  );
  const playerItems = getPlayerItems(player, numberKeyedItems);
  const stats = createPlayerStats(player);
  const heroStats = createHeroStats(player);

  const accountId = typeof player.account_id === 'number' ? player.account_id : 0;
  const roleKey = typeof player.account_id === 'number' ? player.account_id.toString() : '';

  return {
    accountId,
    playerName: player.personaname || (accountId ? `Player ${accountId}` : 'Unknown Player'),
    hero: playerHero,
    role: roleKey ? roleMap[roleKey] : undefined,
    items: playerItems,
    stats,
    heroStats,
  };
}
