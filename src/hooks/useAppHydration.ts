import { useEffect, useRef, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { useConstantsContext } from '@/frontend/contexts/constants-context';
import { useMatchContext } from '@/frontend/matches/contexts/state/match-context';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';

/**
 * Hook for app-wide data hydration
 */
export function useAppHydration() {
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasHydratedRef = useRef(false);
  const ensuredActiveTeamKeyRef = useRef<string | null>(null);

  const configContext = useConfigContext();
  const constantsContext = useConstantsContext();
  const teamContext = useTeamContext();
  const matchContext = useMatchContext();

  // Store context references in refs to avoid recreation
  const contextsRef = useRef({ configContext, constantsContext, teamContext, matchContext });
  contextsRef.current = { configContext, constantsContext, teamContext, matchContext };

  // Track component lifecycle
  const mountCountRef = useRef(0);
  const renderCountRef = useRef(0);

  // Increment render count
  renderCountRef.current += 1;

  // Helpers to reduce complexity
  async function fetchConstants(constantsContext: ReturnType<typeof useConstantsContext>) {
    await Promise.all([constantsContext.fetchHeroes(), constantsContext.fetchItems()]);
  }

  async function waitForConstants(constantsContext: ReturnType<typeof useConstantsContext>) {
    let attempts = 0;
    const maxAttempts = 50;
    while (
      attempts < maxAttempts &&
      (Object.keys(constantsContext.heroes).length === 0 || Object.keys(constantsContext.items).length === 0)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    if (attempts >= maxAttempts) {
      console.warn('Constants not available after waiting, proceeding anyway');
    }
  }

  async function ensureActiveTeam(
    configContext: ReturnType<typeof useConfigContext>,
    teamContext: ReturnType<typeof useTeamContext>,
  ) {
    const active = configContext.activeTeam;
    if (active) {
      await teamContext.addTeam(active.teamId, active.leagueId);
      ensuredActiveTeamKeyRef.current = `${active.teamId}-${active.leagueId}`;
    }
  }

  async function loadTeamsAndManuals(
    configContext: ReturnType<typeof useConfigContext>,
    teamContext: ReturnType<typeof useTeamContext>,
  ) {
    const teams = configContext.getTeams();
    if (teams && teams.size > 0) {
      await teamContext.loadTeamsFromConfig(teams);
    }
    await teamContext.loadManualMatches();
    await teamContext.loadManualPlayers();
  }

  // Run hydration on mount
  useEffect(() => {
    mountCountRef.current += 1;

    const hydrate = async () => {
      if (hasHydratedRef.current) return;
      try {
        setHydrationError(null);

        await fetchConstants(contextsRef.current.constantsContext);
        await waitForConstants(contextsRef.current.constantsContext);
        await ensureActiveTeam(contextsRef.current.configContext, contextsRef.current.teamContext);
        await loadTeamsAndManuals(contextsRef.current.configContext, contextsRef.current.teamContext);

        contextsRef.current.teamContext.refreshAllTeamSummaries().catch((error) => {
          console.warn('Background team refresh failed:', error);
        });

        hasHydratedRef.current = true;
        setHasHydrated(true);
      } catch (error) {
        console.error('Hydration: failed:', error);
        setHydrationError(error instanceof Error ? error.message : 'Hydration failed');
      }
    };

    hydrate();
  }, []);

  // Ensure active team if it becomes available later (e.g., after share payload loads)
  useEffect(() => {
    const active = contextsRef.current.configContext.activeTeam;
    const key = active ? `${active.teamId}-${active.leagueId}` : null;
    if (active && ensuredActiveTeamKeyRef.current !== key) {
      contextsRef.current.teamContext
        .addTeam(active.teamId, active.leagueId)
        .then(() => {
          ensuredActiveTeamKeyRef.current = key;
        })
        .catch(() => {
          // no-op; errors already handled in addTeam pipeline
        });
    }
  }, [contextsRef.current.configContext.activeTeam]);

  return {
    hydrationError,
    hasHydrated,
  };
}
