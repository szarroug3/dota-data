import React from 'react';

import { MultiSelectCombobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHeroContext } from '@/contexts/hero-context';
import type { Hero } from '@/types/contexts/hero-context-value';
import type { Match } from '@/types/contexts/match-context-value';

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
}

interface MatchFiltersProps {
  filters: MatchFilters;
  onFiltersChange: (filters: MatchFilters) => void;
  matches: Match[];
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
          <SelectItem value="wins">Wins Only</SelectItem>
          <SelectItem value="losses">Losses Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function OpponentFilter({ value, onChange, matches }: { value: string[]; onChange: (v: string[]) => void; matches: Match[] }) {
  // Get all unique opponent names from matches
  const opponentSet = new Set<string>();
  matches.forEach(match => {
    if (match.opponent) {
      opponentSet.add(match.opponent);
    }
  });
  
  const opponents = Array.from(opponentSet).sort();
  
  const options = opponents.map(opponent => ({
    value: opponent,
    label: opponent
  }));

  return (
    <div>
      <Label className="mb-2 block">Opponent</Label>
      <MultiSelectCombobox
        options={options}
        value={value}
        onValueChange={onChange}
        placeholder="Search opponents..."
        searchPlaceholder="Search opponents..."
        emptyMessage="No opponents found."
        className="w-full"
      />
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

function HeroesPlayedFilter({ value, onChange, matches }: { value: string[]; onChange: (v: string[]) => void; matches: Match[] }) {
  const { heroes } = useHeroContext();
  
  // Mock heroes for testing - will be replaced with real hero data later
  const mockHeroes: Hero[] = [
    { id: '1', localizedName: 'Anti-Mage', name: 'antimage', primaryAttribute: 'agility', attackType: 'melee', roles: ['carry', 'escape', 'nuker'], complexity: 2, imageUrl: '' },
    { id: '2', localizedName: 'Axe', name: 'axe', primaryAttribute: 'strength', attackType: 'melee', roles: ['initiator', 'durable', 'disabler', 'jungler'], complexity: 1, imageUrl: '' },
    { id: '3', localizedName: 'Bane', name: 'bane', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'disabler', 'nuker', 'durable'], complexity: 2, imageUrl: '' },
    { id: '4', localizedName: 'Bloodseeker', name: 'bloodseeker', primaryAttribute: 'agility', attackType: 'melee', roles: ['carry', 'nuker', 'disabler', 'jungler'], complexity: 1, imageUrl: '' },
    { id: '5', localizedName: 'Crystal Maiden', name: 'crystal_maiden', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'disabler', 'nuker'], complexity: 1, imageUrl: '' },
    { id: '6', localizedName: 'Drow Ranger', name: 'drow_ranger', primaryAttribute: 'agility', attackType: 'ranged', roles: ['carry', 'disabler', 'ranged'], complexity: 1, imageUrl: '' },
    { id: '7', localizedName: 'Earthshaker', name: 'earthshaker', primaryAttribute: 'strength', attackType: 'melee', roles: ['support', 'disabler', 'initiator', 'nuker'], complexity: 2, imageUrl: '' },
    { id: '8', localizedName: 'Juggernaut', name: 'juggernaut', primaryAttribute: 'agility', attackType: 'melee', roles: ['carry', 'escape', 'pusher'], complexity: 1, imageUrl: '' },
    { id: '9', localizedName: 'Mirana', name: 'mirana', primaryAttribute: 'agility', attackType: 'ranged', roles: ['carry', 'support', 'escape', 'nuker', 'disabler'], complexity: 2, imageUrl: '' },
    { id: '10', localizedName: 'Morphling', name: 'morphling', primaryAttribute: 'agility', attackType: 'ranged', roles: ['carry', 'escape', 'durable', 'nuker'], complexity: 3, imageUrl: '' },
    { id: '11', localizedName: 'Shadow Fiend', name: 'nevermore', primaryAttribute: 'agility', attackType: 'ranged', roles: ['carry', 'nuker'], complexity: 2, imageUrl: '' },
    { id: '12', localizedName: 'Phantom Lancer', name: 'phantom_lancer', primaryAttribute: 'agility', attackType: 'melee', roles: ['carry', 'escape', 'pusher', 'nuker'], complexity: 2, imageUrl: '' },
    { id: '13', localizedName: 'Puck', name: 'puck', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['initiator', 'disabler', 'escape', 'nuker'], complexity: 3, imageUrl: '' },
    { id: '14', localizedName: 'Pudge', name: 'pudge', primaryAttribute: 'strength', attackType: 'melee', roles: ['disabler', 'initiator', 'durable', 'nuker'], complexity: 1, imageUrl: '' },
    { id: '15', localizedName: 'Razor', name: 'razor', primaryAttribute: 'agility', attackType: 'ranged', roles: ['carry', 'durable', 'nuker', 'pusher'], complexity: 1, imageUrl: '' },
    { id: '16', localizedName: 'Sand King', name: 'sand_king', primaryAttribute: 'strength', attackType: 'melee', roles: ['initiator', 'disabler', 'support', 'escape', 'nuker'], complexity: 2, imageUrl: '' },
    { id: '17', localizedName: 'Storm Spirit', name: 'storm_spirit', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['carry', 'escape', 'nuker', 'initiator', 'disabler'], complexity: 3, imageUrl: '' },
    { id: '18', localizedName: 'Sven', name: 'sven', primaryAttribute: 'strength', attackType: 'melee', roles: ['carry', 'disabler', 'initiator', 'durable'], complexity: 1, imageUrl: '' },
    { id: '19', localizedName: 'Tiny', name: 'tiny', primaryAttribute: 'strength', attackType: 'melee', roles: ['carry', 'nuker', 'pusher', 'initiator', 'durable'], complexity: 2, imageUrl: '' },
    { id: '20', localizedName: 'Vengeful Spirit', name: 'vengefulspirit', primaryAttribute: 'agility', attackType: 'ranged', roles: ['support', 'initiator', 'disabler', 'nuker'], complexity: 1, imageUrl: '' },
    { id: '21', localizedName: 'Windranger', name: 'windrunner', primaryAttribute: 'agility', attackType: 'ranged', roles: ['carry', 'support', 'escape', 'nuker', 'disabler'], complexity: 2, imageUrl: '' },
    { id: '22', localizedName: 'Zeus', name: 'zuus', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['nuker', 'carry'], complexity: 1, imageUrl: '' },
    { id: '23', localizedName: 'Kunkka', name: 'kunkka', primaryAttribute: 'strength', attackType: 'melee', roles: ['carry', 'support', 'disabler', 'initiator', 'durable'], complexity: 2, imageUrl: '' },
    { id: '24', localizedName: 'Lina', name: 'lina', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'carry', 'nuker', 'disabler'], complexity: 2, imageUrl: '' },
    { id: '25', localizedName: 'Lich', name: 'lich', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'nuker'], complexity: 1, imageUrl: '' }
  ];
  
  // Use mock heroes for now, fallback to context heroes if available
  const availableHeroes = heroes.length > 0 ? heroes : mockHeroes;
  
  // Get all hero IDs played in the matches
  const heroIdSet = new Set<string>();
  matches.forEach(match => {
    match.heroes.forEach(heroId => heroIdSet.add(heroId));
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

export const MatchFilters: React.FC<MatchFiltersProps> = ({ filters, onFiltersChange, matches, className }) => {
  const handleChange = <K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className={`col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 ${className ?? ''}`}>
      <DateRangeFilter 
        value={filters.dateRange} 
        onChange={v => handleChange('dateRange', v)} 
        customDateRange={filters.customDateRange} 
        onCustomDateRangeChange={range => handleChange('customDateRange', range)} 
      />
      <ResultFilter value={filters.result} onChange={v => handleChange('result', v)} />
      <OpponentFilter value={filters.opponent} onChange={v => handleChange('opponent', v)} matches={matches} />
      <TeamSideFilter value={filters.teamSide} onChange={v => handleChange('teamSide', v)} />
      <PickOrderFilter value={filters.pickOrder} onChange={v => handleChange('pickOrder', v)} />
      <HeroesPlayedFilter value={filters.heroesPlayed} onChange={v => handleChange('heroesPlayed', v)} matches={matches} />
    </div>
  );
};
