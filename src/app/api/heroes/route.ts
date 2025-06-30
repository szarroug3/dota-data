import { fetchOpenDota } from "@/lib/api";
import { CACHE_CONFIGS, cacheService } from "@/lib/cache-service";
import { generateMockFilename, writeMockData } from "@/lib/mock-data-writer";
import { logWithTimestamp } from '@/lib/utils';
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET(request: Request) {
  try {
    // Check cache first
    const cachedHeroes = await cacheService.get("heroes");
    
    if (cachedHeroes) {
      logWithTimestamp('log', "Heroes data found in cache");
      return NextResponse.json(cachedHeroes);
    }

    logWithTimestamp('log', "Heroes data not in cache, fetching from OpenDota");
    
    // Try to fetch heroes data from OpenDota API with rate limiting
    const response = await fetchOpenDota("heroes");

    if (!response.ok) {
      // Fallback to local heroes.json file
      logWithTimestamp('log', "OpenDota API failed, using local heroes.json");
      const heroesPath = path.join(process.cwd(), "data", "heroes.json");
      
      if (fs.existsSync(heroesPath)) {
        const localHeroes = JSON.parse(fs.readFileSync(heroesPath, "utf8"));
        return NextResponse.json(localHeroes);
      } else {
        throw new Error("Local heroes.json not found");
      }
    }

    const heroes = await response.json();

    // Transform the data to include both ID and name mappings
    const heroMappings = {
      byId: {} as Record<number, string>,
      byName: {} as Record<string, string>,
      heroes: heroes as Array<{
        id: number;
        name: string;
        localized_name: string;
        primary_attr: string;
        attack_type: string;
        roles: string[];
        img: string;
        icon: string;
      }>,
    };

    // Build the mappings
    heroes.forEach((hero: any) => {
      heroMappings.byId[hero.id] = hero.localized_name;
      heroMappings.byName[hero.name] = hero.localized_name;
    });

    // Cache the result
    await cacheService.set(
      "heroes", 
      heroMappings, 
      undefined, 
      undefined, 
      CACHE_CONFIGS.HEROES.ttl
    );

    // Write to mock data file
    const filename = generateMockFilename(
      "https://api.opendota.com/api/heroes",
    );
    await writeMockData(filename, heroMappings);

    return NextResponse.json(heroMappings);
  } catch (error) {
    logWithTimestamp('error', "Error fetching heroes:", error);
    
    // Final fallback - return basic hero structure
    return NextResponse.json({
      byId: {},
      byName: {},
      heroes: []
    });
  }
}
