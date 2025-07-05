import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/contexts/team-context";
import { logWithTimestamp } from "@/lib/utils";
import type { Match, Team } from "@/types/team";
import { FileText, Loader2 } from "lucide-react";
import { ReactElement, useRef, useState } from "react";

export function TeamImportFormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-wrapper">
      {/* Card, CardHeader, CardTitle, CardDescription are rendered in the parent */}
      {children}
    </div>
  );
}

// 1. Move pollForData to module scope and type it
async function pollForData(url: string, options: RequestInit): Promise<Record<string, unknown>> {
  console.log('pollForData called:', url, options);
  const res = await fetch(url, options);
  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch { data = {}; }
    throw new Error((data as { error?: string })?.error || 'Failed to fetch data');
  }
  return res.json();
}

// Extract createOptimisticTeam to its own file-level function (already done)
function createOptimisticTeam(teamId: string, leagueId: string): Team {
  const uniqueId = `${teamId}-${leagueId}`;
  return {
    id: uniqueId,
    teamId,
    teamName: teamId,
    leagueId,
    leagueName: leagueId,
    players: [],
    loading: true,
  };
}

// Helper for extracting error message from unknown
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return 'Unknown error';
}

function handleMatchesUpdate(
  optimisticTeam: Team,
  newTeam: Record<string, unknown>,
  teamsRef: React.MutableRefObject<Team[]>,
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>,
  _setCurrentTeam: (team: Team) => void
) {
  setTeams(prevTeams => {
    const updatedTeams = prevTeams.map((t: Team) => {
      if (t.id !== optimisticTeam.id) return t;
      // Never update id or leagueId, only update intended fields
      return {
        ...t,
        teamName: typeof newTeam.teamName === 'string' ? newTeam.teamName : t.teamName,
        matchIds: Array.isArray(newTeam.matchIds) ? newTeam.matchIds as string[] : t.matchIds,
        matchIdsByLeague: typeof newTeam.matchIdsByLeague === 'object' ? newTeam.matchIdsByLeague as Record<string, string[]> : t.matchIdsByLeague,
        manualMatches: Array.isArray(newTeam.manualMatches) ? newTeam.manualMatches as Match[] : t.manualMatches,
        loading: false,
      } as Team;
    });
    localStorage.setItem('dota-dashboard-teams', JSON.stringify(updatedTeams));
    return updatedTeams;
  });
}

function handleLeagueUpdate(
  optimisticTeam: Team,
  leagueData: Record<string, unknown>,
  teamsRef: React.MutableRefObject<Team[]>,
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>,
  _setCurrentTeam: (team: Team) => void
) {
  console.log('[handleLeagueUpdate] leagueData:', leagueData, 'leagueName:', leagueData.leagueName);
  const leagueName = (leagueData.leagueName as string) || optimisticTeam.leagueId;
  setTeams(prevTeams => {
    const updatedTeams = prevTeams.map((t: Team) => {
      if (t.id !== optimisticTeam.id) return t;
      console.log('[handleLeagueUpdate] updating team:', t, 'with leagueName:', leagueName);
      // Never update id or leagueId, only update leagueName
      return {
        ...t,
        leagueName,
      } as Team;
    });
    localStorage.setItem('dota-dashboard-teams', JSON.stringify(updatedTeams));
    return updatedTeams;
  });
}

function useTeamImport(
  teams: Team[],
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>,
  setCurrentTeam: (team: Team) => void
) {
  const teamsRef = useRef(teams);
  teamsRef.current = teams;
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState("");
  const [leagueId, setLeagueId] = useState("");

  const onImport = async (): Promise<void> => {
    setImportError(null);
    setImporting(true);
    const existingTeam = teams.find((t: Team) => t.id === `${teamId}-${leagueId}`);
    if (existingTeam) {
      setImportError(`Team ${teamId} in league ${leagueId} already exists.`);
      setImporting(false);
      return;
    }
    if (!teamId || !leagueId) {
      setImportError("Both Team ID and League ID are required.");
      setImporting(false);
      return;
    }
    const optimisticTeam = createOptimisticTeam(teamId, leagueId);
    setTeams(prevTeams => [...prevTeams, optimisticTeam]);
    setCurrentTeam(optimisticTeam);
    setTeamId("");
    setLeagueId("");
    try {
      logWithTimestamp('log', `[TeamImportForm] optimisticTeam: ${JSON.stringify(optimisticTeam, null, 2)}`);
      console.log('Making POST to', `/api/teams/${optimisticTeam.teamId}/matches`, 'with leagueId', optimisticTeam.leagueId);
      const matchesPromise = pollForData(`/api/teams/${optimisticTeam.teamId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: optimisticTeam.leagueId }),
      });
      const leaguePromise = pollForData(`/api/leagues/${optimisticTeam.leagueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      matchesPromise.then((newTeam: Record<string, unknown>) =>
        handleMatchesUpdate(optimisticTeam, newTeam, teamsRef, setTeams, () => {})
      ).catch((e: unknown) => {
        setImportError(getErrorMessage(e));
        setTeams(prevTeams => prevTeams.map((t: Team) =>
          t.id === optimisticTeam.id ? { ...t, loading: false } : t
        ));
      });
      leaguePromise.then((leagueData: Record<string, unknown>) =>
        handleLeagueUpdate(optimisticTeam, leagueData, teamsRef, setTeams, () => {})
      ).catch((e: unknown) => {
        setImportError(getErrorMessage(e));
        setTeams(prevTeams => prevTeams.map((t: Team) =>
          t.id === optimisticTeam.id ? { ...t } : t
        ));
      });
    } catch (e: unknown) {
      setImportError(getErrorMessage(e));
      setTeams(prevTeams => prevTeams.map((t: Team) =>
        t.id === optimisticTeam.id ? { ...t, loading: false } : t
      ));
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    importError,
    teamId,
    leagueId,
    setTeamId,
    setLeagueId,
    onImport,
  };
}

export default function TeamImportForm({ teams, setTeams }: { teams: Team[]; setTeams: React.Dispatch<React.SetStateAction<Team[]>> }): ReactElement {
  const { setCurrentTeam } = useTeam();
  const {
    importing,
    importError,
    teamId,
    leagueId,
    setTeamId,
    setLeagueId,
    onImport,
  } = useTeamImport(teams, setTeams, setCurrentTeam);

  return (
    <CardContent className="space-y-4">
      {importError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <div className="text-sm">{importError}</div>
        </div>
      )}
      <div>
        <Label htmlFor="team-id">Team ID</Label>
        <Input
          id="team-id"
          placeholder="Team ID (e.g. 9517508)"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          disabled={importing}
        />
      </div>
      <div>
        <Label htmlFor="league-id">League ID</Label>
        <Input
          id="league-id"
          placeholder="League ID (e.g. 16435)"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
          disabled={importing}
        />
      </div>
      <Button onClick={onImport} disabled={importing} size="sm">
        {importing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Add Team
          </>
        )}
      </Button>
    </CardContent>
  );
} 