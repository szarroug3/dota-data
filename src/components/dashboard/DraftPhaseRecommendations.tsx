import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, Zap } from "lucide-react";

interface HeroRecommendation {
  name: string;
  role: string;
  reason: string;
  synergy: string[];
  counters: string[];
  pickPriority: string;
  winRate: number;
  games: number;
}

interface PhaseRecommendation {
  title: string;
  description: string;
  heroes: HeroRecommendation[];
}

interface DraftPhaseRecommendationsProps {
  phaseRecommendations: {
    first: PhaseRecommendation;
    second: PhaseRecommendation;
    third: PhaseRecommendation;
  };
  error?: string;
}

export default function DraftPhaseRecommendations({
  phaseRecommendations,
  error,
}: DraftPhaseRecommendationsProps) {
  const [selectedPhase, setSelectedPhase] = useState<
    "first" | "second" | "third"
  >("first");

  const currentPhase = phaseRecommendations[selectedPhase];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft Phase Recommendations</CardTitle>
        <CardDescription>
          Select a draft phase to see targeted hero suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
        ) : (
          <>
            <div className="flex space-x-2 mb-6">
              <Button
                variant={selectedPhase === "first" ? "default" : "outline"}
                onClick={() => setSelectedPhase("first")}
              >
                <Clock className="w-4 h-4 mr-2" />
                First Phase
              </Button>
              <Button
                variant={selectedPhase === "second" ? "default" : "outline"}
                onClick={() => setSelectedPhase("second")}
              >
                <Target className="w-4 h-4 mr-2" />
                Second Phase
              </Button>
              <Button
                variant={selectedPhase === "third" ? "default" : "outline"}
                onClick={() => setSelectedPhase("third")}
              >
                <Zap className="w-4 h-4 mr-2" />
                Third Phase
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {currentPhase.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {currentPhase.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPhase.heroes.map((hero) => (
                    <Card
                      key={hero.name}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{hero.name}</CardTitle>
                          <Badge
                            variant={
                              hero.pickPriority === "High"
                                ? "default"
                                : hero.pickPriority === "Medium"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {hero.pickPriority}
                          </Badge>
                        </div>
                        <CardDescription className="capitalize">
                          {hero.role}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Reason:
                          </p>
                          <p className="text-sm">{hero.reason}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Win Rate:</p>
                            <p className="font-medium">{hero.winRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Games:</p>
                            <p className="font-medium">{hero.games}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Synergy:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {hero.synergy.map((syn) => (
                              <Badge
                                key={syn}
                                variant="outline"
                                className="text-xs"
                              >
                                {syn}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Counters:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {hero.counters.map((counter) => (
                              <Badge
                                key={counter}
                                variant="destructive"
                                className="text-xs"
                              >
                                {counter}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
