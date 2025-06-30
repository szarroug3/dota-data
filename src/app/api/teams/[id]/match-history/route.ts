import { logWithTimestamp } from '@/lib/utils';
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

const MATCH_PREFIX = "match-";
const TEAM_PREFIX = "team-";
const MATCH_EXPIRY_DAYS = 30;

// Type definitions
interface TeamData {
  matchIds?: string[];
  lastAccessed?: string;
}

interface MatchData {
  id: string;
  lastAccessed: string;
  [key: string]: any;
}

// Helper to get current ISO timestamp
function nowISO() {
  return new Date().toISOString();
}

// Helper to check if a match is expired
function isExpired(lastAccessed: string, days: number) {
  const then = new Date(lastAccessed).getTime();
  const now = Date.now();
  return now - then > days * 24 * 60 * 60 * 1000;
}

// GET: Fetch all matches for a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  logWithTimestamp('log', "[REDIS API] ===== GET MATCHES REQUEST =====");
  logWithTimestamp('log', "[REDIS API] Request method:", request.method);
  logWithTimestamp('log', "[REDIS API] Request URL:", request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const { id: teamId } = await params;
    logWithTimestamp('log', "[REDIS API] Team ID:", teamId);
    
    // Get team data (list of match IDs)
    const teamKey = `${TEAM_PREFIX}${teamId}`;
    logWithTimestamp('log', "[REDIS API] Looking up team with key:", teamKey);
    const team = (await redis.get(teamKey)) as TeamData | null;
    logWithTimestamp('log', "[REDIS API] Team data from Redis:", team);
    
    if (!team || !team.matchIds) {
      logWithTimestamp('log', "[REDIS API] No team data or match IDs found, returning empty array");
      return NextResponse.json({ matches: [] });
    }
    
    logWithTimestamp('log', "[REDIS API] Found match IDs:", team.matchIds);
    logWithTimestamp('log', "[REDIS API] Match IDs count:", team.matchIds.length);
    
    // Fetch all matches for this team
    const matchKeys = team.matchIds.map((id: string) => `${MATCH_PREFIX}${id}`);
    logWithTimestamp('log', "[REDIS API] Match keys to fetch:", matchKeys);
    
    const matches = await redis.mget(matchKeys);
    logWithTimestamp('log', "[REDIS API] Raw matches from Redis:", matches);
    logWithTimestamp('log', "[REDIS API] Raw matches count:", matches.length);
    
    // Filter out expired matches and update lastAccessed
    const freshMatches = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i] as MatchData | null;
      if (match && !isExpired(match.lastAccessed, MATCH_EXPIRY_DAYS)) {
        // Update lastAccessed
        match.lastAccessed = nowISO();
        await redis.set(matchKeys[i], match);
        freshMatches.push(match);
        logWithTimestamp('log', `[REDIS API] Added fresh match ${i}:`, match.id);
      } else if (match) {
        // Remove expired match
        await redis.del(matchKeys[i]);
        logWithTimestamp('log', `[REDIS API] Removed expired match ${i}:`, match.id);
      } else {
        logWithTimestamp('log', `[REDIS API] Match ${i} was null or undefined`);
      }
    }
    
    logWithTimestamp('log', "[REDIS API] Final fresh matches count:", freshMatches.length);
    logWithTimestamp('log', "[REDIS API] ===== GET MATCHES COMPLETED SUCCESSFULLY =====");
    return NextResponse.json({ matches: freshMatches });
  } catch (error) {
    logWithTimestamp('error', "[REDIS API] ===== GET MATCHES FAILED =====");
    logWithTimestamp('error', "[REDIS API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch match history" },
      { status: 500 },
    );
  }
}

// POST: Add or update matches for a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  logWithTimestamp('log', "[REDIS API] ===== POST MATCHES REQUEST =====");
  logWithTimestamp('log', "[REDIS API] Request method:", request.method);
  logWithTimestamp('log', "[REDIS API] Request URL:", request.url);
  
  try {
    const { id: teamId } = await params;
    logWithTimestamp('log', "[REDIS API] Team ID:", teamId);
    
    const body = await request.json();
    logWithTimestamp('log', "[REDIS API] Request body:", body);
    
    const { matches } = body;
    logWithTimestamp('log', "[REDIS API] Matches from body:", matches);
    logWithTimestamp('log', "[REDIS API] Matches count:", matches?.length);
    
    if (!Array.isArray(matches)) {
      logWithTimestamp('error', "[REDIS API] Invalid matches array");
      return NextResponse.json(
        { error: "Invalid matches array" },
        { status: 400 },
      );
    }
    
    // Store each match by matchId
    const matchIds: string[] = [];
    logWithTimestamp('log', "[REDIS API] Storing matches in Redis...");
    
    for (const match of matches) {
      if (!match.id) {
        logWithTimestamp('log', "[REDIS API] Skipping match without ID:", match);
        continue;
      }
      
      match.lastAccessed = nowISO();
      const matchKey = `${MATCH_PREFIX}${match.id}`;
      logWithTimestamp('log', "[REDIS API] Storing match with key:", matchKey);
      await redis.set(matchKey, match);
      matchIds.push(match.id);
      logWithTimestamp('log', "[REDIS API] Stored match:", match.id);
    }
    
    logWithTimestamp('log', "[REDIS API] All matches stored, match IDs:", matchIds);
    
    // Update team data with matchIds and lastAccessed
    const teamKey = `${TEAM_PREFIX}${teamId}`;
    logWithTimestamp('log', "[REDIS API] Updating team data with key:", teamKey);
    
    const team = ((await redis.get(teamKey)) as TeamData) || {};
    team.matchIds = matchIds;
    team.lastAccessed = nowISO();
    await redis.set(teamKey, team);
    
    logWithTimestamp('log', "[REDIS API] Team data updated:", team);
    logWithTimestamp('log', "[REDIS API] ===== POST MATCHES COMPLETED SUCCESSFULLY =====");
    return NextResponse.json({ success: true });
  } catch (error) {
    logWithTimestamp('error', "[REDIS API] ===== POST MATCHES FAILED =====");
    logWithTimestamp('error', "[REDIS API] Error:", error);
    return NextResponse.json(
      { error: "Failed to save match history" },
      { status: 500 },
    );
  }
}

// DELETE: Cleanup old matches for a team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: teamId } = await params;
    const team = (await redis.get(`${TEAM_PREFIX}${teamId}`)) as TeamData | null;
    if (!team || !team.matchIds) {
      return NextResponse.json({ deleted: 0 });
    }
    let deleted = 0;
    for (const matchId of team.matchIds) {
      const match = (await redis.get(`${MATCH_PREFIX}${matchId}`)) as MatchData | null;
      if (match && isExpired(match.lastAccessed, MATCH_EXPIRY_DAYS)) {
        await redis.del(`${MATCH_PREFIX}${matchId}`);
        deleted++;
      }
    }
    return NextResponse.json({ deleted });
  } catch (error) {
    logWithTimestamp('error', "Error cleaning up matches:");
    logWithTimestamp('error', error);
    return NextResponse.json(
      { error: "Failed to cleanup matches" },
      { status: 500 },
    );
  }
}
