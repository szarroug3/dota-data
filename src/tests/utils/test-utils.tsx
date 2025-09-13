import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import React from 'react';

import { ConfigProvider } from '@/frontend/contexts/config-context';
import { ThemeContextProvider } from '@/frontend/contexts/theme-context';
import { MatchDataFetchingProvider } from '@/frontend/matches/contexts/fetching/match-data-fetching-context';
import { MatchProvider } from '@/frontend/matches/contexts/state/match-context';
import { PlayerProvider } from '@/frontend/players/contexts/state/player-context';
import { TeamProvider } from '@/frontend/teams/contexts/state/team-context';

// In tests we don't need hero context wiring here; keep wrapper lean
const HeroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

// Mock window.matchMedia for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock document.documentElement.classList for next-themes
Object.defineProperty(document.documentElement, 'classList', {
  writable: true,
  value: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn(),
  },
});

// Mock localStorage for next-themes
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test wrapper component with all necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <ConfigProvider>
        <ThemeContextProvider>
          <TeamProvider>
            <MatchDataFetchingProvider>
              <MatchProvider>
                <PlayerProvider>
                  <HeroProvider>
                    {children}
                  </HeroProvider>
                </PlayerProvider>
              </MatchProvider>
            </MatchDataFetchingProvider>
          </TeamProvider>
        </ThemeContextProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
};

// Custom render function that includes the test wrapper
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

// Export the custom render function as renderWithProviders for better naming
export const renderWithProviders = customRender;

// Re-export everything from testing-library
export * from '@testing-library/react';
