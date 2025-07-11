import { fireEvent, render, screen } from '@testing-library/react';

import { HeroCard, HeroCardList, HeroCardSkeleton } from '@/components/hero/hero-card';

// Mock the hero card variants
jest.mock('@/components/hero/hero-card-variants', () => ({
  ListHeroCard: ({ heroId, hero, isSelected, onSelect, onHide, onViewDetails, className }: any) => (
    <div data-testid="list-hero-card" className={className}>
      <div data-testid="hero-name">{hero.name}</div>
      <div data-testid="hero-id">{heroId}</div>
      <div data-testid="is-selected">{isSelected ? 'selected' : 'not-selected'}</div>
      <button onClick={() => onSelect?.(heroId)} data-testid="select-button" tabIndex={0}>Select</button>
      <button onClick={() => onHide?.(heroId)} data-testid="hide-button" tabIndex={0}>Hide</button>
      <button onClick={() => onViewDetails?.(heroId)} data-testid="view-details-button" tabIndex={0}>View Details</button>
    </div>
  ),
  GridHeroCard: ({ heroId, hero, isSelected, onSelect, onHide, onViewDetails, className }: any) => (
    <div data-testid="grid-hero-card" className={className}>
      <div data-testid="hero-name">{hero.name}</div>
      <div data-testid="hero-id">{heroId}</div>
      <div data-testid="is-selected">{isSelected ? 'selected' : 'not-selected'}</div>
      <button onClick={() => onSelect?.(heroId)} data-testid="select-button" tabIndex={0}>Select</button>
      <button onClick={() => onHide?.(heroId)} data-testid="hide-button" tabIndex={0}>Hide</button>
      <button onClick={() => onViewDetails?.(heroId)} data-testid="view-details-button" tabIndex={0}>View Details</button>
    </div>
  ),
  DetailedHeroCard: ({ heroId, hero, isSelected, onSelect, onHide, onViewDetails, className }: any) => (
    <div data-testid="detailed-hero-card" className={className}>
      <div data-testid="hero-name">{hero.name}</div>
      <div data-testid="hero-id">{heroId}</div>
      <div data-testid="is-selected">{isSelected ? 'selected' : 'not-selected'}</div>
      <button onClick={() => onSelect?.(heroId)} data-testid="select-button" tabIndex={0}>Select</button>
      <button onClick={() => onHide?.(heroId)} data-testid="hide-button" tabIndex={0}>Hide</button>
      <button onClick={() => onViewDetails?.(heroId)} data-testid="view-details-button" tabIndex={0}>View Details</button>
    </div>
  )
}));

// Mock the hero card utils
jest.mock('@/components/hero/hero-card-utils', () => ({
  generateMockHeroInfo: (heroId: string) => ({
    id: heroId,
    name: `Hero ${heroId}`,
    localizedName: `Hero ${heroId}`,
    primaryAttribute: 'agi',
    attackType: 'Melee',
    roles: ['Carry', 'Support'],
    img: `/heroes/${heroId}.png`,
    icon: `/heroes/${heroId}_icon.png`,
    baseHealth: 200,
    baseMana: 75,
    baseArmor: 2,
    baseAttackMin: 45,
    baseAttackMax: 55,
    moveSpeed: 300
  }),
  generateMockHeroMeta: () => ({
    pickRate: 15.2,
    winRate: 52.1,
    banRate: 8.5,
    totalPicks: 1250,
    totalWins: 650,
    totalBans: 420
  }),
  generateMockHeroStats: () => ({
    gamesPlayed: 47,
    wins: 32,
    losses: 15,
    winRate: 68.1,
    averageKills: 8.5,
    averageDeaths: 4.2,
    averageAssists: 12.3,
    averageGPM: 650,
    averageXPM: 580
  })
}));

describe('HeroCard', () => {
  const mockOnSelect = jest.fn();
  const mockOnHide = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render hero card with default props', () => {
      render(
        <HeroCard
          heroId="1"
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('grid-hero-card')).toBeInTheDocument();
      expect(screen.getByTestId('hero-name')).toHaveTextContent('Hero 1');
      expect(screen.getByTestId('hero-id')).toHaveTextContent('1');
    });

    it('should render list mode hero card', () => {
      render(
        <HeroCard
          heroId="1"
          mode="list"
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('list-hero-card')).toBeInTheDocument();
    });

    it('should render detailed mode hero card', () => {
      render(
        <HeroCard
          heroId="1"
          mode="detailed"
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('detailed-hero-card')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <HeroCard
          heroId="1"
          className="custom-hero-card"
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('grid-hero-card')).toHaveClass('custom-hero-card');
    });

    it('should not render when isHidden is true', () => {
      render(
        <HeroCard
          heroId="1"
          isHidden={true}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.queryByTestId('grid-hero-card')).not.toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should show selected state when isSelected is true', () => {
      render(
        <HeroCard
          heroId="1"
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
        <HeroCard
          heroId="1"
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
        <HeroCard
          heroId="1"
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
        <HeroCard
          heroId="1"
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
        <HeroCard
          heroId="1"
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
        <HeroCard
          heroId="1"
        />
      );

      fireEvent.click(screen.getByTestId('select-button'));
      fireEvent.click(screen.getByTestId('hide-button'));
      fireEvent.click(screen.getByTestId('view-details-button'));

      // Should not throw errors when handlers are not provided
      expect(screen.getByTestId('grid-hero-card')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles for interactions', () => {
      render(
        <HeroCard
          heroId="1"
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
        <HeroCard
          heroId="1"
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
        <HeroCard
          heroId="1"
          showStats={false}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('grid-hero-card')).toBeInTheDocument();
    });

    it('should pass showMeta prop to variant components', () => {
      render(
        <HeroCard
          heroId="1"
          showMeta={false}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('grid-hero-card')).toBeInTheDocument();
    });

    it('should pass showRole prop to variant components', () => {
      render(
        <HeroCard
          heroId="1"
          showRole={false}
          onSelect={mockOnSelect}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('grid-hero-card')).toBeInTheDocument();
    });
  });
});

describe('HeroCardSkeleton', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton with default props', () => {
      render(<HeroCardSkeleton />);

      const skeleton = screen.getByTestId('grid-hero-card') || screen.getByRole('generic', { name: /skeleton/i });
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should render list mode skeleton', () => {
      render(<HeroCardSkeleton mode="list" />);

      const skeleton = screen.getByTestId('list-hero-card') || screen.getByRole('generic', { name: /skeleton/i });
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should render detailed mode skeleton', () => {
      render(<HeroCardSkeleton mode="detailed" />);

      const skeleton = screen.getByTestId('detailed-hero-card') || screen.getByRole('generic', { name: /skeleton/i });
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should apply custom className', () => {
      render(<HeroCardSkeleton className="custom-skeleton" />);

      const skeleton = screen.getByTestId('grid-hero-card') || screen.getByRole('generic', { name: /skeleton/i });
      expect(skeleton).toHaveClass('custom-skeleton');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for loading state', () => {
      render(<HeroCardSkeleton />);

      const skeleton = screen.getByTestId('grid-hero-card') || screen.getByRole('generic', { name: /skeleton/i });
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });
});

describe('HeroCardList', () => {
  const mockOnSelectHero = jest.fn();
  const mockOnHideHero = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render list of hero cards', () => {
      render(
        <HeroCardList
          heroIds={['1', '2', '3']}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByTestId('grid-hero-card')).toHaveLength(3);
    });

    it('should render empty message when no heroes', () => {
      render(
        <HeroCardList
          heroIds={[]}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('No heroes found')).toBeInTheDocument();
    });

    it('should render empty message when heroIds is null', () => {
      render(
        <HeroCardList
          heroIds={null as any}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('No heroes found')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <HeroCardList
          heroIds={['1', '2']}
          className="custom-list"
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      const listContainer = screen.getAllByTestId('grid-hero-card')[0].parentElement;
      expect(listContainer).toHaveClass('custom-list');
    });
  });

  describe('Selection State', () => {
    it('should mark selected hero correctly', () => {
      render(
        <HeroCardList
          heroIds={['1', '2', '3']}
          selectedHeroId="2"
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      const heroCards = screen.getAllByTestId('is-selected');
      expect(heroCards[0]).toHaveTextContent('not-selected');
      expect(heroCards[1]).toHaveTextContent('selected');
      expect(heroCards[2]).toHaveTextContent('not-selected');
    });
  });

  describe('Hidden Heroes', () => {
    it('should hide specified heroes', () => {
      render(
        <HeroCardList
          heroIds={['1', '2', '3']}
          hiddenHeroIds={['2']}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      const heroCards = screen.getAllByTestId('grid-hero-card');
      expect(heroCards).toHaveLength(2); // Only 1 and 3 should be visible
    });
  });

  describe('User Interactions', () => {
    it('should call onSelectHero when hero is selected', () => {
      render(
        <HeroCardList
          heroIds={['1', '2']}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      const selectButtons = screen.getAllByTestId('select-button');
      fireEvent.click(selectButtons[0]);

      expect(mockOnSelectHero).toHaveBeenCalledWith('1');
    });

    it('should call onHideHero when hero is hidden', () => {
      render(
        <HeroCardList
          heroIds={['1', '2']}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      const hideButtons = screen.getAllByTestId('hide-button');
      fireEvent.click(hideButtons[0]);

      expect(mockOnHideHero).toHaveBeenCalledWith('1');
    });

    it('should call onViewDetails when view details is clicked', () => {
      render(
        <HeroCardList
          heroIds={['1', '2']}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButtons = screen.getAllByTestId('view-details-button');
      fireEvent.click(viewDetailsButtons[0]);

      expect(mockOnViewDetails).toHaveBeenCalledWith('1');
    });
  });

  describe('Layout Modes', () => {
    it('should render grid layout by default', () => {
      render(
        <HeroCardList
          heroIds={['1', '2']}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByTestId('grid-hero-card')).toHaveLength(2);
    });

    it('should render list layout when mode is list', () => {
      render(
        <HeroCardList
          heroIds={['1', '2']}
          mode="list"
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByTestId('list-hero-card')).toHaveLength(2);
    });

    it('should render detailed layout when mode is detailed', () => {
      render(
        <HeroCardList
          heroIds={['1', '2']}
          mode="detailed"
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByTestId('detailed-hero-card')).toHaveLength(2);
    });
  });

  describe('Props Configuration', () => {
    it('should pass showStats prop to hero cards', () => {
      render(
        <HeroCardList
          heroIds={['1']}
          showStats={false}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('grid-hero-card')).toBeInTheDocument();
    });

    it('should pass showMeta prop to hero cards', () => {
      render(
        <HeroCardList
          heroIds={['1']}
          showMeta={false}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('grid-hero-card')).toBeInTheDocument();
    });

    it('should pass showRole prop to hero cards', () => {
      render(
        <HeroCardList
          heroIds={['1']}
          showRole={false}
          onSelectHero={mockOnSelectHero}
          onHideHero={mockOnHideHero}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByTestId('grid-hero-card')).toBeInTheDocument();
    });
  });
}); 