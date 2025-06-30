import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Calendar, Trophy, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Dota 2 Team Analytics</h1>
        <p className="text-xl text-muted-foreground">
          Track your team&apos;s performance, analyze drafts, and improve your game
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <h3 className="text-xl font-semibold">Team Management</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Import your team from Dotabuff and manage players, stand-ins, and team data.
          </p>
          <Link href="/dashboard/team-management">
            <Button className="w-full">
              Manage Team
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
            <h3 className="text-xl font-semibold">Match History</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            View detailed match history, analyze performance, and track your progress.
          </p>
          <Link href="/dashboard/match-history">
            <Button className="w-full">
              View Matches
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-8 w-8 text-green-500 mr-3" />
            <h3 className="text-xl font-semibold">Draft Analysis</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Get draft suggestions, analyze meta trends, and improve your drafting strategy.
          </p>
          <Link href="/dashboard/draft-suggestions">
            <Button className="w-full">
              Analyze Drafts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Ready to get started? Import your team and start tracking your performance.
        </p>
        <Link href="/dashboard/team-management">
          <Button size="lg">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
