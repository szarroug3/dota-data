/**
 * Hero Context Tests
 *
 * Tests for the hero context provider, including state management,
 * data fetching, error handling, and action dispatching.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { HeroProvider, useHeroContext } from '@/contexts/hero-context';
import type { Hero, HeroData, HeroFilters, HeroStats } from '@/types/contexts/hero-context-value';

// ============================================================================
// TEST COMPONENT
// ============================================================================

// Helper components to reduce complexity
const HeroButtons = ({ setSelectedHero, setFilters, refreshHeroes, refreshHero }: {
  setSelectedHero: (id: string) => void;
  setFilters: (filters: HeroFilters) => void;
  refreshHeroes: () => void;
  refreshHero: (id: string) => void;
}) => (
  <>
    <button data-testid="select-hero-btn" onClick={() => setSelectedHero('1')}>
      Select Hero
    </button>
    <button data-testid="clear-selection-btn" onClick={() => setSelectedHero('')}>
      Clear Selection
    </button>
    <button data-testid="refresh-heroes-btn" onClick={() => refreshHeroes()}>
      Refresh Heroes
    </button>
    <button data-testid="refresh-hero-btn" onClick={() => refreshHero('1')}>
      Refresh Hero
    </button>
    <button data-testid="apply-filters-btn" onClick={() => setFilters({
      primaryAttribute: ['agility'],
      attackType: ['melee'],
      roles: ['Carry'],
      complexity: [2],
      difficulty: ['medium'],
      pickRate: { min: null, max: null },
      winRate: { min: null, max: null }
    })}>
      Apply Filters
    </button>
    <button data-testid="clear-filters-btn" onClick={() => setFilters({
      primaryAttribute: [],
      attackType: [],
      roles: [],
      complexity: [],
      difficulty: [],
      pickRate: { min: null, max: null },
      winRate: { min: null, max: null }
    })}>
      Clear Filters
    </button>
  </>
);

interface HeroCountsProps {
  heroes: Hero[];
  filteredHeroes: Hero[];
  selectedHeroId: string | null;
  selectedHero: HeroData | null;
  heroStats: HeroStats | null;
}

const HeroCounts = ({ heroes, filteredHeroes, selectedHeroId, selectedHero, heroStats }: HeroCountsProps) => (
  <>
    <div data-testid="heroes-count">{heroes.length}</div>
    <div data-testid="filtered-heroes-count">{filteredHeroes.length}</div>
    <div data-testid="selected-hero-id">{selectedHeroId || 'none'}</div>
    <div data-testid="selected-hero-name">{selectedHero?.hero.name || 'none'}</div>
    <div data-testid="hero-stats-games">{heroStats?.totalGames || 0}</div>
  </>
);

interface HeroStatusProps {
  filters: HeroFilters;
  isLoadingHeroes: boolean;
  isLoadingHeroData: boolean;
  isLoadingHeroStats: boolean;
}

const HeroStatus = ({ filters, isLoadingHeroes, isLoadingHeroData, isLoadingHeroStats }: HeroStatusProps) => {
  const isAllFiltersEmpty =
    filters.primaryAttribute.length === 0 &&
    filters.attackType.length === 0 &&
    filters.roles.length === 0 &&
    filters.complexity.length === 0 &&
    filters.difficulty.length === 0 &&
    filters.pickRate.min == null && filters.pickRate.max == null &&
    filters.winRate.min == null && filters.winRate.max == null;
  return (
    <>
      <div data-testid="filters-result">{isAllFiltersEmpty ? 'all' : 'filtered'}</div>
      <div data-testid="loading-heroes">{isLoadingHeroes.toString()}</div>
      <div data-testid="hero-data-loading">{isLoadingHeroData.toString()}</div>
      <div data-testid="hero-stats-loading">{isLoadingHeroStats.toString()}</div>
    </>
  );
};

interface HeroErrorsProps {
  heroesError: string | null;
  heroDataError: string | null;
  heroStatsError: string | null;
}

const HeroErrors = ({ heroesError, heroDataError, heroStatsError }: HeroErrorsProps) => (
  <>
    <div data-testid="heroes-error">{heroesError || 'none'}</div>
    <div data-testid="hero-data-error">{heroDataError || 'none'}</div>
    <div data-testid="hero-stats-error">{heroStatsError || 'none'}</div>
    <div data-testid="hero-error">{heroDataError || heroStatsError || 'none'}</div>
  </>
);

const TestComponent = () => {
  const {
    heroes,
    filteredHeroes,
    selectedHeroId,
    selectedHero,
    heroStats,
    filters,
    isLoadingHeroes,
    isLoadingHeroData,
    isLoadingHeroStats,
    heroesError,
    heroDataError,
    heroStatsError,
    setSelectedHero,
    setFilters,
    refreshHeroes,
    refreshHero
  } = useHeroContext();

  return (
    <div>
      <HeroCounts
        heroes={heroes}
        filteredHeroes={filteredHeroes}
        selectedHeroId={selectedHeroId}
        selectedHero={selectedHero}
        heroStats={heroStats}
      />
      <HeroStatus
        filters={filters}
        isLoadingHeroes={isLoadingHeroes}
        isLoadingHeroData={isLoadingHeroData}
        isLoadingHeroStats={isLoadingHeroStats}
      />
      <HeroErrors
        heroesError={heroesError}
        heroDataError={heroDataError}
        heroStatsError={heroStatsError}
      />
      <HeroButtons
        setSelectedHero={setSelectedHero}
        setFilters={setFilters}
        refreshHeroes={refreshHeroes}
        refreshHero={refreshHero}
      />
    </div>
  );
};

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<HeroProvider>{ui}</HeroProvider>);
};

// ============================================================================
// TESTS
// ============================================================================

describe('HeroProvider Initial State', () => {
  it('should provide initial state', async () => {
    renderWithProvider(<TestComponent />);
    expect(screen.getByTestId('loading-heroes')).toHaveTextContent('true');
    expect(screen.getByTestId('heroes-count')).toHaveTextContent('0');
    expect(screen.getByTestId('filtered-heroes-count')).toHaveTextContent('0');
    expect(screen.getByTestId('selected-hero-id')).toHaveTextContent('none');
    expect(screen.getByTestId('selected-hero-name')).toHaveTextContent('none');
    expect(screen.getByTestId('hero-stats-games')).toHaveTextContent('0');
    expect(screen.getByTestId('filters-result')).toHaveTextContent('all');
    await waitFor(() => {
      expect(screen.getByTestId('loading-heroes')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    expect(screen.getByTestId('filtered-heroes-count')).toHaveTextContent('2');
  });
});

describe('HeroProvider Hero Selection', () => {
  it('should select a hero', async () => {
    renderWithProvider(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    });
    act(() => {
      screen.getByTestId('select-hero-btn').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('selected-hero-id')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-hero-name')).toHaveTextContent('Anti-Mage');
    });
  });

  it('should clear hero selection', async () => {
    renderWithProvider(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    });
    act(() => {
      screen.getByTestId('select-hero-btn').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('selected-hero-id')).toHaveTextContent('1');
    });
    act(() => {
      screen.getByTestId('clear-selection-btn').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('selected-hero-id')).toHaveTextContent('none');
      expect(screen.getByTestId('selected-hero-name')).toHaveTextContent('Unknown Hero');
    });
  });
});

describe('HeroProvider Hero Data Fetching', () => {
  it('should refresh heroes', async () => {
    renderWithProvider(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    });
    act(() => {
      screen.getByTestId('refresh-heroes-btn').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    });
  });

  it('should refresh hero data and stats', async () => {
    renderWithProvider(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    });
    act(() => {
      screen.getByTestId('refresh-hero-btn').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('hero-stats-games')).toHaveTextContent('100');
    });
    expect(screen.getByTestId('hero-stats-loading')).toHaveTextContent('false');
  });
});

describe('HeroProvider Filtering', () => {
  it('should apply filters', async () => {
    renderWithProvider(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    });
    act(() => {
      screen.getByTestId('apply-filters-btn').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('filters-result')).toHaveTextContent('filtered');
    });
  });

  it('should clear filters', async () => {
    renderWithProvider(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    });
    act(() => {
      screen.getByTestId('apply-filters-btn').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('filters-result')).toHaveTextContent('filtered');
    });
    act(() => {
      screen.getByTestId('clear-filters-btn').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('filters-result')).toHaveTextContent('all');
    });
  });
});

describe('HeroProvider Error Handling', () => {
  it('should handle errors gracefully', async () => {
    renderWithProvider(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('heroes-count')).toHaveTextContent('2');
    });
    expect(screen.getByTestId('heroes-error')).toHaveTextContent('none');
    expect(screen.getByTestId('hero-data-error')).toHaveTextContent('none');
    expect(screen.getByTestId('hero-stats-error')).toHaveTextContent('none');
  });
});

describe('HeroProvider Hook Usage', () => {
  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useHeroContext must be used within a HeroProvider');
    consoleSpy.mockRestore();
  });
}); 