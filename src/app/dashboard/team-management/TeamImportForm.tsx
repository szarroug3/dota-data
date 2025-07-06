import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/contexts/team-context";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
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
  const { addTeam } = useTeam();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState("");
  const [leagueId, setLeagueId] = useState("");

  const onImport = async (): Promise<void> => {
    setImportError(null);
    setImporting(true);
    
    if (!teamId || !leagueId) {
      setImportError("Both Team ID and League ID are required for importing from Dotabuff.");
      setImporting(false);
      return;
    }

    // Validate input format
    if (!/^\d+$/.test(teamId)) {
      setImportError("Team ID must be a valid number.");
      setImporting(false);
      return;
    }

    if (!/^\d+$/.test(leagueId)) {
      setImportError("League ID must be a valid number.");
      setImporting(false);
      return;
    }

    try {
      // Use the context's addTeam function which handles the API call
      await addTeam(teamId, leagueId);
      setTeamId("");
      setLeagueId("");
    } catch (e: unknown) {
      const errorMessage = getErrorMessage(e);
      
      // Provide more specific error messages based on common issues
      if (errorMessage.includes('Failed to fetch team or league data')) {
        setImportError("Unable to fetch team or league data. Please verify the Team ID and League ID are correct.");
      } else if (errorMessage.includes('Failed to scrape team data')) {
        setImportError("Unable to scrape team data. The team may not exist or the league may not be available.");
      } else if (errorMessage.includes('already exists')) {
        setImportError("This team has already been imported for this league.");
      } else {
        setImportError(errorMessage);
      }
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
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">{importError}</div>
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="team-id">Team ID</Label>
        <Input
          id="team-id"
          placeholder="1234567"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          disabled={importing}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Find the Team ID in the Dotabuff team URL (e.g., dotabuff.com/teams/1234567)
        </p>
      </div>
      <div>
        <Label htmlFor="league-id">League ID</Label>
        <Input
          id="league-id"
          placeholder="16435"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
          disabled={importing}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Find the League ID in the Dotabuff league URL (e.g., dotabuff.com/leagues/16435)
        </p>
      </div>
      <Button onClick={onImport} disabled={importing} size="sm" className="w-full">
        {importing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing Team...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Import Team
          </>
        )}
      </Button>
    </CardContent>
  );
} 