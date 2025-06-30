import { useFetchTracker } from "@/contexts/data-fetching-context";
import { useTeam } from "@/contexts/team-context";
import { fetchData } from "@/lib/api";
import { useEffect, useState } from "react";

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
    draftOrder: any[];
    highlights: string[];
    playerStats: Record<string, any>;
    games: Array<{
      picks: string[];
      bans: string[];
      opponentPicks: string[];
      opponentBans: string[];
      draftOrder: any[];
      highlights: string[];
      playerStats: Record<string, any>;
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
  dependencies: any[] = [],
  fetchKey?: string,
): UseDataFetchingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the data fetching context for tracking if a fetch key is provided
  const fetchTracker = fetchKey ? useFetchTracker(fetchKey) : null;

  useEffect(() => {
    let isMounted = true;

    const fetchDataAsync = async () => {
      try {
        setLoading(true);
        setError(null);

        // Don't fetch if endpoint is null
        if (!endpoint) {
          if (isMounted) {
            setData(null);
            setLoading(false);
          }
          return;
        }

        // Use fetch tracker if available for debugging
        const result = fetchTracker 
          ? await fetchTracker.trackFetch(fetchData<T>(endpoint))
          : await fetchData<T>(endpoint);

        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
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
  }, dependencies);

  return { data, loading, error };
}

// Hook for fetching player stats
export function usePlayerStats(
  accountId: number | null,
  playerName: string,
  role: string,
) {
  const url = accountId
    ? `/api/players/${accountId}/stats?name=${encodeURIComponent(playerName)}&role=${encodeURIComponent(role)}`
    : null;

  return useDataFetching<PlayerStats>(url, [accountId, playerName, role], `player-stats-${accountId}`);
}

// Hook for fetching match history
export function useMatchHistory(accountIds: string[] | null) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id;

  const url =
    accountIds && accountIds.length > 0 && teamId
      ? `/api/teams/${teamId}/match-history?accountIds=${accountIds.join(",")}`
      : null;

  return useDataFetching<MatchHistory>(url, [accountIds, teamId], 'match-history');
}

// Hook for fetching draft suggestions
export function useDraftSuggestions(accountIds: string[] | null) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id;

  const url =
    accountIds && accountIds.length > 0 && teamId
      ? `/api/teams/${teamId}/draft-suggestions?accountIds=${accountIds.join(",")}`
      : null;

  return useDataFetching<DraftSuggestions>(url, [accountIds, teamId], 'draft-suggestions');
}

// Hook for fetching team analysis
export function useTeamAnalysis(accountIds: string[] | null) {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id;

  const url =
    accountIds && accountIds.length > 0 && teamId
      ? `/api/teams/${teamId}/analysis?accountIds=${accountIds.join(",")}`
      : null;

  return useDataFetching<TeamAnalysis>(url, [accountIds, teamId], 'team-analysis');
}

// Hook for fetching meta insights
export function useMetaInsights(
  timeRange: "week" | "month" | "patch" = "week",
) {
  return useDataFetching<MetaInsights>(
    `/api/meta/insights?timeRange=${timeRange}`,
    [timeRange],
    `meta-insights-${timeRange}`,
  );
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
