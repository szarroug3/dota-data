import { useTeam } from '@/contexts/team-context';
import { useCallback, useEffect, useState } from 'react';

// Types for processed match data
export interface MatchData {
  id: string;
  date: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
  duration: string;
  league: string;
  map: string;
  picks: string[];
  bans: string[];
  opponentPicks: string[];
  opponentBans: string[];
  draftOrder: unknown[];
  highlights: string[];
  playerStats: Record<string, unknown>;
  games: Array<{
    picks: string[];
    bans: string[];
    opponentPicks: string[];
    opponentBans: string[];
    draftOrder: unknown[];
    highlights: string[];
    playerStats: Record<string, unknown>;
    duration: string;
    score: string;
  }>;
  openDota?: {
    isRadiant: boolean;
    radiantWin: boolean;
    startTime: number;
    matchId: number;
  };
}

interface UseMatchDataResult {
  data: MatchData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Helper function to handle response status
async function handleResponseStatus(
  response: Response, 
  matchId: string, 
  teamId: string
): Promise<MatchData> {
  if (response.status === 200) {
    const data = await response.json();
    if (data.status === 'ready') {
      // Data is ready, fetch the actual processed data
      const processedResponse = await fetch(`/api/matches/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      if (processedResponse.ok) {
        return await processedResponse.json();
      }
    } else {
      // Return the processed data directly
      return data;
    }
  } else if (response.status === 202) {
    // Still queued, will be handled by polling
    throw new Error('Processing');
  }
  
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

// Helper function to poll for processed match data
async function pollMatchData(matchId: string, teamId: string): Promise<MatchData> {
  const maxAttempts = 30; // 30 seconds max
  const pollInterval = 1000; // 1 second
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      return await handleResponseStatus(response, matchId, teamId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Processing') {
        // Still queued, wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }
      console.error('Error polling processed match data:', error);
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Timeout waiting for processed match data');
}

// Helper function to fetch single match data
async function fetchSingleMatchData(
  matchId: string, 
  teamId: string
): Promise<MatchData> {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId })
  });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error(`HTTP ${response.status} for match ${matchId}`);
}

// Hook for fetching processed match data
export function useMatchData(matchId: string | null): UseMatchDataResult {
  const { currentTeam } = useTeam();
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!matchId || !currentTeam?.id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useMatchData] Fetching match data:', {
        matchId,
        teamId: currentTeam.id
      });

      const result = await fetchSingleMatchData(matchId, currentTeam.id);
      setData(result);
      setLoading(false);
    } catch (err) {
      console.error('[useMatchData] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch match data');
      setLoading(false);
    }
  }, [matchId, currentTeam?.id]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Helper function to fetch multiple matches
async function fetchMultipleMatches(
  matchIds: string[], 
  teamId: string
): Promise<MatchData[]> {
  console.log('[useMatchesData] Fetching processed matches data:', {
    matchIds: matchIds.length,
    teamId
  });

  // Fetch all matches in parallel
  const fetchPromises = matchIds.map(async (matchId) => {
    console.log('[useMatchesData] Fetching match:', matchId);
    try {
      return await fetchSingleMatchData(matchId, teamId);
    } catch (err) {
      console.error(`Error fetching match ${matchId}:`, err);
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  return results.filter(result => result !== null) as MatchData[];
}

// Hook for fetching multiple processed matches
export function useMatchesData(matchIds: string[] | null): {
  data: MatchData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { currentTeam } = useTeam();
  const [data, setData] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    console.log('[useMatchesData] fetchData called with:', {
      matchIds: matchIds?.length || 0,
      matchIdsSample: matchIds?.slice(0, 3),
      currentTeamId: currentTeam?.id
    });
    
    if (!matchIds || matchIds.length === 0 || !currentTeam?.id) {
      console.log('[useMatchesData] Early return - no matchIds or teamId');
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const validResults = await fetchMultipleMatches(matchIds, currentTeam.id);
      setData(validResults);
      setLoading(false);
    } catch (err) {
      console.error('[useMatchesData] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch matches data');
      setLoading(false);
    }
  }, [matchIds, currentTeam?.id]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Create a stable dependency for useEffect
  const matchIdsString = matchIds ? JSON.stringify(matchIds) : null;

  useEffect(() => {
    fetchData();
  }, [fetchData, matchIdsString]);

  return { data, loading, error, refetch };
} 