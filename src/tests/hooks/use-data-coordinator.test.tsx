import { renderHook } from '@testing-library/react';

import { useDataCoordinator } from '@/hooks/use-data-coordinator';

// Mock the data coordinator context to avoid complex provider setup
jest.mock('@/contexts/data-coordinator-context', () => ({
  useDataCoordinator: () => ({
    // State
    activeTeam: null,
    operationState: {
      isInProgress: false,
      currentStep: 0,
      totalSteps: 0,
      operationType: null,
      progress: {
        teamFetch: false,
        matchFetch: false,
        playerFetch: false,
        heroFetch: false,
        dataTransformation: false
      }
    },
    errorState: {
      hasError: false,
      errorMessage: null,
      errorContext: null,
      retryCount: 0,
      maxRetries: 3
    },
    
    // Actions
    selectTeam: jest.fn(),
    addTeamWithFullData: jest.fn(),
    analyzeMatchesForTeam: jest.fn(),
    aggregatePlayersForTeam: jest.fn(),
    
    // Cross-context coordination
    synchronizeContexts: jest.fn(),
    clearAllContexts: jest.fn(),
    refreshAllData: jest.fn(),
    
    // Error handling
    handleContextError: jest.fn(),
    retryOperation: jest.fn(),
    clearAllErrors: jest.fn(),
    
    // UI integration
    getUIStatus: jest.fn(() => ({
      isLoading: false,
      operationInProgress: false,
      currentOperation: null,
      progress: 0,
      error: null,
      canRetry: false
    })),
    handleUserAction: jest.fn(),
    
    // Context coordination
    coordinateTeamContext: jest.fn(),
    coordinateMatchContext: jest.fn(),
    coordinatePlayerContext: jest.fn(),
    coordinateHeroContext: jest.fn()
  })
}));

describe('useDataCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the expected API shape and actions', async () => {
    const { result } = renderHook(() => useDataCoordinator());
    const api = result.current;

    // Check for key properties
    expect(api).toHaveProperty('operationState');
    expect(api).toHaveProperty('errorState');
    expect(api).toHaveProperty('addTeamWithFullData');
    expect(api).toHaveProperty('clearAllContexts');
    expect(api).toHaveProperty('clearAllErrors');
    expect(api).toHaveProperty('handleUserAction');
    expect(api).toHaveProperty('uiStatus');

    // Check that actions are functions
    expect(typeof api.addTeamWithFullData).toBe('function');
    expect(typeof api.clearAllContexts).toBe('function');
    expect(typeof api.clearAllErrors).toBe('function');
    expect(typeof api.handleUserAction).toBe('function');

    // Check that state objects have expected structure
    expect(api.operationState).toHaveProperty('isInProgress');
    expect(api.operationState).toHaveProperty('currentStep');
    expect(api.operationState).toHaveProperty('totalSteps');
    expect(api.operationState).toHaveProperty('operationType');
    expect(api.operationState).toHaveProperty('progress');

    expect(api.errorState).toHaveProperty('hasError');
    expect(api.errorState).toHaveProperty('errorMessage');
    expect(api.errorState).toHaveProperty('retryCount');
    expect(api.errorState).toHaveProperty('maxRetries');

    // Check UI status
    expect(api.uiStatus).toHaveProperty('isLoading');
    expect(api.uiStatus).toHaveProperty('operationInProgress');
    expect(api.uiStatus).toHaveProperty('currentOperation');
    expect(api.uiStatus).toHaveProperty('progress');
    expect(api.uiStatus).toHaveProperty('error');
    expect(api.uiStatus).toHaveProperty('canRetry');
  });
}); 