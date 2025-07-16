'use client';

import { ThemeProvider } from 'next-themes';

import { AppLayout } from '@/components/layout/AppLayout';
import { AppLoader } from '@/components/layout/AppLoader';
import { ConfigProvider } from '@/contexts/config-context';
import { DataCoordinatorProvider } from '@/contexts/data-coordinator-context';
import { HeroProvider } from '@/contexts/hero-context';
import { HeroDataFetchingProvider } from '@/contexts/hero-data-fetching-context';
import { MatchProvider } from '@/contexts/match-context';
import { MatchDataFetchingProvider } from '@/contexts/match-data-fetching-context';
import { PlayerProvider } from '@/contexts/player-context';
import { PlayerDataFetchingProvider } from '@/contexts/player-data-fetching-context';
import { TeamProvider } from '@/contexts/team-context';
import { TeamDataFetchingProvider } from '@/contexts/team-data-fetching-context';
import { ThemeContextProvider } from '@/contexts/theme-context';

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <ThemeContextProvider>
        <ConfigProvider>
          {/* Data Fetching Providers (no dependencies) */}
          <TeamDataFetchingProvider>
            <MatchDataFetchingProvider>
              <PlayerDataFetchingProvider>
                <HeroDataFetchingProvider>
                  {/* Context Providers (depend on data fetching) */}
                  <TeamProvider>
                    <MatchProvider>
                      <PlayerProvider>
                        <HeroProvider>
                          {/* Data Coordinator (depends on all contexts) */}
                          <DataCoordinatorProvider>
                            <AppLoader>
                              <AppLayout>
                                {children}
                              </AppLayout>
                            </AppLoader>
                          </DataCoordinatorProvider>
                        </HeroProvider>
                      </PlayerProvider>
                    </MatchProvider>
                  </TeamProvider>
                </HeroDataFetchingProvider>
              </PlayerDataFetchingProvider>
            </MatchDataFetchingProvider>
          </TeamDataFetchingProvider>
        </ConfigProvider>
      </ThemeContextProvider>
    </ThemeProvider>
  );
} 