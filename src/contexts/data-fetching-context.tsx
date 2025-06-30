"use client";

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface FetchingState {
  [key: string]: {
    isLoading: boolean;
    startTime: number;
    error?: string;
  };
}

interface DataFetchingContextType {
  // Track fetching states
  fetchingStates: FetchingState;
  
  // Start a fetch operation
  startFetch: (key: string) => void;
  
  // Complete a fetch operation
  completeFetch: (key: string, error?: string) => void;
  
  // Check if something is currently fetching
  isFetching: (key: string) => boolean;
  
  // Get all currently fetching keys
  getFetchingKeys: () => string[];
  
  // Clear a specific fetch state
  clearFetch: (key: string) => void;
  
  // Clear all fetch states
  clearAllFetches: () => void;
}

const DataFetchingContext = createContext<DataFetchingContextType | undefined>(undefined);

export function DataFetchingProvider({ children }: { children: ReactNode }) {
  const [fetchingStates, setFetchingStates] = useState<FetchingState>({});

  const startFetch = useCallback((key: string) => {
    setFetchingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: true,
        startTime: Date.now(),
      }
    }));
  }, []);

  const completeFetch = useCallback((key: string, error?: string) => {
    setFetchingStates(prev => {
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

  const isFetching = useCallback((key: string) => {
    return fetchingStates[key]?.isLoading || false;
  }, [fetchingStates]);

  const getFetchingKeys = useCallback(() => {
    return Object.keys(fetchingStates).filter(key => fetchingStates[key].isLoading);
  }, [fetchingStates]);

  const clearFetch = useCallback((key: string) => {
    setFetchingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const clearAllFetches = useCallback(() => {
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
export function useFetchTracker(key: string) {
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
      completeFetch(key, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [key, startFetch, completeFetch]);

  return {
    isLoading: isFetching(key),
    trackFetch,
  };
} 