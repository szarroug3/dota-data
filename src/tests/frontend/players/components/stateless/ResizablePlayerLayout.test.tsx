import { render, screen } from '@testing-library/react';
import React from 'react';

import type { PlayerListViewEntry } from '@/frontend/lib/app-data-computed-ops';
import type { Player } from '@/frontend/lib/app-data-types';
import type { PlayerDetailsPanelMode } from '@/frontend/players/components/stateless/details/PlayerDetailsPanel';
import type { PlayerListViewMode } from '@/frontend/players/components/stateless/PlayerListView';
import { ResizablePlayerLayout } from '@/frontend/players/components/stateless/ResizablePlayerLayout';

// Mock the Resizable components since they use browser APIs
jest.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="resizable-panel-group" className={className}>
      {children}
    </div>
  ),
  ResizablePanel: ({
    children,
    defaultSize,
    minSize,
    maxSize,
  }: {
    children: React.ReactNode;
    defaultSize?: number | string;
    minSize?: number | string;
    maxSize?: number | string;
  }) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize?.toString()}
      data-min-size={minSize?.toString()}
      data-max-size={maxSize?.toString()}
    >
      {children}
    </div>
  ),
  ResizableHandle: ({ withHandle }: { withHandle?: boolean }) => (
    <div data-testid="resizable-handle" data-with-handle={withHandle}>
      {withHandle && <div data-testid="handle-grip">⋮</div>}
    </div>
  ),
}));

// Mock PlayersList to keep the test focused on the details panel behavior
jest.mock('@/frontend/players/components/stateless/PlayersList', () => ({
  PlayersList: ({
    players,
    selectedPlayerId,
    hiddenPlayersCount,
  }: {
    players: Player[];
    selectedPlayerId?: number | null;
    hiddenPlayersCount?: number;
  }) => (
    <div data-testid="players-list">
      <div>Players: {players.length}</div>
      <div>Selected: {selectedPlayerId ?? 'none'}</div>
      <div>Hidden: {hiddenPlayersCount || 0}</div>
    </div>
  ),
}));

// Mock PlayerDetailsPanel to avoid rendering complex internals
jest.mock('@/frontend/players/components/stateless/details/PlayerDetailsPanel', () => ({
  PlayerDetailsPanel: ({
    player,
    viewMode,
    onViewModeChange,
  }: {
    player: Player;
    viewMode: PlayerDetailsPanelMode;
    onViewModeChange?: (mode: PlayerDetailsPanelMode) => void;
  }) => (
    <div data-testid="player-details-panel">
      <div>View Mode: {viewMode}</div>
      <div>Player: {player.profile.personaname}</div>
      <button onClick={() => onViewModeChange?.('details')}>Set Details</button>
    </div>
  ),
}));

// Minimal player factory matching the Player type shape used by the component
const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  accountId: 111111111,
  profile: {
    name: 'Test Player',
    personaname: 'Test Player',
    avatar: '',
    avatarfull: '',
    profileurl: '',
    rank_tier: 0,
    leaderboard_rank: 0,
  },
  heroStats: [],
  overallStats: { wins: 0, losses: 0, totalGames: 0, winRate: 0 },
  recentMatchIds: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const mockPlayer = createMockPlayer();

const playerListViewEntries: PlayerListViewEntry[] = [{ player: mockPlayer, topHeroes: [], rank: null }];

const defaultProps = {
  visiblePlayers: [mockPlayer],
  onHidePlayer: jest.fn(),
  onRefreshPlayer: jest.fn(),
  viewMode: 'list' as PlayerListViewMode,
  setViewMode: jest.fn(),
  selectedPlayerId: null as number | null,
  onSelectPlayer: jest.fn(),
  hiddenPlayersCount: 0,
  onShowHiddenPlayers: jest.fn(),
  selectedPlayer: null as Player | null,
  playerDetailsViewMode: 'summary' as PlayerDetailsPanelMode,
  setPlayerDetailsViewMode: jest.fn(),
  onScrollToPlayer: jest.fn(),
  onAddPlayer: jest.fn(),
  playerListViewEntries,
  preferredSite: 'dotabuff' as any,
};

describe('ResizablePlayerLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty-state message when no player is selected', () => {
    render(<ResizablePlayerLayout {...defaultProps} />);

    expect(screen.getByTestId('resizable-panel-group')).toBeInTheDocument();
    // Placeholder content analogous to the match history empty state
    expect(screen.getByText('No Player Selected')).toBeInTheDocument();
    expect(screen.getByText('Select a player from the list to view details')).toBeInTheDocument();
  });

  it('renders details panel when a player is selected', () => {
    render(
      <ResizablePlayerLayout {...defaultProps} selectedPlayerId={mockPlayer.accountId} selectedPlayer={mockPlayer} />,
    );

    const detailsPanel = screen.getByTestId('player-details-panel');
    expect(detailsPanel).toBeInTheDocument();
    expect(detailsPanel.textContent).toContain('View Mode: summary');
    expect(detailsPanel.textContent).toContain('Player: Test Player');
  });
});
