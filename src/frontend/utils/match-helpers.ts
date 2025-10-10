/**
 * Match helper functions
 */

import type { Match } from '@/frontend/types/contexts/match-context-value';

export function updateMatchError(
  matchId: number,
  errorMessage: string,
  state: { matches: Map<number, Match>; setMatches: React.Dispatch<React.SetStateAction<Map<number, Match>>> }
) {
  const existingMatch = state.matches.get(matchId);
  if (existingMatch) {
    const updatedMatch: Match = { ...existingMatch, error: errorMessage, isLoading: false };
    state.setMatches(prev => { const newMatches = new Map(prev); newMatches.set(matchId, updatedMatch); return newMatches; });
  } else {
    const errorMatch: Match = { ...createInitialMatchData(matchId), error: errorMessage, isLoading: false };
    state.setMatches(prev => { const newMatches = new Map(prev); newMatches.set(matchId, errorMatch); return newMatches; });
  }
}

export function setMatchLoading(
  matchId: number,
  isLoading: boolean,
  state: { matches: Map<number, Match>; setMatches: React.Dispatch<React.SetStateAction<Map<number, Match>>> }
) {
  const existingMatch = state.matches.get(matchId);
  if (!existingMatch) return;
  state.setMatches(prev => { const newMatches = new Map(prev); newMatches.set(matchId, { ...existingMatch, isLoading }); return newMatches; });
}

export function createInitialMatchData(matchId: number): Match {
  return {
    id: matchId,
    date: new Date().toISOString(),
    duration: 0,
    radiant: { id: 0, name: undefined },
    dire: { id: 0, name: undefined },
    draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
    players: { radiant: [], dire: [] },
    statistics: {
      radiantScore: 0, direScore: 0,
      goldAdvantage: { times: [], radiantGold: [], direGold: [] },
      experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] }
    },
    events: [],
    result: 'radiant',
    isLoading: true
  };
}


