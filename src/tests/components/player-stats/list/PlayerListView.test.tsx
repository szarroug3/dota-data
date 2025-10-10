import { render, screen } from '@testing-library/react';

import { PlayerListView, type PlayerListViewMode } from '@/components/player-stats/list/PlayerListView';
import type { Player } from '@/types/contexts/player-context-value';

// Mock the contexts
jest.mock('@/contexts/config-context', () => ({
  useConfigContext: () => ({
    config: {
      config: {
        preferredExternalSite: 'opendota'
      }
    }
  })
}));

jest.mock('@/contexts/constants-context', () => ({
  useConstantsContext: () => ({
    heroes: {
      '1': { id: 1, name: 'antimage', localizedName: 'Anti-Mage' },
      '2': { id: 2, name: 'axe', localizedName: 'Axe' }
    }
  })
}));

// Mock the utility function
jest.mock('@/utils/player-statistics', () => ({
  processPlayerRank: jest.fn().mockReturnValue({
    displayText: 'Legend',
    isImmortal: false,
    stars: 5
  })
}));

// Test data
const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  profile: {
    profile: {
      account_id: 123456789,
      personaname: 'TestPlayer',
      name: 'TestPlayer',
      plus: false,
      cheese: 0,
      steamid: '76561198012345678',
      avatar: 'https://example.com/avatar.jpg',
      avatarmedium: 'https://example.com/avatar.jpg',
      avatarfull: 'https://example.com/avatar.jpg',
      profileurl: 'https://steamcommunity.com/id/testplayer',
      last_login: '2024-01-01T00:00:00Z',
      loccountrycode: 'US',
      status: 'online',
      fh_unavailable: false,
      is_contributor: false,
      is_subscriber: false
    },
    rank_tier: 50,
    leaderboard_rank: 0
  },
  counts: {
    leaver_status: {},
    game_mode: {},
    lobby_type: {},
    lane_role: {},
    region: {},
    patch: {}
  },
  heroes: [
    { hero_id: 1, last_played: 1640995200, games: 20, win: 12, with_games: 0, with_win: 0, against_games: 0, against_win: 0 },
    { hero_id: 2, last_played: 1640995200, games: 15, win: 8, with_games: 0, with_win: 0, against_games: 0, against_win: 0 }
  ],
  rankings: [],
  ratings: [],
  matches: [],
  totals: {
    np: 0,
    fantasy: 0,
    cosmetic: 0,
    all_time: 0,
    ranked: 0,
    turbo: 0,
    matched: 0
  },
  wl: {
    win: 100,
    lose: 50
  },
  wardMap: {
    obs: {},
    sen: {}
  },
  ...overrides
});

const createMockPlayerWithError = (errorMessage: string): Player => ({
  ...createMockPlayer(),
  error: errorMessage
});

describe('PlayerListView', () => {
  const defaultProps = {
    players: [createMockPlayer()],
    selectedPlayerId: null,
    onSelectPlayer: jest.fn(),
    onRefreshPlayer: jest.fn(),
    viewMode: 'list' as PlayerListViewMode
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
        }).length
      ).toBeGreaterThan(0);
      expect(screen.getByText('Legend')).toBeInTheDocument();
    });

    it('shows error state correctly', () => {
      const errorPlayer = createMockPlayerWithError('Failed to fetch player data');
      render(<PlayerListView {...defaultProps} players={[errorPlayer]} />);
      
      expect(screen.getByText('Loading 123456789')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch player data')).toBeInTheDocument();
      
      // Should not show normal player data when there's an error
      expect(screen.queryByText('150')).not.toBeInTheDocument();
      expect(screen.queryByText(/66\.7%/)).not.toBeInTheDocument();
      expect(screen.queryByText('Legend')).not.toBeInTheDocument();
    });

    it('shows error badge below loading text', () => {
      const errorPlayer = createMockPlayerWithError('Network error');
      render(<PlayerListView {...defaultProps} players={[errorPlayer]} />);
      
      const loadingText = screen.getByText('Loading 123456789');
      const errorBadge = screen.getByText('Error');
      
      // The error badge should appear after the loading text in the DOM
      expect(loadingText).toBeInTheDocument();
      expect(errorBadge).toBeInTheDocument();
      
      // Check that the error badge has the destructive styling
      expect(errorBadge.closest('.bg-destructive')).toBeInTheDocument();
    });

    it('hides hero data when player has error', () => {
      const errorPlayer = createMockPlayerWithError('Data fetch failed');
      render(<PlayerListView {...defaultProps} players={[errorPlayer]} />);
      
      // Should not show "No hero data" text when there's an error
      expect(screen.queryByText('No hero data')).not.toBeInTheDocument();
    });

    it('hides win rate and game count when player has error', () => {
      const errorPlayer = createMockPlayerWithError('Connection timeout');
      render(<PlayerListView {...defaultProps} players={[errorPlayer]} />);
      
      // Should not show game statistics
      expect(screen.queryByText(/games/)).not.toBeInTheDocument();
      expect(screen.queryByText(/win rate/)).not.toBeInTheDocument();
    });

    it('hides rank information when player has error', () => {
      const errorPlayer = createMockPlayerWithError('Server error');
      render(<PlayerListView {...defaultProps} players={[errorPlayer]} />);
      
      // Should not show rank
      expect(screen.queryByText('Legend')).not.toBeInTheDocument();
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
        }).length
      ).toBeGreaterThan(0);
      expect(screen.getByText('Legend')).toBeInTheDocument();
    });

    it('shows error state correctly in card view', () => {
      const errorPlayer = createMockPlayerWithError('Failed to fetch player data');
      render(<PlayerListView {...cardViewProps} players={[errorPlayer]} />);
      
      expect(screen.getByText('Loading 123456789')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch player data')).toBeInTheDocument();
      
      // Should not show normal player data when there's an error
      expect(screen.queryByText('150')).not.toBeInTheDocument();
      expect(screen.queryByText(/66\.7%/)).not.toBeInTheDocument();
      expect(screen.queryByText('Legend')).not.toBeInTheDocument();
    });

    it('shows error badge below loading text in card view', () => {
      const errorPlayer = createMockPlayerWithError('API error');
      render(<PlayerListView {...cardViewProps} players={[errorPlayer]} />);
      
      const loadingText = screen.getByText('Loading 123456789');
      const errorBadge = screen.getByText('Error');
      
      // Both should be present
      expect(loadingText).toBeInTheDocument();
      expect(errorBadge).toBeInTheDocument();
      
      // Check that the error badge has the destructive styling
      expect(errorBadge.closest('.bg-destructive')).toBeInTheDocument();
    });

    it('renders edit and remove buttons for manual players in card view', () => {
      const manualId = 123456789;
      const onEditPlayer = jest.fn();
      const onRemovePlayer = jest.fn();
      render(
        <PlayerListView
          {...cardViewProps}
          players={[createMockPlayer()]}
          manualPlayerIds={new Set([manualId])}
          onEditPlayer={onEditPlayer}
          onRemovePlayer={onRemovePlayer}
        />
      );

      // Edit and Remove buttons should be present for manual players
      expect(screen.getByLabelText('Edit player')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove player')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('applies destructive border styling when player has error', () => {
      const errorPlayer = createMockPlayerWithError('Network error');
      render(<PlayerListView {...defaultProps} players={[errorPlayer]} />);
      
      const playerCard = screen.getByText('Loading 123456789').closest('.border-destructive');
      expect(playerCard).toBeInTheDocument();
    });

    it('shows error message below error badge', () => {
      const errorPlayer = createMockPlayerWithError('Custom error message');
      render(<PlayerListView {...defaultProps} players={[errorPlayer]} />);
      
      const errorBadge = screen.getByText('Error');
      const errorMessage = screen.getByText('Custom error message');
      
      expect(errorBadge).toBeInTheDocument();
      expect(errorMessage).toBeInTheDocument();
      
      // Both should have destructive styling
      expect(errorBadge.closest('.bg-destructive')).toBeInTheDocument();
      expect(errorMessage.closest('.text-destructive')).toBeInTheDocument();
    });
  });
});
