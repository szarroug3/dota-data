import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeam } from "@/contexts/team-context";
import { useTeamData } from "@/contexts/team-data-context";
import { Calendar, TrendingUp, Trophy, Users } from "lucide-react";

interface TeamDataDisplayProps {
  teamId: string;
  leagueId: string;
}

export function TeamDataDisplay({ teamId, leagueId }: TeamDataDisplayProps) {
  const { getTeamData, getLeagueData, isTeamLoading, getTeamError } = useTeamData();
  const { activeTeam } = useTeam();

  const teamData = getTeamData(teamId);
  const leagueData = getLeagueData(leagueId);
  const isLoading = isTeamLoading(teamId);
  const error = getTeamError(teamId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="w-32 h-4 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="w-24 h-3 bg-muted animate-pulse rounded" />
            <div className="w-32 h-3 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Team Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!teamData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Team Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Team data not available.</p>
        </CardContent>
      </Card>
    );
  }

  const matchIds = teamData.matchIdsByLeague?.[leagueId] || [];
  const isActive = activeTeam?.id === `${teamId}-${leagueId}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{teamData.teamName || `Team ${teamId}`}</CardTitle>
            {isActive && (
              <Badge variant="default" className="ml-2">
                Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* League Information */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {leagueData?.leagueName || `League ${leagueId}`}
              </p>
              <p className="text-xs text-muted-foreground">League</p>
            </div>
          </div>

          {/* Match Count */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{matchIds.length}</p>
              <p className="text-xs text-muted-foreground">Matches</p>
            </div>
          </div>

          {/* Player Count */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {teamData.players?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Players</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {matchIds.length === 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              No matches found for this league. You can manually add matches using the &quot;Add Match&quot; button.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 