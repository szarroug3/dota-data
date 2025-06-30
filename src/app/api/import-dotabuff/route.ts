import { fetchDotabuff, fetchOpenDota } from "@/lib/api";
import { CACHE_CONFIGS, cacheService } from "@/lib/cache-service";
import { writeMockData } from "@/lib/mock-data-writer";
import { logWithTimestamp } from '@/lib/utils';
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url, type } = await req.json();

    // Match history import logic
    if (type === "matches") {
      if (!url)
        return NextResponse.json({ error: "Missing URL" }, { status: 400 });

      const res = await fetch(url);
      if (!res.ok)
        return NextResponse.json(
          { error: "Failed to fetch Dotabuff" },
          { status: 500 },
        );
      const html = await res.text();

      // Extract team info from URL
      const teamIdMatch = url.match(/teams\/(\d+)/);
      const teamId = teamIdMatch ? teamIdMatch[1] : "";

      // Parse team name from HTML
      const nameMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
      const teamName = nameMatch
        ? nameMatch[1].replace(/<[^>]+>/g, "").trim()
        : "";

      // Define team object for later use
      const team = { id: teamId, name: teamName };

      // Parse league URL from the page
      const leagueMatch = html.match(/href="([^"]*\/leagues\/[^"]*)"/);
      const leagueUrl = leagueMatch ? leagueMatch[1] : "";

      // Parse matches from the HTML
      const matches: any[] = [];
      const rows = html.split("<tr>");

      for (const row of rows) {
        // Check if this row contains our team
        if (
          row.includes(`/esports/teams/${team.id}`) ||
          row.toLowerCase().includes(team.name.toLowerCase())
        ) {
          // Find the match link
          const matchLink = row.match(/href="\/matches\/(\d+)"/);
          if (matchLink) {
            const matchId = matchLink[1];

            // Extract all team links in the row - try multiple patterns
            let opponent = "";

            // Pattern 1: Look for series title that contains team names
            const seriesTitleMatch = row.match(
              /title="Series \d+[^"]*?([^"]*?vs[^"]*?)"/,
            );
            if (seriesTitleMatch) {
              const seriesTitle = seriesTitleMatch[1];

              // Extract team names from "team1-vs-team2" format
              const teamsMatch = seriesTitle.match(/([^-]+)-vs-([^-]+)/);
              if (teamsMatch) {
                const team1 = teamsMatch[1];
                const team2 = teamsMatch[2];

                // Determine which is the opponent
                if (
                  team1
                    .toLowerCase()
                    .includes(team.name.toLowerCase().replace(/\s+/g, ""))
                ) {
                  opponent = team2;
                } else if (
                  team2
                    .toLowerCase()
                    .includes(team.name.toLowerCase().replace(/\s+/g, ""))
                ) {
                  opponent = team1;
                }
              }
            }

            // Pattern 2: Standard team link pattern
            if (!opponent) {
              const teamLinks = Array.from(
                row.matchAll(/\/esports\/teams\/(\d+)[^>]*>([^<]+)<\/a>/g),
              );

              for (const [, id, name] of teamLinks) {
                if (id !== team.id) {
                  opponent = name.trim();
                  break;
                }
              }
            }

            // Pattern 3: If no opponent found, try alternative pattern
            if (!opponent) {
              const altTeamLinks = Array.from(
                row.matchAll(/href="\/esports\/teams\/[^">]+">([^<]+)<\/a>/g),
              );

              for (const [, name] of altTeamLinks) {
                const trimmedName = name.trim();
                if (trimmedName.toLowerCase() !== team.name.toLowerCase()) {
                  opponent = trimmedName;
                  break;
                }
              }
            }

            // Pattern 4: Look for any text that might be a team name (fallback)
            if (!opponent) {
              // Look for text that's not our team name and looks like a team name
              const textMatches = row.match(/>([A-Za-z0-9\s\-_]+)</g);
              if (textMatches) {
                for (const match of textMatches) {
                  const text = match.slice(1, -1).trim();
                  if (
                    text &&
                    text.length > 2 &&
                    text.length < 50 &&
                    text.toLowerCase() !== team.name.toLowerCase() &&
                    !text.match(/^\d+$/) && // Not just numbers
                    !text.match(
                      /^(W|L|D|T|BO\d+|Series|Completed|Currently|Live)$/i,
                    )
                  ) {
                    // Not just result letters or series types
                    opponent = text;
                    break;
                  }
                }
              }
            }

            matches.push({
              id: matchId,
              date: "", // To be filled from OpenDota
              opponent,
              result: "", // To be filled from OpenDota
              score: "", // To be filled from OpenDota
              league: leagueUrl,
              notes: "",
            });
          }
        }
      }

      // Enrich matches with OpenDota data
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          try {
            // Check cache first for match data
            const cachedMatch = await cacheService.get("match", match.id);
            
            let odData;
            if (cachedMatch) {
              logWithTimestamp('log', `Match ${match.id} found in cache`);
              odData = cachedMatch;
            } else {
              logWithTimestamp('log', `Match ${match.id} not in cache, fetching from OpenDota`);
              const odRes = await fetchOpenDota(`matches/${match.id}`);
              if (!odRes.ok) return match;
              odData = await odRes.json();

              // Cache the match data
              await cacheService.set(
                "match", 
                odData, 
                match.id, 
                undefined, 
                CACHE_CONFIGS.MATCH_DETAILS.ttl
              );

              // Write raw match data to mock file
              await writeMockData(`match-${match.id}.json`, odData);
            }

            // Determine if current team is radiant or dire
            const radiantTeamId = odData.radiant_team?.team_id?.toString();
            const direTeamId = odData.dire_team?.team_id?.toString();
            const isRadiant = radiantTeamId === team.id;
            const isDire = direTeamId === team.id;
            let result = "";
            if (isRadiant || isDire) {
              const win = odData.radiant_win;
              result = (isRadiant && win) || (isDire && !win) ? "W" : "L";
            }
            // Get opponent name
            let opponent = match.opponent;
            if (!opponent) {
              if (isRadiant && odData.dire_team?.name)
                opponent = odData.dire_team.name;
              else if (isDire && odData.radiant_team?.name)
                opponent = odData.radiant_team.name;
            }
            // Format score
            const score = `${odData.radiant_score ?? ""}-${odData.dire_score ?? ""}`;
            // Format date
            const date = odData.start_time
              ? new Date(odData.start_time * 1000).toISOString().split("T")[0]
              : "";
            return {
              ...match,
              date,
              opponent,
              result,
              score,
              openDota: odData, // Attach full OpenDota data for debugging
            };
          } catch (e) {
            return match;
          }
        }),
      );

      // Write enriched matches to mock data file
      await writeMockData(`enriched-matches-${teamId}.json`, enrichedMatches);

      return NextResponse.json(enrichedMatches);
    }

    // Original team import logic
    if (!url)
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });

    // Clean up the URL to use the main team page instead of matches page
    let cleanUrl = url;
    if (url.includes('/matches')) {
      cleanUrl = url.replace('/matches', '');
    }

    const res = await fetchDotabuff(cleanUrl);
    if (!res.ok)
      return NextResponse.json(
        { error: "Failed to fetch Dotabuff" },
        { status: 500 },
      );
    const html = await res.text();

    // Parse team name
    const nameMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
    let name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    
    // Clean up the name to remove "Matches" suffix if present
    if (name.endsWith('Matches')) {
      name = name.slice(0, -7); // Remove "Matches" (7 characters)
    }

    // Parse team tag (look for 'Team Tag' nearby)
    const tagMatch = html.match(/Team Tag<\/div>\s*<div[^>]*>(.*?)<\/div>/);
    const tag = tagMatch ? tagMatch[1].replace(/<[^>]+>/g, "").trim() : "";

    // Parse record - look for W-L format more specifically
    // Look for patterns like "17-6" or "W-L" format
    const recordMatch = html.match(/(\d+)\s*-\s*(\d+)/);
    let record = "";
    if (recordMatch) {
      const wins = parseInt(recordMatch[1]);
      const losses = parseInt(recordMatch[2]);
      // Only use if it looks like a reasonable record (not huge numbers)
      if (wins <= 100 && losses <= 100) {
        record = `${wins}-${losses}`;
      }
    }

    // Parse win rate (look for percentage)
    const winRateMatch = html.match(/(\d+\.?\d*)%/);
    const winRate = winRateMatch ? `${winRateMatch[1]}%` : "";

    // Extract team ID from URL
    const teamIdMatch = cleanUrl.match(/teams\/(\d+)/);
    const teamId = teamIdMatch ? teamIdMatch[1] : "";

    const teamData = {
      id: teamId,
      name,
      tag,
      record,
      winRate,
      dotabuffUrl: cleanUrl,
    };

    // Write team data to mock file
    await writeMockData(`team-${teamId}.json`, teamData);

    return NextResponse.json(teamData);
  } catch (error) {
    logWithTimestamp('error', "Import error:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 },
    );
  }
}
