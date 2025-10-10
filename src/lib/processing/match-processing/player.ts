import type { Hero, Item, PlayerMatchData, PlayerRole } from '@/frontend/lib/app-data-types';
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

/**
 * Get player's hero with fallback
 */
function getPlayerHero(player: OpenDotaMatchPlayer, heroes: Record<string, Hero>): Hero {
  const hero = heroes[player.hero_id?.toString() as keyof typeof heroes];
  return (
    hero || {
      id: String(player.hero_id ?? ''),
      name: '',
      localizedName: `Hero ${player.hero_id ?? ''}`,
      primaryAttribute: 'strength',
      attackType: 'melee',
      roles: [],
      imageUrl: '',
    }
  );
}

/**
 * Convert string-keyed items to number-keyed for lookup
 */
function convertItemsToNumberKeyed(items: Record<string, Item>): Record<number, Item> {
  return Object.keys(items).reduce(
    (acc, key) => {
      const num = Number(key);
      if (Number.isFinite(num)) {
        const itemKey = key as keyof typeof items;
        const item = items[itemKey] as unknown as Item;

        if (item && typeof item === 'object' && 'id' in item && 'name' in item) {
          acc[num] = item;
        }
      }
      return acc;
    },
    {} as Record<number, Item>,
  );
}

/**
 * Get player's role information
 */
function getPlayerRole(
  player: OpenDotaMatchPlayer,
  roleMap: Record<string, PlayerRole>,
): { role: string; lane: number } | undefined {
  const accountId = typeof player.account_id === 'number' ? player.account_id : 0;
  const roleKey = accountId.toString();

  if (!roleKey || !roleMap[roleKey]) return undefined;

  return { role: roleMap[roleKey] || 'Unknown', lane: 0 };
}

export function convertPlayer(
  player: OpenDotaMatchPlayer,
  roleMap: Record<string, PlayerRole>,
  items: Record<string, Item>,
  heroes: Record<string, Hero>,
): PlayerMatchData {
  const playerHero = getPlayerHero(player, heroes);
  const numberKeyedItems = convertItemsToNumberKeyed(items);
  const playerItems = getPlayerItems(player, numberKeyedItems);
  const stats = createPlayerStats(player);
  const heroStats = createHeroStats(player);
  const role = getPlayerRole(player, roleMap);

  const accountId = typeof player.account_id === 'number' ? player.account_id : 0;

  return {
    accountId,
    playerName: player.personaname || `Player ${accountId}`,
    hero: playerHero,
    role,
    items: playerItems,
    stats,
    heroStats,
  };
}
