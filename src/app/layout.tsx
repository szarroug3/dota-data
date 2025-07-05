"use client";

import HeroCacheInitializer from "@/components/HeroCacheInitializer";
import { Layout } from "@/components/layout";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { DataFetchingProvider } from "@/contexts/data-fetching-context";
import { MatchDataProvider } from "@/contexts/match-data-context";
import { PlayerDataProvider } from "@/contexts/player-data-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { TeamProvider } from "@/contexts/team-context";
import { TeamDataProvider } from "@/contexts/team-data-context";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="dota-data-theme"
        >
          <DataFetchingProvider>
            <ToastProvider>
              <MatchDataProvider>
                <TeamDataProvider>
                  <PlayerDataProvider>
                    <TeamProvider>
                      <SidebarProvider>
                        <HeroCacheInitializer />
                        <div className="flex min-h-screen gap-8">
                          <Sidebar />
                          <main className="flex-1 ml-4 md:ml-8">
                            <Layout>{children}</Layout>
                          </main>
                        </div>
                      </SidebarProvider>
                    </TeamProvider>
                  </PlayerDataProvider>
                </TeamDataProvider>
              </MatchDataProvider>
            </ToastProvider>
          </DataFetchingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
