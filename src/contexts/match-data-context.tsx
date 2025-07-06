import { fetchMatchData } from '@/lib/fetch-data';
import * as React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { MatchData, MatchDataContextType } from '../types/contexts';

// ============================================================================
// CACHE
// ============================================================================

// Simple cache to prevent repeated requests
const matchDataCache = new Map<string, MatchData>();

// ============================================================================
// CONTEXT
// ============================================================================

const MatchDataContext = createContext<MatchDataContextType | null>(null);

export function MatchDataProvider({ children }: { children: React.ReactNode }) {
  const [matchDataByTeam, setMatchDataByTeam] = useState<Record<string, MatchData[]>>({});
  const [loadingByTeam, setLoadingByTeam] = useState<Record<string, boolean>>({});
  const [errorByTeam, setErrorByTeam] = useState<Record<string, string | null>>({});

  const fetchTeamMatches = useCallback(async (teamId: string, matchIds: string[]): Promise<void> => {
    // Don't fetch if already loading or if no match IDs
    if (loadingByTeam[teamId] || matchIds.length === 0) {
      return;
    }

    // Set loading state
    setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: true }));
    setErrorByTeam((prev: Record<string, string | null>) => ({ ...prev, [teamId]: null }));

    try {
      // Fetch all matches in parallel using the new standardized API
      const matchPromises = matchIds.map(async (matchId) => {
        // Check cache first
        const cachedData = matchDataCache.get(matchId);
        if (cachedData) {
          console.log(`[MatchDataContext] Using cached data for match ${matchId}`);
          return cachedData;
        }

        try {
          console.log(`[MatchDataContext] Fetching match ${matchId}`);
          const data = await fetchMatchData(matchId);
          
          // Cache the result
          matchDataCache.set(matchId, data);
          
          return data;
        } catch (err) {
          console.error(`[MatchDataContext] Error fetching match ${matchId}:`, err);
          return null;
        }
      });

      const results = await Promise.all(matchPromises);
      const successfulResults = results.filter((result): result is MatchData => result !== null);
      
      console.log(`[MatchDataContext] Successfully fetched ${successfulResults.length}/${matchIds.length} matches`);
      
      setMatchDataByTeam((prev: Record<string, MatchData[]>) => ({ ...prev, [teamId]: successfulResults }));
      setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: false }));
    } catch (err) {
      console.error(`[MatchDataContext] Error fetching matches for team ${teamId}:`, err);
      setErrorByTeam((prev: Record<string, string | null>) => ({ 
        ...prev, 
        [teamId]: err instanceof Error ? err.message : 'Failed to fetch matches' 
      }));
      setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: false }));
    }
  }, [loadingByTeam]);

  const getTeamMatches = useCallback((teamId: string): MatchData[] => {
    // Return cached data if available
    if (matchDataByTeam[teamId]) {
      return matchDataByTeam[teamId];
    }

    // Don't automatically trigger fetch - let components call fetchTeamMatches explicitly
    return [];
  }, [matchDataByTeam]);

  const isTeamLoading = useCallback((teamId: string): boolean => {
    return loadingByTeam[teamId] || false;
  }, [loadingByTeam]);

  const getTeamError = useCallback((teamId: string): string | null => {
    return errorByTeam[teamId] || null;
  }, [errorByTeam]);

  const value: MatchDataContextType = {
    matchDataByTeam,
    loadingByTeam,
    errorByTeam,
    fetchTeamMatches,
    getTeamMatches,
    isTeamLoading,
    getTeamError,
  };

  return (
    <MatchDataContext.Provider value={value}>
      {children}
    </MatchDataContext.Provider>
  );
}

export function useMatchData() {
  const context = useContext(MatchDataContext);
  if (!context) {
    throw new Error('useMatchData must be used within a MatchDataProvider');
  }
  return context;
} 