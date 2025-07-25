/**
 * Match helper functions
 * 
 * Utility functions for match data processing and error handling
 */

import type { Match } from '@/types/contexts/match-context-value';

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Update match error in state
 */
export function updateMatchError(
  matchId: number,
  errorMessage: string,
  state: {
    matches: Map<number, Match>;
    setMatches: React.Dispatch<React.SetStateAction<Map<number, Match>>>;
  }
) {
  const existingMatch = state.matches.get(matchId);
  
  if (existingMatch) {
    // Update existing match with error
    const updatedMatch: Match = {
      ...existingMatch,
      error: errorMessage,
      isLoading: false
    };
    
    state.setMatches(prev => {
      const newMatches = new Map(prev);
      newMatches.set(matchId, updatedMatch);
      return newMatches;
    });
  } else {
    // Create minimal match object with error using the helper function
    const errorMatch: Match = {
      ...createInitialMatchData(matchId),
      error: errorMessage,
      isLoading: false
    };
    
    state.setMatches(prev => {
      const newMatches = new Map(prev);
      newMatches.set(matchId, errorMatch);
      return newMatches;
    });
  }
}

/**
 * Set match loading state
 */
export function setMatchLoading(
  matchId: number,
  isLoading: boolean,
  state: {
    matches: Map<number, Match>;
    setMatches: React.Dispatch<React.SetStateAction<Map<number, Match>>>;
  }
) {
  const existingMatch = state.matches.get(matchId);
  
  if (existingMatch) {
    // Update existing match with loading state
    const updatedMatch: Match = {
      ...existingMatch,
      isLoading
    };
    
    state.setMatches(prev => {
      const newMatches = new Map(prev);
      newMatches.set(matchId, updatedMatch);
      return newMatches;
    });
  }
}

// ============================================================================
// MATCH PROCESSING HELPERS
// ============================================================================

/**
 * Create initial match data with loading state
 */
export function createInitialMatchData(matchId: number): Match {
  return {
    id: matchId,
    date: new Date().toISOString(),
    duration: 0,
    radiant: {
      id: 0,
      name: undefined
    },
    dire: {
      id: 0,
      name: undefined
    },
    draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
    players: { radiant: [], dire: [] },
    statistics: {
      radiantScore: 0, direScore: 0,
      goldAdvantage: { times: [], radiantGold: [], direGold: [] },
      experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] }
    },
    events: [],
    result: 'radiant',
    isLoading: true
  };
} 