/**
 * Hero Context Tests
 *
 * Tests for the hero context provider, including state management,
 * data fetching, error handling, and action dispatching.
 */

import { act, render, screen, waitFor } from '@testing-library/react';

import { HeroProvider, useHeroContext } from '@/contexts/hero-context';
import { HeroDataFetchingProvider, useHeroDataFetching } from '@/contexts/hero-data-fetching-context';
import type { Hero, HeroFilters } from '@/types/contexts/hero-context-value';
import type { OpenDotaHero } from '@/types/external-apis';

// Mock useHeroDataFetching to return mock hero data
jest.mock('@/contexts/hero-data-fetching-context', () => {
  const actual = jest.requireActual('@/contexts/hero-data-fetching-context');
  return {
    ...actual,
    useHeroDataFetching: jest.fn()
  };
});

const mockHeroes: OpenDotaHero[] = [
  {
    id: 1,
    name: 'antimage',
    localized_name: 'Anti-Mage',
    primary_attr: 'agility',
    attack_type: 'melee',
    roles: ['Carry', 'Escape', 'Nuker'],
    legs: 2
  },
  {
    id: 2,
    name: 'axe',
    localized_name: 'Axe',
    primary_attr: 'strength',
    attack_type: 'melee',
    roles: ['Initiator', 'Durable', 'Disabler', 'Jungler'],
    legs: 2
  }
];

// Set up the mock implementation before each test
beforeEach(() => {
  (useHeroDataFetching as jest.Mock).mockReturnValue({
    fetchHeroesData: jest.fn().mockResolvedValue(mockHeroes)
  });
});

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const HeroCounts = ({ heroes, filteredHeroes, selectedHeroId, selectedHero }: {
  heroes: Hero[];
  filteredHeroes: Hero[];
  selectedHeroId: string | null;
  selectedHero: Hero | null;
}) => (
  <>
    <div data-testid="heroes-count">{heroes.length}</div>
    <div data-testid="filtered-heroes-count">{filteredHeroes.length}</div>
    <div data-testid="selected-hero-id">{selectedHeroId || 'none'}</div>
    <div data-testid="selected-hero-name">{selectedHero ? selectedHero.localizedName : 'Unknown Hero'}</div>
  </>
);

const HeroButtons = ({ setSelectedHero, setFilters, refreshHeroes, refreshHero }: {
  setSelectedHero: (id: string) => void;
  setFilters: (filters: HeroFilters) => void;
  refreshHeroes: () => Promise<void>;
  refreshHero: (heroId: string) => Promise<void>;
}) => (
  <>
    <button data-testid="select-hero-btn" onClick={() => setSelectedHero('1')}>Select Hero</button>
    <button data-testid="clear-hero-btn" onClick={() => setSelectedHero('')}>Clear Hero</button>
    <button data-testid="refresh-heroes-btn" onClick={() => refreshHeroes()}>Refresh Heroes</button>
    <button data-testid="refresh-hero-btn" onClick={() => refreshHero('1')}>Refresh Hero</button>
  </>
);

const TestComponent = () => {
  const context = useHeroContext();
  return (
    <div>
      <HeroCounts
        heroes={context.heroes}
        filteredHeroes={context.filteredHeroes}
        selectedHeroId={context.selectedHeroId}
        selectedHero={context.selectedHero}
      />
      <HeroButtons
        setSelectedHero={context.setSelectedHero}
        setFilters={context.setFilters}
        refreshHeroes={context.refreshHeroes}
        refreshHero={context.refreshHero}
      />
      <div data-testid="loading-heroes">{context.isLoadingHeroes.toString()}</div>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('HeroProvider Initial State', () => {
  it('should provide initial state', async () => {
    render(
      <HeroDataFetchingProvider>
        <HeroProvider>
          <TestComponent />
        </HeroProvider>
      </HeroDataFetchingProvider>
    );

    // Wait for heroes to be loaded
    await waitFor(() => expect(screen.getByTestId('heroes-count')).toHaveTextContent('2'));
    expect(screen.getByTestId('filtered-heroes-count')).toHaveTextContent('2');
    expect(screen.getByTestId('selected-hero-id')).toHaveTextContent('none');
    expect(screen.getByTestId('selected-hero-name')).toHaveTextContent('Unknown Hero');
  });
});

describe('HeroProvider Hero Selection', () => {
  it('should select a hero', async () => {
    render(
      <HeroDataFetchingProvider>
        <HeroProvider>
          <TestComponent />
        </HeroProvider>
      </HeroDataFetchingProvider>
    );

    await waitFor(() => expect(screen.getByTestId('heroes-count')).toHaveTextContent('2'));
    
    act(() => {
      screen.getByTestId('select-hero-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('selected-hero-id')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-hero-name')).toHaveTextContent('Anti-Mage');
    });
  });

  it('should clear hero selection', async () => {
    render(
      <HeroDataFetchingProvider>
        <HeroProvider>
          <TestComponent />
        </HeroProvider>
      </HeroDataFetchingProvider>
    );

    await waitFor(() => expect(screen.getByTestId('heroes-count')).toHaveTextContent('2'));
    
    // First select a hero
    act(() => {
      screen.getByTestId('select-hero-btn').click();
    });

    await waitFor(() => expect(screen.getByTestId('selected-hero-id')).toHaveTextContent('1'));

    // Then clear the selection
    act(() => {
      screen.getByTestId('clear-hero-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('selected-hero-id')).toHaveTextContent('none');
      expect(screen.getByTestId('selected-hero-name')).toHaveTextContent('Unknown Hero');
    });
  });
}); 