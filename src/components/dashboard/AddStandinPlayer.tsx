"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTeam } from "@/contexts/team-context";
import { Plus } from "lucide-react";
import { useState } from "react";

async function fetchOpenDotaPlayer(playerId: string) {
  // Accepts Steam32 or Steam64, converts if needed
  let id = playerId;
  if (/^765/.test(playerId)) {
    // Convert Steam64 to Steam32
    id = (BigInt(playerId) - 76561197960265728n).toString();
  }
  const res = await fetch(`/api/players/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ force: false }),
  });
  if (!res.ok) throw new Error("Player not found");
  return res.json();
}

interface AddStandinPlayerProps {
  onClose?: () => void;
}

export default function AddStandinPlayer({ onClose }: AddStandinPlayerProps) {
  const { currentTeam, addStandinPlayer } = useTeam();
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    id: "",
    role: "",
    standinFor: "",
    isStandin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedMMR, setFetchedMMR] = useState<number | null>(null);
  const { toast } = useToast();

  const handleAddPlayer = async () => {
    setError(null);
    setLoading(true);
    setFetchedMMR(null);
    try {
      const data = await fetchOpenDotaPlayer(newPlayer.id);
      setFetchedMMR(data.mmr_estimate?.estimate || null);

      addStandinPlayer(
        {
          name: newPlayer.name,
          id: newPlayer.id,
          role: newPlayer.role || undefined,
          mmr: data.mmr_estimate?.estimate,
        },
        newPlayer.isStandin && newPlayer.standinFor ? newPlayer.standinFor : undefined,
      );

      toast({
        title: newPlayer.isStandin ? "Standin Player Added" : "Player Added",
        description: `Successfully added ${newPlayer.name}${newPlayer.isStandin ? ' as standin player' : ' to your team'}`,
      });

      // Reset form
      setNewPlayer({
        name: "",
        id: "",
        role: "",
        standinFor: "",
        isStandin: false,
      });
      setFetchedMMR(null);
      
      if (onClose) {
        onClose();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch player info");
    } finally {
      setLoading(false);
    }
  };

  if (!currentTeam) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No team selected. Please import a team first.
      </div>
    );
  }

  // Get regular players (non-standins) for the dropdown
  const regularPlayers = currentTeam.players.filter(
    (player) => !player.isStandin,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="player-name">Player Name</Label>
          <Input
            id="player-name"
            value={newPlayer.name}
            onChange={(e) =>
              setNewPlayer({ ...newPlayer, name: e.target.value })
            }
            placeholder="e.g., PlayerName123"
          />
        </div>
        <div>
          <Label htmlFor="player-id">Player ID (Steam32 or Steam64)</Label>
          <Input
            id="player-id"
            value={newPlayer.id}
            onChange={(e) =>
              setNewPlayer({ ...newPlayer, id: e.target.value })
            }
            placeholder="e.g., 123456789 or 7656119..."
          />
        </div>
        <div>
          <Label htmlFor="player-role">Role (Optional)</Label>
          <Select
            value={newPlayer.role}
            onValueChange={(value) =>
              setNewPlayer({ ...newPlayer, role: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Carry">Carry</SelectItem>
              <SelectItem value="Mid">Mid</SelectItem>
              <SelectItem value="Offlane">Offlane</SelectItem>
              <SelectItem value="Support">Support</SelectItem>
              <SelectItem value="Hard Support">Hard Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="player-standin-for">Standing in for (Optional)</Label>
          <Select
            value={newPlayer.standinFor || "none"}
            onValueChange={(value) =>
              setNewPlayer({
                ...newPlayer,
                standinFor: value === "none" ? "" : value,
              })
            }
            disabled={!newPlayer.isStandin}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select player they're replacing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific replacement</SelectItem>
              {regularPlayers.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name} {player.role && `(${player.role})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-standin"
          checked={newPlayer.isStandin}
          onCheckedChange={(checked) =>
            setNewPlayer({ ...newPlayer, isStandin: checked as boolean })
          }
        />
        <Label htmlFor="is-standin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          This player is a standin (temporary player)
        </Label>
      </div>

      {error && (
        <div className="text-red-500 text-sm font-semibold">{error}</div>
      )}
      {loading && (
        <div className="text-muted-foreground text-sm">
          Fetching player info...
        </div>
      )}
      {fetchedMMR !== null && (
        <div className="text-green-600 text-sm">
          Fetched MMR: {fetchedMMR}
        </div>
      )}
      <Button
        onClick={handleAddPlayer}
        disabled={!newPlayer.name || !newPlayer.id || loading}
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Player
      </Button>
    </div>
  );
}
