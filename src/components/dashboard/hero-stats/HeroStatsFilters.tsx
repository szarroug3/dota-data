/**
 * Hero Stats Filters Component
 * 
 * Handles filtering and sorting state for hero statistics tables
 */

import { logWithTimestamp } from "@/lib/utils";
import { useEffect, useState } from "react";

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
 * Helper to apply all filters to a hero stats row
 */
export function filterHeroRows(rows: [string, any][], filters: HeroStatsFilters) {
  return rows.filter(([hero, stats]) => {
    if (filters.heroFilter && !hero.toLowerCase().includes(filters.heroFilter.toLowerCase())) {
      return false;
    }
    
    if (filters.countFilter) {
      const f = parseNumberFilter(filters.countFilter);
      if (f) {
        if (f.op === ">" && !(stats.count > f.num)) return false;
        if (f.op === ">=" && !(stats.count >= f.num)) return false;
        if (f.op === "<" && !(stats.count < f.num)) return false;
        if (f.op === "<=" && !(stats.count <= f.num)) return false;
        if ((f.op === "=" || f.op === "") && !(stats.count === f.num)) return false;
      }
    }
    
    if (filters.winsFilter) {
      const f = parseNumberFilter(filters.winsFilter);
      if (f) {
        if (f.op === ">" && !(stats.wins > f.num)) return false;
        if (f.op === ">=" && !(stats.wins >= f.num)) return false;
        if (f.op === "<" && !(stats.wins < f.num)) return false;
        if (f.op === "<=" && !(stats.wins <= f.num)) return false;
        if ((f.op === "=" || f.op === "") && !(stats.wins === f.num)) return false;
      }
    }
    
    if (filters.winRateFilter) {
      const f = parseNumberFilter(filters.winRateFilter);
      if (f) {
        if (f.op === ">" && !(stats.winRate > f.num)) return false;
        if (f.op === ">=" && !(stats.winRate >= f.num)) return false;
        if (f.op === "<" && !(stats.winRate < f.num)) return false;
        if (f.op === "<=" && !(stats.winRate <= f.num)) return false;
        if ((f.op === "=" || f.op === "") && !(stats.winRate === f.num)) return false;
      }
    }
    
    return true;
  });
}

/**
 * Sorting helper for hero stats rows
 */
export function sortHeroRows(rows: [string, any][], sortBy: string, sortOrder: string) {
  return rows.slice().sort(([heroA, a], [heroB, b]) => {
    if (sortBy !== "default") {
      let valA, valB;
      if (sortBy === "name") {
        valA = heroA.toLowerCase();
        valB = heroB.toLowerCase();
      } else {
        valA = a[sortBy];
        valB = b[sortBy];
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