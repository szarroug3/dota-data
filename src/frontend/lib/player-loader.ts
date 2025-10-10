/**
 * Player Loader
 *
 * Handles fetching and processing player data for AppData.
 * Includes in-flight request deduplication to prevent duplicate API calls.
 */

import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

import type { Player } from './app-data-types';

// ============================================================================
// IN-FLIGHT REQUEST CACHE
// ============================================================================

const inFlightPlayerRequests = new Map<number, Promise<Player | null>>();

// ============================================================================
// FETCH PLAYER DATA
// ============================================================================

/**
 * Fetches player data from the API
 *
 * @param playerId - Player account ID to fetch
 * @returns Player data or null on error
 */
async function fetchPlayerData(playerId: number): Promise<OpenDotaPlayerComprehensive | null> {
  try {
    const response = await fetch(`/api/players/${playerId}`);

    if (!response.ok) {
      console.error(`Failed to fetch player ${playerId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as OpenDotaPlayerComprehensive;
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error);
    return null;
  }
}

// ============================================================================
// PROCESS PLAYER DATA
// ============================================================================

/**
 * Process hero statistics from OpenDota data
 * Note: Only stores basic stats from OpenDota. Detailed stats (kills, deaths, GPM, etc.)
 * are computed on-demand from match data in the UI components.
 */
function processHeroStats(heroes: OpenDotaPlayerComprehensive['heroes']) {
  return (
    heroes?.map((hero) => ({
      heroId: hero.hero_id,
      games: hero.games,
      wins: hero.win,
      lastPlayed: hero.last_played,
    })) || []
  );
}

/**
 * Calculate overall player statistics
 */
function calculateOverallStats(wl: OpenDotaPlayerComprehensive['wl']) {
  const wins = wl?.win || 0;
  const losses = wl?.lose || 0;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  return { wins, losses, totalGames, winRate };
}

/**
 * Process raw OpenDota player data into AppData Player format
 *
 * @param playerData - Raw OpenDota player data
 * @returns Processed Player object
 */
export function processPlayerData(playerData: OpenDotaPlayerComprehensive): Player {
  const now = Date.now();
  const accountId = playerData.profile.profile.account_id;

  return {
    accountId,
    profile: {
      name: playerData.profile.profile.name || `Player ${accountId}`,
      personaname: playerData.profile.profile.personaname || `Player ${accountId}`,
      avatar: playerData.profile.profile.avatar,
      avatarfull: playerData.profile.profile.avatarfull,
      profileurl: playerData.profile.profile.profileurl,
      rank_tier: playerData.profile.rank_tier || 0,
      leaderboard_rank: playerData.profile.leaderboard_rank,
    },
    heroStats: processHeroStats(playerData.heroes),
    overallStats: calculateOverallStats(playerData.wl),
    recentMatchIds: playerData.recentMatches?.map((match) => match.match_id) || [],
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// FETCH AND PROCESS
// ============================================================================

/**
 * Fetches and processes player data with in-flight request deduplication
 *
 * @param playerId - Player account ID to fetch
 * @returns Processed Player object or null on error
 */
export async function fetchAndProcessPlayer(playerId: number): Promise<Player | null> {
  // Check if request is already in flight
  const existingRequest = inFlightPlayerRequests.get(playerId);
  if (existingRequest) {
    return existingRequest;
  }

  // Create new request
  const request = (async () => {
    try {
      const playerData = await fetchPlayerData(playerId);

      if (!playerData) {
        const now = Date.now();
        return {
          accountId: playerId,
          profile: {
            name: `Player ${playerId}`,
            personaname: `Player ${playerId}`,
            rank_tier: 0,
          },
          heroStats: [],
          overallStats: {
            wins: 0,
            losses: 0,
            totalGames: 0,
            winRate: 0,
          },
          recentMatchIds: [],
          error: 'Failed to fetch player data',
          createdAt: now,
          updatedAt: now,
        };
      }

      return processPlayerData(playerData);
    } finally {
      // Remove from in-flight cache when done
      inFlightPlayerRequests.delete(playerId);
    }
  })();

  // Store in cache
  inFlightPlayerRequests.set(playerId, request);

  return request;
}
