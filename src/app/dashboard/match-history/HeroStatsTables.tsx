/**
 * Hero Stats Tables Component
 * 
 * Main component for displaying hero statistics tables with filtering and sorting
 */

import { HeroStatsFilterControls } from "@/components/dashboard/hero-stats/HeroStatsFilterControls";
import { useHeroStatsFilters } from "@/components/dashboard/hero-stats/HeroStatsFilters";
import { HeroStatsTable } from "@/components/dashboard/hero-stats/HeroStatsTable";

export interface HeroStatsTablesProps {
  heroStats: {
    ourPicks: Record<string, any>;
    ourBans: Record<string, any>;
    opponentPicks: Record<string, any>;
    opponentBans: Record<string, any>;
  };
  currentTeam: any;
  getHighlightStyle: (hero: string, stat: string, value: number) => string;
}

export default function HeroStatsTables({
  heroStats,
  currentTeam,
  getHighlightStyle
}: HeroStatsTablesProps) {
  const { filters, setFilters, clearFilters } = useHeroStatsFilters();

  const handleSortChange = (tableType: string, sortBy: string, sortOrder: string) => {
    setFilters({
      [`${tableType}SortBy`]: sortBy,
      [`${tableType}SortOrder`]: sortOrder
    });
  };

  return (
    <div className="space-y-6">
      <HeroStatsFilterControls
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={clearFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeroStatsTable
          title="Our Picks"
          data={heroStats.ourPicks}
          sortBy={filters.ourPicksSortBy}
          sortOrder={filters.ourPicksSortOrder}
          onSortChange={(sortBy, sortOrder) => handleSortChange("ourPicks", sortBy, sortOrder)}
          filters={filters}
          getHighlightStyle={getHighlightStyle}
        />

        <HeroStatsTable
          title="Our Bans"
          data={heroStats.ourBans}
          sortBy={filters.ourBansSortBy}
          sortOrder={filters.ourBansSortOrder}
          onSortChange={(sortBy, sortOrder) => handleSortChange("ourBans", sortBy, sortOrder)}
          filters={filters}
          getHighlightStyle={getHighlightStyle}
        />

        <HeroStatsTable
          title="Opponent Picks"
          data={heroStats.opponentPicks}
          sortBy={filters.opponentPicksSortBy}
          sortOrder={filters.opponentPicksSortOrder}
          onSortChange={(sortBy, sortOrder) => handleSortChange("opponentPicks", sortBy, sortOrder)}
          filters={filters}
          getHighlightStyle={getHighlightStyle}
        />

        <HeroStatsTable
          title="Opponent Bans"
          data={heroStats.opponentBans}
          sortBy={filters.opponentBansSortBy}
          sortOrder={filters.opponentBansSortOrder}
          onSortChange={(sortBy, sortOrder) => handleSortChange("opponentBans", sortBy, sortOrder)}
          filters={filters}
          getHighlightStyle={getHighlightStyle}
        />
      </div>
    </div>
  );
}
