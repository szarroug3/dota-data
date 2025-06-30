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
import { Plus, X } from "lucide-react";
import { useState } from "react";

async function fetchOpenDotaMatch(matchId: string) {
  const res = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
  if (!res.ok) throw new Error("Match not found");
  return res.json();
}

interface AddMatchProps {
  onClose: () => void;
}

export default function AddMatch({ onClose }: AddMatchProps) {
  const { currentTeam, addMatch } = useTeam();
  const [matchId, setMatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedMatch, setFetchedMatch] = useState<unknown>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://api.opendota.com/api/matches/${matchId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch match data");

      toast({
        title: "Match Added",
        description: `Successfully fetched match ${matchId}`,
      });
      setMatchId("");
    } catch (error) {
      logWithTimestamp('error', "Error adding match:", error);
      toast({
        title: "Error",
        description: "Failed to add match. Please check the match ID.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchMatch = async () => {
    setError(null);
    setLoading(true);
    setFetchedMatch(null);
    try {
      const data: unknown = await fetchOpenDotaMatch(matchId);
      setFetchedMatch(data);

      toast({
        title: "Match Added",
        description: `Successfully fetched match ${matchId}`,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch match info");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMatch = () => {
    if (!fetchedMatch || typeof fetchedMatch !== "object") return;

    const match = fetchedMatch as {
      radiant_win?: boolean;
      radiant_team?: { team_id?: number; name?: string };
      dire_team?: { team_id?: number; name?: string };
      radiant_score?: number;
      dire_score?: number;
      start_time?: number;
      duration?: number;
      match_id?: number;
    };

    // Determine if current team won or lost
    const radiantWin = match.radiant_win;
    const currentTeamInRadiant =
      match.radiant_team?.team_id?.toString() === currentTeam?.id;
    const result =
      (radiantWin && currentTeamInRadiant) ||
      (!radiantWin && !currentTeamInRadiant)
        ? "W"
        : "L";

    // Get opponent team info
    const opponentTeam = currentTeamInRadiant
      ? match.dire_team
      : match.radiant_team;
    const opponent = opponentTeam?.name || "Unknown Team";

    // Format score (radiant_score - dire_score)
    const score = `${match.radiant_score || 0}-${match.dire_score || 0}`;

    // Format date
    const date = match.start_time
      ? new Date(match.start_time * 1000).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    addMatch({
      opponent,
      date,
      result,
      score,
      league: currentTeam?.league || "",
      notes: `Match ID: ${matchId}`,
    });

    setFetchedMatch(null);
    setMatchId("");
    onClose();
  };

  let matchObj: Record<string, any> | null = null;
  if (typeof fetchedMatch === "object" && fetchedMatch !== null) {
    matchObj = fetchedMatch as Record<string, any>;
  }

  if (!currentTeam) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Match
        </CardTitle>
        <CardDescription>
          Add a match to your team's history using OpenDota match ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="matchId">Match ID</Label>
            <Input
              id="matchId"
              type="text"
              placeholder="Enter OpenDota match ID"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !matchId.trim()}>
            {loading ? "Adding..." : "Add Match"}
          </Button>
        </form>
        {error && (
          <div className="text-red-500 text-sm font-semibold">{error}</div>
        )}
        {loading && (
          <div className="text-muted-foreground text-sm">
            Fetching match info...
          </div>
        )}
        {matchObj && (
          <div className="p-3 border rounded bg-muted/50">
            <div className="font-medium">
              Match #{matchObj.match_id ?? "Unknown"}
            </div>
            <div className="text-sm text-muted-foreground">
              {matchObj.radiant_team?.name || "Radiant"} vs{" "}
              {matchObj.dire_team?.name || "Dire"}
            </div>
            <div className="text-sm text-muted-foreground">
              Score: {matchObj.radiant_score ?? 0} - {matchObj.dire_score ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Result: {matchObj.radiant_win ? "Radiant Victory" : "Dire Victory"}
            </div>
            <div className="text-sm text-muted-foreground">
              Date: {matchObj.start_time
                ? new Date(matchObj.start_time * 1000).toLocaleDateString()
                : "Unknown"}
            </div>
            <div className="text-sm text-muted-foreground">
              Duration: {matchObj.duration
                ? `${Math.floor(matchObj.duration / 60)}:${(matchObj.duration % 60)
                    .toString()
                    .padStart(2, "0")}`
                : "Unknown"}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          {!fetchedMatch ? (
            <Button onClick={handleFetchMatch} disabled={!matchId || loading}>
              <Plus className="w-4 h-4 mr-2" />
              Fetch Match
            </Button>
          ) : (
            <Button onClick={handleAddMatch}>
              <Plus className="w-4 h-4 mr-2" />
              Add Match
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              setFetchedMatch(null);
              setMatchId("");
            }}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
        <p className="text-center text-muted-foreground">
          Can&apos;t find your match? Try a different ID.
        </p>
      </CardContent>
    </Card>
  );
}
