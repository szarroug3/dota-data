/**
 * Player Statistics Processing
 *
 * Utility functions for processing player data into detailed statistics
 */

import type { Hero } from '@/frontend/lib/app-data-types';
import type { OpenDotaPlayerHero } from '@/types/external-apis';

// ============================================================================
// RANK PROCESSING
// ============================================================================

export interface PlayerRank {
  medal: string;
  stars: number;
  isImmortal: boolean;
  immortalRank?: number;
  displayText: string;
}

/**
 * Process player rank from rank_tier and leaderboard_rank
 */
export function processPlayerRank(rankTier: number, leaderboardRank?: number): PlayerRank | null {
  if (rankTier === 0) {
    return null;
  }

  // Immortal ranks (80+)
  if (rankTier >= 80) {
    const immortalRank = rankTier - 80;

    // If leaderboard_rank is available and > 0, use it for the display
    if (leaderboardRank && leaderboardRank > 0) {
      return {
        medal: 'Immortal',
        stars: 0,
        isImmortal: true,
        immortalRank: leaderboardRank,
        displayText: `Immortal #${leaderboardRank}`,
      };
    }

    // Fallback to the calculated immortal rank
    return {
      medal: 'Immortal',
      stars: 0,
      isImmortal: true,
      immortalRank,
      displayText: immortalRank > 0 ? `Immortal ${immortalRank}` : 'Immortal',
    };
  }

  // Herald to Divine ranks (1-79)
  const medalTiers = ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine'];

  const tier = Math.floor(rankTier / 10) - 1;
  const stars = rankTier % 10;

  if (tier >= 0 && tier < medalTiers.length) {
    const medal = medalTiers[tier];
    return {
      medal,
      stars,
      isImmortal: false,
      // Display medal only; stars are rendered as icons in UI (no numbers)
      displayText: medal,
    };
  }

  return null;
}

// ============================================================================
// HERO USAGE PROCESSING
// ============================================================================

export interface HeroUsage {
  hero: Hero;
  games: number;
  wins: number;
  winRate: number;
  averageKDA?: number;
  roles?: string[];
}

/**
 * Get top heroes by games played
 */
export function getTopHeroesByGames(
  heroes: OpenDotaPlayerHero[],
  heroesData: Record<string, Hero>,
  limit: number = 5,
): HeroUsage[] {
  return heroes
    .sort((a, b) => b.games - a.games)
    .slice(0, limit)
    .map((hero) => {
      const heroData = heroesData[hero.hero_id.toString()];
      return {
        hero: heroData || {
          id: hero.hero_id.toString(),
          name: `npc_dota_hero_${hero.hero_id}`,
          localizedName: `Hero ${hero.hero_id}`,
          primaryAttribute: 'strength',
          attackType: 'melee',
          roles: [],
          imageUrl: '',
        },
        games: hero.games,
        wins: hero.win,
        winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
      };
    });
}

/**
 * Get top heroes by games played from recent matches
 */
export function getTopHeroesFromRecentMatches(
  recentMatches: Array<{
    hero_id: number;
    player_slot: number;
    radiant_win: boolean;
    kills: number;
    deaths: number;
    assists: number;
  }>,
  heroesData: Record<string, Hero>,
  limit: number = 5,
): HeroUsage[] {
  if (!Array.isArray(recentMatches) || recentMatches.length === 0) {
    return [];
  }

  // Aggregate usage per hero from recent matches
  const heroUsageAccumulator: Record<string, { games: number; wins: number; kdaSum: number; kdaCount: number }> = {};

  for (const match of recentMatches) {
    const heroId = match.hero_id.toString();
    const isRadiantPlayer = match.player_slot < 128; // OpenDota convention
    const isWin = match.radiant_win ? isRadiantPlayer : !isRadiantPlayer;

    if (!heroUsageAccumulator[heroId]) {
      heroUsageAccumulator[heroId] = { games: 0, wins: 0, kdaSum: 0, kdaCount: 0 };
    }

    heroUsageAccumulator[heroId].games += 1;
    if (isWin) {
      heroUsageAccumulator[heroId].wins += 1;
    }

    // Track average KDA per hero (optional field on HeroUsage)
    const kda = match.deaths > 0 ? (match.kills + match.assists) / match.deaths : match.kills + match.assists;
    heroUsageAccumulator[heroId].kdaSum += kda;
    heroUsageAccumulator[heroId].kdaCount += 1;
  }

  // Build sorted list
  const usages: HeroUsage[] = Object.entries(heroUsageAccumulator)
    .map(([heroId, stats]) => {
      const heroData = heroesData[heroId];
      const gamesPlayed = stats.games;
      const wins = stats.wins;
      const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
      const averageKDA = stats.kdaCount > 0 ? stats.kdaSum / stats.kdaCount : undefined;

      return {
        hero: heroData || {
          id: heroId,
          name: `npc_dota_hero_${heroId}`,
          localizedName: `Hero ${heroId}`,
          primaryAttribute: 'strength',
          attackType: 'melee',
          roles: [],
          imageUrl: '',
        },
        games: gamesPlayed,
        wins,
        winRate,
        averageKDA,
      };
    })
    .sort((a, b) => b.games - a.games)
    .slice(0, limit);

  return usages;
}

/**
 * Get top heroes by win rate (minimum games threshold)
 */
export function getTopHeroesByWinRate(
  heroes: OpenDotaPlayerHero[],
  heroesData: Record<string, Hero>,
  minGames: number = 5,
  limit: number = 5,
): HeroUsage[] {
  return heroes
    .filter((hero) => hero.games >= minGames)
    .sort((a, b) => {
      const aWinRate = a.games > 0 ? a.win / a.games : 0;
      const bWinRate = b.games > 0 ? b.win / b.games : 0;
      return bWinRate - aWinRate;
    })
    .slice(0, limit)
    .map((hero) => {
      const heroData = heroesData[hero.hero_id.toString()];
      return {
        hero: heroData || {
          id: hero.hero_id.toString(),
          name: `npc_dota_hero_${hero.hero_id}`,
          localizedName: `Hero ${hero.hero_id}`,
          primaryAttribute: 'strength',
          attackType: 'melee',
          roles: [],
          imageUrl: '',
        },
        games: hero.games,
        wins: hero.win,
        winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
      };
    });
}
