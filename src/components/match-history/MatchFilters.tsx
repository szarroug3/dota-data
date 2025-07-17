/**
 * Match Filters Component
 * 
 * Stateless component for filtering and sorting match data.
 * Uses shadcn components for consistent styling.
 */

import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MatchFilters as MatchFiltersType } from '@/types/contexts/match-context-value';


// ============================================================================
// TYPES
// ============================================================================

interface MatchFiltersProps {
  filters: MatchFiltersType;
  sortBy: 'date' | 'duration' | 'opponent';
  sortDirection: 'asc' | 'desc';
  onFilterChange: (filters: Partial<MatchFiltersType>) => void;
  onSortChange: (sortBy: 'date' | 'duration' | 'opponent') => void;
  onSortDirectionChange: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

function DateRangeFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="dateRange">Date Range</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="null|null">All Time</SelectItem>
          <SelectItem value="7d|null">Last 7 Days</SelectItem>
          <SelectItem value="30d|null">Last 30 Days</SelectItem>
          <SelectItem value="90d|null">Last 90 Days</SelectItem>
          <SelectItem value="null|7d">Next 7 Days</SelectItem>
          <SelectItem value="null|30d">Next 30 Days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function ResultFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="result">Result</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select result" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Results</SelectItem>
          <SelectItem value="win">Wins Only</SelectItem>
          <SelectItem value="loss">Losses Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function OpponentFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="opponent">Opponent</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select opponent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Opponents</SelectItem>
          <SelectItem value="Team Alpha">Team Alpha</SelectItem>
          <SelectItem value="Team Beta">Team Beta</SelectItem>
          <SelectItem value="Team Gamma">Team Gamma</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function SortOptions({ sortBy, sortDirection, onSortByChange, onSortDirectionChange }: {
  sortBy: 'date' | 'duration' | 'opponent';
  sortDirection: 'asc' | 'desc';
  onSortByChange: (value: string) => void;
  onSortDirectionChange: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="sortBy">Sort By</Label>
      <div className="flex gap-2">
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="opponent">Opponent</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={onSortDirectionChange}
          aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </Button>
      </div>
    </div>
  );
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({
  filters,
  sortBy,
  sortDirection,
  onFilterChange,
  onSortChange,
  onSortDirectionChange
}) => {
  const handleDateRangeChange = (value: string) => {
    const [start, end] = value.split('|');
    onFilterChange({
      dateRange: {
        start: start === 'null' ? null : start,
        end: end === 'null' ? null : end
      }
    });
  };

  const handleResultChange = (value: string) => {
    onFilterChange({ result: value as 'all' | 'win' | 'loss' });
  };

  const handleOpponentChange = (value: string) => {
    onFilterChange({ opponent: value });
  };

  const handleSortByChange = (value: string) => {
    onSortChange(value as 'date' | 'duration' | 'opponent');
  };

  const getDateRangeValue = () => {
    const { start, end } = filters.dateRange;
    return `${start || 'null'}|${end || 'null'}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters & Sorting</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DateRangeFilter value={getDateRangeValue()} onChange={handleDateRangeChange} />
          <ResultFilter value={filters.result} onChange={handleResultChange} />
          <OpponentFilter value={filters.opponent} onChange={handleOpponentChange} />
          <SortOptions
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortByChange={handleSortByChange}
            onSortDirectionChange={onSortDirectionChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}; 