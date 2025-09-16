import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { ConfigProvider, useConfigContext } from '@/frontend/contexts/config-context';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const StateDisplay: React.FC = () => {
  const { config, activeTeam, getTeams, isLoading, isSaving, error } = useConfigContext();

  const renderConfigState = () => (
    <>
      <div data-testid="preferred-external-site">{config.preferredExternalSite}</div>
      <div data-testid="preferred-matchlist-view">{config.preferredMatchlistView}</div>
      <div data-testid="team-list-count">{getTeams().size}</div>
      <div data-testid="active-team-id">{activeTeam?.teamId || 'none'}</div>
      <div data-testid="active-team-league">{activeTeam?.leagueId || 'none'}</div>
    </>
  );

  const renderLoadingStates = () => (
    <>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="saving">{isSaving ? 'true' : 'false'}</div>
    </>
  );

  const renderErrorState = () => <div data-testid="error">{error || 'none'}</div>;

  return (
    <div>
      {renderConfigState()}
      {renderLoadingStates()}
      {renderErrorState()}
    </div>
  );
};

const ActionButtons: React.FC = () => {
  const { updateConfig, resetConfig, clearErrors } = useConfigContext();

  return (
    <div>
      <button onClick={() => updateConfig({ preferredExternalSite: 'dotabuff' })} data-testid="update-site-btn">
        Update Site
      </button>
      <button onClick={() => updateConfig({ preferredMatchlistView: 'grid' })} data-testid="update-matchlist-btn">
        Update Matchlist View
      </button>
      <button onClick={() => resetConfig()} data-testid="reset-config-btn">
        Reset Config
      </button>
      <button onClick={() => clearErrors()} data-testid="clear-errors-btn">
        Clear Errors
      </button>
    </div>
  );
};

const TestComponent: React.FC = () => (
  <div>
    <StateDisplay />
    <ActionButtons />
  </div>
);

const renderWithProvider = (component: React.ReactElement) => {
  return render(<ConfigProvider>{component}</ConfigProvider>);
};

// ============================================================================
// TEST HELPERS
// ============================================================================

const waitForInitialLoad = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
};

const clickButton = (testId: string) => {
  act(() => {
    screen.getByTestId(testId).click();
  });
};

const expectInitialConfigState = () => {
  expect(screen.getByTestId('preferred-external-site')).toHaveTextContent('dotabuff');
  expect(screen.getByTestId('preferred-matchlist-view')).toHaveTextContent('list');
};

const expectInitialLoadingState = () => {
  expect(screen.getByTestId('loading')).toHaveTextContent('false');
  expect(screen.getByTestId('saving')).toHaveTextContent('false');
  expect(screen.getByTestId('error')).toHaveTextContent('none');
};

// ============================================================================
// TESTS
// ============================================================================

describe('ConfigProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should render with default configuration', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      expectInitialConfigState();
      expectInitialLoadingState();
      expect(screen.getByTestId('preferred-external-site')).toBeInTheDocument();
    });

    it('should load configuration from localStorage on mount', async () => {
      const storedConfig = {
        preferredExternalSite: 'dotabuff',
        preferredMatchlistView: 'grid',
      };

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'dota-scout-assistant-config') {
          return JSON.stringify(storedConfig);
        }
        return null;
      });

      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      expect(screen.getByTestId('preferred-external-site')).toHaveTextContent('dotabuff');
      expect(screen.getByTestId('preferred-matchlist-view')).toHaveTextContent('grid');
    });

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      // Should fall back to default values
      expectInitialConfigState();
      expect(screen.getByTestId('preferred-external-site')).toBeInTheDocument();
    });
  });

  describe('Config Updates', () => {
    it('should update preferred external site', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-site-btn');
      await waitFor(() => {
        expect(screen.getByTestId('preferred-external-site')).toHaveTextContent('dotabuff');
      });
      expect(screen.getByTestId('preferred-external-site')).toHaveTextContent('dotabuff');
    });

    it('should update preferred matchlist view', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-matchlist-btn');
      await waitFor(() => {
        expect(screen.getByTestId('preferred-matchlist-view')).toHaveTextContent('grid');
      });
    });

    it('should reset configuration to defaults', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      // First update some values
      clickButton('update-site-btn');
      clickButton('update-matchlist-btn');

      await waitFor(() => {
        expect(screen.getByTestId('preferred-external-site')).toHaveTextContent('dotabuff');
        expect(screen.getByTestId('preferred-matchlist-view')).toHaveTextContent('grid');
      });

      // Then reset
      clickButton('reset-config-btn');
      await waitFor(() => {
        expectInitialConfigState();
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('clear-errors-btn');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
  });

  describe('localStorage Persistence', () => {
    it('should save config changes to localStorage', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-site-btn');

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'dota-scout-assistant-config',
          expect.stringContaining('"preferredExternalSite":"dotabuff"'),
        );
      });
    });

    it('should load config from localStorage on mount', async () => {
      const storedConfig = {
        preferredExternalSite: 'dotabuff',
        preferredMatchlistView: 'grid',
      };

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'dota-scout-assistant-config') {
          return JSON.stringify(storedConfig);
        }
        return null;
      });

      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      expect(screen.getByTestId('preferred-external-site')).toHaveTextContent('dotabuff');
      expect(screen.getByTestId('preferred-matchlist-view')).toHaveTextContent('grid');
    });

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      // Should fall back to default values
      expectInitialConfigState();
      expect(screen.getByTestId('preferred-external-site')).toHaveTextContent('dotabuff');
    });
  });
});
