import { useCallback, useState } from 'react';

interface VirtualizationConfig {
  enabled: boolean;
  itemHeight: number;
  containerHeight: number;
  overscanCount: number;
}

interface UseVirtualizationOptions {
  defaultEnabled?: boolean;
  defaultItemHeight?: number;
  defaultContainerHeight?: number;
  defaultOverscanCount?: number;
}

export function useVirtualization(options: UseVirtualizationOptions = {}) {
  const {
    defaultEnabled = true,
    defaultItemHeight = 120,
    defaultContainerHeight = 600,
    defaultOverscanCount = 5
  } = options;

  const [config, setConfig] = useState<VirtualizationConfig>({
    enabled: defaultEnabled,
    itemHeight: defaultItemHeight,
    containerHeight: defaultContainerHeight,
    overscanCount: defaultOverscanCount
  });

  const toggleVirtualization = useCallback(() => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const updateItemHeight = useCallback((height: number) => {
    setConfig(prev => ({ ...prev, itemHeight: height }));
  }, []);

  const updateContainerHeight = useCallback((height: number) => {
    setConfig(prev => ({ ...prev, containerHeight: height }));
  }, []);

  const updateOverscanCount = useCallback((count: number) => {
    setConfig(prev => ({ ...prev, overscanCount: count }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({
      enabled: defaultEnabled,
      itemHeight: defaultItemHeight,
      containerHeight: defaultContainerHeight,
      overscanCount: defaultOverscanCount
    });
  }, [defaultEnabled, defaultItemHeight, defaultContainerHeight, defaultOverscanCount]);

  return {
    config,
    toggleVirtualization,
    updateItemHeight,
    updateContainerHeight,
    updateOverscanCount,
    resetConfig
  };
}

// Hook to determine if virtualization should be used based on data size
export function useShouldVirtualize(itemCount: number, threshold: number = 50) {
  return itemCount > threshold;
}

// Hook to calculate optimal item height based on container and item count
export function useOptimalItemHeight(
  containerHeight: number,
  itemCount: number,
  minItemHeight: number = 80,
  maxItemHeight: number = 200
) {
  const calculatedHeight = Math.max(
    minItemHeight,
    Math.min(maxItemHeight, containerHeight / Math.min(itemCount, 10))
  );
  
  return Math.round(calculatedHeight);
} 