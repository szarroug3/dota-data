import HeroCacheInitializer from "@/components/HeroCacheInitializer";
import { Layout } from "@/components/layout";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { DataFetchingProvider } from "@/contexts/data-fetching-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { TeamProvider } from "@/contexts/team-context";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dota Data Assistant",
  description: "A comprehensive Dota 2 drafting and analysis assistant",
};

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
            </ToastProvider>
          </DataFetchingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
