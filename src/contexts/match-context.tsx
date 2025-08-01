"use client";

/**
 * Match Context
 *
 * Manages match state, filtering, selection, and business logic.
 * Uses MatchDataFetchingContext for all data fetching (no API calls here).
 * Provides a clean, type-safe interface for match data and actions.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { useConstantsContext } from '@/contexts/constants-context';
import { useMatchDataFetching } from '@/contexts/match-data-fetching-context';
import { useMatchOperations } from '@/hooks/use-match-operations';
import { processMatchData } from '@/lib/processing/match-processing';
import type {
  Match,
  MatchContextProviderProps,
  MatchContextValue
} from '@/types/contexts/match-context-value';
import type { OpenDotaMatch } from '@/types/external-apis';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const MatchContext = createContext<MatchContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function useMatchState() {
  const [matches, setMatches] = useState<Map<number, Match>>(new Map());
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return {
    matches,
    setMatches,
    selectedMatchId,
    setSelectedMatchId,
    isLoading,
    setIsLoading
  };
}

function useMatchProcessing() {
  const { heroes, heroesByName, items } = useConstantsContext();

  // Process match data from API responses using the processing module
  const processMatchDataFromApi = useCallback((matchData: OpenDotaMatch): Match => {
    return processMatchData(matchData, heroes, heroesByName, items);
  }, [heroes, heroesByName, items]);

  return {
    processMatchData: processMatchDataFromApi
  };
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const MatchProvider: React.FC<MatchContextProviderProps> = ({ children }) => {
  const state = useMatchState();
  const processing = useMatchProcessing();
  const matchDataFetching = useMatchDataFetching();
  
  const actions = useMatchOperations(state, processing, matchDataFetching);

  const contextValue: MatchContextValue = {
    // State
    matches: state.matches,
    selectedMatchId: state.selectedMatchId,
    setSelectedMatchId: state.setSelectedMatchId,
    isLoading: state.isLoading,
    
    // Core operations
    addMatch: actions.addMatch,
    refreshMatch: actions.refreshMatch,
    parseMatch: actions.parseMatch,
    removeMatch: actions.removeMatch,
    
    // Data access
    getMatch: (matchId: number) => state.matches.get(matchId),
    getMatches: (matchIds: number[]) => matchIds.map(id => state.matches.get(id)).filter((match): match is Match => match !== undefined)
  };

  return (
    <MatchContext.Provider value={contextValue}>
      {children}
    </MatchContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useMatchContext = (): MatchContextValue => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatchContext must be used within a MatchProvider');
  }
  return context;
}; 