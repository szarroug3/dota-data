import { enrichMatchesBatch } from "@/lib/match-enrichment";
import { logWithTimestamp } from '@/lib/utils';
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  logWithTimestamp('log', "[API REFRESH-MATCHES] ===== STARTING API REQUEST =====");
  logWithTimestamp('log', "[API REFRESH-MATCHES] Request method:", request.method);
  logWithTimestamp('log', "[API REFRESH-MATCHES] Request URL:", request.url);
  
  try {
    logWithTimestamp('log', "[API REFRESH-MATCHES] Parsing request body...");
    const body = await request.json();
    logWithTimestamp('log', "[API REFRESH-MATCHES] Request body:", body);
    
    const { matchIds, team } = body;
    logWithTimestamp('log', "[API REFRESH-MATCHES] Extracted matchIds:", matchIds);
    logWithTimestamp('log', "[API REFRESH-MATCHES] Extracted team:", team);
    
    if (!Array.isArray(matchIds) || !team) {
      logWithTimestamp('error', "[API REFRESH-MATCHES] Validation failed:");
      logWithTimestamp('error', "[API REFRESH-MATCHES] matchIds is array:", Array.isArray(matchIds));
      logWithTimestamp('error', "[API REFRESH-MATCHES] team exists:", !!team);
      return NextResponse.json({ error: "matchIds (array) and team are required" }, { status: 400 });
    }
    
    logWithTimestamp('log', "[API REFRESH-MATCHES] Validation passed, creating basic match objects...");
    // Create basic match objects
    const basicMatches = matchIds.map((matchId: string) => ({
      id: matchId,
      date: "",
      opponent: "TBD",
      result: "TBD",
      score: "",
      league: team.league || "",
      notes: "Enriching...",
      openDota: undefined,
    }));
    logWithTimestamp('log', "[API REFRESH-MATCHES] Created basic matches:", basicMatches.length);
    logWithTimestamp('log', "[API REFRESH-MATCHES] First few basic matches:", basicMatches.slice(0, 3));
    
    // Enrich all matches
    logWithTimestamp('log', "[API REFRESH-MATCHES] Starting batch enrichment...");
    const enrichedMatches = await enrichMatchesBatch(basicMatches, team);
    logWithTimestamp('log', "[API REFRESH-MATCHES] Batch enrichment completed");
    logWithTimestamp('log', "[API REFRESH-MATCHES] Enriched matches count:", enrichedMatches.length);
    logWithTimestamp('log', "[API REFRESH-MATCHES] First few enriched matches:", enrichedMatches.slice(0, 3));
    
    logWithTimestamp('log', "[API REFRESH-MATCHES] ===== API REQUEST COMPLETED SUCCESSFULLY =====");
    return NextResponse.json(enrichedMatches);
  } catch (error) {
    logWithTimestamp('error', "[API REFRESH-MATCHES] ===== API REQUEST FAILED =====");
    logWithTimestamp('error', "[API REFRESH-MATCHES] Error:", error);
    logWithTimestamp('error', "[API REFRESH-MATCHES] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ error: "Failed to enrich matches" }, { status: 500 });
  }
} 