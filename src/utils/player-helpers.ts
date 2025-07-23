/**
 * Player helper functions
 * 
 * Utility functions for player data processing and error handling
 */

import type { Player } from '@/types/contexts/player-context-value';

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
  }
) {
  const existingPlayer = state.players.get(playerId);
  
  if (existingPlayer) {
    // Update existing player with error
    const updatedPlayer: Player = {
      ...existingPlayer,
      error: errorMessage,
      isLoading: false
    };
    
    state.setPlayers(prev => {
      const newPlayers = new Map(prev);
      newPlayers.set(playerId, updatedPlayer);
      return newPlayers;
    });
  } else {
    // Create minimal player object with error
    const errorPlayer: Player = {
      ...createInitialPlayerData(playerId),
      error: errorMessage,
      isLoading: false
    };
    
    state.setPlayers(prev => {
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
  }
) {
  const existingPlayer = state.players.get(playerId);
  
  if (existingPlayer) {
    // Update existing player with loading state
    const updatedPlayer: Player = {
      ...existingPlayer,
      isLoading
    };
    
    state.setPlayers(prev => {
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
    profile: {
      profile: {
        account_id: playerId,
        personaname: `Loading ${playerId}`,
        name: `Loading ${playerId}`,
        plus: false,
        cheese: 0,
        steamid: '',
        avatar: '',
        avatarmedium: '',
        avatarfull: '',
        profileurl: '',
        last_login: '',
        loccountrycode: '',
        status: null,
        fh_unavailable: false,
        is_contributor: false,
        is_subscriber: false
      },
      rank_tier: 0,
      leaderboard_rank: 0
    },
    counts: {
      leaver_status: {},
      game_mode: {},
      lobby_type: {},
      lane_role: {},
      region: {},
      patch: {}
    },
    heroes: [],
    rankings: [],
    ratings: [],
    recentMatches: [],
    totals: {
      np: 0,
      fantasy: 0,
      cosmetic: 0,
      all_time: 0,
      ranked: 0,
      turbo: 0,
      matched: 0
    },
    wl: {
      win: 0,
      lose: 0
    },
    wardMap: {
      obs: {},
      sen: {}
    },
    isLoading: true
  };
} 