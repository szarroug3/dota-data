/**
 * Theme Context Provider
 *
 * Centralized theme management that integrates with next-themes.
 * Provides a single source of truth for theme state across the entire application.
 */

import { useTheme } from 'next-themes';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  // Theme state
  theme: Theme;
  resolvedTheme: 'light' | 'dark' | null;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // Loading states
  isThemeLoading: boolean;
  isTransitioning: boolean;
}

export interface ThemeContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// THEME CONTEXT PROVIDER
// ============================================================================

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle loading state
  useEffect(() => {
    if (resolvedTheme !== undefined) {
      setIsThemeLoading(false);
    }
  }, [resolvedTheme]);

  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    setIsTransitioning(true);
    
    if (theme === 'system') {
      // If system theme is active, switch to the opposite of current resolved theme
      const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    } else {
      // If specific theme is active, switch to the opposite
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    }
    
    // Reset transition state after a brief delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [theme, resolvedTheme, setTheme]);

  // Enhanced setTheme with transition state
  const handleSetTheme = useCallback((newTheme: Theme) => {
    setIsTransitioning(true);
    setTheme(newTheme);
    
    // Reset transition state after a brief delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [setTheme]);

  // Get the current resolved theme (what's actually being displayed)
  const getResolvedTheme = (): 'light' | 'dark' | null => {
    if (resolvedTheme && (resolvedTheme === 'light' || resolvedTheme === 'dark')) {
      return resolvedTheme;
    }
    if (systemTheme && (systemTheme === 'light' || systemTheme === 'dark')) {
      return systemTheme;
    }
    return null;
  };

  const contextValue: ThemeContextValue = {
    theme: (theme as Theme) || 'system',
    resolvedTheme: getResolvedTheme(),
    setTheme: handleSetTheme,
    toggleTheme,
    isThemeLoading,
    isTransitioning
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  
  return context;
}; 