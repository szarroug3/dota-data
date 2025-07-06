import type { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/opendota';

// Types for processed match data
export interface Match {
  id: string;
  date: string;
  radiantId: string;
  direId: string;
  radiantName: string;
  direName: string;
  radiantWin: boolean;
  radiantScore: number | null;
  direScore: number | null;
  duration: string;
  league: string;
  radiantPicks: string[];
  radiantBans: string[];
  direPicks: string[];
  direBans: string[];
  draftOrder: Array<{
    is_pick: boolean;
    hero_id: number;
    team: number;
    order: number;
  }>;
  players: Array<{
    account_id: number;
    player_slot: number;
    hero_id: number;
    kills: number;
    deaths: number;
    assists: number;
    last_hits: number;
    denies: number;
    gold_per_min: number;
    xp_per_min: number;
    level: number;
    hero_damage: number;
    tower_damage: number;
    hero_healing: number;
    isRadiant: boolean;
    items: number[];
    personaname: string;
    rank_tier: number;
  }>;
}



function extractDraft(picks_bans: OpenDotaMatch['picks_bans'] | undefined) {
  const radiantPicks: string[] = [];
  const radiantBans: string[] = [];
  const direPicks: string[] = [];
  const direBans: string[] = [];
  
  if (Array.isArray(picks_bans)) {
    for (const pb of picks_bans) {
      if (pb.is_pick) {
        (pb.team === 0 ? radiantPicks : direPicks).push(pb.hero_id.toString());
      } else {
        (pb.team === 0 ? radiantBans : direBans).push(pb.hero_id.toString());
      }
    }
  }
  
  return { radiantPicks, radiantBans, direPicks, direBans, draftOrder: picks_bans || [] };
}

function processPlayers(players: OpenDotaMatchPlayer[]): Match['players'] {
  return players.map((player: OpenDotaMatchPlayer) => ({
    account_id: player.account_id,
    player_slot: player.player_slot,
    hero_id: player.hero_id,
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    last_hits: player.last_hits,
    denies: player.denies,
    gold_per_min: player.gold_per_min,
    xp_per_min: player.xp_per_min,
    level: player.level,
    hero_damage: player.hero_damage,
    tower_damage: player.tower_damage,
    hero_healing: player.hero_healing,
    isRadiant: player.player_slot < 128,
    items: [player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5].filter(item => item !== 0),
    personaname: player.personaname || 'Unknown',
    rank_tier: player.rank_tier || 0
  }));
}

// Helper function to calculate match duration
function calculateDuration(matchDuration: number): string {
  if (typeof matchDuration === 'number' && matchDuration > 0) {
    const minutes = Math.floor(matchDuration / 60);
    const seconds = (matchDuration % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  return "?";
}

// Helper function to extract basic match info
function extractBasicMatchInfo(match: OpenDotaMatch) {
  const radiantWin = !!match.radiant_win;
  const radiantScore = typeof match.radiant_score === 'number' ? match.radiant_score : null;
  const direScore = typeof match.dire_score === 'number' ? match.dire_score : null;
  const date = match.start_time ? new Date(match.start_time * 1000).toISOString() : "";
  const duration = calculateDuration(match.duration as number);
  
  return { radiantWin, radiantScore, direScore, date, duration };
}

// Helper function to extract team info
function extractTeamInfo(match: OpenDotaMatch) {
  const league = match.leagueid ? `League ${match.leagueid}` : "Unknown League";
  
  return {
    radiantId: match.radiant_team_id?.toString() || "0",
    direId: match.dire_team_id?.toString() || "0",
    radiantName: match.radiant_name || "Radiant",
    direName: match.dire_name || "Dire",
    league
  };
}

export function processMatch(match: OpenDotaMatch): Match {
  const { radiantWin, radiantScore, direScore, date, duration } = extractBasicMatchInfo(match);
  const { radiantId, direId, radiantName, direName, league } = extractTeamInfo(match);
  const { radiantPicks, radiantBans, direPicks, direBans, draftOrder } = extractDraft(match.picks_bans);

  return {
    id: match.match_id?.toString() ?? "?",
    date,
    radiantId,
    direId,
    radiantName,
    direName,
    radiantWin,
    radiantScore,
    direScore,
    duration,
    league,
    radiantPicks,
    radiantBans,
    direPicks,
    direBans,
    draftOrder,
    players: processPlayers(match.players)
  };
}

// Function to process multiple matches
export function processMatches(matches: OpenDotaMatch[]): Match[] {
  return matches.map(match => processMatch(match));
}

// Function to validate match data before processing
export function validateMatchData(match: unknown): match is OpenDotaMatch {
  if (!match || typeof match !== 'object') {
    return false;
  }

  const m = match as Record<string, unknown>;
  return (
    typeof m.match_id === 'number' &&
    typeof m.start_time === 'number' &&
    typeof m.duration === 'number' &&
    typeof m.radiant_win === 'boolean'
  );
}

// Function to get match processing stats
export function getMatchProcessingStats(matches: Match[]) {
  const totalMatches = matches.length;
  const wins = matches.filter(m => m.radiantWin).length;
  const losses = matches.filter(m => !m.radiantWin).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  return {
    totalMatches,
    wins,
    losses,
    winRate
  };
} 