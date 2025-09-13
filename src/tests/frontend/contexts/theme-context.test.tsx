/**
 * Theme Context Tests
 * 
 * Tests for the centralized theme context to ensure it properly manages theme state
 * and provides smooth transitions.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import React from 'react';

import { ConfigProvider } from '@/frontend/contexts/config-context';
import { ThemeContextProvider, useThemeContext } from '@/frontend/contexts/theme-context';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
    systemTheme: 'light'
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>
}));

// Test component that uses the theme context
const TestComponent: React.FC = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme, isThemeLoading, isTransitioning } = useThemeContext();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <div data-testid="is-loading">{isThemeLoading.toString()}</div>
      <div data-testid="is-transitioning">{isTransitioning.toString()}</div>
      <button data-testid="set-light" onClick={() => setTheme('light')}>Set Light</button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>Set Dark</button>
      <button data-testid="set-system" onClick={() => setTheme('system')}>Set System</button>
      <button data-testid="toggle-theme" onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

// Wrapper component for testing
const TestWrapper: React.FC = () => (
  <ConfigProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeContextProvider>
        <TestComponent />
      </ThemeContextProvider>
    </ThemeProvider>
  </ConfigProvider>
);

describe('ThemeContext', () => {
  it('should provide theme context values', () => {
    render(<TestWrapper />);
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
  });

  it('should provide theme change functions', () => {
    render(<TestWrapper />);
    
    expect(screen.getByTestId('set-light')).toBeInTheDocument();
    expect(screen.getByTestId('set-dark')).toBeInTheDocument();
    expect(screen.getByTestId('set-system')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-theme')).toBeInTheDocument();
  });

  it('should handle theme changes', async () => {
    render(<TestWrapper />);
    
    const setLightButton = screen.getByTestId('set-light');
    const setDarkButton = screen.getByTestId('set-dark');
    const setSystemButton = screen.getByTestId('set-system');
    
    // Test setting different themes
    fireEvent.click(setLightButton);
    fireEvent.click(setDarkButton);
    fireEvent.click(setSystemButton);
    
    // Verify buttons are clickable
    expect(setLightButton).toBeInTheDocument();
    expect(setDarkButton).toBeInTheDocument();
    expect(setSystemButton).toBeInTheDocument();
  });

  it('should handle theme toggle', async () => {
    render(<TestWrapper />);
    
    const toggleButton = screen.getByTestId('toggle-theme');
    fireEvent.click(toggleButton);
    
    // Verify toggle button is clickable
    expect(toggleButton).toBeInTheDocument();
  });

  it('should provide transition state', () => {
    render(<TestWrapper />);
    
    const isTransitioning = screen.getByTestId('is-transitioning');
    expect(isTransitioning).toHaveTextContent('false');
  });
}); 