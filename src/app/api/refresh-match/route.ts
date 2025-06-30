import { enrichMatchWithOpenDota } from "@/lib/match-enrichment";
import { logWithTimestamp } from '@/lib/utils';
import type { Team } from "@/types/team";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { matchId, team } = await request.json();
    if (!matchId || !team) {
      return NextResponse.json({ error: "matchId and team are required" }, { status: 400 });
    }
    const enrichedMatch = await enrichMatchWithOpenDota(matchId, team as Team);
    return NextResponse.json(enrichedMatch);
  } catch (error) {
    logWithTimestamp('error', "[API] Error enriching match:", error);
    return NextResponse.json({ error: "Failed to enrich match" }, { status: 500 });
  }
} 