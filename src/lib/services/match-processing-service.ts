import type { OpenDotaMatch } from '@/types/opendota';

// Types for processed match data
export interface Match {
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
  // Additional fields for UI compatibility
  openDota?: {
    isRadiant: boolean;
    radiantWin: boolean;
    startTime: number;
    matchId: number;
  };
}

// Helper function to format date
function formatMatchDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to format duration
function formatMatchDuration(duration: number): string {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to determine team side
function getTeamSide(match: OpenDotaMatch, teamId: string): 'radiant' | 'dire' {
  // For now, we'll use a simple heuristic based on team ID
  // In a real implementation, you'd need to map team IDs to sides
  const teamIdNum = parseInt(teamId, 10);
  return teamIdNum % 2 === 0 ? 'radiant' : 'dire';
}

// Helper function to determine if team won
function getTeamResult(match: OpenDotaMatch, teamSide: 'radiant' | 'dire'): 'W' | 'L' {
  const isRadiantWin = match.radiant_win;
  const isTeamRadiant = teamSide === 'radiant';
  return (isRadiantWin === isTeamRadiant) ? 'W' : 'L';
}

// Helper function to get opponent name
function getOpponentName(match: OpenDotaMatch, teamId: string): string {
  // For now, return a placeholder
  // In a real implementation, you'd need to look up team names
  return `Team ${match.match_id % 1000}`;
}

// Helper function to extract picks and bans
function extractPicksAndBans(match: OpenDotaMatch, teamSide: 'radiant' | 'dire') {
  if (!match.picks_bans) {
    return {
      picks: [],
      bans: [],
      opponentPicks: [],
      opponentBans: []
    };
  }

  const teamPicks: string[] = [];
  const teamBans: string[] = [];
  const opponentPicks: string[] = [];
  const opponentBans: string[] = [];

  match.picks_bans.forEach(pickBan => {
    const isRadiant = pickBan.team === 0;
    const isPick = pickBan.is_pick;
    const heroId = pickBan.hero_id.toString();

    if (isRadiant === (teamSide === 'radiant')) {
      // Our team
      if (isPick) {
        teamPicks.push(heroId);
      } else {
        teamBans.push(heroId);
      }
    } else {
      // Opponent team
      if (isPick) {
        opponentPicks.push(heroId);
      } else {
        opponentBans.push(heroId);
      }
    }
  });

  return {
    picks: teamPicks,
    bans: teamBans,
    opponentPicks,
    opponentBans
  };
}

// Helper function to create score string
function createScoreString(match: OpenDotaMatch): string {
  if (match.radiant_score !== undefined && match.dire_score !== undefined) {
    return `${match.radiant_score}-${match.dire_score}`;
  }
  return 'N/A';
}

// Main function to process a match
export function processMatch(match: OpenDotaMatch, teamId: string): Match {
  const teamSide = getTeamSide(match, teamId);
  const result = getTeamResult(match, teamSide);
  const opponent = getOpponentName(match, teamId);
  const { picks, bans, opponentPicks, opponentBans } = extractPicksAndBans(match, teamSide);

  return {
    id: match.match_id.toString(),
    date: formatMatchDate(match.start_time),
    opponent,
    result,
    score: createScoreString(match),
    duration: formatMatchDuration(match.duration),
    league: 'Unknown League', // Would need to be populated from league data
    map: 'dota2', // Default map
    picks,
    bans,
    opponentPicks,
    opponentBans,
    draftOrder: [], // Would need to be calculated from picks_bans order
    highlights: [], // Would need to be generated from match events
    playerStats: {}, // Would need to be populated from players array
    games: [{
      picks,
      bans,
      opponentPicks,
      opponentBans,
      draftOrder: [],
      highlights: [],
      playerStats: {},
      duration: formatMatchDuration(match.duration),
      score: createScoreString(match)
    }],
    openDota: {
      isRadiant: teamSide === 'radiant',
      radiantWin: match.radiant_win,
      startTime: match.start_time,
      matchId: match.match_id
    }
  };
}

// Function to process multiple matches
export function processMatches(matches: OpenDotaMatch[], teamId: string): Match[] {
  return matches.map(match => processMatch(match, teamId));
}

// Function to validate match data before processing
export function validateMatchData(match: unknown): match is OpenDotaMatch {
  if (!match || typeof match !== 'object') {
    return false;
  }

  const m = match as any;
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
  const wins = matches.filter(m => m.result === 'W').length;
  const losses = matches.filter(m => m.result === 'L').length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  return {
    totalMatches,
    wins,
    losses,
    winRate,
    avgGameLength: '--', // Would need to be calculated from durations
    currentStreak: 0 // Would need to be calculated from recent matches
  };
} 