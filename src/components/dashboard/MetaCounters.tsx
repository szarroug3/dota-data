import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DataCard from "./DataCard";

interface MetaCounter {
  hero: string;
  counter: string;
  reason: string;
  effectiveness: string;
}

interface MetaCountersProps {
  counters: MetaCounter[];
  error?: string;
}

export default function MetaCounters({ counters, error }: MetaCountersProps) {
  return (
    <DataCard
      title="Meta Counter Picks"
      description="Recommended counters for popular meta heroes"
      icon={Shield}
      error={error}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {counters.map((counter) => (
          <div
            key={`${counter.hero}-${counter.counter}`}
            className="p-4 border rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{counter.hero}</h4>
              <Badge
                variant={
                  counter.effectiveness === "High" ? "destructive" : "secondary"
                }
              >
                {counter.effectiveness}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Counter:</span>
                <Badge variant="outline">{counter.counter}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{counter.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
