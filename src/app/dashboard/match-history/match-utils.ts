import { getHeroNameSync, getOpponentName, getTeamSide } from "@/lib/utils";
import type { OpenDotaFullMatch } from "@/types/opendota";
import type { Team } from "@/types/team";

// Define proper types for the data structures
interface PickBanData {
  is_pick: boolean;
  hero_id: number;
  team: number;
  order: number;
}

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
function matchesOpponentFilter(match: Match, opponentFilter: string, currentTeam: Team): boolean {
  if (!opponentFilter) return true;
  const opponentName = getOpponentName(match, currentTeam);
  return opponentName.toLowerCase().includes(opponentFilter.toLowerCase());
}

function matchesHeroFilter(match: Match, heroFilter: string[], currentTeam: Team): boolean {
  if (heroFilter.length === 0) return true;
  if (!match.openDota?.players) return false;
  
  // Check if any player on our team picked any of the selected heroes
  const ourTeamSide = getTeamSide(match, currentTeam);
  const ourPlayers = match.openDota.players.filter((p) => 
    ourTeamSide === 'Radiant' ? p.isRadiant : !p.isRadiant
  );
  
  return ourPlayers.some((p) => {
    const heroName = getHeroNameSync(p.hero_id as number);
    return heroFilter.some(selectedHero => 
      heroName.toLowerCase() === selectedHero.toLowerCase()
    );
  });
}

function matchesResultFilter(match: Match, resultFilter: string): boolean {
  if (resultFilter === 'all') return true;
  return match.result === resultFilter;
}

function matchesSideFilter(match: Match, sideFilter: string, currentTeam: Team): boolean {
  if (sideFilter === 'all') return true;
  const teamSide = getTeamSide(match, currentTeam);
  return teamSide === sideFilter;
}

function matchesPickFilter(match: Match, pickFilter: string, currentTeam: Team): boolean {
  if (pickFilter === 'all') return true;
  const pickOrder = getPickOrder(match, currentTeam);
  return pickOrder === pickFilter;
}

export function useFilteredMatches(
  matches: Match[],
  filters: {
    opponentFilter: string;
    heroFilter: string[];
    resultFilter: string;
    sideFilter: string;
    pickFilter: string;
  },
  currentTeam: Team | null
): Match[] {
  // If no team is selected, return all matches
  if (!currentTeam) {
    return matches;
  }

  return matches.filter((m: Match) => {
    if (!matchesOpponentFilter(m, filters.opponentFilter, currentTeam)) return false;
    if (!matchesHeroFilter(m, filters.heroFilter, currentTeam)) return false;
    if (!matchesResultFilter(m, filters.resultFilter)) return false;
    if (!matchesSideFilter(m, filters.sideFilter, currentTeam)) return false;
    if (!matchesPickFilter(m, filters.pickFilter, currentTeam)) return false;
    return true;
  });
}

export function getMatchSummary(matches: Match[]) {
  const wins = matches.filter((m: Match) => m.result === "W").length;
  const losses = matches.filter((m: Match) => m.result === "L").length;
  
  // Calculate average game length
  let totalDuration = 0;
  let validMatches = 0;
  matches.forEach(match => {
    if (match.openDota?.duration) {
      totalDuration += match.openDota.duration;
      validMatches++;
    }
  });
  const avgGameLength = validMatches > 0 ? Math.round(totalDuration / validMatches / 60) : 0;
  
  // Calculate current streak
  let currentStreak = 0;
  for (let i = matches.length - 1; i >= 0; i--) {
    if (matches[i].result === "W") {
      currentStreak++;
    } else if (matches[i].result === "L") {
      currentStreak--;
    }
  }
  
  return {
    totalMatches: matches.length,
    wins,
    losses,
    winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
    avgGameLength: `${avgGameLength} min`,
    currentStreak,
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

export function getMatchTrends(matches: Match[]) {
  if (matches.length < 2) return [];
  
  const trends = [];
  
  // Calculate win rate trend
  const recentMatches = matches.slice(-5); // Last 5 matches
  const olderMatches = matches.slice(-10, -5); // 5 matches before that
  
  if (recentMatches.length > 0 && olderMatches.length > 0) {
    const recentWins = recentMatches.filter(m => m.result === "W").length;
    const olderWins = olderMatches.filter(m => m.result === "W").length;
    const recentWinRate = Math.round((recentWins / recentMatches.length) * 100);
    const olderWinRate = Math.round((olderWins / olderMatches.length) * 100);
    const winRateChange = recentWinRate - olderWinRate;
    
    trends.push({
      type: "winRate",
      value: recentWinRate,
      change: winRateChange,
      direction: winRateChange > 0 ? "up" : "down",
      metric: "Win Rate",
      trend: `${Math.abs(winRateChange)}% ${winRateChange > 0 ? "increase" : "decrease"}`
    });
  }
  
  // Calculate average game length trend
  const recentDurations = recentMatches
    .map(m => m.openDota?.duration)
    .filter(d => d !== undefined);
  const olderDurations = olderMatches
    .map(m => m.openDota?.duration)
    .filter(d => d !== undefined);
  
  if (recentDurations.length > 0 && olderDurations.length > 0) {
    const recentAvg = Math.round(recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length / 60);
    const olderAvg = Math.round(olderDurations.reduce((a, b) => a + b, 0) / olderDurations.length / 60);
    const durationChange = recentAvg - olderAvg;
    
    trends.push({
      type: "gameLength",
      value: recentAvg,
      change: durationChange,
      direction: durationChange > 0 ? "up" : "down",
      metric: "Avg Game Length",
      trend: `${Math.abs(durationChange)} min ${durationChange > 0 ? "longer" : "shorter"}`
    });
  }
  
  return trends;
}

export function getPickOrder(match: Match, currentTeam: Team) {
  if (!match.openDota?.picks_bans) return null;
  const firstPick = match.openDota.picks_bans.find((pb: PickBanData) => pb.is_pick);
  if (!firstPick) return null;
  const ourTeam = getTeamSide(match, currentTeam) === "Radiant" ? 0 : 1;
  return firstPick.team === ourTeam ? "FP" : "SP";
} 