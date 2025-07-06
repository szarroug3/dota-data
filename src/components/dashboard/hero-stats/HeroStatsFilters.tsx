/**
 * Hero Stats Filters Component
 * 
 * Handles filtering and sorting state for hero statistics tables
 */

import { logWithTimestamp } from "@/lib/utils";
import { useEffect, useState } from "react";

// Types for hero stats data
interface HeroStats {
  count: number;
  wins: number;
  winRate: number;
}

export interface HeroStatsFilters {
  heroFilter: string;
  countFilter: string;
  winsFilter: string;
  winRateFilter: string;
  ourPicksSortBy: string;
  ourPicksSortOrder: string;
  ourBansSortBy: string;
  ourBansSortOrder: string;
  opponentPicksSortBy: string;
  opponentPicksSortOrder: string;
  opponentBansSortBy: string;
  opponentBansSortOrder: string;
}

export interface UseHeroStatsFiltersReturn {
  filters: HeroStatsFilters;
  setFilters: (filters: Partial<HeroStatsFilters>) => void;
  clearFilters: () => void;
  isLoadingFromStorage: boolean;
}

/**
 * Custom hook for managing hero stats filters and sorting
 */
export function useHeroStatsFilters(): UseHeroStatsFiltersReturn {
  const [filters, setFiltersState] = useState<HeroStatsFilters>({
    heroFilter: "",
    countFilter: "",
    winsFilter: "",
    winRateFilter: "",
    ourPicksSortBy: "default",
    ourPicksSortOrder: "desc",
    ourBansSortBy: "default",
    ourBansSortOrder: "desc",
    opponentPicksSortBy: "default",
    opponentPicksSortOrder: "desc",
    opponentBansSortBy: "default",
    opponentBansSortOrder: "desc",
  });

  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);

  // Load filters from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("heroStatsFilters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFiltersState(prev => ({
            ...prev,
            ...parsed
          }));
        } catch (e) {
          logWithTimestamp('log', "🔍 [HeroStatsFilters] Error parsing localStorage:", e);
        }
      }
      setIsLoadingFromStorage(false);
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (!isLoadingFromStorage) {
      localStorage.setItem("heroStatsFilters", JSON.stringify(filters));
    }
  }, [filters, isLoadingFromStorage]);

  const setFilters = (newFilters: Partial<HeroStatsFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const clearFilters = () => {
    setFiltersState({
      heroFilter: "",
      countFilter: "",
      winsFilter: "",
      winRateFilter: "",
      ourPicksSortBy: "default",
      ourPicksSortOrder: "desc",
      ourBansSortBy: "default",
      ourBansSortOrder: "desc",
      opponentPicksSortBy: "default",
      opponentPicksSortOrder: "desc",
      opponentBansSortBy: "default",
      opponentBansSortOrder: "desc",
    });
  };

  return {
    filters,
    setFilters,
    clearFilters,
    isLoadingFromStorage
  };
}

/**
 * Helper to parse filter string (e.g., '>5', '=3', '<10')
 */
export function parseNumberFilter(filter: string) {
  if (!filter) return null;
  const match = filter.match(/([><=]=?|)(\d+)/);
  if (!match) return null;
  const op = match[1] || "=";
  const num = parseInt(match[2], 10);
  return { op, num };
}

/**
 * Helper to check if a value matches a filter condition
 */
function matchesFilter(value: number, filter: string): boolean {
  const f = parseNumberFilter(filter);
  if (!f) return true;
  
  switch (f.op) {
    case ">":
      return value > f.num;
    case ">=":
      return value >= f.num;
    case "<":
      return value < f.num;
    case "<=":
      return value <= f.num;
    case "=":
    case "":
      return value === f.num;
    default:
      return true;
  }
}

/**
 * Helper to apply all filters to a hero stats row
 */
export function filterHeroRows(rows: [string, HeroStats][], filters: HeroStatsFilters) {
  return rows.filter(([hero, stats]) => {
    // Hero name filter
    if (filters.heroFilter && !hero.toLowerCase().includes(filters.heroFilter.toLowerCase())) {
      return false;
    }
    
    // Count filter
    if (filters.countFilter && !matchesFilter(stats.count, filters.countFilter)) {
      return false;
    }
    
    // Wins filter
    if (filters.winsFilter && !matchesFilter(stats.wins, filters.winsFilter)) {
      return false;
    }
    
    // Win rate filter
    if (filters.winRateFilter && !matchesFilter(stats.winRate, filters.winRateFilter)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Sorting helper for hero stats rows
 */
export function sortHeroRows(rows: [string, HeroStats][], sortBy: string, sortOrder: string) {
  return rows.slice().sort(([heroA, a], [heroB, b]) => {
    if (sortBy !== "default") {
      let valA: string | number, valB: string | number;
      
      if (sortBy === "name") {
        valA = heroA.toLowerCase();
        valB = heroB.toLowerCase();
      } else {
        valA = a[sortBy as keyof HeroStats];
        valB = b[sortBy as keyof HeroStats];
        
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
      }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    }
    
    // Default: win rate desc, picks/games desc, wins desc, name asc
    if (a.winRate !== b.winRate) return b.winRate - a.winRate;
    if (a.count !== b.count) return b.count - a.count;
    if (a.wins !== b.wins) return b.wins - a.wins;
    return heroA.toLowerCase().localeCompare(heroB.toLowerCase());
  });
} 