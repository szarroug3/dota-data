import { Target, BarChart3, Users, Shield, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const quickActions = [
  {
    title: "Draft Suggestions",
    description: "AI-powered hero recommendations",
    icon: Target,
    href: "/dashboard/draft-suggestions",
    color: "text-blue-600",
  },
  {
    title: "Meta Insights",
    description: "Current meta trends and analysis",
    icon: BarChart3,
    href: "/dashboard/meta-insights",
    color: "text-green-600",
  },
  {
    title: "Player Stats",
    description: "Individual player performance",
    icon: Users,
    href: "/dashboard/player-stats",
    color: "text-purple-600",
  },
  {
    title: "Team Analysis",
    description: "Detailed team performance analysis",
    icon: Shield,
    href: "/dashboard/team-analysis",
    color: "text-orange-600",
  },
  {
    title: "Match History",
    description: "Complete match history and statistics",
    icon: Activity,
    href: "/dashboard/match-history",
    color: "text-red-600",
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.title} href={action.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  {action.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
