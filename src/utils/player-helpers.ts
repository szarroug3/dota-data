/**
 * Player helper functions
 *
 * Utility functions for player data processing and error handling
 */

import type { Player } from '@/frontend/lib/app-data-types';

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Update player error in state
 */
export function updatePlayerError(
  playerId: number,
  errorMessage: string,
  state: {
    players: Map<number, Player>;
    setPlayers: React.Dispatch<React.SetStateAction<Map<number, Player>>>;
  },
) {
  const existingPlayer = state.players.get(playerId);

  if (existingPlayer) {
    // Update existing player with error
    const updatedPlayer: Player = {
      ...existingPlayer,
      error: errorMessage,
      isLoading: false,
    };

    state.setPlayers((prev) => {
      const newPlayers = new Map(prev);
      newPlayers.set(playerId, updatedPlayer);
      return newPlayers;
    });
  } else {
    // Create minimal player object with error
    const errorPlayer: Player = {
      ...createInitialPlayerData(playerId),
      error: errorMessage,
      isLoading: false,
    };

    state.setPlayers((prev) => {
      const newPlayers = new Map(prev);
      newPlayers.set(playerId, errorPlayer);
      return newPlayers;
    });
  }
}

/**
 * Set player loading state
 */
export function setPlayerLoading(
  playerId: number,
  isLoading: boolean,
  state: {
    players: Map<number, Player>;
    setPlayers: React.Dispatch<React.SetStateAction<Map<number, Player>>>;
  },
) {
  const existingPlayer = state.players.get(playerId);

  if (existingPlayer) {
    // Update existing player with loading state
    const updatedPlayer: Player = {
      ...existingPlayer,
      isLoading,
    };

    state.setPlayers((prev) => {
      const newPlayers = new Map(prev);
      newPlayers.set(playerId, updatedPlayer);
      return newPlayers;
    });
  }
}

// ============================================================================
// PLAYER PROCESSING HELPERS
// ============================================================================

/**
 * Create initial player data with loading state
 */
export function createInitialPlayerData(playerId: number): Player {
  return {
    accountId: playerId,
    profile: {
      name: `Loading ${playerId}`,
      personaname: `Loading ${playerId}`,
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
    isLoading: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
