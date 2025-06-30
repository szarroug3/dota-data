import { fetchOpenDota } from "@/lib/api";
import { CACHE_CONFIGS, cacheService } from "@/lib/cache-service";
import { generateMockFilename, writeMockData } from "@/lib/mock-data-writer";
import { formatDuration, getHeroName, logWithTimestamp } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get("name") || "Unknown Player";
    const role = searchParams.get("role") || "Unknown Role";
    const { id: accountId } = await params;

    // Check cache first
    const cachedStats = await cacheService.get("player-stats", accountId);
    
    if (cachedStats) {
      logWithTimestamp('log', `Player stats found in cache for account ${accountId}`);
      return NextResponse.json(cachedStats);
    }

    logWithTimestamp('log', `Player stats not in cache, fetching from OpenDota for account ${accountId}`);

    // Fetch player data from OpenDota API with rate limiting
    const [playerResponse, matchesResponse, heroesResponse] = await Promise.all(
      [
        fetchOpenDota(`players/${accountId}`),
        fetchOpenDota(`players/${accountId}/recentMatches`),
        fetchOpenDota(`players/${accountId}/heroes`),
      ],
    );

    if (!playerResponse.ok || !matchesResponse.ok || !heroesResponse.ok) {
      throw new Error("Failed to fetch player data from OpenDota");
    }

    const [playerData, recentMatches, heroesData] = await Promise.all([
      playerResponse.json(),
      matchesResponse.json(),
      heroesResponse.json(),
    ]);

    // Write raw API responses to mock files
    await writeMockData(
      generateMockFilename(`https://api.opendota.com/api/players/${accountId}`),
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

    // Calculate overall stats
    const totalMatches = heroesData.reduce(
      (sum: number, hero: any) => sum + hero.games,
      0,
    );
    const totalWins = heroesData.reduce(
      (sum: number, hero: any) => sum + hero.win,
      0,
    );
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

    // Calculate average KDA, GPM, XPM from recent matches
    const recentMatchesArray = Array.isArray(recentMatches) ? recentMatches : [];
    const recentMatchesWithStats = recentMatchesArray.filter(
      (match: any) => match && typeof match === 'object' && match.kills !== undefined,
    );
    const avgKDA =
      recentMatchesWithStats.length > 0
        ? recentMatchesWithStats.reduce((sum: number, match: any) => {
            const kda =
              (match.kills + match.assists) / Math.max(match.deaths, 1);
            return sum + kda;
          }, 0) / recentMatchesWithStats.length
        : 0;

    // Calculate average GPM from recent matches
    const avgGPM =
      recentMatchesWithStats.length > 0
        ? recentMatchesWithStats.reduce(
            (sum: number, match: any) =>
              sum + match.total_gold / (match.duration / 60),
            0,
          ) / recentMatchesWithStats.length
        : 0;

    // Calculate average XPM from recent matches
    const avgXPM =
      recentMatchesWithStats.length > 0
        ? recentMatchesWithStats.reduce(
            (sum: number, match: any) =>
              sum + match.total_xp / (match.duration / 60),
            0,
          ) / recentMatchesWithStats.length
        : 0;

    // Calculate average game length
    const avgGameLength =
      recentMatchesWithStats.length > 0
        ? formatDuration(
            recentMatchesWithStats.reduce(
              (sum: number, match: any) => sum + match.duration,
              0,
            ) / recentMatchesWithStats.length,
          )
        : "0:00";

    // Transform recent performance
    const recentPerformance = await Promise.all(
      recentMatchesArray.slice(0, 4).map(async (match: any) => ({
        date: new Date(match.start_time * 1000).toISOString().split("T")[0],
        hero: await getHeroName(match.hero_id),
        result: match.win ? "W" : "L",
        KDA: `${match.kills}/${match.deaths}/${match.assists}`,
        GPM: Math.round(match.total_gold / (match.duration / 60)),
      })),
    );

    // Transform top heroes
    const topHeroes = await Promise.all(
      (Array.isArray(heroesData) ? heroesData : [])
        .sort((a: any, b: any) => b.games - a.games)
        .slice(0, 5)
        .map(async (hero: any) => ({
          hero: await getHeroName(hero.hero_id),
          games: hero.games,
          winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
          avgKDA: 0, // Would need match data to calculate
          avgGPM: 0, // Would need match data to calculate
        })),
    );

    // Calculate trends (simplified)
    const trends = [
      {
        metric: "Win Rate",
        value: winRate,
        trend: "+2%",
        direction: "up" as const,
      },
      {
        metric: "Avg KDA",
        value: avgKDA,
        trend: "+0.1",
        direction: "up" as const,
      },
      {
        metric: "Avg GPM",
        value: Math.round(avgGPM),
        trend: "+15",
        direction: "up" as const,
      },
      {
        metric: "Avg XPM",
        value: Math.round(avgXPM),
        trend: "+20",
        direction: "up" as const,
      },
    ];

    // Get rank information
    const rankTier = playerData.rank_tier || 0;
    const rankInfo = getRankTierInfo(rankTier);

    // Transform recently played heroes
    const recentlyPlayed = await Promise.all(
      (Array.isArray(heroesData) ? heroesData : [])
        .sort((a: any, b: any) => b.last_played - a.last_played)
        .slice(0, 4)
        .map(async (hero: any) => {
          const heroName = await getHeroName(hero.hero_id);
          const heroSlug = heroName
            .toLowerCase()
            .replace(/'/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
          return {
            hero: heroName,
            heroImage: `https://www.dotabuff.com/assets/heroes/${heroSlug}.jpg`,
            games: hero.games,
            winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
          };
        }),
    );

    const playerStats = {
      name: playerName,
      role: role,
      overallStats: {
        matches: totalMatches,
        winRate: winRate,
        avgKDA: avgKDA,
        avgGPM: avgGPM,
        avgXPM: avgXPM,
        avgGameLength: avgGameLength,
      },
      recentPerformance,
      topHeroes,
      trends,
      rankInfo,
      recentlyPlayed,
    };

    // Cache the result
    await cacheService.set(
      "player-stats", 
      playerStats, 
      accountId, 
      undefined, 
      CACHE_CONFIGS.PLAYER_DATA.ttl
    );

    return NextResponse.json(playerStats);
  } catch (error) {
    logWithTimestamp('error', 'Error fetching player stats:', error);
    return NextResponse.json(
      { error: "Failed to fetch player statistics" },
      { status: 500 },
    );
  }
}

// Helper function to get rank tier information
function getRankTierInfo(rankTier: number) {
  const tiers = [
    { rank: "Herald", stars: 1, rankImage: "/ranks/herald.png", immortalRank: undefined },
    { rank: "Herald", stars: 2, rankImage: "/ranks/herald.png", immortalRank: undefined },
    { rank: "Herald", stars: 3, rankImage: "/ranks/herald.png", immortalRank: undefined },
    { rank: "Herald", stars: 4, rankImage: "/ranks/herald.png", immortalRank: undefined },
    { rank: "Herald", stars: 5, rankImage: "/ranks/herald.png", immortalRank: undefined },
    { rank: "Guardian", stars: 1, rankImage: "/ranks/guardian.png", immortalRank: undefined },
    { rank: "Guardian", stars: 2, rankImage: "/ranks/guardian.png", immortalRank: undefined },
    { rank: "Guardian", stars: 3, rankImage: "/ranks/guardian.png", immortalRank: undefined },
    { rank: "Guardian", stars: 4, rankImage: "/ranks/guardian.png", immortalRank: undefined },
    { rank: "Guardian", stars: 5, rankImage: "/ranks/guardian.png", immortalRank: undefined },
    { rank: "Crusader", stars: 1, rankImage: "/ranks/crusader.png", immortalRank: undefined },
    { rank: "Crusader", stars: 2, rankImage: "/ranks/crusader.png", immortalRank: undefined },
    { rank: "Crusader", stars: 3, rankImage: "/ranks/crusader.png", immortalRank: undefined },
    { rank: "Crusader", stars: 4, rankImage: "/ranks/crusader.png", immortalRank: undefined },
    { rank: "Crusader", stars: 5, rankImage: "/ranks/crusader.png", immortalRank: undefined },
    { rank: "Archon", stars: 1, rankImage: "/ranks/archon.png", immortalRank: undefined },
    { rank: "Archon", stars: 2, rankImage: "/ranks/archon.png", immortalRank: undefined },
    { rank: "Archon", stars: 3, rankImage: "/ranks/archon.png", immortalRank: undefined },
    { rank: "Archon", stars: 4, rankImage: "/ranks/archon.png", immortalRank: undefined },
    { rank: "Archon", stars: 5, rankImage: "/ranks/archon.png", immortalRank: undefined },
    { rank: "Legend", stars: 1, rankImage: "/ranks/legend.png", immortalRank: undefined },
    { rank: "Legend", stars: 2, rankImage: "/ranks/legend.png", immortalRank: undefined },
    { rank: "Legend", stars: 3, rankImage: "/ranks/legend.png", immortalRank: undefined },
    { rank: "Legend", stars: 4, rankImage: "/ranks/legend.png", immortalRank: undefined },
    { rank: "Legend", stars: 5, rankImage: "/ranks/legend.png", immortalRank: undefined },
    { rank: "Ancient", stars: 1, rankImage: "/ranks/ancient.png", immortalRank: undefined },
    { rank: "Ancient", stars: 2, rankImage: "/ranks/ancient.png", immortalRank: undefined },
    { rank: "Ancient", stars: 3, rankImage: "/ranks/ancient.png", immortalRank: undefined },
    { rank: "Ancient", stars: 4, rankImage: "/ranks/ancient.png", immortalRank: undefined },
    { rank: "Ancient", stars: 5, rankImage: "/ranks/ancient.png", immortalRank: undefined },
    { rank: "Divine", stars: 1, rankImage: "/ranks/divine.png", immortalRank: undefined },
    { rank: "Divine", stars: 2, rankImage: "/ranks/divine.png", immortalRank: undefined },
    { rank: "Divine", stars: 3, rankImage: "/ranks/divine.png", immortalRank: undefined },
    { rank: "Divine", stars: 4, rankImage: "/ranks/divine.png", immortalRank: undefined },
    { rank: "Divine", stars: 5, rankImage: "/ranks/divine.png", immortalRank: undefined },
  ];

  if (rankTier >= 80) {
    return {
      rank: "Immortal",
      stars: undefined,
      immortalRank: rankTier - 80,
      rankImage: "/ranks/immortal.png",
    };
  }

  return (
    tiers[rankTier - 1] || {
      rank: "Uncalibrated",
      stars: undefined,
      rankImage: "/ranks/uncalibrated.png",
      immortalRank: undefined,
    }
  );
}
