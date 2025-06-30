"use client";
import ErrorCard from "@/components/dashboard/ErrorCard";
import PageHeader from "@/components/dashboard/PageHeader";
import TeamOverviewStats from "@/components/dashboard/TeamOverviewStats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeam } from "@/contexts/team-context";
import { useTeamAnalysis } from "@/lib/hooks/useDataFetching";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export default function TeamAnalysisPage() {
  const { currentTeam } = useTeam();

  const accountIds =
    currentTeam?.players?.map((player) => player.id).filter(Boolean) || null;
  const { data: teamAnalysis, loading, error } = useTeamAnalysis(accountIds);

  if (!currentTeam) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Team Analysis"
          description="No team selected. Please add a team in Team Management."
        />
        <div className="text-center text-muted-foreground">
          Select a team to view detailed analysis
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Team Analysis"
          description="Loading team analysis..."
        />
        <div className="grid gap-6">
          {/* Team overview skeleton */}
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          {/* Role performance skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          {/* Game phase stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          {/* Hero pool skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Team Analysis"
          description="Error loading team analysis"
        />
        <ErrorCard title="Team Analysis" error={error} />
      </div>
    );
  }

  if (!teamAnalysis) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Team Analysis"
          description="No team analysis available"
        />
        <div className="text-center text-muted-foreground p-8">
          <div className="text-lg font-medium mb-2">No team analysis data available</div>
          <div className="text-sm">
            Import matches from Dotabuff in Team Management to see team analysis
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Analysis"
        description="Comprehensive team performance analysis and insights"
      />

      <TeamOverviewStats
        team={{
          winRate: teamAnalysis.overallStats.winRate,
          totalMatches: teamAnalysis.overallStats.totalMatches,
          record: currentTeam?.record || '',
          league: currentTeam?.league || '',
          players: currentTeam?.players || [],
          lastMatch: currentTeam?.lastMatch || '',
        }}
      />

      {/* Role Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(teamAnalysis.rolePerformance).map(([role, stats]) => (
          <Card key={role}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {role}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="font-medium">{stats.winRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg KDA:</span>
                  <span className="font-medium">{stats.avgKDA.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg GPM:</span>
                  <span className="font-medium">{stats.avgGPM}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Phase Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(teamAnalysis.gamePhaseStats).map(([phase, stats]) => (
          <Card key={phase}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {phase.replace(/([A-Z])/g, " $1").trim()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="font-medium">{stats.winRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Duration:</span>
                  <span className="font-medium">{stats.avgDuration}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hero Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Picked Heroes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teamAnalysis.heroPool.mostPicked.map((hero, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div>
                    <div className="font-medium">{hero.hero}</div>
                    <div className="text-sm text-muted-foreground">
                      {hero.games} games
                    </div>
                  </div>
                  <Badge variant="outline">{hero.winRate}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Win Rate Heroes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teamAnalysis.heroPool.bestWinRate.map((hero, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div>
                    <div className="font-medium">{hero.hero}</div>
                    <div className="text-sm text-muted-foreground">
                      {hero.games} games
                    </div>
                  </div>
                  <Badge variant="outline">{hero.winRate}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Banned Heroes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teamAnalysis.heroPool.mostBanned.map((hero, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div>
                    <div className="font-medium">{hero.hero}</div>
                    <div className="text-sm text-muted-foreground">
                      {hero.bans} bans
                    </div>
                  </div>
                  <Badge variant="outline">{hero.banRate}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamAnalysis.trends.map((trend, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium">{trend.metric}</div>
                  <div className="text-lg font-bold">{trend.value}</div>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    trend.direction === "up"
                      ? "text-green-600"
                      : trend.direction === "down"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {trend.direction === "up" && (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  {trend.direction === "down" && (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {trend.direction === "neutral" && (
                    <Minus className="h-4 w-4" />
                  )}
                  {trend.trend}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
