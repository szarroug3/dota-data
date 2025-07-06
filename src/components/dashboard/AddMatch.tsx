"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTeam } from "@/contexts/team-context";
import { logWithTimestamp } from '@/lib/utils';
import { Plus } from "lucide-react";
import { useState } from "react";

interface AddMatchProps {
  onClose: () => void;
}

interface OpenDotaMatch {
  radiant_win: boolean;
  radiant_team?: { team_id?: number; name?: string };
  dire_team?: { team_id?: number; name?: string };
  radiant_score?: number;
  dire_score?: number;
  start_time?: number;
}

interface Team {
  id?: string;
  league?: string;
}

function getMatchResult(match: OpenDotaMatch, currentTeam: Team) {
  const radiantWin = match.radiant_win;
  const currentTeamInRadiant = match.radiant_team?.team_id?.toString() === currentTeam?.id;
  return (radiantWin && currentTeamInRadiant) || (!radiantWin && !currentTeamInRadiant) ? "W" : "L";
}

function getOpponentTeam(match: OpenDotaMatch, currentTeam: Team) {
  const currentTeamInRadiant = match.radiant_team?.team_id?.toString() === currentTeam?.id;
  return currentTeamInRadiant ? match.dire_team : match.radiant_team;
}

function getMatchScore(match: OpenDotaMatch) {
  return `${match.radiant_score || 0}-${match.dire_score || 0}`;
}

function getMatchDate(match: OpenDotaMatch) {
  return match.start_time ? new Date(match.start_time * 1000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
}

function processMatchData(match: OpenDotaMatch, currentTeam: Team, matchId: string) {
  const result = getMatchResult(match, currentTeam);
  const opponentTeam = getOpponentTeam(match, currentTeam);
  const opponent = opponentTeam?.name || "Unknown Team";
  const score = getMatchScore(match);
  const date = getMatchDate(match);

  return {
    opponent,
    date,
    result,
    score,
    league: currentTeam?.league || "",
    notes: `Match ID: ${matchId}`,
  };
}

export default function AddMatch({ onClose }: AddMatchProps) {
  const { currentTeam, addMatch } = useTeam();
  const [matchId, setMatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch match data from OpenDota
      const res = await fetch(
        `/api/matches/${matchId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: currentTeam?.id || 'manual' }),
        }
      );
      if (!res.ok) throw new Error("Failed to fetch match data");
      const match = await res.json();

      // Process match data
      const matchData = processMatchData(match, currentTeam || { id: 'manual', league: '' }, matchId);
      await addMatch(matchData);

      toast({
        title: "Match Added",
        description: `Successfully added match ${matchId}`,
      });
      setMatchId("");
      onClose();
    } catch (error) {
      logWithTimestamp('error', "Error adding match:", error);
      setError("Failed to add match. Please check the match ID.");
      toast({
        title: "Error",
        description: "Failed to add match. Please check the match ID.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentTeam) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Match
        </CardTitle>
        <CardDescription>
          Add a match to the team&apos;s history using a match ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="matchId">Match ID</Label>
            <Input
              id="matchId"
              type="text"
              placeholder="1234567890"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !matchId.trim()}>
            {loading ? "Adding..." : "Add Match"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </form>
        {error && (
          <div className="text-red-500 text-sm font-semibold">{error}</div>
        )}
      </CardContent>
    </Card>
  );
}
