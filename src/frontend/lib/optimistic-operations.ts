'use client';

// Generic optimistic operations helper for managing add/remove/refresh operations with optimistic updates

import { useCallback } from 'react';

import { useAbortController, type AbortControllerManager } from '@/hooks/use-abort-controller';
import { handleOperationError } from '@/utils/error-handling';

// ============================================================================
// TYPES
// ============================================================================

export interface OptimisticOperationState<T> {
  items: Map<number, T>;
  setItems: React.Dispatch<React.SetStateAction<Map<number, T>>>;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export interface OptimisticOperationConfig<T, TData> {
  createInitialData: (id: number) => T;
  processData: (data: TData) => T;
  fetchData: (id: number, force: boolean) => Promise<TData | { error: string }>;
  createOperationKey: (id: number) => string;
  abortOperations: (abortController: AbortControllerManager, id: number) => void;
  hasDataChanged?: (existing: T, processed: T) => boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create and add optimistic item to state
 */
function createAndAddOptimisticItem<T>(
  id: number,
  state: OptimisticOperationState<T>,
  createInitialData: (id: number) => T,
): T {
  const optimisticItem = createInitialData(id);

  state.setItems((prev) => {
    const newItems = new Map(prev);
    newItems.set(id, optimisticItem);
    return newItems;
  });

  return optimisticItem;
}

/**
 * Update state with processed item data
 */
function updateStateWithProcessedItem<T>(
  id: number,
  processedItem: T,
  state: OptimisticOperationState<T>,
  hasDataChanged?: (existing: T, processed: T) => boolean,
): void {
  state.setItems((prev) => {
    // Only update if the item data has actually changed
    const existingItem = prev.get(id);
    if (existingItem && hasDataChanged) {
      if (!hasDataChanged(existingItem, processedItem)) {
        return prev;
      }
    }

    const newItems = new Map(prev);
    newItems.set(id, processedItem);
    return newItems;
  });
}

/**
 * Fetch and process item data
 */
async function fetchAndProcessItem<T, TData>(
  id: number,
  force: boolean,
  abortController: AbortController,
  optimisticItem: T,
  config: OptimisticOperationConfig<T, TData>,
  state: OptimisticOperationState<T>,
): Promise<T | null> {
  // Fetch item data with force parameter
  const itemData = await config.fetchData(id, force);

  // Check if operation was aborted during fetch
  if (abortController.signal.aborted) {
    return optimisticItem;
  }

  if (itemData && typeof itemData === 'object' && 'error' in itemData) {
    // Handle gracefully without throwing console errors
    console.warn('Item data fetch warning:', (itemData as { error: string }).error);
    // For now, we'll just log the error since our generic types don't guarantee DataWithError
    console.error(`Failed to fetch item ${id}:`, (itemData as { error: string }).error);
    return null;
  }

  // Process item data
  const processedItem = config.processData(itemData);

  // Update state with fetched data
  updateStateWithProcessedItem(id, processedItem, state, config.hasDataChanged);

  return processedItem;
}

/**
 * Handle item operation with proper error handling
 */
async function handleItemOperation<T, TData>(
  id: number,
  force: boolean,
  operationKey: string,
  abortController: AbortControllerManager,
  config: OptimisticOperationConfig<T, TData>,
  state: OptimisticOperationState<T>,
): Promise<T | null> {
  // Check if item already exists (skip if exists and not forcing)
  if (!force && state.items.has(id)) {
    return state.items.get(id) || null;
  }

  // Check if there's already an ongoing operation for this item
  if (abortController.hasOngoingOperation(operationKey)) {
    return state.items.get(id) || null;
  }

  // Get abort controller for this operation
  const controller = abortController.getAbortController(operationKey);

  try {
    state.setIsLoading(true);

    // Create optimistic item data and add to state
    const optimisticItem = createAndAddOptimisticItem(id, state, config.createInitialData);

    // Check if operation was aborted
    if (controller.signal.aborted) {
      return optimisticItem;
    }

    // Fetch and process item data
    return await fetchAndProcessItem(id, force, controller, optimisticItem, config, state);
  } catch (err) {
    // Handle gracefully without emitting console errors
    console.warn('Item operation warning:', err);
    const errorMessage = handleOperationError(err as Error | string | object, controller, 'Failed to process item');
    if (errorMessage) {
      // For now, we'll just log the error since our generic types don't guarantee DataWithError
      console.error(`Failed to process item ${id}:`, errorMessage);
    }
    return state.items.get(id) || null;
  } finally {
    state.setIsLoading(false);
    // Clean up abort controller
    abortController.cleanupAbortController(operationKey);
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Generic optimistic operations hook
 */
export function useOptimisticOperations<T, TData>(
  state: OptimisticOperationState<T>,
  config: OptimisticOperationConfig<T, TData>,
) {
  const abortController = useAbortController();

  // Consolidated item operation with force parameter
  const processItem = useCallback(
    async (id: number, force = false): Promise<T | null> => {
      const operationKey = config.createOperationKey(id);
      return await handleItemOperation(id, force, operationKey, abortController, config, state);
    },
    [state, config, abortController],
  );

  // Add item (force = false)
  const addItem = useCallback(
    async (id: number): Promise<T | null> => {
      return await processItem(id, false);
    },
    [processItem],
  );

  // Refresh item (force = true)
  const refreshItem = useCallback(
    async (id: number): Promise<T | null> => {
      return await processItem(id, true);
    },
    [processItem],
  );

  // Remove item
  const removeItem = useCallback(
    (id: number) => {
      // ABORT ONGOING OPERATIONS: Abort any ongoing operations for this item
      config.abortOperations(abortController, id);

      state.setItems((prev) => {
        const newItems = new Map(prev);
        newItems.delete(id);
        return newItems;
      });

      // Clear selected item if it was the removed item
      if (state.selectedId === id) {
        state.setSelectedId(null);
      }
    },
    [state, abortController, config],
  );

  return {
    addItem,
    refreshItem,
    removeItem,
  };
}
