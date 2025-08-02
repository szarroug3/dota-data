"use client";

import { ThemeProvider } from "next-themes";
import React from "react";

import { AppLayout } from '@/components/layout/AppLayout';
import { ConfigProvider } from "@/contexts/config-context";
import { ConstantsProvider } from "@/contexts/constants-context";
import { ConstantsDataFetchingProvider } from "@/contexts/constants-data-fetching-context";
import { MatchProvider } from "@/contexts/match-context";
import { MatchDataFetchingProvider } from "@/contexts/match-data-fetching-context";
import { PlayerProvider } from "@/contexts/player-context";
import { PlayerDataFetchingProvider } from "@/contexts/player-data-fetching-context";
import { TeamProvider } from "@/contexts/team-context";
import { TeamDataFetchingProvider } from "@/contexts/team-data-fetching-context";
import { useAppHydration } from "@/hooks/useAppHydration";

interface ClientRootProps {
  children: React.ReactNode;
}

function AppContent({ children }: ClientRootProps) {
  // Handle app hydration
  const { isHydrating, hydrationError } = useAppHydration();

  // Show loading state while hydrating
  if (isHydrating) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application data...</p>
        </div>
      </div>
    );
  }

  // Show error state if hydration failed
  if (hydrationError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load application data</p>
          <p className="text-muted-foreground text-sm">{hydrationError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show app content once hydrated
  return <AppLayout>{children}</AppLayout>;
}

export function ClientRoot({ children }: ClientRootProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* Data Fetching Contexts (no dependencies) */}
      <TeamDataFetchingProvider>
        <MatchDataFetchingProvider>
          <PlayerDataFetchingProvider>
            <ConstantsDataFetchingProvider>
              {/* Config Context (no dependencies) */}
              <ConfigProvider>
                {/* Constants Context (depends on ConstantsDataFetchingContext) */}
                <ConstantsProvider>
                  {/* Match Context (depends on ConstantsContext) */}
                  <MatchProvider>
                    {/* Player Context (no dependencies) */}
                    <PlayerProvider>
                      {/* Team Context (depends on ConfigContext, MatchContext, PlayerContext) */}
                      <TeamProvider>
                        <AppContent>
                          {children}
                        </AppContent>
                      </TeamProvider>
                    </PlayerProvider>
                  </MatchProvider>
                </ConstantsProvider>
              </ConfigProvider>
            </ConstantsDataFetchingProvider>
          </PlayerDataFetchingProvider>
        </MatchDataFetchingProvider>
      </TeamDataFetchingProvider>
    </ThemeProvider>
  );
} 