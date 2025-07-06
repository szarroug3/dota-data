import { Button } from "@/components/ui/button";
import { getHeroImageUrl, getRankInfo, getRankTierInfo } from "@/lib/utils";
import { BarChart3, Crown, Loader2, User, X } from "lucide-react";

interface PlayerData {
  name?: string;
  personaname?: string;
  account_id?: number;
  hero_id?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  last_hits?: number;
  denies?: number;
  gold_per_min?: number;
  xp_per_min?: number;
  net_worth?: number;
  level?: number;
  hero_damage?: number;
  tower_damage?: number;
  hero_healing?: number;
  items?: number[];
  backpack?: number[];
  item_win?: number[];
  item_usage?: number[];
  purchase_time?: Record<string, number>;
  first_purchase_time?: Record<string, number>;
  item_purchase_log?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log?: Array<{
    time: number;
    key: string;
  }>;
  item_purchase_log_2?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log_2?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log_2?: Array<{
    time: number;
    key: string;
  }>;
  item_purchase_log_3?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log_3?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log_3?: Array<{
    time: number;
    key: string;
  }>;
  item_purchase_log_4?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log_4?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log_4?: Array<{
    time: number;
    key: string;
  }>;
  item_purchase_log_5?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log_5?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log_5?: Array<{
    time: number;
    key: string;
  }>;
  item_purchase_log_6?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log_6?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log_6?: Array<{
    time: number;
    key: string;
  }>;
  item_purchase_log_7?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log_7?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log_7?: Array<{
    time: number;
    key: string;
  }>;
  item_purchase_log_8?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log_8?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log_8?: Array<{
    time: number;
    key: string;
  }>;
  item_purchase_log_9?: Array<{
    time: number;
    key: string;
  }>;
  item_win_log_9?: Array<{
    time: number;
    key: string;
  }>;
  item_usage_log_9?: Array<{
    time: number;
    key: string;
  }>;
  // Additional properties
  heroes?: Array<{
    hero_id: number;
    games: number;
    last_played: number;
  }>;
  rank_tier?: number;
  topHeroes?: Array<{
    hero_id: number;
    name: string;
    games: number;
    winRate: number;
  }>;
  topRecentHeroes?: Array<{
    hero_id: number;
    name: string;
    games: number;
    winRate: number;
  }>;
}

interface PlayerPopupProps {
  player: PlayerData;
  isOpen: boolean;
  onClose: () => void;
  playerData: PlayerData | null;
  loadingPlayerData: boolean;
  onNavigateToPlayer: (player: PlayerData) => void;
}

// Extracted component for name truncation
function truncateName(name: string, maxLength: number = 20) {
  if (!name) return "Unknown";
  return name.length > maxLength
    ? name.substring(0, maxLength) + "..."
    : name;
}

// Extracted component for player stats calculation
function getPlayerStats(data: PlayerData) {
  return {
    kills: data.kills || 0,
    deaths: data.deaths || 0,
    assists: data.assists || 0,
    lastHits: data.last_hits || 0,
    denies: data.denies || 0,
    gpm: data.gold_per_min || 0,
    xpm: data.xp_per_min || 0,
    netWorth: data.net_worth || 0,
    level: data.level || 0,
    heroDamage: data.hero_damage || 0,
    towerDamage: data.tower_damage || 0,
    heroHealing: data.hero_healing || 0,
  };
}

// Extracted component for top heroes calculation
function getTopHeroes(data: PlayerData | null, _limit: number = 5) {
  if (!data) return [];
  
  // This would need to be implemented with actual hero data
  // For now, return empty array
  return [];
}

// Extracted component for popup header
function PopupHeader({ player, onClose }: { player: PlayerData; onClose: () => void }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Player Quick Info</h2>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{truncateName(player.name || player.personaname || "")}</h3>
            <p className="text-sm text-muted-foreground">
              {player.account_id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extracted component for loading state
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      Loading player data...
    </div>
  );
}

// Extracted component for no data state
function NoDataState() {
  return (
    <div className="text-center text-muted-foreground py-8">
      No player data available
    </div>
  );
}

// Extracted component for rank display
function RankDisplay({ rankTier }: { rankTier: number }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/20 rounded">
      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${getRankInfo(rankTier).color}`}>
          {getRankTierInfo(rankTier).rank}
        </span>
        {getRankTierInfo(rankTier).stars > 0 && (
          <span className="text-xs text-muted-foreground">
            {getRankTierInfo(rankTier).stars} {getRankTierInfo(rankTier).stars === 1 ? 'Star' : 'Stars'}
          </span>
        )}
      </div>
    </div>
  );
}

// Extracted component for hero item
function HeroItem({ 
  hero, 
  index 
}: { 
  hero: { hero_id: number; name: string; games: number; winRate: number }; 
  index: number; 
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
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
  );
}

// Extracted component for top heroes section
function TopHeroesSection({ 
  heroes, 
  title, 
  icon 
}: { 
  heroes: Array<{ hero_id: number; name: string; games: number; winRate: number }>; 
  title: string; 
  icon: React.ReactNode; 
}) {
  if (!heroes || heroes.length === 0) return null;

  return (
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <div className="space-y-2">
        {heroes.map((hero, index) => (
          <HeroItem key={hero.hero_id} hero={hero} index={index} />
        ))}
      </div>
    </div>
  );
}

// Extracted component for action buttons
function ActionButtons({ 
  onNavigateToPlayer, 
  onClose, 
  player 
}: { 
  onNavigateToPlayer: (player: PlayerData) => void; 
  onClose: () => void; 
  player: PlayerData; 
}) {
  return (
    <div className="flex gap-2 pt-4 border-t">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigateToPlayer(player)}
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
  );
}

// Extracted component for hero grid
function HeroGrid({ 
  heroes, 
  title 
}: { 
  heroes: any[]; 
  title: string; 
}) {
  return (
    <div className="mb-2">
      <div className="font-semibold mb-1">{title}</div>
      <div className="flex gap-2">
        {heroes.map((h: any) => (
          <div key={h.id} className="flex flex-col items-center">
            <img src={getHeroImageUrl(h.name)} alt={h.name} className="w-8 h-8 rounded" />
            <span className="text-xs mt-1">{h.name}</span>
            <span className="text-xs text-muted-foreground">{h.games} games</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Extracted component for stats grid
function StatsGrid({ playerData }: { playerData: PlayerData | null }) {
  const stats = playerData ? getPlayerStats(playerData) : {
    kills: 0,
    deaths: 0,
    assists: 0,
    lastHits: 0
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">
          {stats.kills}
        </div>
        <div className="text-sm text-muted-foreground">Kills</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">
          {stats.deaths}
        </div>
        <div className="text-sm text-muted-foreground">Deaths</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">
          {stats.assists}
        </div>
        <div className="text-sm text-muted-foreground">Assists</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">
          {stats.lastHits}
        </div>
        <div className="text-sm text-muted-foreground">Last Hits</div>
      </div>
    </div>
  );
}

// Extracted component for popup content
function PopupContent({ 
  playerData, 
  loadingPlayerData, 
  onNavigateToPlayer, 
  onClose, 
  player 
}: { 
  playerData: PlayerData | null; 
  loadingPlayerData: boolean; 
  onNavigateToPlayer: (player: PlayerData) => void; 
  onClose: () => void; 
  player: PlayerData; 
}) {
  if (loadingPlayerData) {
    return <LoadingState />;
  }

  if (!playerData) {
    return <NoDataState />;
  }

  const topAllTime = getTopHeroes(playerData);
  const topRecent = getTopHeroes(playerData, 3);

  return (
    <div className="space-y-4">
      {/* Player rank info */}
      {playerData.rank_tier && (
        <RankDisplay rankTier={playerData.rank_tier} />
      )}

      {/* Top Heroes All Time */}
      <TopHeroesSection 
        heroes={playerData.topHeroes || []} 
        title="Top Heroes (All Time)" 
        icon={<Crown className="w-4 h-4" />} 
      />

      {/* Top Heroes Last 3 Months */}
      <TopHeroesSection 
        heroes={playerData.topRecentHeroes || []} 
        title="Top Heroes (Last 3 Months)" 
        icon={<BarChart3 className="w-4 h-4" />} 
      />

      {/* Action Buttons */}
      <ActionButtons 
        onNavigateToPlayer={onNavigateToPlayer} 
        onClose={onClose} 
        player={player} 
      />

      <HeroGrid heroes={topAllTime} title="Top 5 Heroes (All Time)" />
      <HeroGrid heroes={topRecent} title="Top 5 Heroes (Last 3 Months)" />

      <StatsGrid playerData={playerData} />
    </div>
  );
}

export default function PlayerPopup({
  player,
  isOpen,
  onClose,
  playerData,
  loadingPlayerData,
  onNavigateToPlayer,
}: PlayerPopupProps) {
  if (!isOpen || !player) return null;

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
        <PopupHeader player={player} onClose={onClose} />
        <div className="p-4">
          <PopupContent 
            playerData={playerData}
            loadingPlayerData={loadingPlayerData}
            onNavigateToPlayer={onNavigateToPlayer}
            onClose={onClose}
            player={player}
          />
        </div>
      </div>
    </div>
  );
} 