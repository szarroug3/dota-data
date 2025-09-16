/**
 * Team operations hook types
 *
 * Provides type definitions for team operation functions.
 */

import type { TeamData } from '@/types/contexts/team-context-value';

/**
 * Function type for fetching team and league data
 */
export type FetchTeamAndLeagueDataFunction = (existingTeamData: TeamData, force: boolean) => Promise<TeamData>;
