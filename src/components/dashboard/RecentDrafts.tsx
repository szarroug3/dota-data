import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DataCard from "./DataCard";

interface RecentDraft {
  date: string;
  opponent: string;
  result: string;
  score?: string;
  picks: string[];
  bans: string[];
  notes: string;
}

interface RecentDraftsProps {
  drafts: RecentDraft[];
  error?: string;
}

export default function RecentDrafts({ drafts, error }: RecentDraftsProps) {
  return (
    <DataCard
      title="Recent Drafts"
      description="Analysis of recent draft performances"
      icon={BarChart3}
      error={error}
    >
      <div className="space-y-4">
        {drafts.map((draft) => (
          <div key={draft.date} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">vs {draft.opponent}</h4>
                <p className="text-sm text-muted-foreground">{draft.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={draft.result === "W" ? "default" : "destructive"}
                >
                  {draft.result}
                </Badge>
                {draft.score && <Badge variant="outline">{draft.score}</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              {draft.picks.map((pick, index) => (
                <div
                  key={index}
                  className="text-center p-2 bg-muted/30 rounded"
                >
                  <p className="text-sm font-medium">{pick}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">{draft.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
