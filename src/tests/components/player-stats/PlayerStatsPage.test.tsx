import React from 'react';

import { PlayerStatsPage } from '@/frontend/players/components/stateless/PlayerStatsPage';
import { renderWithProviders, screen } from '@/tests/utils/test-utils';

// We don’t want a global loading skeleton to show on add/refresh
// This test ensures the page renders list content even when the player context is in a loading state,
// leaving per-player loading to individual cards.

// Mock AppData context instead of constants context
jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => ({
    teams: new Map(),
    matches: new Map(),
    players: new Map(),
    heroes: new Map(),
    items: new Map(),
    leagues: new Map(),
    selectedTeamId: null,
    setSelectedTeamId: jest.fn(),
    addTeam: jest.fn(),
    updateTeam: jest.fn(),
    removeTeam: jest.fn(),
    addMatch: jest.fn(),
    updateMatch: jest.fn(),
    removeMatch: jest.fn(),
    addPlayer: jest.fn(),
    updatePlayer: jest.fn(),
    removePlayer: jest.fn(),
    loadTeamData: jest.fn(),
    loadMatchData: jest.fn(),
    loadPlayerData: jest.fn(),
    loadHeroesData: jest.fn(),
    loadItemsData: jest.fn(),
    loadLeaguesData: jest.fn(),
  }),
}));

// Mock ResizablePlayerLayout to render a deterministic marker
jest.mock('@/frontend/players/components/stateless/ResizablePlayerLayout', () => ({
  ResizablePlayerLayout: (props: any) => (
    <div
      data-testid="player-layout"
      data-view-mode={props.viewMode}
      data-player-count={props.players?.length ?? 0}
      data-player-ids={(props.players || []).map((p: any) => p.profile.profile.account_id).join(',')}
    >
      layout
    </div>
  ),
}));

describe('PlayerStatsPage', () => {
  it('does not render a global loading skeleton when context is loading', () => {
    renderWithProviders(<PlayerStatsPage />);
    // Should render the layout instead of a page-level loading skeleton
    expect(screen.getByTestId('player-layout')).toBeInTheDocument();
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });

  it('initializes player list view mode from in-memory config defaults', () => {
    renderWithProviders(<PlayerStatsPage />);
    const layout = screen.getByTestId('player-layout');
    expect(layout).toHaveAttribute('data-view-mode', 'list');
  });

  it('filters players to only those on the active team (manual or auto)', () => {
    renderWithProviders(<PlayerStatsPage />);
    const layout = screen.getByTestId('player-layout');
    expect(layout).toHaveAttribute('data-player-count', '1');
    expect(layout).toHaveAttribute('data-player-ids', '123456789');
  });
});
