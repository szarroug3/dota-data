import { useEffect, useRef } from 'react';

import { useMatchContext } from '@/contexts/match-context';
import type { Match, MatchFilters } from '@/types/contexts/match-context-value';
import type { Player } from '@/types/contexts/player-context-value';

export interface UseMatchDataReturn {
  matches: Match[];
  players: Player[]; // Use proper Player type instead of any[]
  selectedMatch: Match | null;
  loading: boolean;
  error: string | null;
  filters: MatchFilters;
  actions: {
    selectMatch: (matchId: string) => void;
    setFilters: (filters: MatchFilters) => void;
    refreshMatches: (force?: boolean) => Promise<void>;
    clearError: () => void;
  };
}

export interface UseMatchDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

/**
 * Custom hook for accessing and managing match data.
 * Supports auto-refresh and options for filtering, selection, and refresh.
 */
export function useMatchData(options?: UseMatchDataOptions): UseMatchDataReturn {
  const context = useMatchContext();
  const {
    matches,
    selectedMatchId,
    selectMatch,
    setFilters,
    refreshMatches,
    clearErrors,
    filters,
    matchesError,
    isLoadingMatches
  } = context;

  // Find the selected match from the matches array
  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;

  // Auto-refresh logic
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (options?.autoRefresh && options.refreshInterval && options.refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshMatches();
      }, options.refreshInterval * 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return undefined;
  }, [options?.autoRefresh, options?.refreshInterval, refreshMatches]);

  return {
    matches,
    players: [], // Add empty array for compatibility
    selectedMatch,
    loading: isLoadingMatches,
    error: matchesError,
    filters,
    actions: {
      selectMatch,
      setFilters,
      refreshMatches,
      clearError: clearErrors
    }
  };
} 