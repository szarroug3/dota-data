/**
 * Individual Hero Stats Table Component
 * 
 * Renders a single hero statistics table with sorting and filtering
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHeroImageUrl } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { filterHeroRows, sortHeroRows } from "./HeroStatsFilters";

export interface HeroStatsTableProps {
  title: string;
  data: Record<string, any>;
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  filters: {
    heroFilter: string;
    countFilter: string;
    winsFilter: string;
    winRateFilter: string;
  };
  getHighlightStyle: (hero: string, stat: string, value: number) => string;
}

export function HeroStatsTable({
  title,
  data,
  sortBy,
  sortOrder,
  onSortChange,
  filters,
  getHighlightStyle
}: HeroStatsTableProps) {
  // Prepare hero stats rows
  const rows = Object.entries(data).map(([hero, stats]) => [hero, stats]);
  
  // Apply filters and sorting
  const filteredRows = filterHeroRows(rows, filters);
  const sortedRows = sortHeroRows(filteredRows, sortBy, sortOrder);

  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(column, newSortOrder);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (sortedRows.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-muted-foreground text-center py-8">No heroes found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1"
                >
                  Hero {getSortIcon("name")}
                </Button>
              </th>
              <th className="text-left p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("count")}
                  className="flex items-center gap-1"
                >
                  Count {getSortIcon("count")}
                </Button>
              </th>
              <th className="text-left p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("wins")}
                  className="flex items-center gap-1"
                >
                  Wins {getSortIcon("wins")}
                </Button>
              </th>
              <th className="text-left p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("winRate")}
                  className="flex items-center gap-1"
                >
                  Win Rate {getSortIcon("winRate")}
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map(([hero, stats]) => (
              <tr key={hero} className="border-b hover:bg-muted/50">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={getHeroImageUrl(hero)}
                      alt={hero}
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/heroes/default.jpg";
                      }}
                    />
                    <span className="font-medium">{hero}</span>
                  </div>
                </td>
                <td className="p-2">
                  <span className={getHighlightStyle(hero, "count", stats.count)}>
                    {stats.count}
                  </span>
                </td>
                <td className="p-2">
                  <span className={getHighlightStyle(hero, "wins", stats.wins)}>
                    {stats.wins}
                  </span>
                </td>
                <td className="p-2">
                  <Badge
                    variant={stats.winRate >= 60 ? "default" : stats.winRate >= 50 ? "secondary" : "destructive"}
                    className={getHighlightStyle(hero, "winRate", stats.winRate)}
                  >
                    {stats.winRate.toFixed(1)}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 