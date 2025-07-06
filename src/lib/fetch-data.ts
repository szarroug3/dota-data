// Generic fetch function for internal API endpoints
export async function fetchData<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// NEW STANDARDIZED API HELPERS
// ============================================================================

/**
 * Fetch team and league data in parallel
 * @param teamId - The team ID to fetch
 * @param leagueId - The league ID to validate
 * @returns Promise with team and league data
 */
export async function fetchTeamData(teamId: string, leagueId: string) {
  // Fetch team and league data in parallel
  const [teamResponse, leagueResponse] = await Promise.all([
    fetch(`/api/teams/${teamId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: false })
    }),
    fetch(`/api/leagues/${leagueId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: false })
    })
  ]);

  if (!teamResponse.ok || !leagueResponse.ok) {
    throw new Error('Failed to fetch team or league data');
  }

  const [teamData, leagueData] = await Promise.all([
    teamResponse.json(),
    leagueResponse.json()
  ]);

  return { teamData, leagueData };
}

/**
 * Fetch match data using the new standardized API
 * @param matchId - The match ID to fetch
 * @returns Promise with match data
 */
export async function fetchMatchData(matchId: string) {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch match data: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch player data using the new standardized API
 * @param playerId - The player ID to fetch
 * @returns Promise with player data
 */
export async function fetchPlayerData(playerId: string) {
  const response = await fetch(`/api/players/${playerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch player data: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch player matches data
 * @param playerId - The player ID to fetch matches for
 * @returns Promise with player matches data
 */
export async function fetchPlayerMatches(playerId: string) {
  const response = await fetch(`/api/players/${playerId}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch player matches: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch player heroes data
 * @param playerId - The player ID to fetch heroes for
 * @returns Promise with player heroes data
 */
export async function fetchPlayerHeroes(playerId: string) {
  const response = await fetch(`/api/players/${playerId}/heroes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch player heroes: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch player totals data
 * @param playerId - The player ID to fetch totals for
 * @returns Promise with player totals data
 */
export async function fetchPlayerTotals(playerId: string) {
  const response = await fetch(`/api/players/${playerId}/totals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch player totals: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch player win/loss data
 * @param playerId - The player ID to fetch win/loss for
 * @returns Promise with player win/loss data
 */
export async function fetchPlayerWL(playerId: string) {
  const response = await fetch(`/api/players/${playerId}/wl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch player win/loss: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch heroes data
 * @returns Promise with all heroes data
 */
export async function fetchHeroesData() {
  const response = await fetch('/api/heroes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch heroes data: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch items data
 * @returns Promise with all items data
 */
export async function fetchItemsData() {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch items data: ${response.status}`);
  }

  return response.json();
}

/**
 * Start background data fetching for matches and players
 * @param teamData - The team data containing match IDs
 * @param leagueId - The league ID to filter by
 * @param activeTeamPlayerIds - Set of active team player IDs
 * @returns Promise that resolves when background fetching is complete
 */
export async function startBackgroundDataFetching(
  teamData: any,
  leagueId: string,
  activeTeamPlayerIds: Set<string>
) {
  const matchIds = teamData.matchIdsByLeague[leagueId] || [];
  
  if (matchIds.length === 0) {
    return;
  }

  // Fetch all matches in parallel
  const matchPromises = matchIds.map((matchId: string) => fetchMatchData(matchId));
  
  // Process matches as they complete
  const results = await Promise.allSettled(matchPromises);
  
  const playerIds = new Set<string>();
  
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      const match = result.value;
      // Extract active team players from match
      match.players?.forEach((player: any) => {
        if (activeTeamPlayerIds.has(player.account_id?.toString() || '')) {
          playerIds.add(player.account_id?.toString() || '');
        }
      });
    }
  });

  // Fetch player data for active team players
  const playerPromises = Array.from(playerIds).map(playerId => 
    fetchPlayerData(playerId)
  );
  
  // Don't await this - let it run in background
  Promise.allSettled(playerPromises);
} 