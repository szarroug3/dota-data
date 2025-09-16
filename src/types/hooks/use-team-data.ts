/**
 * Team data hook types
 *
 * Provides type definitions for the useTeamData hook.
 */

import type { TeamData } from '@/types/contexts/team-context-value';

export interface UseTeamDataReturn {
  // Team data
  teams: TeamData[];
  activeTeam: TeamData | null;
  activeTeamId: string | null;
  teamData: TeamData | null;

  // Loading states
  isLoading: boolean;

  // Error states
  teamsError: string | null;
  teamDataError: string | null;

  // Actions
  setActiveTeam: (teamId: string, leagueId: string) => void;
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string, leagueId: string) => void;
  refreshTeam: (teamId: string, leagueId: string) => Promise<void>;
}
