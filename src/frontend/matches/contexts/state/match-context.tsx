'use client';

/**
 * Match Context (Frontend - Matches State Context)
 *
 * Mirrors the existing implementation while living under the new frontend structure.
 * Uses the fetching context from the new frontend path.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { useConstantsContext } from '@/frontend/contexts/constants-context';
import { useMatchDataFetching } from '@/frontend/matches/contexts/fetching/match-data-fetching-context';
import { useMatchOperations } from '@/hooks/use-match-operations';
import { processMatchData } from '@/lib/processing/match-processing';
import type { Match, MatchContextProviderProps, MatchContextValue } from '@/types/contexts/match-context-value';
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
    setIsLoading,
  };
}

function useMatchProcessing() {
  const { heroes, heroesByName, itemsById } = useConstantsContext();

  // Process match data from API responses using the processing module
  const processMatchDataFromApi = useCallback(
    (matchData: OpenDotaMatch): Match => {
      return processMatchData(matchData, heroes, heroesByName, itemsById);
    },
    [heroes, heroesByName, itemsById],
  );

  return {
    processMatchData: processMatchDataFromApi,
  };
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const MatchProvider: React.FC<MatchContextProviderProps> = ({ children }) => {
  const state = useMatchState();
  const processing = useMatchProcessing();
  const matchDataFetching = useMatchDataFetching();
  const { getGlobalManualMatches, setGlobalManualMatches } = useConfigContext();
  const { heroes, items } = useConstantsContext();
  const hydratedRef = React.useRef(false);

  const actions = useMatchOperations(state, processing, matchDataFetching);

  useEffect(() => {
    const ready = () => Object.keys(heroes || {}).length > 0 && Object.keys(items || {}).length > 0;
    if (hydratedRef.current || !ready()) return;
    try {
      const stored = getGlobalManualMatches?.() ?? [];
      if (stored.length > 0) stored.forEach((mid) => actions.addMatch(mid));
      hydratedRef.current = true;
    } catch (e) {
      console.warn('Failed to hydrate global manual matches:', e);
    }
  }, [actions, getGlobalManualMatches, heroes, items]);

  const addMatchAndPersist = useCallback(
    async (matchId: number) => {
      const result = await actions.addMatch(matchId);
      try {
        const current = getGlobalManualMatches?.() ?? [];
        if (!current.includes(matchId)) {
          setGlobalManualMatches?.([...current, matchId]);
        }
      } catch (e) {
        console.warn('Failed to persist global manual matches:', e);
      }
      return result;
    },
    [actions, getGlobalManualMatches, setGlobalManualMatches],
  );

  const removeMatchAndPersist = useCallback(
    (matchId: number) => {
      try {
        actions.removeMatch(matchId);
      } finally {
        try {
          const current = getGlobalManualMatches?.() ?? [];
          if (current.includes(matchId)) {
            setGlobalManualMatches?.(current.filter((id) => id !== matchId));
          }
        } catch (e) {
          console.warn('Failed to update persisted global manual matches on remove:', e);
        }
      }
    },
    [actions, getGlobalManualMatches, setGlobalManualMatches],
  );

  const contextValue: MatchContextValue = {
    // State
    matches: state.matches,
    selectedMatchId: state.selectedMatchId,
    setSelectedMatchId: state.setSelectedMatchId,
    isLoading: state.isLoading,

    // Core operations
    addMatch: addMatchAndPersist,
    refreshMatch: actions.refreshMatch,
    parseMatch: actions.parseMatch,
    removeMatch: removeMatchAndPersist,

    // Data access
    getMatch: (matchId: number) => {
      return state.matches.get(matchId);
    },
    getMatches: (matchIds: number[]) =>
      matchIds.map((id) => state.matches.get(id)).filter((match): match is Match => match !== undefined),

    // State setters for optimistic updates
    setMatches: state.setMatches,

    // Match data fetching context
    matchDataFetching: {
      fetchMatchData: matchDataFetching.fetchMatchData,
      clearMatchCache: matchDataFetching.clearMatchCache,
      clearAllCache: matchDataFetching.clearAllCache,
      isMatchCached: matchDataFetching.isMatchCached,
    },

    // High-performing heroes (TeamProvider computes this cross-cutting data)
    highPerformingHeroes: new Set(),
  };

  return <MatchContext.Provider value={contextValue}>{children}</MatchContext.Provider>;
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
