import React, { useMemo } from 'react';

import { MultiSelectCombobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useConstantsContext } from '@/contexts/constants-context';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';


export interface MatchFilters {
  dateRange: 'all' | '7days' | '30days' | 'custom';
  customDateRange: {
    start: string | null;
    end: string | null;
  };
  result: 'all' | 'wins' | 'losses';
  opponent: string[];
  teamSide: 'all' | 'radiant' | 'dire';
  pickOrder: 'all' | 'first' | 'second';
  heroesPlayed: string[];
  highPerformersOnly: boolean;
}

interface MatchFiltersProps {
  filters: MatchFilters;
  onFiltersChange: (filters: MatchFilters) => void;
  matches: Match[];
  teamMatches: Record<number, TeamMatchParticipation>;
  className?: string;
}

function DateRangeFilter({ 
  value, 
  onChange, 
  customDateRange, 
  onCustomDateRangeChange 
}: { 
  value: MatchFilters['dateRange']; 
  onChange: (v: MatchFilters['dateRange']) => void;
  customDateRange: MatchFilters['customDateRange'];
  onCustomDateRangeChange: (range: MatchFilters['customDateRange']) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="mb-2 block">Date Range</Label>
      <Select value={value} onValueChange={v => onChange(v as MatchFilters['dateRange'])}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="7days">Last 7 Days</SelectItem>
          <SelectItem value="30days">Last 30 Days</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>
      
      {value === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Start Date</Label>
            <Input
              type="date"
              value={customDateRange.start || ''}
              onChange={(e) => onCustomDateRangeChange({
                ...customDateRange,
                start: e.target.value || null
              })}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">End Date</Label>
            <Input
              type="date"
              value={customDateRange.end || ''}
              onChange={(e) => onCustomDateRangeChange({
                ...customDateRange,
                end: e.target.value || null
              })}
              className="text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ResultFilter({ value, onChange }: { value: MatchFilters['result']; onChange: (v: MatchFilters['result']) => void }) {
  return (
    <div>
      <Label className="mb-2 block">Result</Label>
      <Select value={value} onValueChange={v => onChange(v as MatchFilters['result'])}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Matches</SelectItem>
          <SelectItem value="wins">Wins</SelectItem>
          <SelectItem value="losses">Losses</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function TeamSideFilter({ value, onChange }: { value: MatchFilters['teamSide']; onChange: (v: MatchFilters['teamSide']) => void }) {
  return (
    <div>
      <Label className="mb-2 block">Team Side</Label>
      <Select value={value} onValueChange={v => onChange(v as MatchFilters['teamSide'])}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sides</SelectItem>
          <SelectItem value="radiant">Radiant</SelectItem>
          <SelectItem value="dire">Dire</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function PickOrderFilter({ value, onChange }: { value: MatchFilters['pickOrder']; onChange: (v: MatchFilters['pickOrder']) => void }) {
  return (
    <div>
      <Label className="mb-2 block">Pick Order</Label>
      <Select value={value} onValueChange={v => onChange(v as MatchFilters['pickOrder'])}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Matches</SelectItem>
          <SelectItem value="first">First Pick</SelectItem>
          <SelectItem value="second">Second Pick</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function HeroesPlayedFilter({ value, onChange, matches, teamMatches }:
  {
    value: string[];
    onChange: (v: string[]) => void;
    matches: Match[];
    teamMatches: Record<number, TeamMatchParticipation>;
  }) {
  const { heroes } = useConstantsContext();
  
  // Use context heroes
  const availableHeroes = Object.values(heroes);
  
  // Get all hero IDs played by the team in the matches
  const heroIdSet = new Set<string>();
  matches.forEach(match => {
    // Get the team's side for this match
    const teamMatchData = teamMatches[match.id];
    if (!teamMatchData || !teamMatchData.side) return;
    
    // Extract heroes only from the team's side
    if (match.draft) {
      const picks = teamMatchData.side === 'radiant' ? match.draft.radiantPicks : match.draft.direPicks;
      picks?.forEach(pick => {
        if (pick.hero?.id) {
          heroIdSet.add(pick.hero.id);
        }
      });
    }
  });
  
  // If no heroes found in matches, use all available heroes for testing
  if (heroIdSet.size === 0) {
    availableHeroes.forEach(hero => heroIdSet.add(hero.id));
  }
  
  // Map to hero objects and sort alphabetically
  const playedHeroes = Array.from(heroIdSet)
    .map(id => availableHeroes.find(h => h.id === id))
    .filter((h): h is Hero => !!h)
    .sort((a, b) => a.localizedName.localeCompare(b.localizedName));

  const options = playedHeroes.map(hero => ({
    value: hero.id,
    label: hero.localizedName
  }));

  return (
    <div>
      <Label className="mb-2 block">Heroes Played</Label>
      <MultiSelectCombobox
        options={options}
        value={value}
        onValueChange={onChange}
        placeholder="Search heroes..."
        searchPlaceholder="Search heroes..."
        emptyMessage="No heroes found."
        className="w-full"
      />
    </div>
  );
}

function HighPerformersFilter({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-col justify-end h-full py-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Toggle
                pressed={value}
                onPressedChange={onChange}
                size="sm"
                className="px-3"
              >
                High Performing Heroes Only
              </Toggle>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>5+ games with 60%+ win rate</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function OpponentFilter({ value, onChange, teamMatches }:
  {
    value: string[];
    onChange: (v: string[]) => void;
    teamMatches: Record<number, TeamMatchParticipation>;
  }) {
  
  // Get all unique opponent names from the team match data
  const opponentNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(teamMatches).forEach(teamMatch => {
      if (teamMatch.opponentName) {
        names.add(teamMatch.opponentName);
      }
    });
    return Array.from(names).sort();
  }, [teamMatches]);
  
  // Create options for the filter
  const options = opponentNames.map(opponentName => ({
    value: opponentName,
    label: opponentName
  }));
  
  return (
    <div>
      <Label className="mb-2 block">Opponent Teams</Label>
      <MultiSelectCombobox
        options={options}
        value={value}
        onValueChange={onChange}
        placeholder="Select opponents..."
        searchPlaceholder="Search opponents..."
        emptyMessage="No opponents found."
        className="w-full"
      />
    </div>
  );
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({ filters, onFiltersChange, matches, teamMatches, className }) => {
  const handleChange = <K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className || ''}`}>
      <DateRangeFilter 
        value={filters.dateRange} 
        onChange={v => handleChange('dateRange', v)} 
        customDateRange={filters.customDateRange}
        onCustomDateRangeChange={v => handleChange('customDateRange', v)}
      />
      <ResultFilter value={filters.result} onChange={v => handleChange('result', v)} />
      <TeamSideFilter value={filters.teamSide} onChange={v => handleChange('teamSide', v)} />
      <PickOrderFilter value={filters.pickOrder} onChange={v => handleChange('pickOrder', v)} />
      <HeroesPlayedFilter value={filters.heroesPlayed} onChange={v => handleChange('heroesPlayed', v)} matches={matches} teamMatches={teamMatches} />
      <OpponentFilter value={filters.opponent} onChange={v => handleChange('opponent', v)} teamMatches={teamMatches} />
      <HighPerformersFilter value={filters.highPerformersOnly} onChange={v => handleChange('highPerformersOnly', v)} />
    </div>
  );
};
