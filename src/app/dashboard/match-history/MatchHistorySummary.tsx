import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Trophy } from "lucide-react";

export default function MatchHistorySummary({
  summary,
  trends,
  error,
}: {
  summary: any;
  trends: any[];
  error?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Overall team performance</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{summary.totalMatches}</div>
                <div className="text-muted-foreground text-xs">
                  Total Matches
                </div>
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
                <div className="text-2xl font-bold">
                  {summary.avgGameLength}
                </div>
                <div className="text-muted-foreground text-xs">
                  Avg Game Length
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {summary.currentStreak}
                </div>
                <div className="text-muted-foreground text-xs">
                  Current Streak
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
          <CardDescription>Recent performance trends</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
