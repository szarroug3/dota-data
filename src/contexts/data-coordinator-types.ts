/**
 * Data Coordinator Types
 * 
 * Centralized type definitions for the data coordinator context and workflows.
 * Eliminates duplication between data-coordinator-context.tsx and data-coordinator-workflows.tsx.
 */

export type OperationType = 'team-addition' | 'match-analysis' | 'player-aggregation' | 'hero-analysis';

export interface OperationState {
  isInProgress: boolean;
  currentStep: number;
  totalSteps: number;
  operationType: OperationType | null;
  progress: {
    teamFetch: boolean;
    matchFetch: boolean;
    playerFetch: boolean;
    heroFetch: boolean;
    dataTransformation: boolean;
  };
}

export interface ErrorState {
  hasError: boolean;
  errorMessage: string | null;
  errorContext: string | null;
  retryCount: number;
  maxRetries: number;
}

export interface UIStatus {
  isLoading: boolean;
  operationInProgress: boolean;
  currentOperation: OperationType | null;
  progress: number; // 0-100
  error: string | null;
  canRetry: boolean;
}

export type UserAction =
  | { type: 'add-team'; teamId: string; leagueId: string }
  | { type: 'analyze-matches'; teamId: string; leagueId: string }
  | { type: 'aggregate-players'; teamId: string; leagueId: string }
  | { type: 'clear-all' }
  | { type: 'retry-operation' };

export interface DataCoordinatorContextValue {
  // State
  activeTeam: { teamId: string; leagueId: string } | null;
  operationState: OperationState;
  errorState: ErrorState;
  
  // Actions
  selectTeam: (teamId: string, leagueId: string) => Promise<void>;
  addTeamWithFullData: (teamId: string, leagueId: string) => Promise<void>;
  refreshTeamWithFullData: (teamId: string, leagueId: string) => Promise<void>;
  analyzeMatchesForTeam: (teamId: string, leagueId: string) => Promise<void>;
  aggregatePlayersForTeam: (teamId: string) => Promise<void>;
  fetchMatchesForTeam: (teamId: string, leagueId: string) => Promise<void>;
  
  // Cross-context coordination
  synchronizeContexts: () => Promise<void>;
  clearAllContexts: () => void;
  refreshAllData: () => Promise<void>;
  
  // Error handling
  handleContextError: (error: Error, context: string) => void;
  retryOperation: () => Promise<void>;
  clearAllErrors: () => void;
  
  // UI integration
  getUIStatus: () => UIStatus;
  handleUserAction: (action: UserAction) => Promise<void>;
  
  // Context coordination
  coordinateTeamContext: () => void;
  coordinateMatchContext: () => void;
  coordinatePlayerContext: () => void;
  coordinateHeroContext: () => void;
}

export interface DataCoordinatorProviderProps {
  children: React.ReactNode;
} 