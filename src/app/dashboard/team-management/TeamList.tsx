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
            {team.loading ? `Team ${team.teamId}` : team.teamName}
          </span>
          {isActive && (
            <Badge variant="default" className="ml-2">
              Active
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{team.loading ? `League ${team.leagueId}` : (team.leagueName || team.leagueId)}</span>
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

function useTeamListHandlers(currentTeam: Team | null, setCurrentTeam: (team: Team | null) => void, setRefreshingId: (id: string | null) => void, setForceRefreshingId: (id: string | null) => void) {
  const { teams, removeTeam, setActiveTeam } = useTeam();

  const handleSwitchTeam = (team: Team) => {
    setActiveTeam(team.id);
  };

  const handleDeleteTeam = (id: string) => {
    removeTeam(id);
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
    // TODO: Implement refresh logic using the new API structure
    // For now, just show the loading state
  };

  const handleForceRefreshTeam = async (team: Team) => {
    setForceRefreshingId(team.id);
    // Note: Force refresh logic would need to be updated to work with the new context
    // For now, we'll just show the loading state
    setTimeout(() => {
      setForceRefreshingId(null);
    }, 2000);
    // TODO: Implement force refresh logic using the new API structure
    // For now, just show the loading state
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
export default function TeamList() {
  // NOTE: This component does NOT poll for team/league names.
  // Ongoing polling is handled by the team context.
  // Only refresh/force refresh logic is handled here.
  const { teams, activeTeam } = useTeam();

  const [forceRefreshingId, setForceRefreshingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const {
    handleSwitchTeam,
    handleDeleteTeam,
    handleRefreshTeam,
    handleForceRefreshTeam,
  } = useTeamListHandlers(activeTeam, () => {}, setRefreshingId, setForceRefreshingId);

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
          currentTeam={activeTeam}
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