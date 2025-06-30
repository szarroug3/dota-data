import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DataCard from "./DataCard";

interface LeagueStandingsProps {
  standings: Array<{
    position: number;
    team: string;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  league: string;
}

export default function LeagueStandings({
  standings,
  league,
}: LeagueStandingsProps) {
  return (
    <DataCard
      title="League Standings"
      description={`Current standings in ${league}`}
      icon={Trophy}
    >
      <div className="space-y-3">
        {standings.map((team) => (
          <div
            key={team.team}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                {team.position}
              </div>
              <div>
                <h4 className="font-medium">{team.team}</h4>
                <p className="text-sm text-muted-foreground">
                  {team.wins}W - {team.losses}L
                </p>
              </div>
            </div>
            <Badge variant="outline">{team.winRate}%</Badge>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
