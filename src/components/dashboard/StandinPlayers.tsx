import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, User } from "lucide-react";
import { useTeam } from "@/contexts/team-context";

export default function StandinPlayers() {
  const { currentTeam, removeStandinPlayer } = useTeam();

  if (!currentTeam) {
    return null;
  }

  const standinPlayers = currentTeam.players.filter(
    (player) => player.isStandin,
  );
  const regularPlayers = currentTeam.players.filter(
    (player) => !player.isStandin,
  );

  if (standinPlayers.length === 0) {
    return null;
  }

  const getPlayerName = (playerId: string) => {
    const player = regularPlayers.find((p) => p.id === playerId);
    return player?.name || "Unknown Player";
  };

  return (
    <div>
      {standinPlayers.map((player, idx) => (
        <div
          key={player.id}
          className={`flex items-center justify-between p-3 border rounded-lg ${idx < standinPlayers.length - 1 ? "mb-2" : ""}`}
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-medium text-sm truncate max-w-[120px]">
              {player.name}
            </span>
            <Badge variant="secondary" className="text-xs">
              Standin
            </Badge>
            {player.role && (
              <Badge variant="outline" className="text-xs">
                {player.role}
              </Badge>
            )}
            {player.mmr && (
              <span className="text-xs text-muted-foreground">
                [{player.mmr} MMR]
              </span>
            )}
            {player.standinFor && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                Standing in for {getPlayerName(player.standinFor)}
              </span>
            )}
            {player.addedDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Added {player.addedDate}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeStandinPlayer(player.id)}
            title="Remove standin"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
