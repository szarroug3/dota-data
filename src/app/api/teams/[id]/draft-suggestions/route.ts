import { fetchOpenDota } from "@/lib/api";
import { CACHE_CONFIGS, cacheService } from "@/lib/cache-service";
import { generateMockFilename, writeMockData } from "@/lib/mock-data-writer";
import { getHeroNameSync, logWithTimestamp } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// Meta heroes for current patch (simplified)
const metaHeroes = [
  "Anti-Mage",
  "Axe",
  "Bane",
  "Bloodseeker",
  "Crystal Maiden",
  "Drow Ranger",
  "Earthshaker",
  "Juggernaut",
  "Mirana",
  "Morphling",
  "Shadow Fiend",
  "Phantom Lancer",
  "Puck",
  "Pudge",
  "Razor",
  "Sand King",
  "Storm Spirit",
  "Sven",
  "Tiny",
  "Vengeful Spirit",
];

// Hero counters (simplified)
const heroCounters: { [key: string]: string[] } = {
  "Anti-Mage": ["Bloodseeker", "Spirit Breaker", "Doom"],
  Axe: ["Viper", "Razor", "Drow Ranger"],
  Bane: ["Slark", "Lifestealer", "Abaddon"],
  Bloodseeker: ["Anti-Mage", "Slark", "Lifestealer"],
  "Crystal Maiden": ["Slark", "Riki", "Bounty Hunter"],
  "Drow Ranger": ["Axe", "Spirit Breaker", "Clockwerk"],
  Earthshaker: ["Anti-Mage", "Slark", "Lifestealer"],
  Juggernaut: ["Axe", "Bloodseeker", "Doom"],
  Mirana: ["Slark", "Riki", "Bounty Hunter"],
  Morphling: ["Anti-Mage", "Bloodseeker", "Doom"],
};

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
      // Check cache first for player data
      const cachedPlayerData = await cacheService.get<{heroesData: any, recentMatches: any}>("player-draft-data", accountId);
      
      let heroesData, recentMatches;
      if (cachedPlayerData) {
        logWithTimestamp('log', `Player draft data found in cache for account ${accountId}`);
        heroesData = cachedPlayerData.heroesData;
        recentMatches = cachedPlayerData.recentMatches;
      } else {
        logWithTimestamp('log', `Player draft data not in cache, fetching from OpenDota for account ${accountId}`);
        const [heroesResponse, matchesResponse] = await Promise.all([
          fetchOpenDota(`players/${accountId}/heroes`),
          fetchOpenDota(`players/${accountId}/recentMatches`),
        ]);

        if (!heroesResponse.ok || !matchesResponse.ok) {
          throw new Error(`Failed to fetch data for player ${accountId}`);
        }

        [heroesData, recentMatches] = await Promise.all([
          heroesResponse.json(),
          matchesResponse.json(),
        ]);

        // Cache the player data
        await cacheService.set(
          "player-draft-data", 
          { heroesData, recentMatches }, 
          accountId, 
          undefined, 
          CACHE_CONFIGS.PLAYER_DATA.ttl
        );

        // Write raw API responses to mock files
        await writeMockData(
          generateMockFilename(
            `https://api.opendota.com/api/players/${accountId}/heroes`,
          ),
          heroesData,
        );
        await writeMockData(
          generateMockFilename(
            `https://api.opendota.com/api/players/${accountId}/recentMatches`,
          ),
          recentMatches,
        );
      }

      return { accountId, heroesData, recentMatches };
    });

    const playersData = await Promise.all(playerDataPromises);

    // Analyze team strengths and weaknesses
    const allHeroes = playersData.flatMap((p) => p.heroesData);
    const heroStats: {
      [key: string]: {
        games: number;
        wins: number;
        winRate: number;
        role?: string;
      };
    } = {};

    allHeroes.forEach((hero: any) => {
      const heroName = getHeroNameSync(hero.hero_id);
      if (!heroStats[heroName]) {
        heroStats[heroName] = { games: 0, wins: 0, winRate: 0 };
      }
      heroStats[heroName].games += hero.games;
      heroStats[heroName].wins += hero.win;
    });

    Object.values(heroStats).forEach((hero) => {
      hero.winRate = hero.games > 0 ? (hero.wins / hero.games) * 100 : 0;
    });

    // Get top heroes by role (simplified)
    const topHeroes = Object.entries(heroStats)
      .sort(([, a], [, b]) => b.games - a.games)
      .slice(0, 20)
      .map(([hero, stats]) => ({
        hero,
        games: stats.games,
        winRate: stats.winRate,
        role: "Unknown", // Would need hero role data
      }));

    // Generate draft suggestions
    const teamStrengths = {
      carry: topHeroes.find((h) => h.role === "Carry")?.hero || "Anti-Mage",
      mid: topHeroes.find((h) => h.role === "Mid")?.hero || "Shadow Fiend",
      support:
        topHeroes.find((h) => h.role === "Support")?.hero || "Crystal Maiden",
      offlane: topHeroes.find((h) => h.role === "Offlane")?.hero || "Axe",
    };

    const teamWeaknesses = [
      "Limited hero pool in support role",
      "Weak early game presence",
      "Lack of strong initiators",
      "Over-reliance on late game carries",
    ];

    const phaseRecommendations = {
      first: {
        title: "First Phase Picks",
        description: "Focus on versatile heroes that can fit multiple roles",
        heroes: topHeroes.slice(0, 5).map((hero) => ({
          name: hero.hero,
          role: hero.role,
          reason: "High win rate and experience",
          synergy: ["Team fighting", "Scaling"],
          counters: ["Early aggression", "Split pushing"],
          pickPriority: "High",
          winRate: hero.winRate,
          games: hero.games,
        })),
      },
      second: {
        title: "Second Phase Picks",
        description: "Fill remaining roles and counter opponent picks",
        heroes: topHeroes.slice(5, 10).map((hero) => ({
          name: hero.hero,
          role: hero.role,
          reason: "Good performance and flexibility",
          synergy: ["Mid game", "Team coordination"],
          counters: ["Specific counters based on opponent"],
          pickPriority: "Medium",
          winRate: hero.winRate,
          games: hero.games,
        })),
      },
      third: {
        title: "Final Phase Picks",
        description: "Complete the composition and address weaknesses",
        heroes: topHeroes.slice(10, 15).map((hero) => ({
          name: hero.hero,
          role: hero.role,
          reason: "Situational picks based on draft",
          synergy: ["Late game", "Specific strategies"],
          counters: ["Opponent composition"],
          pickPriority: "Low",
          winRate: hero.winRate,
          games: hero.games,
        })),
      },
    };

    const metaCounters = [
      {
        hero: "Anti-Mage",
        counter: "Lion",
        reason: "Strong disable and burst damage",
        effectiveness: "High",
      },
      {
        hero: "Shadow Fiend",
        counter: "Storm Spirit",
        reason: "Mobility and burst damage",
        effectiveness: "Medium",
      },
      {
        hero: "Crystal Maiden",
        counter: "Riki",
        reason: "Squishy support vulnerable to ganks",
        effectiveness: "High",
      },
    ];

    const recentDrafts = [
      {
        date: "2024-01-15",
        opponent: "Team Alpha",
        result: "W",
        picks: ["Anti-Mage", "Shadow Fiend", "Crystal Maiden", "Axe", "Lion"],
        bans: ["Invoker", "Pudge", "Mirana", "Juggernaut", "Tidehunter"],
        notes: "Strong late game composition with good support",
      },
      {
        date: "2024-01-10",
        opponent: "Team Beta",
        result: "L",
        picks: ["Luna", "Storm Spirit", "Witch Doctor", "Tidehunter", "Riki"],
        bans: ["Anti-Mage", "Shadow Fiend", "Crystal Maiden", "Axe", "Lion"],
        notes: "Lost early game, couldn't recover",
      },
    ];

    const draftSuggestions = {
      teamStrengths,
      teamWeaknesses,
      phaseRecommendations,
      metaCounters,
      recentDrafts,
      topHeroes,
    };

    // Write processed draft suggestions to mock file
    await writeMockData(
      `draft-suggestions-${teamId}.json`,
      draftSuggestions,
    );

    return NextResponse.json(draftSuggestions);
  } catch (error) {
    logWithTimestamp('error', "Error fetching draft suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft suggestions" },
      { status: 500 },
    );
  }
}
