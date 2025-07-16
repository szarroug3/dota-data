/**
 * Config Context Tests
 *
 * Tests for the config context provider, including state management,
 * configuration updates, preferences management, and localStorage persistence.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { ConfigProvider, useConfigContext } from '@/contexts/config-context';

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const StateDisplay: React.FC = () => {
  const {
    config,
    preferences,
    isLoading,
    isSaving,
    error
  } = useConfigContext();

  const renderConfigState = () => (
    <>
      <div data-testid="theme">{config.theme}</div>
      <div data-testid="ui-density">{config.uiDensity}</div>
      <div data-testid="preferred-site">{config.preferredExternalSite}</div>
      <div data-testid="auto-refresh">{config.autoRefresh ? 'true' : 'false'}</div>
      <div data-testid="sidebar-collapsed">{config.sidebarCollapsed ? 'true' : 'false'}</div>
      <div data-testid="debug-mode">{config.debugMode ? 'true' : 'false'}</div>
    </>
  );

  const renderPreferencesState = () => (
    <>
      <div data-testid="dashboard-view">{preferences.dashboard.defaultView}</div>
      <div data-testid="team-management-view">{preferences.teamManagement.defaultView}</div>
      <div data-testid="match-history-view">{preferences.matchHistory.defaultView}</div>
      <div data-testid="player-stats-view">{preferences.playerStats.defaultView}</div>
      <div data-testid="draft-suggestions-view">{preferences.draftSuggestions.defaultView}</div>
      <div data-testid="team-analysis-view">{preferences.teamAnalysis.defaultView}</div>
    </>
  );

  const renderLoadingStates = () => (
    <>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="saving">{isSaving ? 'true' : 'false'}</div>
    </>
  );

  const renderErrorState = () => (
    <div data-testid="error">{error || 'none'}</div>
  );

  return (
    <div>
      {renderConfigState()}
      {renderPreferencesState()}
      {renderLoadingStates()}
      {renderErrorState()}
    </div>
  );
};

const ActionButtons: React.FC = () => {
  const {
    updateConfig,
    updatePreferences,
    resetConfig,
    resetPreferences,
    clearErrors
  } = useConfigContext();

  // Default values for preferences
  const defaultDashboard = {
    defaultView: 'overview',
    showPerformanceHighlights: true,
    showRecentMatches: true,
    showQuickActions: true,
    autoRefresh: true
  };
  const defaultTeamManagement = {
    defaultView: 'list',
    showArchivedTeams: false,
    sortBy: 'name' as const,
    sortDirection: 'asc' as const
  };

  return (
    <div>
      <button 
        onClick={() => updateConfig({ theme: 'dark' })} 
        data-testid="update-theme-btn"
      >
        Update Theme
      </button>
      <button 
        onClick={() => updateConfig({ preferredExternalSite: 'dotabuff' })} 
        data-testid="update-site-btn"
      >
        Update Site
      </button>
      <button 
        onClick={() => updateConfig({ sidebarCollapsed: true })} 
        data-testid="update-sidebar-btn"
      >
        Update Sidebar
      </button>
      <button 
        onClick={() => updatePreferences({ 
          dashboard: { ...defaultDashboard, defaultView: 'recent' } 
        })} 
        data-testid="update-dashboard-btn"
      >
        Update Dashboard
      </button>
      <button 
        onClick={() => updatePreferences({ 
          teamManagement: { ...defaultTeamManagement, defaultView: 'grid' } 
        })} 
        data-testid="update-team-management-btn"
      >
        Update Team Management
      </button>
      <button 
        onClick={() => resetConfig()} 
        data-testid="reset-config-btn"
      >
        Reset Config
      </button>
      <button 
        onClick={() => resetPreferences()} 
        data-testid="reset-preferences-btn"
      >
        Reset Preferences
      </button>
      <button 
        onClick={() => clearErrors()} 
        data-testid="clear-errors-btn"
      >
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
  expect(screen.getByTestId('theme')).toHaveTextContent('system');
  expect(screen.getByTestId('ui-density')).toHaveTextContent('comfortable');
  expect(screen.getByTestId('preferred-site')).toHaveTextContent('dotabuff');
  expect(screen.getByTestId('auto-refresh')).toHaveTextContent('true');
  expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
  expect(screen.getByTestId('debug-mode')).toHaveTextContent('false');
};

const expectInitialPreferencesState = () => {
  expect(screen.getByTestId('dashboard-view')).toHaveTextContent('overview');
  expect(screen.getByTestId('team-management-view')).toHaveTextContent('list');
  expect(screen.getByTestId('match-history-view')).toHaveTextContent('list');
  expect(screen.getByTestId('player-stats-view')).toHaveTextContent('overview');
  expect(screen.getByTestId('draft-suggestions-view')).toHaveTextContent('suggestions');
  expect(screen.getByTestId('team-analysis-view')).toHaveTextContent('overview');
};

const expectInitialLoadingState = () => {
  expect(screen.getByTestId('loading')).toHaveTextContent('false');
  expect(screen.getByTestId('saving')).toHaveTextContent('false');
  expect(screen.getByTestId('error')).toHaveTextContent('none');
};

// ============================================================================
// MOCK LOCAL STORAGE
// ============================================================================

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// ============================================================================
// TESTS
// ============================================================================

describe('ConfigProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should render without crashing', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('theme')).toBeInTheDocument();
    });

    // eslint-disable-next-line jest/expect-expect
    it('should have correct initial state', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      expectInitialConfigState();
      expectInitialPreferencesState();
      expectInitialLoadingState();
    });

    it('should load config from localStorage if available', async () => {
      const storedConfig = {
        theme: 'dark',
        uiDensity: 'compact',
        preferredExternalSite: 'dotabuff',
        autoRefresh: false,
        refreshInterval: 600,
        cacheEnabled: false,
        cacheTTL: 1800,
        sidebarCollapsed: true,
        showAdvancedStats: true,
        showPerformanceGraphs: false,
        showTrends: false,
        notifications: {
          matchUpdates: false,
          teamUpdates: false,
          errorAlerts: false
        },
        debugMode: true,
        mockMode: true
      };

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'dota-scout-assistant-config') {
          return JSON.stringify(storedConfig);
        }
        return null;
      });

      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('ui-density')).toHaveTextContent('compact');
      expect(screen.getByTestId('preferred-site')).toHaveTextContent('dotabuff');
      expect(screen.getByTestId('auto-refresh')).toHaveTextContent('false');
      expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
      expect(screen.getByTestId('debug-mode')).toHaveTextContent('true');
    });

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      // Should fall back to default values
      expectInitialConfigState();
      expectInitialPreferencesState();
      expect(screen.getByTestId('theme')).toBeInTheDocument();
    });
  });

  describe('Config Updates', () => {
    it('should update theme configuration', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-theme-btn');
      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      });
    });

    it('should update preferred external site', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-site-btn');
      await waitFor(() => {
        expect(screen.getByTestId('preferred-site')).toHaveTextContent('dotabuff');
      });
    });

    it('should update sidebar collapsed state', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-sidebar-btn');
      await waitFor(() => {
        expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
      });
    });

    it('should reset configuration to defaults', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      // First update some values
      clickButton('update-theme-btn');
      clickButton('update-site-btn');
      clickButton('update-sidebar-btn');

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('preferred-site')).toHaveTextContent('dotabuff');
        expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
      });

      // Then reset
      clickButton('reset-config-btn');
      await waitFor(() => {
        expectInitialConfigState();
      });
      expect(screen.getByTestId('theme')).toBeInTheDocument();
    });
  });

  describe('Preferences Updates', () => {
    it('should update dashboard preferences', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-dashboard-btn');
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-view')).toHaveTextContent('recent');
      });
    });

    it('should update team management preferences', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-team-management-btn');
      await waitFor(() => {
        expect(screen.getByTestId('team-management-view')).toHaveTextContent('grid');
      });
    });

    it('should reset preferences to defaults', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      // First update some values
      clickButton('update-dashboard-btn');
      clickButton('update-team-management-btn');

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-view')).toHaveTextContent('recent');
        expect(screen.getByTestId('team-management-view')).toHaveTextContent('grid');
      });

      // Then reset
      clickButton('reset-preferences-btn');
      await waitFor(() => {
        expectInitialPreferencesState();
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear errors when requested', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      // Simulate an error by mocking localStorage to throw
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Trigger an update that will cause an error
      clickButton('update-theme-btn');
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('none');
      });

      // Clear the error
      clickButton('clear-errors-btn');
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('should save config changes to localStorage', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-theme-btn');
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'dota-scout-assistant-config',
          expect.stringContaining('"theme":"dark"')
        );
      });
    });

    it('should save preferences changes to localStorage', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();

      clickButton('update-dashboard-btn');
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'dota-scout-assistant-preferences',
          expect.stringContaining('"defaultView":"recent"')
        );
      });
    });
  });
}); 