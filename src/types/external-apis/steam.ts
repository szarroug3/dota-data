export interface SteamMatchSummary {
  match_id: number;
  radiant_team_id?: number;
  dire_team_id?: number;
}

export interface SteamLeague {
  id: string;
  name: string;
  steam?: {
    result?: {
      status?: number;
      matches?: SteamMatchSummary[];
    };
  };
}

export interface SteamTeam {
  id: string;
  name: string;
}
