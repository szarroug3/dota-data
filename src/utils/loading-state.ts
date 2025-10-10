/**
 * Generic loading state utilities
 *
 * Provides reusable loading state management functions for contexts and components.
 * Eliminates code duplication across different data types.
 *
 * Works with objects that have optional `isLoading` field.
 */

import type { Dispatch, SetStateAction } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DataWithLoading {
  isLoading?: boolean;
}

// ============================================================================
// MAP-BASED LOADING STATE FUNCTIONS
// ============================================================================

/**
 * Set loading state to true for a specific item in a Map
 */
export function setMapItemLoading<K, T extends DataWithLoading>(
  setMap: Dispatch<SetStateAction<Map<K, T>>>,
  key: K,
): void {
  setMap((prev) => {
    const newMap = new Map(prev);
    const currentItem = newMap.get(key);
    if (currentItem) {
      newMap.set(key, { ...currentItem, isLoading: true });
    }
    return newMap;
  });
}

/**
 * Clear loading state (set to false) for a specific item in a Map
 */
export function clearMapItemLoading<K, T extends DataWithLoading>(
  setMap: Dispatch<SetStateAction<Map<K, T>>>,
  key: K,
): void {
  setMap((prev) => {
    const newMap = new Map(prev);
    const currentItem = newMap.get(key);
    if (currentItem) {
      newMap.set(key, { ...currentItem, isLoading: false });
    }
    return newMap;
  });
}

// ============================================================================
// LOADING STATE FUNCTIONS
// ============================================================================

/**
 * Set loading state to true for an object with isLoading field
 */
export function setLoading<T extends DataWithLoading>(setData: Dispatch<SetStateAction<T>>): void {
  setData((prev) => ({
    ...prev,
    isLoading: true,
  }));
}

/**
 * Clear loading state (set to false) for an object with isLoading field
 */
export function clearLoading<T extends DataWithLoading>(setData: Dispatch<SetStateAction<T>>): void {
  setData((prev) => ({
    ...prev,
    isLoading: false,
  }));
}

// ============================================================================
// LOADING STATE CHECKING FUNCTIONS
// ============================================================================

/**
 * Run an async operation while automatically toggling a specific Map item's loading state
 * to true before the operation and false after it completes (or errors).
 */
export async function withMapItemLoading<K, T extends DataWithLoading>(
  setMap: Dispatch<SetStateAction<Map<K, T>>>,
  key: K,
  operation: () => Promise<void> | void,
): Promise<void> {
  setMapItemLoading(setMap, key);
  try {
    await operation();
  } finally {
    clearMapItemLoading(setMap, key);
  }
}

/**
 * Check if an item is loading
 */
export function isLoading<T extends DataWithLoading>(item: T): boolean {
  return item.isLoading === true;
}

/**
 * Check if any item in a Map is loading
 */
export function isAnyMapItemLoading<K, T extends DataWithLoading>(map: Map<K, T>): boolean {
  return Array.from(map.values()).some((item) => item.isLoading === true);
}

/**
 * Check if a specific item in a Map is loading
 */
export function isMapItemLoading<K, T extends DataWithLoading>(map: Map<K, T>, key: K): boolean {
  const item = map.get(key);
  return item ? item.isLoading === true : false;
}
