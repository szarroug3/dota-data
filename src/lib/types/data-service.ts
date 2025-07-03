/**
 * Type definitions for the data service layer
 * 
 * Contains interfaces for player stats, match history, draft suggestions,
 * team analysis, and meta insights.
 */

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