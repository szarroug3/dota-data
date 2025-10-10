import { fireEvent, render, screen } from '@testing-library/react';

import { MatchFilters } from '@/components/match-history/filters/MatchFilters';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

// Minimal hero context mock for combobox options
jest.mock('@/contexts/constants-context', () => ({
  useConstantsContext: () => ({
    heroes: {
      '1': { id: '1', name: 'npc_dota_hero_axe', localizedName: 'Axe' },
      '2': { id: '2', name: 'npc_dota_hero_lina', localizedName: 'Lina' },
    },
    items: {},
    heroesByName: {},
    isLoading: false,
    error: null,
  }),
}));

const baseFilters = {
  dateRange: 'all' as const,
  customDateRange: { start: null, end: null },
  result: 'all' as const,
  opponent: [] as string[],
  teamSide: 'all' as const,
  pickOrder: 'all' as const,
  heroesPlayed: [] as string[],
  highPerformersOnly: false,
};

const matches: Match[] = [
  { id: 101, date: new Date().toISOString(), duration: 1200, result: 'radiant', players: { radiant: [], dire: [] }, draft: { radiantPicks: [{ hero: { id: '1', name: 'Axe', localizedName: 'Axe' } }], direPicks: [] } },
];

const teamMatches: Record<number, TeamMatchParticipation> = {
  101: { matchId: 101, result: 'won', duration: 1200, opponentName: 'OG', leagueId: '1', startTime: Date.now(), side: 'radiant', pickOrder: 'first' },
};

describe('MatchFilters', () => {
  it('renders and updates filters', () => {
    const onFiltersChange = jest.fn();
    render(
      <MatchFilters filters={baseFilters} onFiltersChange={onFiltersChange} matches={matches} teamMatches={teamMatches} />
    );

    // Date range change
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByText(/Last 7 Days/i));
    expect(onFiltersChange).toHaveBeenCalled();

    // Result change
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByText(/Wins/i));
    expect(onFiltersChange).toHaveBeenCalled();

    // Team side change
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByText(/Radiant/i));
    expect(onFiltersChange).toHaveBeenCalled();

    // Pick order change
    fireEvent.mouseDown(screen.getAllByRole('combobox')[3]);
    fireEvent.click(screen.getByText(/First Pick/i));
    expect(onFiltersChange).toHaveBeenCalled();

    // High performers toggle
    fireEvent.click(screen.getByRole('button', { name: /Matches with High Performing Heroes Only/i }));
    expect(onFiltersChange).toHaveBeenCalled();
  });
});


