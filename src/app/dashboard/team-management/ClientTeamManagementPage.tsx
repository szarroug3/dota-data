"use client";
import PageHeader from "@/components/dashboard/PageHeader";
import { TeamDataDisplay } from "@/components/dashboard/TeamDataDisplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeam } from "@/contexts/team-context";
import TeamImportForm from "./TeamImportForm";
import TeamList from "./TeamList";

function TeamListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveTeamDisplay() {
  const { activeTeam } = useTeam();

  if (!activeTeam) {
    return null;
  }

  // Extract teamId and leagueId from the active team ID
  const [teamId, leagueId] = activeTeam.id.split('-');

  return (
    <div className="space-y-4">
      <TeamDataDisplay teamId={teamId} leagueId={leagueId} />
    </div>
  );
}

function TeamManagementContent() {
  const { isLoaded, activeTeam } = useTeam();

  return (
    <div className="space-y-6">
      {/* Active Team Display */}
      {activeTeam && <ActiveTeamDisplay />}
      
      {/* Team List - show skeleton while loading, content when ready */}
      {!isLoaded ? (
        <TeamListSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Teams</CardTitle>
            <CardDescription>
              Manage your imported teams and their league-specific data
            </CardDescription>
          </CardHeader>
          <TeamList />
        </Card>
      )}
      
      {/* Import Form - always render immediately */}
      <Card>
        <CardHeader>
          <CardTitle>Import Team from Dotabuff</CardTitle>
                      <CardDescription>
              Import a team and scrape their match data from Dotabuff. You&apos;ll need both the Team ID and League ID.
            </CardDescription>
        </CardHeader>
        <TeamImportForm />
      </Card>
    </div>
  );
}

/**
 * Team Management Page (Client)
 *
 * - Uses the team context for all team management
 * - Simplified state management - no more localStorage handling here
 * - No more polling - that's handled by the context
 * - Clean separation of concerns
 * - Shows active team data with league-specific information
 */
export default function ClientTeamManagementPage() {
  return (
    <div className="space-y-6">
      {/* Page Header - always render immediately */}
      <PageHeader
        title="Team Management"
        description="Manage your teams, import from Dotabuff, and view league-specific data."
      />
      
      {/* Content - render immediately with loading states */}
      <TeamManagementContent />
    </div>
  );
} 