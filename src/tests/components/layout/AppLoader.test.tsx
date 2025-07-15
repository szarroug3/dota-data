import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { AppLoader } from '@/components/layout/AppLoader';
import { ConfigProvider, useConfigContext } from '@/contexts/config-context';
import { TeamProvider, useTeamContext } from '@/contexts/team-context';
import { ThemeContextProvider, useThemeContext } from '@/contexts/theme-context';

// Mock the contexts
jest.mock('@/contexts/theme-context', () => ({
  useThemeContext: jest.fn(),
  ThemeContextProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>
}));

jest.mock('@/contexts/config-context', () => ({
  useConfigContext: jest.fn(),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="config-provider">{children}</div>
}));

jest.mock('@/contexts/team-context', () => ({
  useTeamContext: jest.fn(),
  TeamProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="team-provider">{children}</div>
}));


describe('AppLoader', () => {
  it('should show blank screen while loading', () => {
    (useThemeContext as jest.Mock).mockReturnValue({ isThemeLoading: true });
    (useConfigContext as jest.Mock).mockReturnValue({ isLoading: true });
    (useTeamContext as jest.Mock).mockReturnValue({ isLoadingTeams: true });

    render(
      <ThemeContextProvider>
        <ConfigProvider>
          <TeamProvider>
            <AppLoader>
              <div data-testid="app-content">App Content</div>
            </AppLoader>
          </TeamProvider>
        </ConfigProvider>
      </ThemeContextProvider>
    );

    // Should show blank screen (no content)
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
  });

  it('should render app content after loading is complete', async () => {
    (useThemeContext as jest.Mock).mockReturnValue({ isThemeLoading: false });
    (useConfigContext as jest.Mock).mockReturnValue({ isLoading: false });
    (useTeamContext as jest.Mock).mockReturnValue({ isLoadingTeams: false });

    render(
      <ThemeContextProvider>
        <ConfigProvider>
          <TeamProvider>
            <AppLoader>
              <div data-testid="app-content">App Content</div>
            </AppLoader>
          </TeamProvider>
        </ConfigProvider>
      </ThemeContextProvider>
    );

    // Should render app content after loading
    await waitFor(() => {
      expect(screen.getAllByTestId('app-content')).toHaveLength(2);
    }, { timeout: 2000 });

    expect(screen.getByText('App Content')).toBeInTheDocument();
  });
}); 