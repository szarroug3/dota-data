'use client';

import { ThemeProvider } from 'next-themes';

import { AppLayout } from '@/components/layout/AppLayout';
import { AppLoader } from '@/components/layout/AppLoader';
import { CacheManagementProvider } from '@/contexts/cache-management-context';
import { ConfigProvider } from '@/contexts/config-context';
import { HeroProvider } from '@/contexts/hero-context';
import { MatchProvider } from '@/contexts/match-context';
import { PlayerProvider } from '@/contexts/player-context';
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
          <CacheManagementProvider>
            <TeamDataFetchingProvider>
              <TeamProvider>
                <MatchProvider>
                  <PlayerProvider>
                    <HeroProvider>
                      <AppLoader>
                        <AppLayout>
                          {children}
                        </AppLayout>
                      </AppLoader>
                    </HeroProvider>
                  </PlayerProvider>
                </MatchProvider>
              </TeamProvider>
            </TeamDataFetchingProvider>
          </CacheManagementProvider>
        </ConfigProvider>
      </ThemeContextProvider>
    </ThemeProvider>
  );
} 