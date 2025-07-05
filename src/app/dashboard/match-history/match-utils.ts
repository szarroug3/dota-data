import type { OpenDotaFullMatch } from "@/types/opendota";

// Types for hero stats
export interface HeroStats {
  games: number;
  wins: number;
  winRate: number;
}

export interface HeroStatsData {
  ourPicks: Record<string, HeroStats>;
  ourBans: Record<string, { games: number; winRate: number }>;
  opponentPicks: Record<string, HeroStats>;
  opponentBans: Record<string, { games: number; winRate: number }>;
}

export interface PickBan {
  hero_id: string;
  is_pick: boolean;
  team: number;
}

export interface Match {
  id?: string;
  match_id?: string;
  picks_bans?: PickBan[];
  result?: string;
  openDota?: OpenDotaFullMatch;
  firstPick?: boolean;
}

// Helper to process picks and bans for a match
function handlePick(pb: PickBan, match: Match, stats: HeroStatsData) {
  const heroId = pb.hero_id;
  if (pb.team === 0) {
    if (!stats.ourPicks[heroId]) stats.ourPicks[heroId] = { games: 0, wins: 0, winRate: 0 };
    stats.ourPicks[heroId].games += 1;
    if (match.result === 'W') stats.ourPicks[heroId].wins += 1;
  } else {
    if (!stats.opponentPicks[heroId]) stats.opponentPicks[heroId] = { games: 0, wins: 0, winRate: 0 };
    stats.opponentPicks[heroId].games += 1;
    if (match.result === 'L') stats.opponentPicks[heroId].wins += 1;
  }
}

function handleBan(pb: PickBan, stats: HeroStatsData) {
  const heroId = pb.hero_id;
  if (pb.team === 0) {
    if (!stats.ourBans[heroId]) stats.ourBans[heroId] = { games: 0, winRate: 0 };
    stats.ourBans[heroId].games += 1;
  } else {
    if (!stats.opponentBans[heroId]) stats.opponentBans[heroId] = { games: 0, winRate: 0 };
    stats.opponentBans[heroId].games += 1;
  }
}

function processPicksAndBans(match: Match, stats: HeroStatsData) {
  if (!match.picks_bans) return;
  for (const pb of match.picks_bans) {
    if (pb.is_pick) {
      handlePick(pb, match, stats);
    } else {
      handleBan(pb, stats);
    }
  }
}

// Helper to calculate win rates
function calculateWinRates(stats: HeroStatsData) {
  for (const heroId in stats.ourPicks) {
    const h = stats.ourPicks[heroId];
    h.winRate = h.games > 0 ? Math.round((h.wins / h.games) * 100) : 0;
  }
  for (const heroId in stats.opponentPicks) {
    const h = stats.opponentPicks[heroId];
    h.winRate = h.games > 0 ? Math.round((h.wins / h.games) * 100) : 0;
  }
  for (const heroId in stats.ourBans) {
    stats.ourBans[heroId].winRate = 0;
  }
  for (const heroId in stats.opponentBans) {
    stats.opponentBans[heroId].winRate = 0;
  }
}

export function calculateHeroStats(matches: Match[]): HeroStatsData {
  const stats: HeroStatsData = {
    ourPicks: {},
    ourBans: {},
    opponentPicks: {},
    opponentBans: {},
  };
  for (const match of matches) {
    processPicksAndBans(match, stats);
  }
  calculateWinRates(stats);
  return stats;
}

// Helper functions for filtering
function matchesHeroFilter(match: Match, selectedHeroes: string[]): boolean {
  if (selectedHeroes.length === 0) return true;
  if (!match.picks_bans) return false;
  return selectedHeroes.some((heroId: string) => 
    match.picks_bans?.some((pb: PickBan) => pb.hero_id.toString() === heroId)
  );
}

function matchesResultFilter(match: Match, resultFilter: string): boolean {
  if (!resultFilter) return true;
  return match.result === resultFilter;
}

function matchesSideFilter(match: Match, sideFilter: string): boolean {
  if (!sideFilter) return true;
  if (sideFilter === 'radiant' && !match.openDota?.isRadiant) return false;
  if (sideFilter === 'dire' && match.openDota?.isRadiant) return false;
  return true;
}

function matchesPickFilter(match: Match, pickFilter: string): boolean {
  if (!pickFilter) return true;
  if (pickFilter === 'fp' && match.firstPick !== true) return false;
  if (pickFilter === 'sp' && match.firstPick === true) return false;
  return true;
}

export function useFilteredMatches(
  matches: Match[],
  selectedHeroes: string[],
  resultFilter: string,
  sideFilter: string,
  pickFilter: string
): Match[] {
  return matches.filter((m: Match) => {
    if (!matchesHeroFilter(m, selectedHeroes)) return false;
    if (!matchesResultFilter(m, resultFilter)) return false;
    if (!matchesSideFilter(m, sideFilter)) return false;
    if (!matchesPickFilter(m, pickFilter)) return false;
    return true;
  });
}

export function getMatchSummary(matches: Match[]) {
  const wins = matches.filter((m: Match) => m.result === "W").length;
  const losses = matches.filter((m: Match) => m.result === "L").length;
  return {
    totalMatches: matches.length,
    wins,
    losses,
    winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
    avgGameLength: "--",
    currentStreak: 0,
  };
}

export function getHighlightStyle(hero: string, type: string, heroStats: HeroStatsData) {
  const heroKey = String(hero);
  let stats: { games: number; winRate: number } | undefined;
  if (type === "pick") stats = heroStats.ourPicks[heroKey];
  else if (type === "ban") stats = heroStats.ourBans[heroKey];
  else if (type === "opponentPick") stats = heroStats.opponentPicks[heroKey];
  else if (type === "opponentBan") stats = heroStats.opponentBans[heroKey];
  if (!stats) return "";
  if ((stats.games >= 8 && stats.winRate >= 70) || (stats.games >= 5 && stats.winRate >= 80)) {
    return "bg-yellow-50 dark:bg-yellow-950/20 border-l-2 border-l-yellow-500";
  }
  return "";
} 