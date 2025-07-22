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
  | { type: 'aggregate-players'; teamId: string; leagueId: string };

export interface DataCoordinatorContextValue {
  // State
  operationState: OperationState;
  errorState: ErrorState;
  
  // Hydration state
  hasHydrated: boolean;
  isHydrating: boolean;
  hydrationError: string | null;
  
  // Core actions
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  refreshTeam: (teamId: string, leagueId: string) => Promise<void>;
  refreshMatch: (matchId: string) => Promise<void>;
  parseMatch: (matchId: string) => Promise<void>;
  
  // Active team operations
  addMatchToActiveTeam: (matchId: string, teamSide: 'radiant' | 'dire') => Promise<void>;
  addPlayerToActiveTeam: (playerId: string) => Promise<void>;
  
  // Visibility controls
  hideMatch: (teamId: string, leagueId: string, matchId: string) => void;
  showMatch: (teamId: string, leagueId: string, matchId: string) => void;
  hidePlayer: (teamId: string, leagueId: string, playerId: string) => void;
  showPlayer: (teamId: string, leagueId: string, playerId: string) => void;
  
  // UI integration
  getUIStatus: () => UIStatus;
  handleUserAction: (action: UserAction) => Promise<void>;
}

export interface DataCoordinatorProviderProps {
  children: React.ReactNode;
} 