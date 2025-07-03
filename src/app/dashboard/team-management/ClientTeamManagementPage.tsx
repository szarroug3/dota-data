"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useTeam } from "@/contexts/team-context";
import type { Team } from "@/types/team";
import { useEffect, useState } from "react";
import TeamImportForm from "./TeamImportForm";
import TeamList from "./TeamList";

function pollForTeamAndLeagueNames(teams: Team[], setTeams: (teams: Team[]) => void) {
  teams.forEach((team, idx) => {
    // Only poll if teamName or leagueName is missing or marked as loading
    if (!team.teamName || team.teamName === 'loading' || !team.leagueName || team.leagueName === 'loading') {
      // Poll for team name
      if (team.teamId) {
        fetch(`/api/teams/${team.teamId}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.name && data.name !== team.teamName) {
              const updated = [...teams];
              updated[idx] = { ...team, teamName: data.name };
              setTeams(updated);
              if (typeof window !== 'undefined') {
                localStorage.setItem("dota-dashboard-teams", JSON.stringify(updated));
              }
            }
          });
      }
      // Poll for league name
      if (team.leagueId) {
        fetch(`/api/leagues/${team.leagueId}`)
          .then(res => res.ok ? res.json().then(data => ({ status: res.status, data })) : null)
          .then(result => {
            if (result && result.status === 200 && result.data && result.data.leagueName && result.data.leagueName !== team.leagueName) {
              const updated = [...teams];
              const idx = updated.findIndex(t => t.id === team.id);
              if (idx !== -1) {
                updated[idx] = { ...updated[idx], leagueName: result.data.leagueName };
                setTeams(updated);
              }
            }
          });
      }
    }
  });
}

// Move this to module scope, not on window
const matchDataQueuedTeams = new WeakSet<any>();

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
  const { currentTeam, setCurrentTeam, isLoaded } = useTeam();
  const { toast } = useToast();

  // Default teams for initial state (empty - no teams by default)
  const defaultTeams: Team[] = [];

  // Always start with default teams to avoid hydration mismatch
  const [teams, setTeamsState] = useState<Team[]>(defaultTeams);
  const [isLoadedState, setIsLoadedState] = useState(false);
  const [hasReset, setHasReset] = useState(false);

  // NEW: Track expected team count for skeleton fallback
  const [expectedTeamCount, setExpectedTeamCount] = useState(1);

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined" && !hasReset) {
      const loadTeams = () => {
        const stored = localStorage.getItem("dota-dashboard-teams");
        if (stored) {
          try {
            const parsedTeams = JSON.parse(stored);
            setTeamsState(parsedTeams);
            setExpectedTeamCount(Array.isArray(parsedTeams) && parsedTeams.length > 0 ? parsedTeams.length : 1);
          } catch (e) {
            setExpectedTeamCount(1);
          }
        } else {
          setExpectedTeamCount(1);
          setTeamsState([]);
        }
      };
      loadTeams();
      // Listen for storage events to update teams when changed elsewhere
      const handleStorage = (e: StorageEvent) => {
        if (e.key === "dota-dashboard-teams") {
          loadTeams();
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, [hasReset]);

  // Restore active team from localStorage after teams are loaded
  useEffect(() => {
    if (isLoaded && teams.length > 0 && !currentTeam) {
      const savedTeamId = localStorage.getItem("activeTeamId");
      if (savedTeamId) {
        const found = teams.find((t) => t.id === savedTeamId);
        if (found) {
          setCurrentTeam(found);
        }
      }
    }
  }, [isLoaded, teams, currentTeam, setCurrentTeam]);

  // Sync current team with teams list if there's a mismatch
  useEffect(() => {
    if (isLoaded && currentTeam && teams.length > 0) {
      const teamExists = teams.some((team) => team.id === currentTeam.id);
      if (!teamExists) {
        const updatedTeams = [...teams, currentTeam];
        setTeamsState(updatedTeams);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "dota-dashboard-teams",
            JSON.stringify(updatedTeams),
          );
        }
      }
    }
  }, [isLoaded, currentTeam, teams]);

  // Update queue stats periodically
  useEffect(() => {
    // This is a no-op in the client version (no cacheService)
  }, []);

  // Poll for team and league names if missing
  useEffect(() => {
    if (teams.length > 0) {
      // This interval is the ONLY place where polling for team/league names happens.
      // Do not add polling in TeamList or TeamImportForm.
      const interval = setInterval(() => {
        pollForTeamAndLeagueNames(teams, setTeamsState);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [teams]);

  // Queue up match data requests for all matchIds for a team after import
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
          // Fire-and-forget fetch to queue match data
          fetch(`/api/matches/${matchId}`);
        });
      }
    });
     
  }, [teams]);

  // Main UI with lazy loaded subcomponents and suspense skeletons
  return (
    <div className="space-y-6">
      {/* Page Header - always render immediately */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Manage your teams, import from Dotabuff, and refresh data.</p>
      </div>
      {/* Loading state: show skeletons for TeamList and ImportForm only */}
      {!isLoaded ? (
        <>
          {/* Team Selection Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-32" />
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Team Management Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
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
          {/* Import Section Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Team List */}
          <Card>
            <CardHeader>
              <CardDescription>All Teams</CardDescription>
            </CardHeader>
            <TeamList teams={teams} setTeams={setTeamsState} />
          </Card>
          {/* Import Form */}
          <Card>
            <CardHeader>
              <CardTitle>Import Team from Dotabuff</CardTitle>
              <CardDescription>Import a team and all their matches from Dotabuff</CardDescription>
            </CardHeader>
            <TeamImportForm teams={teams} setTeams={setTeamsState} />
          </Card>
        </>
      )}
    </div>
  );
} 