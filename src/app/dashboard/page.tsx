"use client";
import LeagueStandings from "@/components/dashboard/LeagueStandings";
import PageHeader from "@/components/dashboard/PageHeader";
import QuickActions from "@/components/dashboard/QuickActions";
import TeamOverviewStats from "@/components/dashboard/TeamOverviewStats";
import TopHeroes from "@/components/dashboard/TopHeroes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTeam } from "@/contexts/team-context";
import { Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { currentTeam, isLoaded } = useTeam();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Move useEffect out of conditional
  useEffect(() => {
    if (!isLoaded) return;
    const configId = searchParams.get("config");
    if (configId) {
      setLoadingConfig(true);
      fetch(`/api/configs/${configId}`)
        .then((res) => res.json())
        .then((cfg) => {
          // TODO: Apply config to dashboard state
        })
        .finally(() => setLoadingConfig(false));
    }
  }, [searchParams, isLoaded]);

  if (!isLoaded) {
    return null; // Let Next.js Suspense handle the loading UI
  }

  // Dashboard config object
  const dashboardConfig = {
    filters: { role: "carry", patch: "7.36" },
    layout: "compact",
    timestamp: Date.now(),
  };

  // Save config and generate shareable link
  const saveConfig = async () => {
    const id = Math.random().toString(36).substring(2, 10);
    await fetch(`/api/configs/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dashboardConfig),
    });
    const url = `${window.location.origin}${window.location.pathname}?config=${id}`;
    setShareLink(url);
  };

  if (!currentTeam) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="No team selected. Please add a team in Team Management."
        />
        <Card>
          <CardContent className="pt-6">
            <Link href="/dashboard/team-management">
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Go to Team Management
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only render dashboard sections if real data is available
  // (Assume currentTeam.league and currentTeam.topHeroes would be set by backend/context in real usage)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          loadingConfig ? "Loading config..." : "Team dashboard overview"
        }
      />

      {/* Team Overview Stats */}
      <TeamOverviewStats team={currentTeam} />

      {/* League Standings */}
      {currentTeam.league ? (
        <LeagueStandings
          standings={currentTeam.standings ?? []}
          league={currentTeam.league}
        />
      ) : (
        <div className="text-muted-foreground">No league data available.</div>
      )}

      {/* Top Heroes */}
      {currentTeam.topHeroes ? (
        <TopHeroes heroes={currentTeam.topHeroes} />
      ) : (
        <div className="text-muted-foreground">No top hero data available.</div>
      )}

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
