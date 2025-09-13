'use client';

import React, { useEffect, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { useThemeContext } from '@/frontend/contexts/theme-context';

interface AppLoaderProps {
  children: React.ReactNode;
}

/**
 * AppLoader Component
 * 
 * Prevents rendering of main content until all critical contexts are loaded.
 * Shows a blank screen to prevent layout shift and flash of wrong state.
 */
export const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const { isThemeLoading } = useThemeContext();
  const { isLoading: isConfigLoading } = useConfigContext();

  // Check if all critical contexts are loaded
  useEffect(() => {
    const allLoaded = !isThemeLoading && !isConfigLoading;
    
    if (allLoaded) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isThemeLoading, isConfigLoading]);

  // Show blank screen while loading to prevent layout shift
  if (!isReady) {
    return null;
  }

  return <div data-testid="app-content">{children}</div>;
}; 