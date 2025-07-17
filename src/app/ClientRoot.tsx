"use client";

import { ThemeProvider } from "next-themes";
import React from "react";

import { AppLayout } from '@/components/layout/AppLayout';
import { ConfigProvider } from "@/contexts/config-context";
import { DataCoordinatorProvider } from "@/contexts/data-coordinator-context";
import { HeroProvider } from "@/contexts/hero-context";
import { HeroDataFetchingProvider } from "@/contexts/hero-data-fetching-context";
import { MatchProvider } from "@/contexts/match-context";
import { MatchDataFetchingProvider } from "@/contexts/match-data-fetching-context";
import { PlayerProvider } from "@/contexts/player-context";
import { PlayerDataFetchingProvider } from "@/contexts/player-data-fetching-context";
import { TeamHydrationHandler, TeamProvider } from "@/contexts/team-context";
import { TeamDataFetchingProvider } from "@/contexts/team-data-fetching-context";

interface ClientRootProps {
  children: React.ReactNode;
}

export function ClientRoot({ children }: ClientRootProps) {
  return (
    <TeamDataFetchingProvider>
      <MatchDataFetchingProvider>
        <PlayerDataFetchingProvider>
          <HeroDataFetchingProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ConfigProvider>
                <TeamProvider>
                  <MatchProvider>
                    <PlayerProvider>
                      <HeroProvider>
                        <DataCoordinatorProvider>
                          <TeamHydrationHandler />
                          <AppLayout>
                            {children}
                          </AppLayout>
                        </DataCoordinatorProvider>
                      </HeroProvider>
                    </PlayerProvider>
                  </MatchProvider>
                </TeamProvider>
              </ConfigProvider>
            </ThemeProvider>
          </HeroDataFetchingProvider>
        </PlayerDataFetchingProvider>
      </MatchDataFetchingProvider>
    </TeamDataFetchingProvider>
  );
} 