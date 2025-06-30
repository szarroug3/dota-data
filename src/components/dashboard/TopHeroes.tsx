import { Star } from "lucide-react";
import DataCard from "./DataCard";

interface TopHeroesProps {
  heroes: Array<{
    hero: string;
    games: number;
    winRate: number;
    avgKDA: string;
    img: string;
  }>;
}

export default function TopHeroes({ heroes }: TopHeroesProps) {
  return (
    <DataCard
      title="Top Heroes"
      description="Most successful heroes this season"
      icon={Star}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {heroes.map((hero) => (
          <div key={hero.hero} className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={hero.img}
                alt={hero.hero}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h4 className="font-semibold">{hero.hero}</h4>
                <p className="text-sm text-muted-foreground">
                  {hero.games} games
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Rate:</span>
                <span className="font-medium">{hero.winRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg KDA:</span>
                <span className="font-medium">{hero.avgKDA}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
