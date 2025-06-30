import { fetchOpenDota } from "@/lib/api";
import { cacheService } from "@/lib/cache-service";
import { generateMockFilename, writeMockData } from "@/lib/mock-data-writer";
import { getHeroNameSync, logWithTimestamp } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "week";

    // Check cache first
    const cachedInsights = await cacheService.get("meta-insights", timeRange);
    
    if (cachedInsights) {
      logWithTimestamp('log', "Meta insights found in cache");
      return NextResponse.json(cachedInsights);
    }

    logWithTimestamp('log', "Meta insights not in cache, fetching from OpenDota");

    // Fetch meta data from OpenDota API with rate limiting
    const [heroesResponse, proMatchesResponse] = await Promise.all([
      fetchOpenDota("heroes"),
      fetchOpenDota("proMatches"),
    ]);

    if (!heroesResponse.ok || !proMatchesResponse.ok) {
      throw new Error("Failed to fetch meta data from OpenDota");
    }

    const [heroesData, proMatches] = await Promise.all([
      heroesResponse.json(),
      proMatchesResponse.json(),
    ]);

    // Write raw API responses to mock files
    await writeMockData(
      generateMockFilename("https://api.opendota.com/api/heroes"),
      heroesData,
    );
    await writeMockData(
      generateMockFilename("https://api.opendota.com/api/proMatches"),
      proMatches,
    );

    // Get recent pro matches (last 100)
    const recentMatches = proMatches.slice(0, 100);

    // Analyze hero performance in pro matches
    const heroStats: {
      [key: string]: {
        picks: number;
        wins: number;
        bans: number;
        totalMatches: number;
      };
    } = {};

    // Initialize hero stats
    heroesData.forEach((hero: any) => {
      heroStats[hero.localized_name] = {
        picks: 0,
        wins: 0,
        bans: 0,
        totalMatches: 0,
      };
    });

    // Analyze recent matches for hero performance
    recentMatches.forEach((match: any) => {
      if (match.picks_bans) {
        match.picks_bans.forEach((pickBan: any) => {
          const heroName = getHeroNameSync(pickBan.hero_id);
          if (heroStats[heroName]) {
            if (pickBan.is_pick) {
              heroStats[heroName].picks++;
              // Determine if this pick won (simplified logic)
              const radiantWon = match.radiant_win;
              const isRadiantPick = pickBan.team === 0;
              if (
                (radiantWon && isRadiantPick) ||
                (!radiantWon && !isRadiantPick)
              ) {
                heroStats[heroName].wins++;
              }
            } else {
              heroStats[heroName].bans++;
            }
            heroStats[heroName].totalMatches++;
          }
        });
      }
    });

    // Calculate meta insights
    const topPicks = Object.entries(heroStats)
      .filter(([_, stats]) => stats.picks > 0)
      .sort(([_, a], [__, b]) => b.picks - a.picks)
      .slice(0, 10)
      .map(([hero, stats]) => ({
        hero,
        picks: stats.picks,
        winRate: stats.picks > 0 ? (stats.wins / stats.picks) * 100 : 0,
        pickRate: (stats.picks / recentMatches.length) * 100,
        banRate: (stats.bans / recentMatches.length) * 100,
      }));

    const topBans = Object.entries(heroStats)
      .filter(([_, stats]) => stats.bans > 0)
      .sort(([_, a], [__, b]) => b.bans - a.bans)
      .slice(0, 10)
      .map(([hero, stats]) => ({
        hero,
        bans: stats.bans,
        banRate: (stats.bans / recentMatches.length) * 100,
      }));

    // Provide mock strategies and roleStats for now
    const strategies = [
      "Aggressive early game with strong laning heroes",
      "Quick teamfight coordination in mid game",
      "Efficient late game scaling",
    ];
    const roleStats = {
      carry: { avgGPM: 680, avgKDA: "6.8/4.3/4.1", winRate: 52.8 },
      mid: { avgGPM: 610, avgKDA: "8.2/4.1/5.6", winRate: 50.2 },
      offlane: { avgGPM: 450, avgKDA: "4.5/6.1/9.2", winRate: 49.5 },
      support: { avgGPM: 310, avgKDA: "2.4/6.5/13.1", winRate: 51.3 },
    };
    // Provide mock metaTrends for now
    const metaTrends = [
      {
        title: "Fast Paced Meta",
        description: "Average game length decreased by 4.1 minutes this week",
        impact: "High",
        trend: "up",
        details:
          "Teams prioritizing early game heroes and aggressive strategies",
      },
      {
        title: "Support Impact Rising",
        description: "Support heroes seeing 15% increase in pick rates",
        impact: "Medium",
        trend: "up",
        details:
          "Meta shift towards utility supports with strong teamfight presence",
      },
    ];

    const insights = {
      currentMeta: {
        description:
          "Recent week shows fast-paced meta with emphasis on early game control",
        keyHeroes: topPicks,
        strategies,
      },
      metaTrends,
      roleStats,
    };

    // Cache the result (use 1 hour TTL for meta insights)
    await cacheService.set(
      "meta-insights", 
      insights, 
      timeRange, 
      undefined, 
      60 * 60 * 1000 // 1 hour
    );

    return NextResponse.json(insights);
  } catch (error) {
    logWithTimestamp('error', "Error fetching meta insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch meta insights" },
      { status: 500 },
    );
  }
}
