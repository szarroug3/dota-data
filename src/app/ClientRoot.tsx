"use client";

import { ThemeProvider } from "next-themes";
import React from "react";

import { AppLayout } from '@/components/layout/AppLayout';
import { ConfigProvider } from "@/contexts/config-context";
import { ConstantsProvider } from "@/contexts/constants-context";
import { ConstantsDataFetchingProvider } from "@/contexts/constants-data-fetching-context";
import { DataCoordinatorProvider } from "@/contexts/data-coordinator-context";
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
          <ConstantsDataFetchingProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ConfigProvider>
                <TeamProvider>
                  <ConstantsProvider>
                    <MatchProvider>
                      <PlayerProvider>
                        <DataCoordinatorProvider>
                          <TeamHydrationHandler />
                          <AppLayout>
                            {children}
                          </AppLayout>
                        </DataCoordinatorProvider>
                      </PlayerProvider>
                    </MatchProvider>
                  </ConstantsProvider>
                </TeamProvider>
              </ConfigProvider>
            </ThemeProvider>
          </ConstantsDataFetchingProvider>
        </PlayerDataFetchingProvider>
      </MatchDataFetchingProvider>
    </TeamDataFetchingProvider>
  );
} 