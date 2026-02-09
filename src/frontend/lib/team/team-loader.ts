/**
 * Team loading utilities
 * Handles fetching team data from API with request deduplication
 */

// In-flight request cache to deduplicate concurrent requests
const inFlightTeamRequests = new Map<number, Promise<{ name?: string }>>();

/**
 * Fetch team data from API
 * Automatically deduplicates concurrent requests for the same team
 * Always reuses in-flight requests regardless of force flag
 *
 * @param teamId - The team ID to fetch
 * @returns Team data with at least { name: string }
 */
export async function fetchTeamData(teamId: number): Promise<{ name?: string }> {
  // Always check if request is already in flight - no reason to duplicate
  const existingRequest = inFlightTeamRequests.get(teamId);
  if (existingRequest) {
    return existingRequest;
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch team: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      // Clean up in-flight cache when done
      inFlightTeamRequests.delete(teamId);
    }
  })();

  // Cache the promise
  inFlightTeamRequests.set(teamId, requestPromise);

  return requestPromise;
}

/**
 * Get team's match IDs from league cache
 *
 * @param leagueCache - The cached league matches data
 * @param teamId - The team ID to get matches for
 * @returns Array of match IDs for the team
 */
export function getTeamMatchIdsFromCache(
  leagueCache: { matchIdsByTeam: Map<number, number[]> } | undefined,
  teamId: number,
): number[] {
  return leagueCache?.matchIdsByTeam.get(teamId) || [];
}
