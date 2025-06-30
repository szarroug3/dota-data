export const runtime = "nodejs";

import { fetchDotabuff } from "@/lib/api";
import { cacheService } from "@/lib/cache-service";
import { logWithTimestamp } from '@/lib/utils';
import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

function getSeasonIdFromUrl(url: string) {
  // Match /esports/leagues/16435, /esports/leagues/16435-foo, /esports/leagues/16435-foo/tooltip, etc.
  const match = url.match(/\/esports\/leagues\/(\d+)/);
  return match ? match[1] : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  logWithTimestamp('log', "[DOTABUFF IMPORT] ===== STARTING DOTABUFF IMPORT REQUEST =====");
  logWithTimestamp('log', "[DOTABUFF IMPORT] Request method:", request.method);
  logWithTimestamp('log', "[DOTABUFF IMPORT] Request URL:", request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const { id: teamId } = await context.params;
    const seasonId = searchParams.get("season");
    
    logWithTimestamp('log', "[DOTABUFF IMPORT] Extracted teamId:", teamId);
    logWithTimestamp('log', "[DOTABUFF IMPORT] Extracted seasonId:", seasonId);
    
    if (!seasonId) {
      logWithTimestamp('error', "[DOTABUFF IMPORT] Missing season query param");
      return NextResponse.json(
        { error: "Missing season query param" },
        { status: 400 },
      );
    }

    // Check cache first for Dotabuff match IDs
    const cacheKey = `${teamId}-${seasonId}`;
    logWithTimestamp('log', "[DOTABUFF IMPORT] Checking cache with key:", cacheKey);
    const cachedMatchIds = await cacheService.get<{matchIds: string[]}>("dotabuff-matches", cacheKey);
    
    if (cachedMatchIds) {
      logWithTimestamp('log', `[DOTABUFF IMPORT] Cache hit! Found ${cachedMatchIds.matchIds.length} match IDs in cache for team ${teamId}, season ${seasonId}`);
      return NextResponse.json({ matchIds: cachedMatchIds.matchIds });
    }

    logWithTimestamp('log', `[DOTABUFF IMPORT] Cache miss. Fetching from Dotabuff for team ${teamId}, season ${seasonId}`);

    const baseUrl = `https://www.dotabuff.com/esports/teams/${teamId}/matches`;
    logWithTimestamp('log', "[DOTABUFF IMPORT] Base URL:", baseUrl);
    
    let page = 1;
    let totalPages = 1;
    const allMatchIds: string[] = [];
    const seenMatchIds = new Set<string>();

    const fetchPage = async (pageNum: number) => {
      const url = pageNum === 1 ? baseUrl : `${baseUrl}?page=${pageNum}`;
      logWithTimestamp('log', `[DOTABUFF IMPORT] Fetching page ${pageNum}:`, url);
      
      const response = await fetchDotabuff(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      
      logWithTimestamp('log', `[DOTABUFF IMPORT] Page ${pageNum} response status:`, response.status);
      logWithTimestamp('log', `[DOTABUFF IMPORT] Page ${pageNum} response ok:`, response.ok);
      
      if (!response.ok) {
        logWithTimestamp('error', `[DOTABUFF IMPORT] Failed to fetch page ${pageNum}:`, response.status, response.statusText);
        throw new Error(`Failed to fetch page ${pageNum}`);
      }
      
      const text = await response.text();
      logWithTimestamp('log', `[DOTABUFF IMPORT] Page ${pageNum} response length:`, text.length);
      return text;
    };

    logWithTimestamp('log', "[DOTABUFF IMPORT] Fetching first page to determine total pages...");
    const firstHtml = await fetchPage(1);
    const $first = cheerio.load(firstHtml);
    totalPages = 1;
    $first(".pagination a").each((_, el) => {
      const num = parseInt($first(el).text().trim(), 10);
      if (!isNaN(num) && num > totalPages) totalPages = num;
    });
    logWithTimestamp('log', `[DOTABUFF IMPORT] Total pages determined: ${totalPages}`);

    for (page = 1; page <= totalPages; page++) {
      logWithTimestamp('log', `[DOTABUFF IMPORT] Processing page ${page}/${totalPages}`);
      const html = page === 1 ? firstHtml : await fetchPage(page);
      const $ = cheerio.load(html);
      const pageMatchIds: string[] = [];
      const rows = $("table.recent-esports-matches tbody tr");
      logWithTimestamp('log',
        `[DOTABUFF IMPORT] Found ${rows.length} rows on page ${page}`,
      );
      
      rows.each((rowIdx, row) => {
        const tds = $(row).find("td");
        logWithTimestamp('log', `[DOTABUFF IMPORT] Row ${rowIdx}: ${tds.length} tds`);
        const firstTdHtml = tds.eq(0).html();
        logWithTimestamp('log',
          `[DOTABUFF IMPORT] Row ${rowIdx} first <td> HTML:`,
          firstTdHtml,
        );
        const leagueCell = tds.eq(0).find("a");
        if (leagueCell.length === 0) {
          logWithTimestamp('log',
            `[DOTABUFF IMPORT] Row ${rowIdx}: No <a> found in first <td>`,
          );
        } else {
          const leagueUrl = leagueCell.attr("href") || "";
          const leagueSeasonId = getSeasonIdFromUrl(leagueUrl);
          logWithTimestamp('log',
            `[DOTABUFF IMPORT] Row ${rowIdx} leagueUrl: ${leagueUrl}, leagueSeasonId: ${leagueSeasonId}`,
          );
          if (leagueSeasonId !== seasonId) {
            logWithTimestamp('log', `[DOTABUFF IMPORT] Row ${rowIdx}: Season mismatch, skipping`);
            return;
          }
          
          $(row)
            .find('a[href^="/matches/"]')
            .each((_, a) => {
              const matchId = $(a).attr("href")?.split("/").pop();
              if (matchId && !seenMatchIds.has(matchId)) {
                pageMatchIds.push(matchId);
                seenMatchIds.add(matchId);
                logWithTimestamp('log', `[DOTABUFF IMPORT] Row ${rowIdx}: Added match ID ${matchId}`);
              }
            });
        }
      });
      logWithTimestamp('log',
        `[DOTABUFF IMPORT] Page ${page}: ${pageMatchIds.length} matches`,
      );
      allMatchIds.push(...pageMatchIds);
    }
    logWithTimestamp('log',
      `[DOTABUFF IMPORT] Total matches for season ${seasonId}: ${allMatchIds.length}`,
    );
    logWithTimestamp('log', "[DOTABUFF IMPORT] All match IDs:", allMatchIds);

    // Cache the result (use 6 hours TTL for Dotabuff scraping data)
    logWithTimestamp('log', "[DOTABUFF IMPORT] Caching results with key:", cacheKey);
    await cacheService.set(
      "dotabuff-matches", 
      { matchIds: allMatchIds }, 
      cacheKey, 
      undefined, 
      6 * 60 * 60 * 1000 // 6 hours
    );
    logWithTimestamp('log', "[DOTABUFF IMPORT] Results cached successfully");

    logWithTimestamp('log', "[DOTABUFF IMPORT] ===== DOTABUFF IMPORT COMPLETED SUCCESSFULLY =====");
    return NextResponse.json({ matchIds: allMatchIds });
  } catch (e) {
    logWithTimestamp('error', "[DOTABUFF IMPORT] ===== DOTABUFF IMPORT FAILED =====");
    logWithTimestamp('error', "[DOTABUFF IMPORT] Error:", e);
    logWithTimestamp('error', "[DOTABUFF IMPORT] Error details:", {
      message: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
      name: e instanceof Error ? e.name : undefined
    });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
