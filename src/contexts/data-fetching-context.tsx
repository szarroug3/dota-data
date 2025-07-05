"use client";

import * as React from 'react';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { 
  DataFetchingContextType, 
  FetchingState, 
  FetchTrackerReturn 
} from '../types/contexts';

// ============================================================================
// CONTEXT
// ============================================================================

const DataFetchingContext = createContext<DataFetchingContextType | undefined>(undefined);

export function DataFetchingProvider({ children }: { children: ReactNode }) {
  const [fetchingStates, setFetchingStates] = useState<FetchingState>({});

  const startFetch = useCallback((key: string): void => {
    setFetchingStates((prev: FetchingState) => ({
      ...prev,
      [key]: {
        isLoading: true,
        startTime: Date.now(),
      }
    }));
  }, []);

  const completeFetch = useCallback((key: string, error?: string): void => {
    setFetchingStates((prev: FetchingState) => {
      const newState = { ...prev };
      if (newState[key]) {
        newState[key] = {
          ...newState[key],
          isLoading: false,
          error,
        };
      }
      return newState;
    });
  }, []);

  const isFetching = useCallback((key: string): boolean => {
    return fetchingStates[key]?.isLoading || false;
  }, [fetchingStates]);

  const getFetchingKeys = useCallback((): string[] => {
    return Object.keys(fetchingStates).filter(key => fetchingStates[key].isLoading);
  }, [fetchingStates]);

  const clearFetch = useCallback((key: string): void => {
    setFetchingStates((prev: FetchingState) => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const clearAllFetches = useCallback((): void => {
    setFetchingStates({});
  }, []);

  const value: DataFetchingContextType = {
    fetchingStates,
    startFetch,
    completeFetch,
    isFetching,
    getFetchingKeys,
    clearFetch,
    clearAllFetches,
  };

  return (
    <DataFetchingContext.Provider value={value}>
      {children}
    </DataFetchingContext.Provider>
  );
}

export function useDataFetching() {
  const context = useContext(DataFetchingContext);
  if (context === undefined) {
    throw new Error('useDataFetching must be used within a DataFetchingProvider');
  }
  return context;
}

// Hook for tracking specific fetch operations
export function useFetchTracker(key: string): FetchTrackerReturn {
  const { startFetch, completeFetch, isFetching } = useDataFetching();
  
  const trackFetch = useCallback(async <T,>(
    fetchPromise: Promise<T>
  ): Promise<T> => {
    startFetch(key);
    try {
      const result = await fetchPromise;
      completeFetch(key);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      completeFetch(key, errorMessage);
      throw error;
    }
  }, [key, startFetch, completeFetch]);

  return {
    isLoading: isFetching(key),
    trackFetch,
  };
} 