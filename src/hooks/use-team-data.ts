import { useMemo } from 'react';

import type { TeamData } from '@/types/contexts/team-context-value';

// Minimal placeholder to satisfy tests; real implementation lives in operations/hooks
export function useTeamData() {
  return useMemo(
    () => ({
      teams: [],
      activeTeam: null as { teamId: string; leagueId: string } | null,
      activeTeamId: null as { teamId: string; leagueId: string } | null,
      teamData: null as TeamData | null,
      isLoading: false,
      teamsError: null as string | null,
      teamDataError: null as string | null,
      addTeam: async (_teamId: string, _leagueId: string) => {},
      setActiveTeam: (_teamId: string, _leagueId: string) => {},
      refreshTeam: async (_teamId: string, _leagueId: string) => {},
      removeTeam: (_teamId: string, _leagueId: string) => {},
    }),
    [],
  );
}
