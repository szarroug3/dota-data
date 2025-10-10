import type { AppData } from './app-data';

/**
 * Refresh cached match/player metadata for all teams using the latest reference data.
 * This is used after hydration once heroes/items/leagues have finished loading.
 */
export function refreshTeamsCachedMetadata(appData: AppData): void {
  const teams = appData.getTeams();
  teams.forEach((team) => {
    const matchIds = Array.from(team.matches.keys());
    if (matchIds.length > 0) {
      appData.updateTeamMatchParticipation(team.id, matchIds);
    } else {
      appData.updateTeamPlayersMetadata(team.id);
    }
  });
}
