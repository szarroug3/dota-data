"use client";
import AddPlayer from "@/components/dashboard/AddPlayer";
import ErrorCard from "@/components/dashboard/ErrorCard";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeam } from "@/contexts/team-context";
import { useTeamData } from "@/contexts/team-data-context";
import { usePlayerStats } from "@/lib/hooks/usePlayerStats";
import { Minus, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

// Types for player data
interface Player {
  id: string;
  name: string;
  role?: string;
}

interface PlayerStats {
  rank: string;
  stars?: number;
  immortalRank?: number;
  overallStats: {
    matches: number;
    avgKDA: number;
    avgGPM: number;
    avgXPM: number;
    winRate: number;
  };
  trends: Array<{
    metric: string;
    value: string;
    direction: "up" | "down" | "neutral";
    trend: string;
  }>;
  recentPerformance: Array<{
    result: "W" | "L";
    hero: string;
    date: string;
    KDA: string;
    GPM: number;
  }>;
  topHeroes: Array<{
    hero: string;
    games: number;
    winRate: number;
  }>;
  recentlyPlayed: Array<{
    hero: string;
    games: number;
    winRate: number;
  }>;
}

// Loading state component
function PlayerStatsLoadingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-6 w-6 bg-muted animate-pulse rounded" />
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-32 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// Player header component
function PlayerHeader({ player, playerStats }: { player: Player; playerStats: PlayerStats }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2">
          {player.name}
          <Badge variant="secondary">{player.role || "Unknown"}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">
            {playerStats.rank}
          </span>
          {playerStats.stars !== undefined && (
            <span className="text-sm text-muted-foreground">
              {playerStats.stars}{" "}
              {playerStats.stars === 1 ? "Star" : "Stars"}
            </span>
          )}
          {playerStats.immortalRank && (
            <span className="text-sm text-muted-foreground">
              #{playerStats.immortalRank}
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">
          {playerStats.overallStats.winRate.toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground">Win Rate</div>
      </div>
    </div>
  );
}

// Overall stats component
function OverallStats({ overallStats }: { overallStats: PlayerStats["overallStats"] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        title="Matches"
        value={overallStats.matches}
        description="Total games played"
      />
      <StatsCard
        title="Avg KDA"
        value={overallStats.avgKDA.toFixed(2)}
        description="Kills/Deaths/Assists ratio"
      />
      <StatsCard
        title="Avg GPM"
        value={overallStats.avgGPM.toFixed(0)}
        description="Gold per minute"
      />
      <StatsCard
        title="Avg XPM"
        value={overallStats.avgXPM.toFixed(0)}
        description="Experience per minute"
      />
    </div>
  );
}

// Performance trends component
function PerformanceTrends({ trends }: { trends: PlayerStats["trends"] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Performance Trends</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trends.map((trend, index) => (
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
    </div>
  );
}

// Recent performance component
function RecentPerformance({ recentPerformance }: { recentPerformance: PlayerStats["recentPerformance"] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Recent Performance</h3>
      <div className="space-y-2">
        {recentPerformance.map((match, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  match.result === "W" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div>
                <div className="font-medium">{match.hero}</div>
                <div className="text-sm text-muted-foreground">
                  {match.date}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{match.KDA}</div>
              <div className="text-sm text-muted-foreground">
                {match.GPM} GPM
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Top heroes component
function TopHeroes({ topHeroes }: { topHeroes: PlayerStats["topHeroes"] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Top Heroes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topHeroes.map((hero, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div>
              <div className="font-medium">{hero.hero}</div>
              <div className="text-sm text-muted-foreground">
                {hero.games} games
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{hero.winRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recently played component
function RecentlyPlayed({ recentlyPlayed }: { recentlyPlayed: PlayerStats["recentlyPlayed"] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Recently Played</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentlyPlayed.map((hero, index) => (
          <div key={index} className="text-center p-3 bg-muted rounded-lg">
            <div className="w-12 h-12 mx-auto mb-2 bg-muted-foreground rounded-full flex items-center justify-center">
              {/* Hero image would go here */}
            </div>
            <div className="font-medium text-sm">{hero.hero}</div>
            <div className="text-xs text-muted-foreground">
              {hero.games} games
            </div>
            <div className="text-xs font-medium">
              {hero.winRate.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Player stats card component
function PlayerStatsCard({ player }: { player: Player }) {
  const {
    data: playerStats,
    loading,
    error,
  } = usePlayerStats(player.id, player.name, player.role || "Unknown");

  if (loading) {
    return <PlayerStatsLoadingCard />;
  }

  if (error) {
    return (
      <ErrorCard
        title={`${player.name} - ${player.role || "Unknown"}`}
        error={error}
        description="Unable to load player statistics from OpenDota API."
      />
    );
  }

  if (!playerStats) {
    return (
      <ErrorCard
        title={`${player.name} - ${player.role || "Unknown"}`}
        error="No data available"
        description="Player statistics not available."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <PlayerHeader player={player} playerStats={playerStats} />
      </CardHeader>

      <CardContent className="space-y-6">
        <OverallStats overallStats={playerStats.overallStats} />
        <PerformanceTrends trends={playerStats.trends} />
        <RecentPerformance recentPerformance={playerStats.recentPerformance} />
        <TopHeroes topHeroes={playerStats.topHeroes} />
        <RecentlyPlayed recentlyPlayed={playerStats.recentlyPlayed} />
      </CardContent>
    </Card>
  );
}

export default function PlayerStatsPage() {
  const { currentTeam } = useTeam();
  const { getLeagueData } = useTeamData();
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  if (!currentTeam) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Player Statistics"
          description="No team selected. Please add a team in Team Management."
        />
        <div className="text-center text-muted-foreground">
          Select a team to view player statistics
        </div>
      </div>
    );
  }

  // Get league data for the current team
  const leagueData = currentTeam.leagueId ? getLeagueData(currentTeam.leagueId) : null;
  const leagueName = leagueData?.leagueName || (currentTeam.leagueId ? `League ${currentTeam.leagueId}` : 'Unknown League');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Player Statistics"
        description={
          currentTeam
            ? `Player stats for ${currentTeam.teamName} in ${leagueName}`
            : "No team selected. Please add a team in Team Management."
        }
      />

      {showAddPlayer && <AddPlayer onClose={() => setShowAddPlayer(false)} />}

      {/* Check if there are players */}
      {!currentTeam.players || currentTeam.players.length === 0 ? (
        <div className="grid gap-6">
          <div className="text-center text-muted-foreground p-8">
            <div className="text-lg font-medium mb-2">No players found</div>
            <div className="text-sm mb-4">
              Add players to view player statistics
            </div>
            <Button onClick={() => setShowAddPlayer(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Team Players</h2>
            <Button onClick={() => setShowAddPlayer(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>
          <div className="grid gap-6">
            {currentTeam.players.map((player) => (
              <PlayerStatsCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
