import { useFetchTracker } from "@/contexts/data-fetching-context";
import { useTeam } from "@/contexts/team-context";
import { fetchData } from '@/lib/fetch-data';
import { useEffect, useRef, useState } from "react";

// Types for the hook responses
export interface DataFetchingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface PlayerStats {
  name: string;
  role: string;
  overallStats: {
    matches: number;
    winRate: number;
    avgKDA: number;
    avgGPM: number;
    avgXPM: number;
    avgGameLength: string;
  };
  recentPerformance: Array<{
    date: string;
    hero: string;
    result: string;
    KDA: string;
    GPM: number;
  }>;
  topHeroes: Array<{
    hero: string;
    games: number;
    winRate: number;
    avgKDA: number;
    avgGPM: number;
  }>;
  trends: Array<{
    metric: string;
    value: number | string;
    trend: string;
    direction: "up" | "down" | "neutral";
  }>;
  rank: string;
  stars?: number;
  immortalRank?: number;
  rankImage: string;
  recentlyPlayed: Array<{
    hero: string;
    heroImage: string;
    games: number;
    winRate: number;
  }>;
}

export interface MatchHistory {
  summary: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    avgGameLength: string;
    longestWinStreak: number;
    currentStreak: number;
  };
  matches: Array<{
    id: string;
    date: string;
    opponent: string;
    result: string;
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
  }>;
  trends: Array<{
    metric: string;
    value: number | string;
    trend: string;
    direction: "up" | "down" | "neutral";
  }>;
}

export interface DraftSuggestions {
  teamStrengths: {
    carry: string;
    mid: string;
    support: string;
    offlane: string;
  };
  teamWeaknesses: string[];
  phaseRecommendations: {
    first: {
      title: string;
      description: string;
      heroes: Array<{
        name: string;
        role: string;
        reason: string;
        synergy: string[];
        counters: string[];
        pickPriority: string;
        winRate: number;
        games: number;
      }>;
    };
    second: {
      title: string;
      description: string;
      heroes: Array<{
        name: string;
        role: string;
        reason: string;
        synergy: string[];
        counters: string[];
        pickPriority: string;
        winRate: number;
        games: number;
      }>;
    };
    third: {
      title: string;
      description: string;
      heroes: Array<{
        name: string;
        role: string;
        reason: string;
        synergy: string[];
        counters: string[];
        pickPriority: string;
        winRate: number;
        games: number;
      }>;
    };
  };
  metaCounters: Array<{
    hero: string;
    counter: string;
    reason: string;
    effectiveness: string;
  }>;
  recentDrafts: Array<{
    date: string;
    opponent: string;
    result: string;
    picks: string[];
    bans: string[];
    notes: string;
  }>;
}

export interface TeamAnalysis {
  overallStats: {
    totalMatches: number;
    winRate: number;
    avgGameLength: string;
    avgKDA: number;
    avgGPM: number;
    avgXPM: number;
  };
  rolePerformance: {
    carry: { winRate: number; avgKDA: number; avgGPM: number };
    mid: { winRate: number; avgKDA: number; avgGPM: number };
    offlane: { winRate: number; avgKDA: number; avgGPM: number };
    support: { winRate: number; avgKDA: number; avgGPM: number };
  };
  gamePhaseStats: {
    earlyGame: { winRate: number; avgDuration: string };
    midGame: { winRate: number; avgDuration: string };
    lateGame: { winRate: number; avgDuration: string };
  };
  heroPool: {
    mostPicked: Array<{ hero: string; games: number; winRate: number }>;
    bestWinRate: Array<{ hero: string; games: number; winRate: number }>;
    mostBanned: Array<{ hero: string; bans: number; banRate: number }>;
  };
  trends: Array<{
    metric: string;
    value: number | string;
    trend: string;
    direction: "up" | "down" | "neutral";
  }>;
}

export interface MetaInsights {
  currentMeta: {
    description: string;
    keyHeroes: Array<{
      hero: string;
      pickRate: number;
      winRate: number;
      banRate: number;
    }>;
    strategies: string[];
  };
  metaTrends: Array<{
    title: string;
    description: string;
    impact: string;
    trend: "up" | "down" | "neutral";
    details: string;
  }>;
  roleStats: {
    carry: { avgGPM: number; avgKDA: string; winRate: number };
    mid: { avgGPM: number; avgKDA: string; winRate: number };
    offlane: { avgGPM: number; avgKDA: string; winRate: number };
    support: { avgGPM: number; avgKDA: string; winRate: number };
  };
}

interface UseDataFetchingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useDataFetching<T>(
  endpoint: string | null,
  fetchKey?: string,
): UseDataFetchingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Always call useFetchTracker, but only use it if fetchKey is provided
  const fetchTracker = useFetchTracker(fetchKey || '__no_fetch_key__');

  useEffect(() => {
    let isMounted = true;

    const fetchDataAsync = async () => {
      try {
        setLoading(true);
        setError(null);

        // Debug logging
        console.log('[useDataFetching] Starting fetch:', { endpoint, fetchKey });

        // Don't fetch if endpoint is null
        if (!endpoint) {
          console.log('[useDataFetching] No endpoint provided, skipping fetch');
          if (isMounted) {
            setData(null);
            setLoading(false);
          }
          return;
        }

        // Use fetch tracker if fetchKey is provided
        const result = fetchKey
          ? await fetchTracker.trackFetch(fetchData<T>(endpoint))
          : await fetchData<T>(endpoint);

        console.log('[useDataFetching] Fetch completed:', {
          hasResult: !!result,
          resultType: typeof result,
          resultKeys: result && typeof result === 'object' ? Object.keys(result) : null
        });

        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useDataFetching] Fetch error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setLoading(false);
        }
      }
    };

    fetchDataAsync();

    return () => {
      isMounted = false;
    };
  }, [endpoint, fetchKey, fetchTracker]);

  return { data, loading, error };
}

// Hook for fetching player stats
export function usePlayerStats(
  accountId: number | null,
) {
  const url = accountId
    ? `/api/players/${accountId}`
    : null;
  const fetchKey = `player-stats-${accountId}`;
  return useDataFetching<PlayerStats>(url, fetchKey);
}

// Helper function to fetch player data
async function fetchPlayerDataHelper(accountId: string) {
  const response = await fetch(`/api/players/${accountId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch player ${accountId}`);
  }
  
  return response.json();
}

// Type for raw match data from API
interface RawMatchData {
  match_id: number;
  start_time: number;
  radiant_win: boolean;
  duration: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  gold_per_min?: number;
  xp_per_min?: number;
  hero_name?: string;
  hero_damage?: number;
  tower_damage?: number;
  last_hits?: number;
  denies?: number;
}

// Helper function to create player stats
function createPlayerStats(match: RawMatchData) {
  return {
    kills: match.kills || 0,
    deaths: match.deaths || 0,
    assists: match.assists || 0,
    gpm: match.gold_per_min,
    xpm: match.xp_per_min,
    hero: match.hero_name || 'Unknown',
    heroDamage: match.hero_damage,
    towerDamage: match.tower_damage,
    lastHits: match.last_hits,
    denies: match.denies
  };
}

// Helper function to create game data
function createGameData(match: RawMatchData) {
  return {
    picks: [],
    bans: [],
    opponentPicks: [],
    opponentBans: [],
    draftOrder: [],
    highlights: [],
    playerStats: {
      kills: match.kills || 0,
      deaths: match.deaths || 0,
      assists: match.assists || 0,
      gpm: match.gold_per_min,
      xpm: match.xp_per_min
    },
    duration: `${Math.floor(match.duration / 60)}:${(match.duration % 60).toString().padStart(2, '0')}`,
    score: `${match.kills || 0}/${match.deaths || 0}/${match.assists || 0}`
  };
}

// Helper function to process match data
function processMatchData(match: RawMatchData) {
  return {
    id: match.match_id.toString(),
    date: new Date(match.start_time * 1000).toLocaleDateString(),
    opponent: 'Unknown Team',
    result: match.radiant_win ? 'Win' : 'Loss',
    score: `${match.kills || 0}/${match.deaths || 0}/${match.assists || 0}`,
    duration: `${Math.floor(match.duration / 60)}:${(match.duration % 60).toString().padStart(2, '0')}`,
    league: 'Unknown League',
    map: 'Dota 2',
    picks: [],
    bans: [],
    opponentPicks: [],
    opponentBans: [],
    draftOrder: [],
    highlights: [],
    playerStats: createPlayerStats(match),
    games: [createGameData(match)]
  };
}

// Helper function to calculate summary statistics
function calculateSummaryStats(processedMatches: MatchHistory['matches']) {
  const totalMatches = processedMatches.length;
  const wins = processedMatches.filter(m => m.result === 'Win').length;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

  return {
    totalMatches,
    wins,
    losses: totalMatches - wins,
    winRate,
    avgGameLength: '30:00', // Placeholder
    longestWinStreak: 0, // Placeholder
    currentStreak: 0 // Placeholder
  };
}

// Helper function to calculate trends
function calculateTrends(winRate: number) {
  return [
    { metric: 'Win Rate', value: `${winRate.toFixed(1)}%`, trend: 'stable', direction: 'neutral' as const },
    { metric: 'Avg KDA', value: '2.5', trend: 'stable', direction: 'neutral' as const }
  ];
}

// Hook for fetching match history from individual player endpoints
export function useMatchHistory(accountIds: string[] | null) {
  const [combinedData, setCombinedData] = useState<MatchHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountIds || accountIds.length === 0) {
      setCombinedData(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchPlayerData = async () => {
      try {
        // Fetch data for all players in parallel
        const playerPromises = accountIds.map(fetchPlayerDataHelper);
        const playerResults = await Promise.all(playerPromises);
        
        if (!isMounted) return;

        // Combine match data from all players
        const allMatches: RawMatchData[] = [];
        const seenMatches = new Set<string>();

        playerResults.forEach(playerData => {
          if (playerData && playerData.recent_matches) {
            playerData.recent_matches.forEach((match: RawMatchData) => {
              if (!seenMatches.has(match.match_id.toString())) {
                seenMatches.add(match.match_id.toString());
                allMatches.push(match);
              }
            });
          }
        });

        // Sort by date (newest first) and process matches
        const sortedMatches = allMatches.sort((a, b) => b.start_time - a.start_time);
        const processedMatches = sortedMatches.slice(0, 50).map(processMatchData);

        // Calculate summary and trends
        const summary = calculateSummaryStats(processedMatches);
        const trends = calculateTrends(summary.winRate);

        setCombinedData({
          summary,
          matches: processedMatches,
          trends
        });
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch match history');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPlayerData();

    return () => {
      isMounted = false;
    };
  }, [accountIds]);

  return { data: combinedData, loading, error };
}

// Hook for fetching draft suggestions
export function useDraftSuggestions(accountIds: string[] | null) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id;
  const url =
    accountIds && accountIds.length > 0 && teamId
      ? `/api/teams/${teamId}/draft-suggestions?accountIds=${accountIds.join(",")}`
      : null;
  const fetchKey = 'draft-suggestions';
  return useDataFetching<DraftSuggestions>(url, fetchKey);
}

// Hook for fetching team analysis
export function useTeamAnalysis(accountIds: string[] | null) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id;
  const url =
    accountIds && accountIds.length > 0 && teamId
      ? `/api/teams/${teamId}/analysis?accountIds=${accountIds.join(",")}`
      : null;
  const fetchKey = 'team-analysis';
  return useDataFetching<TeamAnalysis>(url, fetchKey);
}

// Hook for fetching meta insights
export function useMetaInsights(
  timeRange: "week" | "month" | "patch" = "week",
) {
  const [data, setData] = useState<MetaInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Simulate API call with mock data
    const fetchMetaInsights = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!isMounted) return;

        // Generate mock meta insights data
        const mockData: MetaInsights = {
          currentMeta: {
            description: `Current meta analysis for ${timeRange} time period`,
            keyHeroes: [
              { hero: "Invoker", pickRate: 45.2, winRate: 52.1, banRate: 12.3 },
              { hero: "Crystal Maiden", pickRate: 38.7, winRate: 48.9, banRate: 8.1 },
              { hero: "Juggernaut", pickRate: 42.1, winRate: 51.3, banRate: 15.7 },
              { hero: "Phantom Assassin", pickRate: 35.6, winRate: 49.8, banRate: 22.4 },
              { hero: "Tidehunter", pickRate: 28.9, winRate: 47.2, banRate: 18.6 },
              { hero: "Wraith King", pickRate: 31.4, winRate: 50.5, banRate: 11.2 }
            ],
            strategies: [
              "Early game aggression with strong lane dominators",
              "Mid game team fight coordination",
              "Late game scaling with carry heroes"
            ]
          },
          metaTrends: [
            {
              title: "Early Game Dominance",
              description: "Teams focusing on early game advantages",
              impact: "High",
              trend: "up",
              details: "Increased pick rate of early game heroes"
            },
            {
              title: "Support Role Evolution",
              description: "Supports taking more active roles in team fights",
              impact: "Medium",
              trend: "up",
              details: "Higher GPM and KDA for support players"
            },
            {
              title: "Carry Meta Shift",
              description: "Shift towards late game scaling carries",
              impact: "Medium",
              trend: "neutral",
              details: "Balanced pick rates across carry heroes"
            }
          ],
          roleStats: {
            carry: { avgGPM: 650, avgKDA: "2.8", winRate: 52.3 },
            mid: { avgGPM: 580, avgKDA: "3.2", winRate: 51.8 },
            offlane: { avgGPM: 420, avgKDA: "2.5", winRate: 49.7 },
            support: { avgGPM: 280, avgKDA: "2.1", winRate: 48.9 }
          }
        };

        setData(mockData);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch meta insights');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetaInsights();

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  return { data, loading, error };
}

// Hook for fetching team data based on current team context
export function useTeamData() {
  const { currentTeam } = useTeam();

  const accountIds =
    currentTeam?.players?.map((player) => player.id).filter(Boolean) ||
    null;

  const matchHistory = useMatchHistory(accountIds);
  const draftSuggestions = useDraftSuggestions(accountIds);
  const teamAnalysis = useTeamAnalysis(accountIds);
  const metaInsights = useMetaInsights();

  return {
    matchHistory,
    draftSuggestions,
    teamAnalysis,
    metaInsights,
    hasTeam: !!currentTeam,
  };
}

// Type for batch match data
interface BatchMatchData {
  id: string;
  error?: boolean;
  [key: string]: unknown;
}

// Batch fetch match details for a list of match IDs
export function useBatchMatchDetails(matchIds: string[] | null) {
  const [matches, setMatches] = useState<BatchMatchData[]>([]);
  const [loading, setLoading] = useState(false);
  // Simple in-memory cache for the session
  const cacheRef = useRef<Record<string, BatchMatchData>>({});

  useEffect(() => {
    if (!matchIds || matchIds.length === 0) {
      setMatches([]);
      return;
    }
    let isMounted = true;
    setLoading(true);
    // Find which IDs need to be fetched
    const toFetch = matchIds.filter(id => !cacheRef.current[id]);
    const fetches = toFetch.map(id =>
      fetch(`/api/matches/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) cacheRef.current[id] = data;
        })
        .catch(() => {})
    );
    Promise.all(fetches).then(() => {
      if (isMounted) {
        // Return matches in the same order as matchIds
        setMatches(matchIds.map(id => cacheRef.current[id] || { id, error: true }));
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [matchIds]);

  return { matches, loading };
}
