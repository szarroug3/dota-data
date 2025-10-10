import { useMemo } from 'react';

import { useAppData } from '@/contexts/app-data-context';
import type { MatchFilters } from '@/frontend/lib/app-data-types';

const EMPTY_HIDDEN_MATCHES = new Set<number>();

export function useMatchFilters(filters: MatchFilters, hiddenMatchIds?: Set<number>) {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;
  const resolvedHiddenIds = hiddenMatchIds ?? EMPTY_HIDDEN_MATCHES;

  return useMemo(
    () => appData.getTeamMatchFilters(selectedTeamId, filters, resolvedHiddenIds),
    [
      appData,
      selectedTeamId,
      filters,
      resolvedHiddenIds,
      appData.matches,
      appData.teams,
      appData.leagueMatchesCache,
      appData.heroes,
    ],
  );
}
