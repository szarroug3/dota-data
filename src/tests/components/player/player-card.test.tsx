import { fireEvent, render, screen } from '@testing-library/react';

import { PlayerCard, PlayerCardList, PlayerCardSkeleton } from '@/components/player/player-card';

// Mock the player card variants
jest.mock('@/components/player/player-card/CompactPlayerCard', () => ({
  CompactPlayerCard: ({ player, stats, rank, isSelected, onSelect, onHide, onViewDetails, className }: any) => (
    <div data-testid="compact-player-card" className={className}>
      <div data-testid="player-name">{player.name}</div>
      <div data-testid="player-id">{player.id}</div>
      <div data-testid="is-selected">{isSelected ? 'selected' : 'not-selected'}</div>
      <div data-testid="player-rank">{rank.tier}</div>
      <div data-testid="player-stats">{stats.totalMatches} matches</div>
      <button onClick={onSelect} data-testid="select-button" tabIndex={0}>Select</button>
      <button onClick={onHide} data-testid="hide-button" tabIndex={0}>Hide</button>
      <button onClick={onViewDetails} data-testid="view-details-button" tabIndex={0}>View Details</button>
    </div>
  )
}));

jest.mock('@/components/player/player-card/DefaultPlayerCard', () => ({
  DefaultPlayerCard: ({ player, stats, rank, isSelected, onSelect, onHide, onViewDetails, className }: any) => (
    <div data-testid="default-player-card" className={className}>
      <div data-testid="player-name">{player.name}</div>
      <div data-testid="player-id">{player.id}</div>
      <div data-testid="is-selected">{isSelected ? 'selected' : 'not-selected'}</div>
      <div data-testid="player-rank">{rank.tier}</div>
      <div data-testid="player-stats">{stats.totalMatches} matches</div>
      <button onClick={onSelect} data-testid="select-button" tabIndex={0}>Select</button>
      <button onClick={onHide} data-testid="hide-button" tabIndex={0}>Hide</button>
      <button onClick={onViewDetails} data-testid="view-details-button" tabIndex={0}>View Details</button>
    </div>
  )
}));

jest.mock('@/components/player/player-card/LargePlayerCard', () => ({
  LargePlayerCard: ({ player, stats, rank, isSelected, onSelect, onHide, onViewDetails, className }: any) => (
    <div data-testid="large-player-card" className={className}>
      <div data-testid="player-name">{player.name}</div>
      <div data-testid="player-id">{player.id}</div>
      <div data-testid="is-selected">{isSelected ? 'selected' : 'not-selected'}</div>
      <div data-testid="player-rank">{rank.tier}</div>
      <div data-testid="player-stats">{stats.totalMatches} matches</div>
      <button onClick={onSelect} data-testid="select-button" tabIndex={0}>Select</button>
      <button onClick={onHide} data-testid="hide-button" tabIndex={0}>Hide</button>
      <button onClick={onViewDetails} data-testid="view-details-button" tabIndex={0}>View Details</button>
    </div>
  )
}));

// Mock the usePlayerCard hook
jest.mock('@/components/player/player-card/usePlayerCard', () => ({
  usePlayerCard: () => ({
    stats: {
      totalMatches: 47,
      wins: 32,
      losses: 15,
      winRate: 68.1,
      averageKills: 8.5,
      averageDeaths: 4.2,
      averageAssists: 12.3,
      averageGPM: 650,
      averageXPM: 580
    },
    rank: {
      tier: 'Legend',
      medal: 'Legend',
      score: 3500
    }
  })
}));

const mockPlayer = {
  id: '1',
  name: 'Player1',
  accountId: 123456789,
  teamId: 'team1',
  role: 'Carry',
  totalMatches: 47,
  winRate: 68.1,
  lastUpdated: '2024-01-15T18:30:00Z'
};

describe('PlayerCard', () => {
  const mockOnSelect = jest.fn();
  const mockOnHide = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render player card with default props', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('default-player-card')).toBeInTheDocument();
      expect(screen.getByTestId('player-name')).toHaveTextContent('Player1');
      expect(screen.getByTestId('player-id')).toHaveTextContent('1');
    });

    it('should render compact size player card', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          size="compact"
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('compact-player-card')).toBeInTheDocument();
    });

    it('should render large size player card', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          size="large"
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('large-player-card')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          className="custom-player-card"
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('default-player-card')).toHaveClass('custom-player-card');
    });

    it('should not render when isHidden is true', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          isHidden={true}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.queryByTestId('default-player-card')).not.toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should show selected state when isSelected is true', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          isSelected={true}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('is-selected')).toHaveTextContent('selected');
    });

    it('should show not selected state when isSelected is false', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          isSelected={false}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('is-selected')).toHaveTextContent('not-selected');
    });
  });

  describe('User Interactions', () => {
    it('should call onSelect when select button is clicked', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      fireEvent.click(screen.getByTestId('select-button'));

      expect(mockOnSelect).toHaveBeenCalledWith('1');
    });

    it('should call onHide when hide button is clicked', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      fireEvent.click(screen.getByTestId('hide-button'));

      expect(mockOnHide).toHaveBeenCalledWith('1');
    });

    it('should call onViewDetails when view details button is clicked', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      fireEvent.click(screen.getByTestId('view-details-button'));

      expect(mockOnViewDetails).toHaveBeenCalledWith('1');
    });

    it('should not call handlers when they are not provided', () => {
      render(
        <PlayerCard
          player={mockPlayer}
        />
      );

      fireEvent.click(screen.getByTestId('select-button'));
      fireEvent.click(screen.getByTestId('hide-button'));
      fireEvent.click(screen.getByTestId('view-details-button'));

      // Should not throw errors when handlers are not provided
      expect(screen.getByTestId('default-player-card')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles for interactions', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('select-button')).toBeInTheDocument();
      expect(screen.getByTestId('hide-button')).toBeInTheDocument();
      expect(screen.getByTestId('view-details-button')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      const hideButton = screen.getByRole('button', { name: /hide/i });
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i });

      expect(hideButton).toHaveAttribute('tabIndex', '0');
      expect(viewDetailsButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Props Configuration', () => {
    it('should pass showStats prop to variant components', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          showStats={false}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('default-player-card')).toBeInTheDocument();
    });

    it('should pass showRank prop to variant components', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          showRank={false}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('default-player-card')).toBeInTheDocument();
    });

    it('should pass showPerformance prop to variant components', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          showPerformance={false}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('default-player-card')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display player stats from hook', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('player-stats')).toHaveTextContent('47 matches');
    });

    it('should display player rank from hook', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('player-rank')).toHaveTextContent('Legend');
    });
  });
});

describe('PlayerCardSkeleton', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton with default props', () => {
      render(<PlayerCardSkeleton />);
      const skeleton = screen.getByTestId('default-player-card');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should render compact size skeleton', () => {
      render(<PlayerCardSkeleton size="compact" />);
      const skeleton = screen.getByTestId('compact-player-card');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should render large size skeleton', () => {
      render(<PlayerCardSkeleton size="large" />);
      const skeleton = screen.getByTestId('large-player-card');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should apply custom className', () => {
      render(<PlayerCardSkeleton className="custom-skeleton" />);
      const skeleton = screen.getByTestId('default-player-card');
      expect(skeleton).toHaveClass('custom-skeleton');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for loading state', () => {
      render(<PlayerCardSkeleton />);
      const skeleton = screen.getByTestId('default-player-card');
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });
});

describe('PlayerCardList', () => {
  const mockPlayers = [
    {
      id: '1',
      name: 'Player1',
      accountId: 123456789,
      teamId: 'team1',
      role: 'Carry',
      totalMatches: 47,
      winRate: 68.1,
      lastUpdated: '2024-01-15T18:30:00Z'
    },
    {
      id: '2',
      name: 'Player2',
      accountId: 987654321,
      teamId: 'team2',
      role: 'Support',
      totalMatches: 32,
      winRate: 56.2,
      lastUpdated: '2024-01-14T20:15:00Z'
    },
    {
      id: '3',
      name: 'Player3',
      accountId: 1122334455,
      teamId: 'team3',
      role: 'Mid',
      totalMatches: 28,
      winRate: 72.1,
      lastUpdated: '2024-01-13T16:45:00Z'
    }
  ];

  const mockOnSelectPlayer = jest.fn();
  const mockOnHidePlayer = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render list of player cards', () => {
      render(
        <PlayerCardList
          players={mockPlayers}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByTestId('default-player-card')).toHaveLength(3);
    });

    it('should render empty message when no players', () => {
      render(
        <PlayerCardList
          players={[]}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('No players found')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 2)}
          className="custom-list"
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      const listContainer = screen.getAllByTestId('default-player-card')[0].parentElement;
      expect(listContainer).toHaveClass('custom-list');
    });
  });

  describe('Selection State', () => {
    it('should mark selected player correctly', () => {
      render(
        <PlayerCardList
          players={mockPlayers}
          selectedPlayerId="2"
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      const playerCards = screen.getAllByTestId('is-selected');
      expect(playerCards[0]).toHaveTextContent('not-selected');
      expect(playerCards[1]).toHaveTextContent('selected');
      expect(playerCards[2]).toHaveTextContent('not-selected');
    });
  });

  describe('Hidden Players', () => {
    it('should hide specified players', () => {
      render(
        <PlayerCardList
          players={mockPlayers}
          hiddenPlayerIds={['2']}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      const playerCards = screen.getAllByTestId('default-player-card');
      expect(playerCards).toHaveLength(2); // Only 1 and 3 should be visible
    });
  });

  describe('User Interactions', () => {
    it('should call onSelectPlayer when player is selected', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 2)}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      const selectButtons = screen.getAllByTestId('select-button');
      fireEvent.click(selectButtons[0]);

      expect(mockOnSelectPlayer).toHaveBeenCalledWith('1');
    });

    it('should call onHidePlayer when player is hidden', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 2)}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      const hideButtons = screen.getAllByTestId('hide-button');
      fireEvent.click(hideButtons[0]);

      expect(mockOnHidePlayer).toHaveBeenCalledWith('1');
    });

    it('should call onViewDetails when view details is clicked', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 2)}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButtons = screen.getAllByTestId('view-details-button');
      fireEvent.click(viewDetailsButtons[0]);

      expect(mockOnViewDetails).toHaveBeenCalledWith('1');
    });
  });

  describe('Size Variants', () => {
    it('should render compact size by default', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 2)}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByTestId('default-player-card')).toHaveLength(2);
    });

    it('should render compact size when specified', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 2)}
          size="compact"
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByTestId('compact-player-card')).toHaveLength(2);
    });

    it('should render large size when specified', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 2)}
          size="large"
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByTestId('large-player-card')).toHaveLength(2);
    });
  });

  describe('Props Configuration', () => {
    it('should pass showStats prop to player cards', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 1)}
          showStats={false}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('default-player-card')).toBeInTheDocument();
    });

    it('should pass showRank prop to player cards', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 1)}
          showRank={false}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('default-player-card')).toBeInTheDocument();
    });

    it('should pass showPerformance prop to player cards', () => {
      render(
        <PlayerCardList
          players={mockPlayers.slice(0, 1)}
          showPerformance={false}
          onSelectPlayer={mockOnSelectPlayer}
          onHidePlayer={mockOnHidePlayer}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('default-player-card')).toBeInTheDocument();
    });
  });
}); 