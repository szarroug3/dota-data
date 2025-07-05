import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { useTeam } from "@/contexts/team-context";
import { logWithTimestamp } from "@/lib/utils";
import type { Team as TeamBase } from "@/types/team";
import { Check, FileText, Loader2, RefreshCw, Trash2, Zap } from "lucide-react";
import { useState } from "react";

// Extend Team type locally to include UI-only fields
export type Team = TeamBase & {
  failed?: boolean;
  error?: string;
  loading?: boolean;
};

// Poll for team matches utility (shared by refresh and force refresh)
async function pollForTeamMatches(url: string, options: RequestInit): Promise<unknown> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error('Failed to fetch team matches');
  return res.json();
}

export function TeamListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-wrapper">
      {/* Card, CardHeader, CardDescription are rendered in the parent */}
      {children}
    </div>
  );
}

function SwitchButton({ team, currentTeam, onSwitch }: { team: Team; currentTeam: Team | null; onSwitch: (team: Team) => void }) {
  if (team.loading || team.failed || currentTeam?.id === team.id) return null;
  return (
    <Button variant="outline" size="sm" onClick={() => onSwitch(team)}>
      Switch
    </Button>
  );
}

function RefreshButton({ team, refreshingId, onRefresh }: { team: Team; refreshingId: string | null; onRefresh: (team: Team) => void }) {
  if (team.loading || team.failed) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onRefresh(team)}
      disabled={refreshingId === team.id}
      title={!team.dotabuffUrl ? "No Dotabuff URL available for refresh" : "Refresh team data and matches"}
      className="w-10"
    >
      {refreshingId === team.id ? <Check className="w-4 h-4 text-green-500" /> : <RefreshCw className="w-4 h-4" />}
    </Button>
  );
}

function ForceRefreshButton({ team, forceRefreshingId, onForceRefresh }: { team: Team; forceRefreshingId: string | null; onForceRefresh: (team: Team) => void }) {
  if (team.loading || team.failed) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onForceRefresh(team)}
      disabled={forceRefreshingId === team.id}
      title={!team.dotabuffUrl ? "No Dotabuff URL available for force refresh" : "Force refresh all team data and matches"}
      className="w-10"
    >
      {forceRefreshingId === team.id ? <Check className="w-4 h-4 text-green-500" /> : <Zap className="w-4 h-4" />}
    </Button>
  );
}

function DeleteButton({ team, onDelete }: { team: Team; onDelete: (id: string) => void }) {
  if (team.loading || team.failed) return null;
  return (
    <Button variant="destructive" size="sm" onClick={() => onDelete(team.id)}>
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

function TeamActions({
  team,
  currentTeam,
  refreshingId,
  forceRefreshingId,
  onSwitch,
  onRefresh,
  onForceRefresh,
  onDelete,
}: {
  team: Team;
  currentTeam: Team | null;
  refreshingId: string | null;
  forceRefreshingId: string | null;
  onSwitch: (team: Team) => void;
  onRefresh: (team: Team) => void;
  onForceRefresh: (team: Team) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <SwitchButton team={team} currentTeam={currentTeam} onSwitch={onSwitch} />
      <RefreshButton team={team} refreshingId={refreshingId} onRefresh={onRefresh} />
      <ForceRefreshButton team={team} forceRefreshingId={forceRefreshingId} onForceRefresh={onForceRefresh} />
      <DeleteButton team={team} onDelete={onDelete} />
    </div>
  );
}

function TeamListRow({
  team,
  currentTeam,
  refreshingId,
  forceRefreshingId,
  onSwitch,
  onRefresh,
  onForceRefresh,
  onDelete,
}: {
  team: Team;
  currentTeam: Team | null;
  refreshingId: string | null;
  forceRefreshingId: string | null;
  onSwitch: (team: Team) => void;
  onRefresh: (team: Team) => void;
  onForceRefresh: (team: Team) => void;
  onDelete: (id: string) => void;
}) {
  const isActive = currentTeam?.id === team.id;
  
  return (
    <div
      key={team.id}
      className={`flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg gap-2 transition-all duration-200 ${
        isActive 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'border-border hover:border-border/60'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {team.loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            </>
          ) : null}
          <span className={`font-semibold ${isActive ? 'text-primary' : ''}`}>
            {team.teamName}
          </span>
          {isActive && (
            <Badge variant="default" className="ml-2">
              Active
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{team.leagueName || team.leagueId}</span>
        </div>
      </div>
      <TeamActions
        team={team}
        currentTeam={currentTeam}
        refreshingId={refreshingId}
        forceRefreshingId={forceRefreshingId}
        onSwitch={onSwitch}
        onRefresh={onRefresh}
        onForceRefresh={onForceRefresh}
        onDelete={onDelete}
      />
    </div>
  );
}

function useTeamListHandlers(teams: Team[], setTeams: React.Dispatch<React.SetStateAction<Team[]>> | undefined, currentTeam: Team | null, setCurrentTeam: (team: Team | null) => void, setRefreshingId: (id: string | null) => void, setForceRefreshingId: (id: string | null) => void) {
  const handleSwitchTeam = (team: Team) => {
    setCurrentTeam(team);
  };

  const handleDeleteTeam = (id: string) => {
    const updatedTeams = teams.filter((team: Team) => team.id !== id);
    if (setTeams) setTeams(updatedTeams);
    if (typeof window !== "undefined") {
      localStorage.setItem("dota-dashboard-teams", JSON.stringify(updatedTeams));
    }
    if (currentTeam?.id === id) {
      setCurrentTeam(updatedTeams.length > 0 ? updatedTeams[0] : null);
    }
  };

  const handleRefreshTeam = async (team: Team) => {
    setRefreshingId(team.id);
    setTimeout(() => {
      setRefreshingId(null);
    }, 2000);
    if (!team.teamId || !team.leagueId) {
      logWithTimestamp('error', '[TeamList] Refresh failed: Missing teamId or leagueId', { teamId: team.teamId, leagueId: team.leagueId });
      return;
    }
    logWithTimestamp('log', '[TeamList] Refresh - team data:', { teamId: team.teamId, leagueId: team.leagueId });
    pollForTeamMatches(
      `/api/teams/${team.teamId}/matches`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: team.leagueId }),
      }
    )
      .then((data: unknown) => {
        logWithTimestamp('log', '[TeamList] Refresh import completed successfully', data);
      })
      .catch((error: unknown) => {
        logWithTimestamp('log', '[TeamList] Refresh background error (handled silently):', error);
      });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('reset-queue-polling-interval'));
    }
  };

  const handleForceRefreshTeam = async (team: Team) => {
    setForceRefreshingId(team.id);
    const clearedTeam: Team = { ...team, manualMatches: [], players: [] };
    const updatedTeams = teams.map((t) => (t.id === team.id ? clearedTeam : t));
    if (setTeams) { setTeams(updatedTeams); }
    if (typeof window !== "undefined") {
      localStorage.setItem("dota-dashboard-teams", JSON.stringify(updatedTeams));
    }
    if (currentTeam?.id === team.id) {
      setCurrentTeam(clearedTeam);
    }
    setTimeout(() => {
      setForceRefreshingId(null);
    }, 2000);
    pollForTeamMatches(
      `/api/teams/${team.teamId}/matches`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: team.leagueId, force: true }),
      }
    )
      .then((newTeam: unknown) => {
        logWithTimestamp('log', '[TeamList] Import successful, new team data:', newTeam);
        const finalTeams = updatedTeams.map((t) =>
          t.id === team.id ? ({
            ...t,
            ...(newTeam as Partial<Team>),
            loading: false,
          } as Team) : t
        );
        if (setTeams) { setTeams(finalTeams); }
        if (currentTeam?.id === team.id) {
          setCurrentTeam({ ...clearedTeam, ...(newTeam as Partial<Team>), loading: false });
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("dota-dashboard-teams", JSON.stringify(finalTeams));
        }
      })
      .catch((error: unknown) => {
        logWithTimestamp('log', '[TeamList] Force refresh background error (handled silently):', error);
      });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('reset-queue-polling-interval'));
    }
  };

  return { handleSwitchTeam, handleDeleteTeam, handleRefreshTeam, handleForceRefreshTeam };
}

/**
 * TeamList component that displays all teams with management options.
 * 
 * Force Refresh Behavior:
 * - Shows checkmark briefly when force refresh is clicked
 * - Clears team data immediately
 * - Shows checkmark for 2 seconds to confirm request was submitted
 * - Background processing happens transparently via the queue system
 * 
 * This approach is honest about what's happening - the user knows their
 * request has been submitted and is being processed in the background.
 */
export default function TeamList({ teams, setTeams }: { teams: Team[]; setTeams?: React.Dispatch<React.SetStateAction<Team[]>> }) {
  // NOTE: This component does NOT poll for team/league names.
  // Ongoing polling is handled by ClientTeamManagementPage.
  // Only refresh/force refresh logic is handled here.
  const {
    currentTeam,
    setCurrentTeam,
  } = useTeam();

  const [forceRefreshingId, setForceRefreshingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const {
    handleSwitchTeam,
    handleDeleteTeam,
    handleRefreshTeam,
    handleForceRefreshTeam,
  } = useTeamListHandlers(teams, setTeams, currentTeam, setCurrentTeam, setRefreshingId, setForceRefreshingId);

  // Show empty state immediately if no teams
  if (!teams || teams.length === 0) {
    return (
      <CardContent className="space-y-3">
        <div className="text-center text-muted-foreground py-8">
          <div className="mb-4">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p className="text-sm">Use the form below to import your first team from Dotabuff.</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="space-y-3">
      {teams.map((team) => (
        <TeamListRow
          key={team.id}
          team={team}
          currentTeam={currentTeam}
          refreshingId={refreshingId}
          forceRefreshingId={forceRefreshingId}
          onSwitch={handleSwitchTeam}
          onRefresh={handleRefreshTeam}
          onForceRefresh={handleForceRefreshTeam}
          onDelete={handleDeleteTeam}
        />
      ))}
    </CardContent>
  );
} 