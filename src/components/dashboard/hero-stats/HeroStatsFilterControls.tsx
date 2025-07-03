/**
 * Hero Stats Filter Controls Component
 * 
 * Provides filter input controls for hero statistics
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { HeroStatsFilters } from "./HeroStatsFilters";

export interface HeroStatsFilterControlsProps {
  filters: HeroStatsFilters;
  onFilterChange: (filters: Partial<HeroStatsFilters>) => void;
  onClearFilters: () => void;
}

export function HeroStatsFilterControls({
  filters,
  onFilterChange,
  onClearFilters
}: HeroStatsFilterControlsProps) {
  const hasActiveFilters = filters.heroFilter || filters.countFilter || filters.winsFilter || filters.winRateFilter;

  return (
    <div className="bg-card rounded-lg p-4 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <Search className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Filter Hero Statistics</h3>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hero Name</label>
          <Input
            placeholder="Filter by hero name..."
            value={filters.heroFilter}
            onChange={(e) => onFilterChange({ heroFilter: e.target.value })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Count (e.g., &gt;5, =3, &lt;10)</label>
          <Input
            placeholder="Filter by count..."
            value={filters.countFilter}
            onChange={(e) => onFilterChange({ countFilter: e.target.value })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Wins (e.g., &gt;3, =2, &lt;5)</label>
          <Input
            placeholder="Filter by wins..."
            value={filters.winsFilter}
            onChange={(e) => onFilterChange({ winsFilter: e.target.value })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Win Rate % (e.g., &gt;50, =60, &lt;40)</label>
          <Input
            placeholder="Filter by win rate..."
            value={filters.winRateFilter}
            onChange={(e) => onFilterChange({ winRateFilter: e.target.value })}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Filter examples:</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Count: <code>&gt;5</code> (more than 5), <code>=3</code> (exactly 3), <code>&lt;10</code> (less than 10)</li>
          <li>Wins: <code>&gt;=2</code> (2 or more), <code>&lt;=4</code> (4 or less)</li>
          <li>Win Rate: <code>&gt;50</code> (above 50%), <code>=60</code> (exactly 60%)</li>
        </ul>
      </div>
    </div>
  );
} 