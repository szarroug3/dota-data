import { useTeam } from '@/contexts/team-context';
import type { MatchData } from '@/types/contexts';
import { useCallback, useEffect, useState } from 'react';

interface UseMatchDataResult {
  data: MatchData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Helper function to fetch single match data
async function fetchSingleMatchData(matchId: string): Promise<MatchData> {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error(`HTTP ${response.status} for match ${matchId}`);
}

// Simple cache to prevent repeated requests for the same match
const matchDataCache = new Map<string, MatchData>();

// Hook for fetching processed match data
export function useMatchData(matchId: string | null): UseMatchDataResult {
  const { currentTeam } = useTeam();
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCacheHit = useCallback((cachedData: MatchData) => {
    console.log('[useMatchData] Using cached data for match:', matchId);
    setData(cachedData);
    setLoading(false);
    setError(null);
  }, [matchId]);

  const handleFetchSuccess = useCallback((result: MatchData, cacheKey: string) => {
    matchDataCache.set(cacheKey, result);
    setData(result);
    setLoading(false);
  }, []);

  const handleFetchError = useCallback((err: unknown) => {
    console.error('[useMatchData] Error:', err);
    setError(err instanceof Error ? err.message : 'Failed to fetch match data');
    setLoading(false);
  }, []);

  const fetchData = useCallback(async () => {
    if (!matchId || !currentTeam?.id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cacheKey = `${matchId}-${currentTeam.id}`;
    const cachedData = matchDataCache.get(cacheKey);
    if (cachedData) {
      handleCacheHit(cachedData);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useMatchData] Fetching match data:', {
        matchId,
        teamId: currentTeam.id
      });

      const result = await fetchSingleMatchData(matchId);
      handleFetchSuccess(result, cacheKey);
    } catch (err) {
      handleFetchError(err);
    }
  }, [matchId, currentTeam?.id, handleCacheHit, handleFetchSuccess, handleFetchError]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Helper function to fetch multiple matches
async function fetchMultipleMatches(matchIds: string[]): Promise<MatchData[]> {
  console.log('[useMatchesData] Fetching processed matches data:', {
    matchIds: matchIds.length
  });

  // Fetch all matches in parallel
  const fetchPromises = matchIds.map(async (matchId) => {
    console.log('[useMatchesData] Fetching match:', matchId);
    try {
      return await fetchSingleMatchData(matchId);
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

  const handleEarlyReturn = useCallback(() => {
    console.log('[useMatchesData] Early return - no matchIds or teamId');
    setData([]);
    setLoading(false);
    setError(null);
  }, []);

  const handleFetchSuccess = useCallback((validResults: MatchData[]) => {
    setData(validResults);
    setLoading(false);
  }, []);

  const handleFetchError = useCallback((err: unknown) => {
    console.error('[useMatchesData] Error:', err);
    setError(err instanceof Error ? err.message : 'Failed to fetch matches data');
    setLoading(false);
  }, []);

  const fetchData = useCallback(async () => {
    console.log('[useMatchesData] fetchData called with:', {
      matchIds: matchIds?.length || 0,
      matchIdsSample: matchIds?.slice(0, 3),
      currentTeamId: currentTeam?.id
    });
    
    if (!matchIds || matchIds.length === 0 || !currentTeam?.id) {
      handleEarlyReturn();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const validResults = await fetchMultipleMatches(matchIds);
      handleFetchSuccess(validResults);
    } catch (err) {
      handleFetchError(err);
    }
  }, [matchIds, currentTeam?.id, handleEarlyReturn, handleFetchSuccess, handleFetchError]);

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