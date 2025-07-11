'use client';

import { ThemeProvider } from 'next-themes';

import { CacheManagementProvider } from '@/contexts/cache-management-context';
import { ConfigProvider } from '@/contexts/config-context';
import { HeroProvider } from '@/contexts/hero-context';
import { MatchProvider } from '@/contexts/match-context';
import { PlayerProvider } from '@/contexts/player-context';
import { TeamProvider } from '@/contexts/team-context';

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConfigProvider>
        <CacheManagementProvider>
          <TeamProvider>
            <MatchProvider>
              <PlayerProvider>
                <HeroProvider>
                  {children}
                </HeroProvider>
              </PlayerProvider>
            </MatchProvider>
          </TeamProvider>
        </CacheManagementProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
} 