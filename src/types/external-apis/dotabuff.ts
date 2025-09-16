export interface DotabuffMatchSummary {
  matchId: number;
  result: 'won' | 'lost';
  duration: number;
  opponentName: string;
  leagueId: string;
  startTime: number;
}

export interface DotabuffTeam {
  id: string;
  name: string;
  matches: Record<number, DotabuffMatchSummary>;
}

export interface DotabuffLeague {
  id: string;
  name: string;
}
