/**
 * Hero Stats Tables Component
 * 
 * Main component for displaying hero statistics tables with filtering and sorting
 */

import { HeroStatsFilterControls } from "@/components/dashboard/hero-stats/HeroStatsFilterControls";
import { useHeroStatsFilters } from "@/components/dashboard/hero-stats/HeroStatsFilters";
import { HeroStatsTable } from "@/components/dashboard/hero-stats/HeroStatsTable";
import type { HeroStatsData } from "./match-utils";

interface HeroStatsTablesProps {
  heroStats: HeroStatsData;
  getHighlightStyle: (hero: string, type: string) => string;
  loading?: boolean;
}

export default function HeroStatsTables({ 
  heroStats, 
  getHighlightStyle, 
  loading = false 
}: HeroStatsTablesProps) {
  const { filters, setFilters, clearFilters } = useHeroStatsFilters();

  const handleSortChange = (tableType: string, sortBy: string, sortOrder: string) => {
    setFilters({
      [`${tableType}SortBy`]: sortBy,
      [`${tableType}SortOrder`]: sortOrder
    });
  };

  // Only show loading skeleton if we have no hero stats data and are loading
  const shouldShowLoading = loading && (
    !heroStats || 
    (Object.keys(heroStats.ourPicks).length === 0 && 
     Object.keys(heroStats.ourBans).length === 0 && 
     Object.keys(heroStats.opponentPicks).length === 0 && 
     Object.keys(heroStats.opponentBans).length === 0)
  );

  if (shouldShowLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 w-full bg-muted animate-pulse rounded" />
        <div className="h-32 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroStatsFilterControls
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={clearFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Left: Our Picks */}
        <HeroStatsTable
          title="Our Picks"
          data={heroStats.ourPicks}
          sortBy={filters.ourPicksSortBy}
          sortOrder={filters.ourPicksSortOrder}
          onSortChange={(sortBy, sortOrder) => handleSortChange("ourPicks", sortBy, sortOrder)}
          filters={filters}
          getHighlightStyle={getHighlightStyle}
        />

        {/* Top Right: Opponent Picks */}
        <HeroStatsTable
          title="Opponent Picks"
          data={heroStats.opponentPicks}
          sortBy={filters.opponentPicksSortBy}
          sortOrder={filters.opponentPicksSortOrder}
          onSortChange={(sortBy, sortOrder) => handleSortChange("opponentPicks", sortBy, sortOrder)}
          filters={filters}
          getHighlightStyle={getHighlightStyle}
        />

        {/* Bottom Left: Our Bans */}
        <HeroStatsTable
          title="Our Bans"
          data={heroStats.ourBans}
          sortBy={filters.ourBansSortBy}
          sortOrder={filters.ourBansSortOrder}
          onSortChange={(sortBy, sortOrder) => handleSortChange("ourBans", sortBy, sortOrder)}
          filters={filters}
          getHighlightStyle={getHighlightStyle}
        />

        {/* Bottom Right: Opponent Bans */}
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
