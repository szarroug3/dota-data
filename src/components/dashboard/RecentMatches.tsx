import { Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DataCard from "./DataCard";

interface RecentMatchesProps {
  matches: Array<{
    date: string;
    opponent: string;
    result: string;
    score: string;
    league: string;
  }>;
  error?: string;
}

export default function RecentMatches({ matches, error }: RecentMatchesProps) {
  return (
    <DataCard
      title="Recent Matches"
      description="Latest match results and performance"
      icon={Calendar}
      error={error}
    >
      <>
        <div className="space-y-3">
          {matches.map((match) => (
            <div
              key={match.date}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h4 className="font-medium">vs {match.opponent}</h4>
                <p className="text-sm text-muted-foreground">
                  {match.date} • {match.league}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={match.result === "W" ? "default" : "destructive"}
                >
                  {match.result}
                </Badge>
                <span className="font-medium">{match.score}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/dashboard/match-history">
            <Button variant="outline" className="w-full">
              View Full Match History
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </>
    </DataCard>
  );
}
