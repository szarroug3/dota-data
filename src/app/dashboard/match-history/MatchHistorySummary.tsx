import { TrendingDown, TrendingUp } from "lucide-react";

interface MatchSummary {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgGameLength: string;
  currentStreak: number;
}

interface MatchTrend {
  type: string;
  value: number;
  change: number;
}

interface MatchHistorySummaryProps {
  summary: MatchSummary;
  trends: MatchTrend[];
  error?: string;
  loading?: boolean;
}

export default function MatchHistorySummary({
  summary,
  trends,
  error,
  loading,
}: MatchHistorySummaryProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-16 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="font-semibold leading-none mb-1">Summary</div>
        <div className="text-muted-foreground text-sm mb-4">Overall team performance</div>
        {error ? (
          <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{summary.totalMatches}</div>
              <div className="text-muted-foreground text-xs">Total Matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.winRate}%</div>
              <div className="text-muted-foreground text-xs">Win Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.wins}</div>
              <div className="text-muted-foreground text-xs">Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.losses}</div>
              <div className="text-muted-foreground text-xs">Losses</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.avgGameLength}</div>
              <div className="text-muted-foreground text-xs">Avg Game Length</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.currentStreak}</div>
              <div className="text-muted-foreground text-xs">Current Streak</div>
            </div>
          </div>
        )}
      </div>
      <div>
        <div className="font-semibold leading-none mb-1">Trends</div>
        <div className="text-muted-foreground text-sm mb-4">Recent performance trends</div>
        {error ? (
          <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {trends.map((trend, i) => (
              <div key={i} className="flex items-center gap-2">
                {trend.direction === "up" ? (
                  <TrendingUp className="text-green-500 w-5 h-5" />
                ) : (
                  <TrendingDown className="text-red-500 w-5 h-5" />
                )}
                <div>
                  <div className="font-semibold">{trend.metric}</div>
                  <div className="text-xs text-muted-foreground">
                    {trend.value}{" "}
                    <span
                      className={
                        trend.direction === "up"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {trend.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
