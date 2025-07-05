import { MatchData } from '@/lib/hooks/useMatchData';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface MatchDataContextType {
  // Cached match data by team ID
  matchDataByTeam: Record<string, MatchData[]>;
  // Loading states by team ID
  loadingByTeam: Record<string, boolean>;
  // Error states by team ID
  errorByTeam: Record<string, string | null>;
  // Trigger fetching for a specific team
  fetchTeamMatches: (teamId: string, matchIds: string[]) => void;
  // Get matches for a team (from cache or trigger fetch)
  getTeamMatches: (teamId: string, matchIds: string[]) => MatchData[];
  // Check if team data is loading
  isTeamLoading: (teamId: string) => boolean;
  // Get error for a team
  getTeamError: (teamId: string) => string | null;
}

const MatchDataContext = createContext<MatchDataContextType | null>(null);

// Helper function to fetch single match data
async function fetchSingleMatchData(matchId: string, teamId: string): Promise<MatchData> {
  try {
    console.log(`[MatchDataContext] Starting fetch for match ${matchId} with teamId ${teamId}`);
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`/api/matches/${matchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamId }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log(`[MatchDataContext] Response status for match ${matchId}:`, response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`[MatchDataContext] Successfully fetched match ${matchId}`);
      return data;
    }
    
    throw new Error(`HTTP ${response.status} for match ${matchId}`);
  } catch (err) {
    console.error(`[MatchDataContext] Network error fetching match ${matchId}:`, err);
    if (err instanceof TypeError && err.message.includes('NetworkError')) {
      throw new Error(`Network error: Unable to connect to server for match ${matchId}. Please check your connection and try again.`);
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timeout: The request for match ${matchId} took too long to complete. Please try again.`);
    }
    throw err;
  }
}

// Helper function to fetch multiple matches
async function fetchMultipleMatches(matchIds: string[], teamId: string): Promise<MatchData[]> {
  console.log('[MatchDataContext] Fetching processed matches data:', {
    matchIds: matchIds.length,
    teamId
  });

  // Fetch all matches in parallel with retry logic
  const fetchPromises = matchIds.map(async (matchId) => {
    console.log('[MatchDataContext] Fetching match:', matchId);
    
    // Retry logic for network errors
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[MatchDataContext] Attempt ${attempt} for match ${matchId}`);
        return await fetchSingleMatchData(matchId, teamId);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[MatchDataContext] Attempt ${attempt} failed for match ${matchId}:`, lastError);
        
        // If it's a network error and we have more retries, wait before retrying
        if (attempt < maxRetries && lastError.message.includes('Network error')) {
          const delay = Math.min(1000 * attempt, 5000); // Exponential backoff, max 5 seconds
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
  const successfulResults = results.filter(result => result !== null) as MatchData[];
  
  console.log(`[MatchDataContext] Successfully fetched ${successfulResults.length}/${matchIds.length} matches`);
  return successfulResults;
}

export function MatchDataProvider({ children }: { children: React.ReactNode }) {
  const [matchDataByTeam, setMatchDataByTeam] = useState<Record<string, MatchData[]>>({});
  const [loadingByTeam, setLoadingByTeam] = useState<Record<string, boolean>>({});
  const [errorByTeam, setErrorByTeam] = useState<Record<string, string | null>>({});

  const fetchTeamMatches = useCallback(async (teamId: string, matchIds: string[]) => {
    // Don't fetch if already loading or if no match IDs
    if (loadingByTeam[teamId] || matchIds.length === 0) {
      return;
    }

    // Set loading state
    setLoadingByTeam(prev => ({ ...prev, [teamId]: true }));
    setErrorByTeam(prev => ({ ...prev, [teamId]: null }));

    try {
      const matches = await fetchMultipleMatches(matchIds, teamId);
      
      setMatchDataByTeam(prev => ({ ...prev, [teamId]: matches }));
      setLoadingByTeam(prev => ({ ...prev, [teamId]: false }));
    } catch (err) {
      console.error(`[MatchDataContext] Error fetching matches for team ${teamId}:`, err);
      setErrorByTeam(prev => ({ 
        ...prev, 
        [teamId]: err instanceof Error ? err.message : 'Failed to fetch matches' 
      }));
      setLoadingByTeam(prev => ({ ...prev, [teamId]: false }));
    }
  }, [loadingByTeam]);

  const getTeamMatches = useCallback((teamId: string, matchIds: string[]): MatchData[] => {
    // Return cached data if available
    if (matchDataByTeam[teamId]) {
      return matchDataByTeam[teamId];
    }

    // Trigger fetch if not already loading and we have match IDs
    if (!loadingByTeam[teamId] && matchIds.length > 0) {
      // Use setTimeout to avoid blocking the render
      setTimeout(() => fetchTeamMatches(teamId, matchIds), 0);
    }

    return [];
  }, [matchDataByTeam, loadingByTeam, fetchTeamMatches]);

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