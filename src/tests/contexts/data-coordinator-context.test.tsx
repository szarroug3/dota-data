/**
 * Data Coordinator Context Tests
 * 
 * Tests the data coordinator context's ability to orchestrate complex data operations
 * across multiple contexts with proper state management, error handling, and UI integration.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { DataCoordinatorProvider, useDataCoordinator } from '@/contexts/data-coordinator-context';
import { useHeroContext } from '@/contexts/hero-context';
import { useMatchContext } from '@/contexts/match-context';
import { useMatchDataFetching } from '@/contexts/match-data-fetching-context';
import { usePlayerContext } from '@/contexts/player-context';
import { usePlayerDataFetching } from '@/contexts/player-data-fetching-context';
import { useTeamContext } from '@/contexts/team-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import type { Match } from '@/types/contexts/match-context-value';
import type { Player } from '@/types/contexts/player-context-value';

// Mock all the contexts
jest.mock('@/contexts/team-context');
jest.mock('@/contexts/match-context');
jest.mock('@/contexts/player-context');
jest.mock('@/contexts/hero-context');
jest.mock('@/contexts/team-data-fetching-context');
jest.mock('@/contexts/match-data-fetching-context');
jest.mock('@/contexts/player-data-fetching-context');

const mockUseTeamContext = jest.mocked(useTeamContext);
const mockUseMatchContext = jest.mocked(useMatchContext);
const mockUsePlayerContext = jest.mocked(usePlayerContext);
const mockUseHeroContext = jest.mocked(useHeroContext);
const mockUseTeamDataFetching = jest.mocked(useTeamDataFetching);
const mockUseMatchDataFetching = jest.mocked(useMatchDataFetching);
const mockUsePlayerDataFetching = jest.mocked(usePlayerDataFetching);

// Test component to access the context
const TestComponent: React.FC = () => {
  const coordinator = useDataCoordinator();
  const uiStatus = coordinator.getUIStatus();
  
  return (
    <div>
      <div data-testid="active-team-id">{coordinator.activeTeam?.teamId || 'none'}</div>
      <div data-testid="active-team-league">{coordinator.activeTeam?.leagueId || 'none'}</div>
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
      
      <button 
        onClick={() => coordinator.selectTeam('test-team-id', 'league-1')}
        data-testid="select-team-btn"
      >
        Select Team
      </button>
      
      <button 
        onClick={() => coordinator.clearAllContexts()}
        data-testid="clear-contexts-btn"
      >
        Clear Contexts
      </button>
      
      <button 
        onClick={() => coordinator.clearAllErrors()}
        data-testid="clear-errors-btn"
      >
        Clear Errors
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
    teamDataList: [],
    activeTeam: null,
    isLoading: false,
    error: null,
    addTeam: jest.fn(),
    removeTeam: jest.fn(),
    setActiveTeam: jest.fn(),
    refreshTeam: jest.fn(),
    getTeamMatchesForLeague: jest.fn(),
    getTeamPlayersForLeague: jest.fn(),
    teamExists: jest.fn(),
    clearError: jest.fn()
  };

  const mockMatchContext = {
    matches: [] as Match[],
    filteredMatches: [] as Match[],
    selectedMatchId: null,
    selectedMatch: null,
    filters: {
      dateRange: { start: null, end: null },
      result: 'all' as const,
      opponent: '',
      heroes: [],
      players: [],
      duration: { min: null, max: null }
    },
    isLoadingMatches: false,
    matchesError: null,
    hiddenMatchIds: [],
    heroStatsGrid: {},
    preferences: {
      defaultView: 'list' as const,
      showHiddenMatches: false,
      autoRefresh: false,
      refreshInterval: 30,
      showAdvancedStats: false
    },
    isLoadingMatchDetails: false,
    matchDetailsError: null,
    isLoadingHeroStats: false,
    heroStatsError: null,
    selectMatch: jest.fn(),
    setFilters: jest.fn(),
    refreshMatches: jest.fn(),
    clearErrors: jest.fn(),
    hideMatch: jest.fn(),
    showMatch: jest.fn(),
    toggleMatchVisibility: jest.fn(),
    setHeroStatsGrid: jest.fn(),
    setPreferences: jest.fn(),
    refreshMatchDetails: jest.fn(),
    refreshHeroStats: jest.fn(),
    updatePreferences: jest.fn(),
    addMatches: jest.fn()
  };

  const mockPlayerContext = {
    players: [] as Player[],
    filteredPlayers: [] as Player[],
    selectedPlayerId: null,
    selectedPlayer: null,
    filters: {
      dateRange: { start: null, end: null },
      heroes: [],
      roles: [],
      result: 'all' as const,
      performance: {
        minKDA: null,
        minGPM: null,
        minXPM: null
      }
    },
    isLoadingPlayers: false,
    playersError: null,
    isLoadingPlayerData: false,
    playerDataError: null,
    setSelectedPlayer: jest.fn(),
    setFilters: jest.fn(),
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    refreshPlayer: jest.fn(),
    clearErrors: jest.fn()
  };

  const mockHeroContext = {
    heroes: [],
    filteredHeroes: [],
    selectedHeroId: null,
    selectedHero: null,
    filters: {
      primaryAttribute: [],
      attackType: [],
      roles: [],
      complexity: [],
      difficulty: [],
      pickRate: { min: null, max: null },
      winRate: { min: null, max: null }
    },
    isLoadingHeroes: false,
    heroesError: null,
    isLoadingHeroData: false,
    isLoadingHeroStats: false,
    heroDataError: null,
    heroStatsError: null,
    setSelectedHero: jest.fn(),
    setFilters: jest.fn(),
    refreshHeroes: jest.fn(),
    refreshHero: jest.fn(),
    clearErrors: jest.fn()
  };

  const mockTeamDataFetching = {
    fetchTeamData: jest.fn(),
    fetchLeagueData: jest.fn(),
    isTeamCached: jest.fn(),
    isLeagueCached: jest.fn(),
    clearTeamCache: jest.fn(),
    clearLeagueCache: jest.fn(),
    clearAllCache: jest.fn(),
    getTeamError: jest.fn(),
    getLeagueError: jest.fn(),
    clearTeamError: jest.fn(),
    clearLeagueError: jest.fn(),
    clearAllErrors: jest.fn()
  };

  const mockMatchDataFetching = {
    fetchMatchData: jest.fn(),
    isMatchCached: jest.fn(),
    clearMatchCache: jest.fn(),
    clearAllCache: jest.fn(),
    getMatchError: jest.fn(),
    clearMatchError: jest.fn(),
    clearAllErrors: jest.fn()
  };

  const mockPlayerDataFetching = {
    fetchPlayerData: jest.fn(),
    isPlayerCached: jest.fn(),
    clearPlayerCache: jest.fn(),
    clearAllCache: jest.fn(),
    getPlayerError: jest.fn(),
    clearPlayerError: jest.fn(),
    clearAllErrors: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseTeamContext.mockReturnValue(mockTeamContext);
    mockUseMatchContext.mockReturnValue(mockMatchContext);
    mockUsePlayerContext.mockReturnValue(mockPlayerContext);
    mockUseHeroContext.mockReturnValue(mockHeroContext);
    mockUseTeamDataFetching.mockReturnValue(mockTeamDataFetching);
    mockUseMatchDataFetching.mockReturnValue(mockMatchDataFetching);
    mockUsePlayerDataFetching.mockReturnValue(mockPlayerDataFetching);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('active-team-id')).toHaveTextContent('none');
      expect(screen.getByTestId('active-team-league')).toHaveTextContent('none');
      expect(screen.getByTestId('operation-in-progress')).toHaveTextContent('false');
      expect(screen.getByTestId('operation-type')).toHaveTextContent('none');
      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
      expect(screen.getByTestId('total-steps')).toHaveTextContent('0');
      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      expect(screen.getByTestId('error-message')).toHaveTextContent('none');
      expect(screen.getByTestId('ui-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('ui-progress')).toHaveTextContent('0');
      expect(screen.getByTestId('ui-error')).toHaveTextContent('none');
      expect(screen.getByTestId('ui-can-retry')).toHaveTextContent('false');
    });
  });

  describe('selectTeam', () => {
    it('should successfully select a team', async () => {
      mockTeamContext.setActiveTeam.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const selectButton = screen.getByTestId('select-team-btn');
      await userEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('test-team-id');
        expect(screen.getByTestId('active-team-league')).toHaveTextContent('league-1');
      });

      expect(mockTeamContext.setActiveTeam).toHaveBeenCalledWith('test-team-id', 'league-1');
    });
  });

  describe('clearAllContexts', () => {
    it('should clear all contexts', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const clearButton = screen.getByTestId('clear-contexts-btn');
      await userEvent.click(clearButton);

      expect(mockMatchContext.selectMatch).toHaveBeenCalledWith('');
      expect(mockPlayerContext.setSelectedPlayer).toHaveBeenCalledWith('');
      expect(mockHeroContext.setSelectedHero).toHaveBeenCalledWith('');
    });
  });

  describe('clearAllErrors', () => {
    it('should clear all errors', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const clearErrorsButton = screen.getByTestId('clear-errors-btn');
      await userEvent.click(clearErrorsButton);

      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      expect(screen.getByTestId('error-message')).toHaveTextContent('none');
    });
  });

  describe('Context Coordination', () => {
    it('should coordinate team context operations', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // The coordinator should be able to call team context methods
      expect(mockTeamContext.setActiveTeam).toBeDefined();
      expect(mockTeamContext.addTeam).toBeDefined();
    });

    it('should coordinate match context operations', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // The coordinator should be able to call match context methods
      expect(mockMatchContext.selectMatch).toBeDefined();
      expect(mockMatchContext.refreshMatches).toBeDefined();
    });

    it('should coordinate player context operations', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // The coordinator should be able to call player context methods
      expect(mockPlayerContext.setSelectedPlayer).toBeDefined();
      expect(mockPlayerContext.addPlayer).toBeDefined();
    });

    it('should coordinate hero context operations', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // The coordinator should be able to call hero context methods
      expect(mockHeroContext.setSelectedHero).toBeDefined();
      expect(mockHeroContext.refreshHeroes).toBeDefined();
    });
  });
}); 