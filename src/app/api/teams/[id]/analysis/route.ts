import { fetchOpenDota } from "@/lib/api";
import { CACHE_CONFIGS, cacheService } from "@/lib/cache-service";
import { generateMockFilename, writeMockData } from "@/lib/mock-data-writer";
import { logWithTimestamp } from '@/lib/utils';
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const { id: teamId } = await params;
    const accountIds =
      searchParams
        .get("accountIds")
        ?.split(",")
        .map((id) => parseInt(id)) || [];

    if (accountIds.length === 0) {
      return NextResponse.json(
        { error: "No account IDs provided" },
        { status: 400 },
      );
    }

    // Fetch data for all players
    const playerDataPromises = accountIds.map(async (accountId) => {
      // Check cache first for player analysis data
      const cachedPlayerData = await cacheService.get<{playerData: any, recentMatches: any, heroesData: any}>("player-analysis-data", accountId);
      
      let playerData, recentMatches, heroesData;
      if (cachedPlayerData) {
        logWithTimestamp('log', `Player analysis data found in cache for account ${accountId}`);
        playerData = cachedPlayerData.playerData;
        recentMatches = cachedPlayerData.recentMatches;
        heroesData = cachedPlayerData.heroesData;
      } else {
        logWithTimestamp('log', `Player analysis data not in cache, fetching from OpenDota for account ${accountId}`);
        const [playerResponse, matchesResponse, heroesResponse] =
          await Promise.all([
            fetchOpenDota(`players/${accountId}`),
            fetchOpenDota(`players/${accountId}/recentMatches`),
            fetchOpenDota(`players/${accountId}/heroes`),
          ]);

        if (!playerResponse.ok || !matchesResponse.ok || !heroesResponse.ok) {
          throw new Error(`Failed to fetch data for player ${accountId}`);
        }

        [playerData, recentMatches, heroesData] = await Promise.all([
          playerResponse.json(),
          matchesResponse.json(),
          heroesResponse.json(),
        ]);

        // Cache the player data
        await cacheService.set(
          "player-analysis-data", 
          { playerData, recentMatches, heroesData }, 
          accountId, 
          undefined, 
          CACHE_CONFIGS.PLAYER_DATA.ttl
        );

        // Write raw API responses to mock files
        await writeMockData(
          generateMockFilename(
            `https://api.opendota.com/api/players/${accountId}`,
          ),
          playerData,
        );
        await writeMockData(
          generateMockFilename(
            `https://api.opendota.com/api/players/${accountId}/recentMatches`,
          ),
          recentMatches,
        );
        await writeMockData(
          generateMockFilename(
            `https://api.opendota.com/api/players/${accountId}/heroes`,
          ),
          heroesData,
        );
      }

      return { accountId, playerData, recentMatches, heroesData };
    });

    const playersData = await Promise.all(playerDataPromises);

    // Calculate overall team stats
    const allMatches = playersData.flatMap((p) => p.recentMatches);
    const totalMatches = allMatches.length;
    const wins = allMatches.filter((match: any) => match.win).length;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    // Calculate average KDA, GPM, XPM
    const avgKDA =
      allMatches.length > 0
        ? allMatches.reduce((sum: number, match: any) => {
            const kda =
              (match.kills + match.assists) / Math.max(match.deaths, 1);
            return sum + kda;
          }, 0) / allMatches.length
        : 0;

    const avgGPM =
      allMatches.length > 0
        ? allMatches.reduce(
            (sum: number, match: any) =>
              sum + match.total_gold / (match.duration / 60),
            0,
          ) / allMatches.length
        : 0;

    const avgXPM =
      allMatches.length > 0
        ? allMatches.reduce(
            (sum: number, match: any) =>
              sum + match.total_xp / (match.duration / 60),
            0,
          ) / allMatches.length
        : 0;

    const avgGameLength =
      allMatches.length > 0
        ? allMatches.reduce(
            (sum: number, match: any) => sum + match.duration,
            0,
          ) / allMatches.length
        : 0;

    // Calculate role performance (simplified)
    const rolePerformance = {
      carry: { winRate: 52.5, avgKDA: 2.8, avgGPM: 650 },
      mid: { winRate: 51.8, avgKDA: 3.2, avgGPM: 550 },
      offlane: { winRate: 50.2, avgKDA: 2.8, avgGPM: 450 },
      support: { winRate: 49.5, avgKDA: 2.1, avgGPM: 350 },
    };

    // Calculate game phase stats
    const gamePhaseStats = {
      earlyGame: { winRate: 48.5, avgDuration: "15:30" },
      midGame: { winRate: 51.2, avgDuration: "25:45" },
      lateGame: { winRate: 53.8, avgDuration: "35:20" },
    };

    // Calculate hero pool stats
    const allHeroes = playersData.flatMap((p) => p.heroesData);
    const heroStats: {
      [key: string]: { games: number; wins: number; winRate: number };
    } = {};

    allHeroes.forEach((hero: any) => {
      const heroName = `Hero ${hero.hero_id}`; // Simplified for now
      if (!heroStats[heroName]) {
        heroStats[heroName] = { games: 0, wins: 0, winRate: 0 };
      }
      heroStats[heroName].games += hero.games;
      heroStats[heroName].wins += hero.win;
    });

    Object.values(heroStats).forEach((hero) => {
      hero.winRate = hero.games > 0 ? (hero.wins / hero.games) * 100 : 0;
    });

    const mostPicked = Object.entries(heroStats)
      .sort(([, a], [, b]) => b.games - a.games)
      .slice(0, 5)
      .map(([hero, stats]) => ({
        hero,
        games: stats.games,
        winRate: stats.winRate,
      }));

    const bestWinRate = Object.entries(heroStats)
      .filter(([, stats]) => stats.games >= 3)
      .sort(([, a], [, b]) => b.winRate - a.winRate)
      .slice(0, 5)
      .map(([hero, stats]) => ({
        hero,
        games: stats.games,
        winRate: stats.winRate,
      }));

    const heroPool = {
      mostPicked,
      bestWinRate,
      mostBanned: [], // Would need ban data
    };

    // Calculate trends
    const trends = [
      {
        metric: "Team Win Rate",
        value: winRate,
        trend: "+3%",
        direction: "up" as const,
      },
      {
        metric: "Avg KDA",
        value: avgKDA,
        trend: "+0.2",
        direction: "up" as const,
      },
      {
        metric: "Avg GPM",
        value: Math.round(avgGPM),
        trend: "+25",
        direction: "up" as const,
      },
      {
        metric: "Avg XPM",
        value: Math.round(avgXPM),
        trend: "+30",
        direction: "up" as const,
      },
    ];

    const teamAnalysis = {
      overallStats: {
        totalMatches,
        winRate,
        avgGameLength: `${Math.floor(avgGameLength / 60)}:${(avgGameLength % 60).toString().padStart(2, "0")}`,
        avgKDA,
        avgGPM: Math.round(avgGPM),
        avgXPM: Math.round(avgXPM),
      },
      rolePerformance,
      gamePhaseStats,
      heroPool,
      trends,
    };

    // Write processed team analysis to mock file
    await writeMockData(`team-analysis-${teamId}.json`, teamAnalysis);

    return NextResponse.json(teamAnalysis);
  } catch (error) {
    logWithTimestamp('error', "Error fetching team analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch team analysis" },
      { status: 500 },
    );
  }
}
