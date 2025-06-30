import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Shield, Users } from "lucide-react";

interface HeroSuggestion {
  hero: string;
  role: string;
  priority: "high" | "medium" | "low";
  reasoning: string;
  winRate: number;
  games: number;
  img: string;
  type: "strong" | "weak" | "meta" | "synergy";
}

interface HeroSuggestionsListProps {
  suggestions: HeroSuggestion[];
  title: string;
  description?: string;
  error?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "strong":
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case "weak":
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case "meta":
      return <Shield className="w-4 h-4 text-blue-600" />;
    case "synergy":
      return <Users className="w-4 h-4 text-purple-600" />;
    default:
      return <TrendingUp className="w-4 h-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function HeroSuggestionsList({
  suggestions,
  title,
  description,
  error,
}: HeroSuggestionsListProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.hero}
              className="flex items-start gap-4 p-4 border rounded-lg"
            >
              <img
                src={suggestion.img}
                alt={suggestion.hero}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{suggestion.hero}</h4>
                  <Badge variant="outline">{suggestion.role}</Badge>
                  <Badge className={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority} priority
                  </Badge>
                  {getTypeIcon(suggestion.type)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {suggestion.reasoning}
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Win Rate:{" "}
                    <span className="font-medium">{suggestion.winRate}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    Games:{" "}
                    <span className="font-medium">{suggestion.games}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
