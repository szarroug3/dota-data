/**
 * Individual Hero Stats Table Component
 * 
 * Renders a single hero statistics table with sorting and filtering
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHeroImageUrl } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { filterHeroRows, HeroStatsFilters, sortHeroRows } from "./HeroStatsFilters";

// Types for hero stats data
interface HeroStats {
  count: number;
  wins: number;
  winRate: number;
}

export interface HeroStatsTableProps {
  title: string;
  data: Record<string, HeroStats>;
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  filters: HeroStatsFilters;
  getHighlightStyle: (hero: string, stat: string, value: number) => string;
}

// Sort button component
function SortButton({ 
  column, 
  currentSortBy, 
  currentSortOrder, 
  onSort 
}: { 
  column: string; 
  currentSortBy: string; 
  currentSortOrder: string; 
  onSort: (column: string) => void; 
}) {
  const getSortIcon = () => {
    if (currentSortBy !== column) return null;
    return currentSortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(column)}
      className="flex items-center gap-1"
    >
      {column === "name" ? "Hero" : column === "count" ? "Count" : column === "wins" ? "Wins" : "Win Rate"} {getSortIcon()}
    </Button>
  );
}

// Hero row component
function HeroRow({ 
  hero, 
  stats, 
  getHighlightStyle 
}: { 
  hero: string; 
  stats: HeroStats; 
  getHighlightStyle: (hero: string, stat: string, value: number) => string; 
}) {
  return (
    <tr className="border-b hover:bg-muted/50">
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
  );
}

// Table header component
function TableHeader({ 
  sortBy, 
  sortOrder, 
  onSortChange 
}: { 
  sortBy: string; 
  sortOrder: string; 
  onSortChange: (sortBy: string, sortOrder: string) => void; 
}) {
  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(column, newSortOrder);
  };

  return (
    <thead>
      <tr className="border-b">
        <th className="text-left p-2">
          <SortButton 
            column="name" 
            currentSortBy={sortBy} 
            currentSortOrder={sortOrder} 
            onSort={handleSort} 
          />
        </th>
        <th className="text-left p-2">
          <SortButton 
            column="count" 
            currentSortBy={sortBy} 
            currentSortOrder={sortOrder} 
            onSort={handleSort} 
          />
        </th>
        <th className="text-left p-2">
          <SortButton 
            column="wins" 
            currentSortBy={sortBy} 
            currentSortOrder={sortOrder} 
            onSort={handleSort} 
          />
        </th>
        <th className="text-left p-2">
          <SortButton 
            column="winRate" 
            currentSortBy={sortBy} 
            currentSortOrder={sortOrder} 
            onSort={handleSort} 
          />
        </th>
      </tr>
    </thead>
  );
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
  const rows: [string, HeroStats][] = Object.entries(data).map(([hero, stats]) => [hero, stats]);
  
  // Apply filters and sorting
  const filteredRows = filterHeroRows(rows, filters);
  const sortedRows = sortHeroRows(filteredRows, sortBy, sortOrder);

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
          <TableHeader 
            sortBy={sortBy} 
            sortOrder={sortOrder} 
            onSortChange={onSortChange} 
          />
          <tbody>
            {sortedRows.map(([hero, stats]) => (
              <HeroRow 
                key={hero} 
                hero={hero} 
                stats={stats} 
                getHighlightStyle={getHighlightStyle} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 