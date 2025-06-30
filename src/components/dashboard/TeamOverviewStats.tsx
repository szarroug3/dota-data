import { TrendingUp, Target, Users, Calendar } from "lucide-react";
import StatsCard from "./StatsCard";

interface TeamOverviewStatsProps {
  team: {
    winRate?: number;
    record?: string;
    totalMatches?: number;
    league?: string;
    players: Array<{
      name: string;
      id: string;
      role?: string;
      mmr?: number;
      isStandin?: boolean;
    }>;
    lastMatch?: string;
  };
}

export default function TeamOverviewStats({ team }: TeamOverviewStatsProps) {
  const regularPlayers = team.players.filter((player) => !player.isStandin);
  const standinPlayers = team.players.filter((player) => player.isStandin);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Win Rate"
        value={`${team.winRate || 0}%`}
        description={`${team.record || "0-0"} record`}
        icon={TrendingUp}
      />
      <StatsCard
        title="Total Matches"
        value={team.totalMatches || 0}
        description={team.league || "Unknown League"}
        icon={Target}
      />
      <StatsCard
        title="Active Players"
        value={regularPlayers.length}
        description={`${standinPlayers.length} standin${standinPlayers.length !== 1 ? "s" : ""}`}
        icon={Users}
      />
      <StatsCard
        title="Last Match"
        value={team.lastMatch || "N/A"}
        description="Recent activity"
        icon={Calendar}
      />
    </div>
  );
}
