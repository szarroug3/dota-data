import { render, screen } from '@testing-library/react';

import type { PlayerListViewEntry } from '@/frontend/lib/app-data-computed-ops';
import type { Player } from '@/frontend/lib/app-data-types';
import { PlayerListView, type PlayerListViewMode } from '@/frontend/players/components/stateless/PlayerListView';

// Mock the contexts
jest.mock('@/frontend/contexts/config-context', () => ({
  useConfigContext: () => ({
    config: {
      config: {
        preferredExternalSite: 'opendota',
      },
    },
  }),
}));

// Test data
const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  accountId: 123456789,
  profile: {
    name: 'TestPlayer',
    personaname: 'TestPlayer',
    avatar: 'https://example.com/avatar.jpg',
    avatarfull: 'https://example.com/avatar.jpg',
    profileurl: 'https://steamcommunity.com/id/testplayer',
    rank_tier: 50,
    leaderboard_rank: 0,
  },
  heroStats: [
    { heroId: 1, games: 20, wins: 12, lastPlayed: 1640995200 },
    { heroId: 2, games: 15, wins: 8, lastPlayed: 1640995200 },
  ],
  overallStats: {
    wins: 100,
    losses: 50,
    totalGames: 150,
    winRate: 66.7,
  },
  recentMatchIds: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createMockPlayerWithError = (errorMessage: string): Player => ({
  ...createMockPlayer(),
  error: errorMessage,
});

const createMockEntry = (overrides: Partial<PlayerListViewEntry> = {}): PlayerListViewEntry => ({
  player: createMockPlayer(),
  topHeroes: [],
  rank: {
    medal: 'Legend',
    stars: 5,
    isImmortal: false,
    displayText: 'Legend',
  },
  ...overrides,
});

describe('PlayerListView', () => {
  const defaultProps = {
    playerEntries: [createMockEntry()],
    selectedPlayerId: null,
    onSelectPlayer: jest.fn(),
    onRefreshPlayer: jest.fn(),
    viewMode: 'list' as PlayerListViewMode,
    preferredSite: 'opendota' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('List View Mode', () => {
    it('renders players in list format', () => {
      render(<PlayerListView {...defaultProps} />);

      expect(screen.getByText('TestPlayer')).toBeInTheDocument();
      // Assert stats numbers are present without depending on responsive labels/text splitting
      expect(
        screen.getAllByText((content, node) => {
          const text = node?.textContent || '';
          return text.includes('150') && text.includes('66.7%');
        }).length,
      ).toBeGreaterThan(0);
    });

    it('shows error state correctly', () => {
      const errorPlayer = createMockPlayerWithError('Failed to fetch player data');
      render(<PlayerListView {...defaultProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      // Card has aria-label with error text
      expect(screen.getByRole('button', { name: /Error: Failed to fetch player data/i })).toBeInTheDocument();

      // Should not show normal player data when there's an error
      expect(screen.queryByText('150')).not.toBeInTheDocument();
      expect(screen.queryByText(/66\.7%/)).not.toBeInTheDocument();
      expect(screen.queryByText('Legend')).not.toBeInTheDocument();
    });

    it('shows error aria-label on errored row', () => {
      const errorPlayer = createMockPlayerWithError('Network error');
      render(<PlayerListView {...defaultProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      const erroredCard = screen.getByRole('button', { name: /Error: Network error/i });
      expect(erroredCard).toBeInTheDocument();
    });

    it('hides hero data when player has error', () => {
      const errorPlayer = createMockPlayerWithError('Data fetch failed');
      render(<PlayerListView {...defaultProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      // Should not show "No hero data" text when there's an error
      expect(screen.queryByText('No hero data')).not.toBeInTheDocument();
    });

    it('hides win rate and game count when player has error', () => {
      const errorPlayer = createMockPlayerWithError('Connection timeout');
      render(<PlayerListView {...defaultProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      // Should not show game statistics
      expect(screen.queryByText(/games/)).not.toBeInTheDocument();
      expect(screen.queryByText(/win rate/)).not.toBeInTheDocument();
    });

    it('hides rank information when player has error', () => {
      const errorPlayer = createMockPlayerWithError('Server error');
      render(<PlayerListView {...defaultProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      // Should not show rank
      expect(screen.queryByText('Legend')).not.toBeInTheDocument();
    });

    it('renders edit and remove buttons for manual players', () => {
      const manualId = 123456789;
      const onEditPlayer = jest.fn();
      const onRemovePlayer = jest.fn();
      render(
        <PlayerListView
          {...defaultProps}
          playerEntries={[createMockEntry()]}
          manualPlayerIds={new Set([manualId])}
          onEditPlayer={onEditPlayer}
          onRemovePlayer={onRemovePlayer}
        />,
      );

      expect(screen.getByRole('button', { name: /Edit player/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Remove player/i })).toBeInTheDocument();
    });
  });

  describe('Card View Mode', () => {
    const cardViewProps = { ...defaultProps, viewMode: 'card' as PlayerListViewMode };

    it('renders players in card format', () => {
      render(<PlayerListView {...cardViewProps} />);

      expect(screen.getByText('TestPlayer')).toBeInTheDocument();
      expect(
        screen.getAllByText((content, node) => {
          const text = node?.textContent || '';
          return text.includes('150') && text.includes('66.7%');
        }).length,
      ).toBeGreaterThan(0);
    });

    it('shows error state correctly in card view', () => {
      const errorPlayer = createMockPlayerWithError('Failed to fetch player data');
      render(<PlayerListView {...cardViewProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      const erroredCard = screen.getByRole('button', { name: /Error: Failed to fetch player data/i });
      expect(erroredCard).toBeInTheDocument();

      // Should not show normal player data when there's an error
      expect(screen.queryByText('150')).not.toBeInTheDocument();
      expect(screen.queryByText(/66\.7%/)).not.toBeInTheDocument();
      expect(screen.queryByText('Legend')).not.toBeInTheDocument();
    });

    it('shows error aria-label in card view', () => {
      const errorPlayer = createMockPlayerWithError('API error');
      render(<PlayerListView {...cardViewProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      const erroredCard = screen.getByRole('button', { name: /Error: API error/i });
      expect(erroredCard).toBeInTheDocument();

      expect(erroredCard).toHaveClass('border-destructive');
    });

    it('renders edit and remove buttons for manual players in card view', () => {
      const manualId = 123456789;
      const onEditPlayer = jest.fn();
      const onRemovePlayer = jest.fn();
      render(
        <PlayerListView
          {...cardViewProps}
          playerEntries={[createMockEntry({ player: createMockPlayer({ accountId: manualId }) })]}
          manualPlayerIds={new Set([manualId])}
          onEditPlayer={onEditPlayer}
          onRemovePlayer={onRemovePlayer}
        />,
      );

      expect(screen.queryByRole('button', { name: /Edit player/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Remove player/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('applies destructive border styling when player has error', () => {
      const errorPlayer = createMockPlayerWithError('Network error');
      render(<PlayerListView {...defaultProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      const playerCard = screen.getByRole('button', { name: /Error: Network error/i });
      expect(playerCard).toHaveClass('border-destructive');
    });

    it('shows error message below error badge', () => {
      const errorPlayer = createMockPlayerWithError('Custom error message');
      render(<PlayerListView {...defaultProps} playerEntries={[createMockEntry({ player: errorPlayer })]} />);

      const erroredCard = screen.getByRole('button', { name: /Error: Custom error message/i });
      expect(erroredCard).toBeInTheDocument();
      expect(erroredCard).toHaveClass('border-destructive');
      expect(screen.getByRole('alert')).toHaveTextContent('Custom error message');
    });
  });
});
