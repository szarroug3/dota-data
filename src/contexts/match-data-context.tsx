import * as React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { 
  MatchDataContextType, 
  NetworkError, 
  TimeoutError,
  MatchData
} from '../types/contexts';
import { MatchRequest } from '../types/api';

// ============================================================================
// CONSTANTS
// ============================================================================

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;
const MAX_RETRY_DELAY_MS = 5000;

// ============================================================================
// CACHE
// ============================================================================

// Simple cache to prevent repeated requests
const matchDataCache = new Map<string, MatchData>();

// ============================================================================
// API HELPERS
// ============================================================================

async function fetchSingleMatchData(matchId: string): Promise<MatchData> {
  // Check cache first
  const cacheKey = matchId;
  const cachedData = matchDataCache.get(cacheKey);
  if (cachedData) {
    console.log(`[MatchDataContext] Using cached data for match ${matchId}`);
    return cachedData;
  }

  try {
    console.log(`[MatchDataContext] Starting fetch for match ${matchId}`);
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    const response = await fetch(`/api/matches/${matchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({} as MatchRequest),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log(`[MatchDataContext] Response status for match ${matchId}:`, response.status);
    
    if (response.status === 200) {
      const data = await response.json() as MatchData;
      console.log(`[MatchDataContext] Successfully fetched match ${matchId}`);
      
      // Cache the result
      matchDataCache.set(cacheKey, data);
      
      return data;
    }
    
    throw new Error(`HTTP ${response.status} for match ${matchId}`);
  } catch (err) {
    console.error(`[MatchDataContext] Network error fetching match ${matchId}:`, err);
    
    if (err instanceof TypeError && err.message.includes('NetworkError')) {
      const networkError = new Error(`Network error: Unable to connect to server for match ${matchId}. Please check your connection and try again.`) as NetworkError;
      networkError.name = 'NetworkError';
      throw networkError;
    }
    
    if (err instanceof Error && err.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout: The request for match ${matchId} took too long to complete. Please try again.`) as TimeoutError;
      timeoutError.name = 'AbortError';
      throw timeoutError;
    }
    
    throw err;
  }
}

async function fetchMultipleMatches(matchIds: string[]): Promise<MatchData[]> {
  console.log('[MatchDataContext] Fetching processed matches data:', {
    matchIds: matchIds.length
  });

  // Fetch all matches in parallel with retry logic
  const fetchPromises = matchIds.map(async (matchId): Promise<MatchData | null> => {
    console.log('[MatchDataContext] Fetching match:', matchId);
    
    // Retry logic for network errors
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[MatchDataContext] Attempt ${attempt} for match ${matchId}`);
        return await fetchSingleMatchData(matchId);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[MatchDataContext] Attempt ${attempt} failed for match ${matchId}:`, lastError);
        
        // If it's a network error and we have more retries, wait before retrying
        if (attempt < MAX_RETRIES && lastError.message.includes('Network error')) {
          const delay = Math.min(1000 * attempt, MAX_RETRY_DELAY_MS); // Exponential backoff, max 5 seconds
          console.log(`[MatchDataContext] Retrying match ${matchId} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break; // Don't retry for non-network errors or after max retries
        }
      }
    }
    
    console.error(`[MatchDataContext] All attempts failed for match ${matchId}:`, lastError);
    return null;
  });

  const results = await Promise.all(fetchPromises);
  const successfulResults = results.filter((result): result is MatchData => result !== null);
  
  console.log(`[MatchDataContext] Successfully fetched ${successfulResults.length}/${matchIds.length} matches`);
  return successfulResults;
}

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
      const matches = await fetchMultipleMatches(matchIds);
      
      setMatchDataByTeam((prev: Record<string, MatchData[]>) => ({ ...prev, [teamId]: matches }));
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

export function useMatchDataContext() {
  const context = useContext(MatchDataContext);
  if (!context) {
    throw new Error('useMatchData must be used within a MatchDataProvider');
  }
  return context;
} 