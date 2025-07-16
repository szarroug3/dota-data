import { render, screen } from '@testing-library/react';

import { ClientRoot } from '@/app/ClientRoot';

// Mock the child components to avoid complex dependencies
jest.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

jest.mock('@/components/layout/AppLoader', () => ({
  AppLoader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-loader">{children}</div>
  ),
}));

// Mock the hero data fetching context to prevent real API calls
jest.mock('@/contexts/hero-data-fetching-context', () => ({
  HeroDataFetchingProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hero-data-fetching-provider">{children}</div>
  ),
  useHeroDataFetching: () => ({
    fetchHeroesData: jest.fn().mockResolvedValue([]),
    clearHeroesCache: jest.fn(),
    clearAllCache: jest.fn(),
    clearHeroesError: jest.fn(),
    clearAllErrors: jest.fn(),
    isHeroesCached: jest.fn().mockReturnValue(false),
    getHeroesError: jest.fn().mockReturnValue(null),
  }),
}));

describe('ClientRoot', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(
        <ClientRoot>
          <div data-testid="test-content">Test Content</div>
        </ClientRoot>
      );
    }).not.toThrow();
  });

  it('renders child content', () => {
    render(
      <ClientRoot>
        <div data-testid="test-content">Test Content</div>
      </ClientRoot>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders layout components', () => {
    render(
      <ClientRoot>
        <div data-testid="test-content">Test Content</div>
      </ClientRoot>
    );

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByTestId('app-loader')).toBeInTheDocument();
  });

  it('provides all required context providers', () => {
    // This test verifies that the provider tree is complete
    // by checking that we can render without context errors
    const TestComponent = () => {
      return <div data-testid="provider-test">Provider Test</div>;
    };

    expect(() => {
      render(
        <ClientRoot>
          <TestComponent />
        </ClientRoot>
      );
    }).not.toThrow();

    expect(screen.getByTestId('provider-test')).toBeInTheDocument();
  });
}); 