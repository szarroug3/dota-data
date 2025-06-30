import { Button } from "@/components/ui/button";
import { getHeroImageUrl, getHeroNameSync, getRankInfo, getRankTierInfo } from "@/lib/utils";
import { BarChart3, Crown, Loader2, User, X } from "lucide-react";

interface PlayerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlayer: any;
  playerData: any;
  loadingPlayerData: boolean;
  onNavigateToPlayer: (player: any) => void;
}

function getTopHeroes(playerData: any, months?: number) {
  if (!playerData || !playerData.heroes) return [];
  let heroes = playerData.heroes;
  if (months) {
    const cutoff = Date.now() / 1000 - months * 30 * 24 * 60 * 60;
    heroes = heroes.filter((h: any) => h.last_played >= cutoff);
  }
  return heroes
    .sort((a: any, b: any) => b.games - a.games)
    .slice(0, 5)
    .map((h: any) => ({
      id: h.hero_id,
      name: getHeroNameSync(h.hero_id),
      games: h.games,
    }));
}

export default function PlayerPopup({
  isOpen,
  onClose,
  selectedPlayer,
  playerData,
  loadingPlayerData,
  onNavigateToPlayer,
}: PlayerPopupProps) {
  if (!isOpen || !selectedPlayer) return null;

  const truncateName = (name: string, maxLength: number = 20) => {
    if (!name) return "Unknown";
    return name.length > maxLength
      ? name.substring(0, maxLength) + "..."
      : name;
  };

  const topAllTime = getTopHeroes(playerData);
  const topRecent = getTopHeroes(playerData, 3);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto p-6 relative">
        <button
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Player Quick Info</h2>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">{truncateName(selectedPlayer.name)}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedPlayer.account_id}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          {loadingPlayerData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading player data...
            </div>
          ) : playerData ? (
            <div className="space-y-4">
              {/* Player rank info */}
              {playerData.rank_tier && (
                <div className="flex items-center gap-2 p-3 bg-muted/20 rounded">
                  <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${getRankInfo(playerData.rank_tier).color}`}>
                      {getRankTierInfo(playerData.rank_tier).rank}
                    </span>
                    {getRankTierInfo(playerData.rank_tier).stars > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {getRankTierInfo(playerData.rank_tier).stars} {getRankTierInfo(playerData.rank_tier).stars === 1 ? 'Star' : 'Stars'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Top Heroes All Time */}
              {playerData?.topHeroes && playerData.topHeroes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Top Heroes (All Time)
                  </h4>
                  <div className="space-y-2">
                    {playerData.topHeroes.map((hero: any, index: number) => (
                      <div
                        key={hero.hero_id}
                        className="flex items-center justify-between p-2 bg-muted/20 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <img
                            src={getHeroImageUrl(hero.name)}
                            alt={hero.name}
                            className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/window.svg";
                            }}
                          />
                          <span className="font-medium">{hero.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {hero.games} games • {hero.winRate}% WR
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Heroes Last 3 Months */}
              {playerData?.topRecentHeroes && playerData.topRecentHeroes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Top Heroes (Last 3 Months)
                  </h4>
                  <div className="space-y-2">
                    {playerData.topRecentHeroes.map((hero: any, index: number) => (
                      <div
                        key={hero.hero_id}
                        className="flex items-center justify-between p-2 bg-muted/20 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <img
                            src={getHeroImageUrl(hero.name)}
                            alt={hero.name}
                            className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/window.svg";
                            }}
                          />
                          <span className="font-medium">{hero.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {hero.games} games • {hero.winRate}% WR
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToPlayer(selectedPlayer)}
                  className="flex-1"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Full Stats
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>

              <div className="mb-2">
                <div className="font-semibold mb-1">Top 5 Heroes (All Time)</div>
                <div className="flex gap-2 mb-2">
                  {topAllTime.map((h: any) => (
                    <div key={h.id} className="flex flex-col items-center">
                      <img src={getHeroImageUrl(h.name)} alt={h.name} className="w-8 h-8 rounded" />
                      <span className="text-xs mt-1">{h.name}</span>
                      <span className="text-xs text-muted-foreground">{h.games} games</span>
                    </div>
                  ))}
                </div>
                <div className="font-semibold mb-1">Top 5 Heroes (Last 3 Months)</div>
                <div className="flex gap-2">
                  {topRecent.map((h: any) => (
                    <div key={h.id} className="flex flex-col items-center">
                      <img src={getHeroImageUrl(h.name)} alt={h.name} className="w-8 h-8 rounded" />
                      <span className="text-xs mt-1">{h.name}</span>
                      <span className="text-xs text-muted-foreground">{h.games} games</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No player data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 