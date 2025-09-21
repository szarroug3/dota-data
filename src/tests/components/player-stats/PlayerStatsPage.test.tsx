import React from 'react';

import { PlayerStatsPage } from '@/frontend/players/components/stateless/PlayerStatsPage';
import { renderWithProviders, screen } from '@/tests/utils/test-utils';

// We don’t want a global loading skeleton to show on add/refresh
// This test ensures the page renders list content even when the player context is in a loading state,
// leaving per-player loading to individual cards.

// Provide player context mock with a loading state and one player
jest.mock('@/frontend/players/contexts/state/player-context', () => {
  const helpers = jest.requireActual('@/utils/player-helpers');
  return {
    usePlayerContext: () => {
      const players = new Map<number, ReturnType<typeof helpers.createInitialPlayerData>>();
      players.set(123456789, helpers.createInitialPlayerData(123456789));
      players.set(999999999, helpers.createInitialPlayerData(999999999));
      return {
        players,
        selectedPlayerId: null,
        setSelectedPlayerId: jest.fn(),
        isLoading: true,
        addPlayer: jest.fn(),
        refreshPlayer: jest.fn(),
        removePlayer: jest.fn(),
        getPlayer: jest.fn(),
        getPlayers: jest.fn(),
      };
    },
    PlayerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('@/frontend/teams/contexts/state/team-context', () => {
  return {
    useTeamContext: () => ({
      selectedTeamId: { teamId: 1, leagueId: 1 },
      addPlayerToTeam: jest.fn(),
      getSelectedTeam: () => ({ manualPlayers: [123456789], matches: {} }),
      removeManualPlayer: jest.fn(),
      editManualPlayer: jest.fn(),
    }),
    TeamProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Provide a minimal constants context so MatchProvider can mount
jest.mock('@/frontend/contexts/constants-context', () => {
  return {
    useConstantsContext: () => ({
      heroes: {},
      items: {},
      fetchHeroes: jest.fn(),
      fetchItems: jest.fn(),
      isLoading: false,
      error: null,
    }),
    ConstantsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

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
