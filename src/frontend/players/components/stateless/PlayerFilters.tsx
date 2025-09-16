import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Player } from '@/types/contexts/player-context-value';

export interface PlayerFilters {
  search: string;
  sortBy: 'name' | 'rank' | 'games' | 'winRate' | 'heroes';
  sortDirection: 'asc' | 'desc';
}

interface PlayerFiltersProps {
  filters: PlayerFilters;
  onFiltersChange: (filters: PlayerFilters) => void;
  players: Player[];
}

export const PlayerFilters: React.FC<PlayerFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleSortByChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value as PlayerFilters['sortBy'] });
  };

  const handleSortDirectionChange = (value: string) => {
    onFiltersChange({ ...filters, sortDirection: value as 'asc' | 'desc' });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card dark:bg-card rounded-lg border">
      <div className="flex-1">
        <Label htmlFor="player-search" className="text-sm font-medium">
          Search Players
        </Label>
        <Input
          id="player-search"
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="sm:w-48">
        <Label htmlFor="sort-by" className="text-sm font-medium">
          Sort By
        </Label>
        <Select value={filters.sortBy} onValueChange={handleSortByChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rank">Rank</SelectItem>
            <SelectItem value="games">Games</SelectItem>
            <SelectItem value="winRate">Win Rate</SelectItem>
            <SelectItem value="heroes">Heroes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="sm:w-32">
        <Label htmlFor="sort-direction" className="text-sm font-medium">
          Direction
        </Label>
        <Select value={filters.sortDirection} onValueChange={handleSortDirectionChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
