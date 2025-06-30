import { Target, TrendingUp, AlertTriangle, Users, Shield } from "lucide-react";
import StatsCard from "./StatsCard";

interface DraftSuggestionsOverviewProps {
  suggestions: {
    totalSuggestions: number;
    strongPicks: number;
    weakPicks: number;
    metaCounters: number;
    teamSynergies: number;
  };
  error?: string;
}

export default function DraftSuggestionsOverview({
  suggestions,
  error,
}: DraftSuggestionsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatsCard
        title="Total Suggestions"
        value={suggestions.totalSuggestions}
        description="Available picks"
        icon={Target}
        error={error}
      />
      <StatsCard
        title="Strong Picks"
        value={suggestions.strongPicks}
        description="High priority"
        icon={TrendingUp}
        iconColor="text-green-600"
        error={error}
      />
      <StatsCard
        title="Weak Picks"
        value={suggestions.weakPicks}
        description="Avoid these"
        icon={AlertTriangle}
        iconColor="text-red-600"
        error={error}
      />
      <StatsCard
        title="Meta Counters"
        value={suggestions.metaCounters}
        description="Current meta"
        icon={Shield}
        iconColor="text-blue-600"
        error={error}
      />
      <StatsCard
        title="Team Synergies"
        value={suggestions.teamSynergies}
        description="Good combinations"
        icon={Users}
        iconColor="text-purple-600"
        error={error}
      />
    </div>
  );
}
