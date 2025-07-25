/**
 * Generic error handling utilities
 * 
 * Provides reusable error handling functions for contexts and components.
 * Eliminates code duplication across different data types.
 * 
 * Works with objects that have optional `error` and `isLoading` fields.
 */

import type { Dispatch, SetStateAction } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DataWithError {
  error?: string | null;
  isLoading?: boolean;
}

// ============================================================================
// MAP-BASED ERROR UPDATE FUNCTIONS
// ============================================================================

/**
 * Update error state for a specific item in a Map
 */
export function updateMapItemError<K, T extends DataWithError>(
  setMap: Dispatch<SetStateAction<Map<K, T>>>,
  key: K,
  errorMessage: string
): void {
  setMap(prev => {
    const newMap = new Map(prev);
    const currentItem = newMap.get(key);
    if (currentItem) {
      newMap.set(key, { ...currentItem, error: errorMessage, isLoading: false });
    }
    return newMap;
  });
}

/**
 * Clear error for a specific item in a Map
 */
export function clearMapItemError<K, T extends DataWithError>(
  setMap: Dispatch<SetStateAction<Map<K, T>>>,
  key: K
): void {
  setMap(prev => {
    const newMap = new Map(prev);
    const currentItem = newMap.get(key);
    if (currentItem) {
      newMap.set(key, { ...currentItem, error: null });
    }
    return newMap;
  });
}

// ============================================================================
// ERROR UPDATE FUNCTIONS
// ============================================================================

/**
 * Update error state for a single item with error/isLoading fields
 */
export function updateErrorState<T extends DataWithError>(
  errorMessage: string,
  setData: Dispatch<SetStateAction<T>>
): void {
  setData(prev => ({
    ...prev,
    error: errorMessage,
    isLoading: false
  }));
}

/**
 * Clear error for a single item with error/isLoading fields
 */
export function clearErrorState<T extends DataWithError>(
  setData: Dispatch<SetStateAction<T>>
): void {
  setData(prev => ({
    ...prev,
    error: null
  }));
}

// ============================================================================
// ERROR CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if an item has an error
 */
export function hasError<T extends DataWithError>(
  item: T
): boolean {
  return item.error !== null && item.error !== undefined;
}

/**
 * Get error message for a specific item in a Map
 */
export function getMapItemError<K, T extends DataWithError>(
  map: Map<K, T>,
  key: K
): string | null {
  const item = map.get(key);
  return item ? item.error || null : null;
}

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Handle operation errors with proper error vs abort distinction
 */
export function handleOperationError(
  error: Error | string | object,
  abortController: AbortController,
  errorMessage: string = 'Operation failed'
): string | null {
  // Only handle actual errors, not aborts
  if (!abortController.signal.aborted) {
    return error instanceof Error ? error.message : errorMessage;
  }
  return null;
}

/**
 * Create error message from various error types
 */
export function createErrorMessage(
  error: Error | string | object,
  defaultMessage: string = 'An error occurred'
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
} 