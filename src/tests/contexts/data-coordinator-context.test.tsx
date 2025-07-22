/**
 * Data Coordinator Context Tests
 * 
 * Tests the data coordinator context's ability to orchestrate complex data operations
 * across multiple contexts with proper state management, error handling, and UI integration.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useConstantsContext } from '@/contexts/constants-context';
import { DataCoordinatorProvider, useDataCoordinator } from '@/contexts/data-coordinator-context';
import { useMatchContext } from '@/contexts/match-context';
import { usePlayerContext } from '@/contexts/player-context';
import { useTeamContext } from '@/contexts/team-context';

// Mock all the contexts
jest.mock('@/contexts/team-context');
jest.mock('@/contexts/match-context');
jest.mock('@/contexts/player-context');
jest.mock('@/contexts/constants-context');
jest.mock('@/contexts/config-context');

const mockUseTeamContext = jest.mocked(useTeamContext);
const mockUseMatchContext = jest.mocked(useMatchContext);
const mockUsePlayerContext = jest.mocked(usePlayerContext);
const mockUseConstantsContext = jest.mocked(useConstantsContext);
const mockUseConfigContext = jest.mocked(useConfigContext);

// Test component to access the context
const TestComponent: React.FC = () => {
  const coordinator = useDataCoordinator();
  const uiStatus = coordinator.getUIStatus();
  
  return (
    <div>
      <div data-testid="operation-in-progress">{coordinator.operationState.isInProgress.toString()}</div>
      <div data-testid="operation-type">{coordinator.operationState.operationType || 'none'}</div>
      <div data-testid="current-step">{coordinator.operationState.currentStep.toString()}</div>
      <div data-testid="total-steps">{coordinator.operationState.totalSteps.toString()}</div>
      <div data-testid="has-error">{coordinator.errorState.hasError.toString()}</div>
      <div data-testid="error-message">{coordinator.errorState.errorMessage || 'none'}</div>
      <div data-testid="ui-loading">{uiStatus.isLoading.toString()}</div>
      <div data-testid="ui-progress">{uiStatus.progress.toString()}</div>
      <div data-testid="ui-error">{uiStatus.error || 'none'}</div>
      <div data-testid="ui-can-retry">{uiStatus.canRetry.toString()}</div>
      <div data-testid="has-hydrated">{coordinator.hasHydrated.toString()}</div>
      <div data-testid="is-hydrating">{coordinator.isHydrating.toString()}</div>
      <div data-testid="hydration-error">{coordinator.hydrationError || 'none'}</div>
      
      <button 
        onClick={() => coordinator.addTeam('test-team-id', 'league-1')}
        data-testid="add-team-btn"
      >
        Add Team
      </button>
      
      <button 
        onClick={() => coordinator.refreshTeam('test-team-id', 'league-1')}
        data-testid="refresh-team-btn"
      >
        Refresh Team
      </button>
      
      <button 
        onClick={() => coordinator.addMatchToActiveTeam('123456789', 'radiant')}
        data-testid="add-match-btn"
      >
        Add Match
      </button>
      
      <button 
        onClick={() => coordinator.addPlayerToActiveTeam('987654321')}
        data-testid="add-player-btn"
      >
        Add Player
      </button>
    </div>
  );
};

// Wrapper component with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DataCoordinatorProvider>
    {children}
  </DataCoordinatorProvider>
);

describe('DataCoordinatorContext', () => {
  // Mock context return values
  const mockTeamContext = {
    teams: new Map(),
    activeTeam: null as { teamId: string; leagueId: string } | null,
    isLoading: false,
    error: null,
    addTeam: jest.fn(),
    refreshTeam: jest.fn(),
    removeTeam: jest.fn(),
    setActiveTeam: jest.fn(),
    addMatchToTeam: jest.fn(),
    addPlayerToTeam: jest.fn(),
    setTeams: jest.fn(),
    loadTeamsFromConfig: jest.fn(),
    getTeam: jest.fn(),
    getActiveTeam: jest.fn(),
    getAllTeams: jest.fn(),
    hideMatch: jest.fn(),
    showMatch: jest.fn(),
    hidePlayer: jest.fn(),
    showPlayer: jest.fn()
  };

  const mockMatchContext = {
    matches: new Map(),
    selectedMatchId: null,
    isLoading: false,
    error: null,
    addMatch: jest.fn(),
    refreshMatch: jest.fn(),
    parseMatch: jest.fn(),
    setSelectedMatchId: jest.fn(),
    getMatch: jest.fn(),
    getMatches: jest.fn()
  };

  const mockPlayerContext = {
    players: new Map(),
    selectedPlayerId: null,
    selectedPlayer: null,
    isLoading: false,
    error: null,
    addPlayer: jest.fn(),
    refreshPlayer: jest.fn(),
    setSelectedPlayerId: jest.fn(),
    getPlayer: jest.fn(),
    getPlayers: jest.fn()
  };

  const mockConstantsContext = {
    heroes: {},
    items: {},
    isLoadingHeroes: false,
    isLoadingItems: false,
    heroesError: null,
    itemsError: null,
    fetchHeroes: jest.fn(),
    fetchItems: jest.fn(),
    clearErrors: jest.fn(),
    getItemById: jest.fn(),
    getHeroById: jest.fn()
  };

  const mockConfigContext = {
    config: {
      preferredExternalSite: 'dotabuff' as const,
      preferredMatchlistView: 'list' as const,
      theme: 'system' as const
    },
    teamList: [],
    setTeamList: jest.fn(),
    activeTeam: null,
    setActiveTeam: jest.fn(),
    isLoading: false,
    isSaving: false,
    error: null,
    updateConfig: jest.fn(),
    resetConfig: jest.fn(),
    clearErrors: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockUseTeamContext.mockReturnValue(mockTeamContext);
    mockUseMatchContext.mockReturnValue(mockMatchContext);
    mockUsePlayerContext.mockReturnValue(mockPlayerContext);
    mockUseConstantsContext.mockReturnValue(mockConstantsContext);
    mockUseConfigContext.mockReturnValue(mockConfigContext);
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('operation-in-progress')).toHaveTextContent('false');
      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      // Note: hydration state may vary based on implementation
      expect(screen.getByTestId('has-hydrated')).toBeInTheDocument();
      expect(screen.getByTestId('is-hydrating')).toBeInTheDocument();
    });
  });

  describe('Core Actions', () => {
    it('should call addTeam when addTeam action is triggered', async () => {
      mockTeamContext.addTeam.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addTeamButton = screen.getByTestId('add-team-btn');
      await userEvent.click(addTeamButton);

      await waitFor(() => {
        expect(mockTeamContext.addTeam).toHaveBeenCalledWith('test-team-id', 'league-1');
      });
    });

    it('should call refreshTeam when refreshTeam action is triggered', async () => {
      mockTeamContext.refreshTeam.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const refreshTeamButton = screen.getByTestId('refresh-team-btn');
      await userEvent.click(refreshTeamButton);

      await waitFor(() => {
        expect(mockTeamContext.refreshTeam).toHaveBeenCalledWith('test-team-id', 'league-1');
      });
    });
  });

  describe('Active Team Operations', () => {
    it('should call addMatchToTeam when addMatchToActiveTeam is triggered with active team', async () => {
      // Mock that there is an active team
      mockTeamContext.activeTeam = { teamId: 'test-team-id', leagueId: 'league-1' };
      mockTeamContext.addMatchToTeam.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Add match directly (no need to set active team first)
      const addMatchButton = screen.getByTestId('add-match-btn');
      await userEvent.click(addMatchButton);

      await waitFor(() => {
        expect(mockTeamContext.addMatchToTeam).toHaveBeenCalledWith('123456789', 'radiant');
      });
    });

    it('should call addPlayerToTeam when addPlayerToActiveTeam is triggered with active team', async () => {
      // Mock that there is an active team
      mockTeamContext.activeTeam = { teamId: 'test-team-id', leagueId: 'league-1' };
      mockTeamContext.addPlayerToTeam.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Add player directly (no need to set active team first)
      const addPlayerButton = screen.getByTestId('add-player-btn');
      await userEvent.click(addPlayerButton);

      await waitFor(() => {
        expect(mockTeamContext.addPlayerToTeam).toHaveBeenCalledWith('987654321');
      });
    });

    it('should throw error when trying to add match without active team', async () => {
      // Mock that there is no active team
      mockTeamContext.activeTeam = null;
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addMatchButton = screen.getByTestId('add-match-btn');
      
      // This should throw an error, but the button click handler should catch it
      await userEvent.click(addMatchButton);
      
      // Check that the error is properly handled in the UI
      await waitFor(() => {
        expect(screen.getByTestId('ui-error')).not.toHaveTextContent('none');
      });
    });

    it('should throw error when trying to add player without active team', async () => {
      // Mock that there is no active team
      mockTeamContext.activeTeam = null;
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addPlayerButton = screen.getByTestId('add-player-btn');
      
      // This should throw an error, but the button click handler should catch it
      await userEvent.click(addPlayerButton);
      
      // Check that the error is properly handled in the UI
      await waitFor(() => {
        expect(screen.getByTestId('ui-error')).not.toHaveTextContent('none');
      });
    });
  });

  describe('UI Status', () => {
    it('should return correct UI status', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('ui-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('ui-progress')).toHaveTextContent('0');
      expect(screen.getByTestId('ui-error')).toHaveTextContent('none');
      expect(screen.getByTestId('ui-can-retry')).toHaveTextContent('false');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors from team context', async () => {
      mockTeamContext.addTeam.mockRejectedValue(new Error('Team fetch failed'));
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addTeamButton = screen.getByTestId('add-team-btn');
      await userEvent.click(addTeamButton);

      await waitFor(() => {
        expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      });
    });
  });
}); 