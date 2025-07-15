

import type { MetaStats } from '@/hooks/useDraftSuggestions';

import { MetaStatsCard } from './MetaStatsCard';

interface MetaStatsSectionProps {
  metaStats: MetaStats;
}

export function MetaStatsSection({ metaStats }: MetaStatsSectionProps) {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-4">
        Meta Snapshot
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetaStatsCard title="Top Picks" heroes={metaStats.topPicks} />
        <MetaStatsCard title="Top Bans" heroes={metaStats.topBans} />
        <MetaStatsCard title="Emerging Heroes" heroes={metaStats.emergingHeroes} />
        <MetaStatsCard title="Top Counter-Picks" heroes={metaStats.counterPicks} />
      </div>
    </div>
  );
} 