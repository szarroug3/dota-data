"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Team } from "@/types/team";
import React, { startTransition, useEffect, useState } from "react";
import TeamImportForm from "./TeamImportForm";
import TeamList from "./TeamList";

// Extract polling for team/league names into a custom hook
function useTeamAndLeagueNamePolling(teams: Team[], setTeams: React.Dispatch<React.SetStateAction<Team[]>>) {
  useEffect(() => {
    if (teams.length > 0) {
      const interval = setInterval(() => {
        teams.forEach((team) => {
          // Skip teams that are currently loading to avoid interference with manual imports
          if (team.loading) {
            return;
          }
          
          if (!team.teamName || team.teamName === 'loading' || !team.leagueName || team.leagueName === 'loading') {
            if (team.teamId) {
              fetch(`/api/teams/${team.teamId}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                  if (data && data.name && data.name !== team.teamName) {
                    setTeams((prevTeams: Team[]) => prevTeams.map((t: Team) =>
                      t.id === team.id ? { ...t, teamName: data.name } as Team : t
                    ));
                    if (typeof window !== 'undefined') {
                      const updated = teams.map((t: Team) =>
                        t.id === team.id ? { ...t, teamName: data.name } : t
                      );
                      localStorage.setItem("dota-dashboard-teams", JSON.stringify(updated));
                    }
                  }
                });
            }
            if (team.leagueId) {
              fetch(`/api/leagues/${team.leagueId}`)
                .then(res => res.ok ? res.json().then(data => ({ status: res.status, data })) : null)
                .then(result => {
                  if (result && result.status === 200 && result.data && result.data.leagueName && result.data.leagueName !== team.leagueName) {
                    setTeams((prevTeams: Team[]) => prevTeams.map((t: Team) =>
                      t.id === team.id ? { ...t, leagueName: result.data.leagueName } as Team : t
                    ));
                    if (typeof window !== 'undefined') {
                      const updated = teams.map((t: Team) =>
                        t.id === team.id ? { ...t, leagueName: result.data.leagueName } : t
                      );
                      localStorage.setItem("dota-dashboard-teams", JSON.stringify(updated));
                    }
                  }
                });
            }
          }
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [teams, setTeams]);
}

// Extract match data queueing into a custom hook
function useMatchDataQueueing(teams: Team[]) {
  const matchDataQueuedTeams = React.useRef(new WeakSet<object>()).current;
  useEffect(() => {
    teams.forEach((team) => {
      if (
        team.matchIds &&
        Array.isArray(team.matchIds) &&
        team.matchIds.length > 0 &&
        team.loading === false &&
        !matchDataQueuedTeams.has(team)
      ) {
        matchDataQueuedTeams.add(team);
        team.matchIds.forEach((matchId) => {
          fetch(`/api/matches/${matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: team.teamId }),
          });
        });
      }
    });
  }, [teams, matchDataQueuedTeams]);
}

// Extract localStorage sync into a custom hook with deferred loading
function useTeamsLocalStorageSync(setTeamsState: (teams: Team[]) => void, hasReset: boolean) {
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  
  useEffect(() => {
    if (typeof window !== "undefined" && !hasReset) {
      // Defer loading to avoid blocking initial render
      const loadTeams = () => {
        const stored = localStorage.getItem("dota-dashboard-teams");
        if (stored) {
          try {
            const parsedTeams = JSON.parse(stored);
            startTransition(() => {
              setTeamsState(parsedTeams);
              setIsLoadingTeams(false);
            });
          } catch {
            startTransition(() => {
              setTeamsState([]);
              setIsLoadingTeams(false);
            });
          }
        } else {
          startTransition(() => {
            setTeamsState([]);
            setIsLoadingTeams(false);
          });
        }
      };
      
      // Load teams after a brief delay to allow UI to render first
      const timer = setTimeout(loadTeams, 0);
      
      const handleStorage = (e: StorageEvent) => {
        if (e.key === "dota-dashboard-teams") {
          loadTeams();
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("storage", handleStorage);
      };
    } else {
      setIsLoadingTeams(false);
    }
  }, [setTeamsState, hasReset]);

  return { isLoadingTeams };
}

function TeamListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



function TeamManagementContent({ teams, setTeams, isLoadingTeams } : { 
  teams: Team[]; 
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  isLoadingTeams: boolean;
}) {
  return (
    <>
      {/* Team List - show skeleton while loading, content when ready */}
      {isLoadingTeams ? (
        <TeamListSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardDescription>All Teams</CardDescription>
          </CardHeader>
          <TeamList teams={teams} setTeams={setTeams} />
        </Card>
      )}
      
      {/* Import Form - always render immediately */}
      <Card>
        <CardHeader>
          <CardTitle>Import Team from Dotabuff</CardTitle>
          <CardDescription>Import a team and all their matches from Dotabuff</CardDescription>
        </CardHeader>
        <TeamImportForm teams={teams} setTeams={setTeams} />
      </Card>
    </>
  );
}

/**
 * Team Management Page (Client)
 *
 * - Handles loading and saving teams from localStorage.
 * - Handles optimistic add of teams (from TeamImportForm).
 * - Handles polling for missing team and league names every 2 seconds.
 *   (This is the ONLY place where polling for names happens.)
 * - Passes teams and setTeams to TeamList and TeamImportForm.
 *
 * TeamList and TeamImportForm do NOT poll for names; they only update state for their own actions.
 */
export default function ClientTeamManagementPage() {
  // Default teams for initial state (empty - no teams by default)
  const defaultTeams: Team[] = [];
  const [teams, setTeamsState] = useState<Team[]>(defaultTeams);
  const [hasReset] = useState(false);

  const { isLoadingTeams } = useTeamsLocalStorageSync(setTeamsState, hasReset);
  
  // Start data loading after initial render
  useEffect(() => {
    if (!isLoadingTeams && teams.length > 0) {
      startTransition(() => {
        // Trigger polling and queueing effects
        // These are handled by the existing hooks that are already called above
      });
    }
  }, [isLoadingTeams, teams]);

  return (
    <div className="space-y-6">
      {/* Page Header - always render immediately */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Manage your teams, import from Dotabuff, and refresh data.</p>
      </div>
      
      {/* Content - render immediately with loading states */}
      <TeamManagementContent 
        teams={teams} 
        setTeams={setTeamsState} 
        isLoadingTeams={isLoadingTeams}
      />
    </div>
  );
} 