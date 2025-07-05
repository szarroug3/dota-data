import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/contexts/team-context";
import { logWithTimestamp } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import { ReactElement, useState } from "react";

export function TeamImportFormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-wrapper">
      {/* Card, CardHeader, CardTitle, CardDescription are rendered in the parent */}
      {children}
    </div>
  );
}

// Helper for extracting error message from unknown
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return 'Unknown error';
}

function useTeamImport() {
  const { teams, addTeam, setActiveTeam } = useTeam();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState("");
  const [leagueId, setLeagueId] = useState("");

  const onImport = async (): Promise<void> => {
    setImportError(null);
    setImporting(true);
    
    if (!teamId || !leagueId) {
      setImportError("Both Team ID and League ID are required.");
      setImporting(false);
      return;
    }

    try {
      // Use the context's addTeam function which handles the API call
      await addTeam(teamId, leagueId);
      setTeamId("");
      setLeagueId("");
    } catch (e: unknown) {
      setImportError(getErrorMessage(e));
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

export default function TeamImportForm(): ReactElement {
  const {
    importing,
    importError,
    teamId,
    leagueId,
    setTeamId,
    setLeagueId,
    onImport,
  } = useTeamImport();

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