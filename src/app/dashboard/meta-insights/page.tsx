"use client";
import ErrorCard from "@/components/dashboard/ErrorCard";
import PageHeader from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTeam } from "@/contexts/team-context";
import { useTeamData } from "@/contexts/team-data-context";
import { useMetaInsights } from "@/lib/hooks/useDataFetching";
import {
  Calendar,
  Clock,
  Minus,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";
import { useState } from "react";

// Types extracted from inline usage
export type HeroBan = { banRate: number };
export type HeroPick = { hero: string; pickRate: number; winRate: number };

export default function MetaInsightsPage() {
  const { currentTeam } = useTeam();
  const { getLeagueData } = useTeamData();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "patch">(
    "week",
  );

  const { data: metaData, loading, error } = useMetaInsights(timeRange);

  const handleTimeRangeChange = (newTimeRange: "week" | "month" | "patch") => {
    if (newTimeRange !== timeRange) {
      setTimeRange(newTimeRange);
    }
  };

  // Get league data for the current team
  const leagueData = currentTeam?.leagueId ? getLeagueData(currentTeam.leagueId) : null;
  const leagueName = leagueData?.leagueName || (currentTeam?.leagueId ? `League ${currentTeam.leagueId}` : 'Unknown League');

  if (loading && !metaData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Meta Insights"
          description={`Loading meta insights for ${currentTeam?.teamName || 'team'} in ${leagueName}...`}
        />
        <div className="grid gap-6">
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
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
          title="Meta Insights"
          description="Error loading meta insights"
        />
        <ErrorCard title="Meta Insights" error={error} />
      </div>
    );
  }

  if (!metaData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Meta Insights"
          description={`No meta insights available for ${currentTeam?.teamName || 'team'} in ${leagueName}`}
        />
        <div className="text-center text-muted-foreground p-8">
          <div className="text-lg font-medium mb-2">No meta data available</div>
          <div className="text-sm">
            Import matches from Dotabuff in Team Management to see meta insights
          </div>
        </div>
      </div>
    );
  }

  const heroInternalNameMap: Record<string, string> = {
    Invoker: "invoker",
    "Crystal Maiden": "crystal_maiden",
    Juggernaut: "juggernaut",
    "Phantom Assassin": "phantom_assassin",
    Tidehunter: "tidehunter",
    "Wraith King": "skeleton_king",
    "Nature's Prophet": "furion",
    Doom: "doom_bringer",
    Clockwerk: "rattletrap",
    Lifestealer: "life_stealer",
    Io: "wisp",
    Magnus: "magnataur",
    "Naga Siren": "naga_siren",
    Timbersaw: "shredder",
    "Centaur Warrunner": "centaur",
    "Treant Protector": "treant",
    "Vengeful Spirit": "vengefulspirit",
    Windranger: "windrunner",
    Zeus: "zuus",
    // Add more as needed
  };

  // Get top bans (heroes with highest ban rates)
  const topBans = metaData.currentMeta.keyHeroes
    .filter((hero: HeroBan) => hero.banRate > 0)
    .sort((a: HeroBan, b: HeroBan) => b.banRate - a.banRate)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meta Insights"
        description={`Current meta trends and strategic analysis for ${currentTeam?.teamName || 'team'} in ${leagueName}`}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            onClick={() => handleTimeRangeChange("week")}
            disabled={loading}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Week
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            onClick={() => handleTimeRangeChange("month")}
            disabled={loading}
          >
            <Clock className="w-4 h-4 mr-2" />
            Month
          </Button>
          <Button
            variant={timeRange === "patch" ? "default" : "outline"}
            onClick={() => handleTimeRangeChange("patch")}
            disabled={loading}
          >
            <Tag className="w-4 h-4 mr-2" />
            Patch
          </Button>
        </div>
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Content with subtle loading overlay */}
      <div className={`relative space-y-6 ${loading ? "opacity-50" : ""}`}>
        {/* Meta Trends Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">32.4 min</p>
                  <p className="text-sm text-muted-foreground">
                    Avg Game Length
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">124</p>
                  <p className="text-sm text-muted-foreground">Heroes Picked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">51.2%</p>
                  <p className="text-sm text-muted-foreground">
                    Radiant Win Rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Picks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Picks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metaData.currentMeta.keyHeroes.map(
                (hero: HeroPick, index: number) => {
                  const heroInternalName =
                    heroInternalNameMap[hero.hero] ||
                    hero.hero.toLowerCase().replace(/\s+/g, "_");
                  const heroImageUrl = `https://cdn.stratz.com/images/dota2/heroes/${heroInternalName}_vert.png`;

                  return (
                    <div
                      key={hero.hero}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                          <img
                            src={heroImageUrl}
                            alt={hero.hero}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/window.svg";
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">{hero.hero}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Pick Rate: {hero.pickRate}%</span>
                            <span>Win Rate: {hero.winRate}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={hero.pickRate > 40 ? "default" : "secondary"}
                          className="flex items-center space-x-1"
                        >
                          {hero.pickRate > 40 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {hero.pickRate > 40 ? "High" : "Low"}
                        </Badge>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Bans */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Bans</CardTitle>
          </CardHeader>
          <CardContent>
            {topBans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topBans.map((hero: HeroBan) => {
                  const heroInternalName =
                    heroInternalNameMap[hero.hero] ||
                    hero.hero.toLowerCase().replace(/\s+/g, "_");
                  const heroImageUrl = `https://cdn.stratz.com/images/dota2/heroes/${heroInternalName}_vert.png`;

                  return (
                    <div key={hero.hero} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <img
                          src={heroImageUrl}
                          alt={hero.hero}
                          className="w-10 h-10 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/window.svg";
                          }}
                        />
                        <div>
                          <h4 className="font-semibold">{hero.hero}</h4>
                          <Badge variant="destructive">
                            {hero.banRate}% ban rate
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        High ban rate due to strong performance
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No ban data available for this time period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Meta Trends</CardTitle>
            <CardDescription>
              Key trends shaping the current meta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metaData.metaTrends.map((trend: any) => (
                <div key={trend.title} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{trend.title}</h4>
                    <Badge
                      variant={
                        trend.impact === "High"
                          ? "destructive"
                          : trend.impact === "Medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {trend.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {trend.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trend.details}
                  </p>
                  <div className="flex items-center mt-3">
                    {trend.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : trend.trend === "down" ? (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-500 mr-1" />
                    )}
                    <span className="text-sm font-medium">
                      {trend.trend === "up"
                        ? "Rising"
                        : trend.trend === "down"
                          ? "Declining"
                          : "Stable"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Role Statistics</CardTitle>
            <CardDescription>
              Average performance metrics by role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metaData?.roleStats &&
                Object.entries(metaData.roleStats).map(
                  ([role, stats]: [string, any]) => (
                    <div key={role} className="p-4 border rounded-lg">
                      <h4 className="font-semibold capitalize mb-3">{role}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Avg GPM:
                          </span>
                          <span className="font-medium">{stats.avgGPM}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Avg KDA:
                          </span>
                          <span className="font-medium">{stats.avgKDA}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Win Rate:
                          </span>
                          <span className="font-medium">{stats.winRate}%</span>
                        </div>
                      </div>
                    </div>
                  ),
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
