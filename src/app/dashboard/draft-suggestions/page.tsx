"use client";
import DraftPhaseRecommendations from "@/components/dashboard/DraftPhaseRecommendations";
import DraftSuggestionsOverview from "@/components/dashboard/DraftSuggestionsOverview";
import ErrorCard from "@/components/dashboard/ErrorCard";
import MetaCounters from "@/components/dashboard/MetaCounters";
import PageHeader from "@/components/dashboard/PageHeader";
import RecentDrafts from "@/components/dashboard/RecentDrafts";
import TeamAnalysis from "@/components/dashboard/TeamAnalysis";
import { useTeam } from "@/contexts/team-context";
import { useDraftSuggestions } from "@/lib/hooks/useDataFetching";

// Extracted component for loading state
function DraftSuggestionsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Draft Suggestions"
        description="Loading draft suggestions..."
      />
      <div className="grid gap-6">
        {/* Overview skeleton */}
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        {/* Team analysis and meta counters skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
        {/* Draft phase recommendations skeleton */}
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
        {/* Recent drafts skeleton */}
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

// Extracted component for no team state
function NoTeamSelected() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Draft Suggestions"
        description="No team selected. Please add a team in Team Management."
      />
      <div className="text-center text-muted-foreground">
        Select a team to view draft suggestions
      </div>
    </div>
  );
}

// Extracted component for error state
function DraftSuggestionsError({ error }: { error: Error }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Draft Suggestions"
        description="Error loading draft suggestions"
      />
      <ErrorCard title="Draft Suggestions" error={error} />
    </div>
  );
}

// Extracted component for no data state
function NoDraftData() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Draft Suggestions"
        description="No draft suggestions available"
      />
      <div className="text-center text-muted-foreground p-8">
        <div className="text-lg font-medium mb-2">No draft data available</div>
        <div className="text-sm">
          Add players and import matches in Team Management to get draft suggestions
        </div>
      </div>
    </div>
  );
}

// Extracted component for calculating suggestions overview
function calculateSuggestionsOverview(draftData: any) {
  return {
    totalSuggestions:
      draftData.phaseRecommendations.first.heroes.length +
      draftData.phaseRecommendations.second.heroes.length +
      draftData.phaseRecommendations.third.heroes.length,
    strongPicks: draftData.phaseRecommendations.first.heroes.filter(
      (h: any) => h.pickPriority === "High",
    ).length,
    weakPicks: draftData.phaseRecommendations.third.heroes.filter(
      (h: any) => h.pickPriority === "Low",
    ).length,
    metaCounters: draftData.metaCounters.length,
    teamSynergies: 4, // This would be calculated based on actual synergy analysis
  };
}

// Extracted component for main content
function DraftSuggestionsContent({ 
  currentTeam, 
  draftData 
}: { 
  currentTeam: any; 
  draftData: any; 
}) {
  const suggestionsOverview = calculateSuggestionsOverview(draftData);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Draft Suggestions"
        description={
          currentTeam
            ? `Draft suggestions for ${currentTeam.teamName}`
            : "No team selected. Please add a team in Team Management."
        }
      />

      <DraftSuggestionsOverview suggestions={suggestionsOverview} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamAnalysis
          strengths={draftData.teamStrengths}
          weaknesses={draftData.teamWeaknesses}
        />
        <MetaCounters counters={draftData.metaCounters} />
      </div>

      <DraftPhaseRecommendations
        phaseRecommendations={draftData.phaseRecommendations}
      />
      <RecentDrafts drafts={draftData.recentDrafts} />
    </div>
  );
}

export default function DraftSuggestionsPage() {
  const { currentTeam } = useTeam();

  const accountIds =
    currentTeam?.players?.map((player: any) => player.id).filter(Boolean) || null;
  const { data: draftData, loading, error } = useDraftSuggestions(accountIds);

  if (!currentTeam) {
    return <NoTeamSelected />;
  }

  if (loading) {
    return <DraftSuggestionsLoading />;
  }

  if (error) {
    return <DraftSuggestionsError error={error} />;
  }

  if (!draftData) {
    return <NoDraftData />;
  }

  return <DraftSuggestionsContent currentTeam={currentTeam} draftData={draftData} />;
}
