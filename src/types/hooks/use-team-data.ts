/**
 * Team data hook types
 * 
 * Provides type definitions for the useTeamData hook.
 */

import type { TeamData } from '@/types/contexts/team-context-value';
import type { Team } from '@/types/contexts/league-types';

export interface UseTeamDataReturn {
  // Team data
  teams: Team[];
  activeTeam: Team | null;
  activeTeamId: string | null;
  teamData: TeamData | null;
  teamStats: TeamSummary | null;

  // Loading states
  isLoadingTeams: boolean;
  isLoadingTeamData: boolean;
  isLoadingTeamStats: boolean;

  // Error states
  teamsError: string | null;
  teamDataError: string | null;
  teamStatsError: string | null;

  // Actions
  setActiveTeam: (teamId: string) => void;
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string) => Promise<void>;
  refreshTeam: (teamId: string) => Promise<void>;
  updateTeam: (teamId: string) => Promise<void>;
  clearErrors: () => void;
} 