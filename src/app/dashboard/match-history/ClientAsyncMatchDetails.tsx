"use client";
import { useMatchData } from "@/lib/hooks/useMatchData";
import type { Team } from "@/types/team";
import type { Match } from "./match-utils";

import MatchDetails from "./MatchDetails";
import MatchDetailsSkeleton from "./MatchDetailsSkeleton";

interface ClientAsyncMatchDetailsProps {
  selectedMatchObj: Match | null;
  currentTeam: Team;
  error?: string | null;
  isLoading?: boolean;
  onShowPlayerPopup?: (player: unknown) => void;
}

export default function ClientAsyncMatchDetails({
  selectedMatchObj,
  currentTeam,
  error = null,
  isLoading = false,
  onShowPlayerPopup,
}: ClientAsyncMatchDetailsProps) {
  // Use the new processed match data hook
  const { data: processedMatch, loading, error: fetchError } = useMatchData(
    selectedMatchObj?.id || null
  );

  const handleShowPlayerPopup = onShowPlayerPopup ?? (() => {});

  if (!selectedMatchObj || !currentTeam) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No match selected</h3>
          <p className="text-sm">Select a match from the list to view details.</p>
        </div>
      </div>
    );
  }
  if (loading || isLoading) return <MatchDetailsSkeleton />;
  if (fetchError || error) return <div className="p-4 text-red-500">{fetchError || error}</div>;
  if (!processedMatch) return <MatchDetailsSkeleton />;

  // Convert MatchData to Match type expected by MatchDetails
  const matchForDetails = {
    id: processedMatch.id,
    date: processedMatch.date,
    result: processedMatch.result,
          openDota: processedMatch.openDota ? {
        match_id: processedMatch.openDota.matchId,
        start_time: processedMatch.openDota.startTime,
        radiant_win: processedMatch.openDota.radiantWin,
        duration: 0, // Will be calculated from processedMatch.duration
        players: [], // Empty for now, would need to be populated from actual match data
        picks_bans: [], // Empty for now, would need to be populated from actual match data
        radiant_name: "Radiant",
        dire_name: "Dire",
        radiant_score: 0,
        dire_score: 0,
        isRadiant: processedMatch.openDota.isRadiant,
        radiant_team_id: 0,
        dire_team_id: 0,
        leagueid: 0,
        game_mode: 0,
        lobby_type: 0,
        hero_id: 0,
        player_slot: 0, // Required by OpenDotaMatch
        version: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        skill: 0,
        leaver_status: 0,
        party_size: 0,
        cluster: 0,
        patch: 0,
        region: 0,
        win: 0,
        lose: 0,
        total_gold: 0,
        total_xp: 0,
        kills_per_min: 0,
        kda: 0,
        abandons: 0,
        neutral_kills: 0,
        tower_kills: 0,
        courier_kills: 0,
        lane_kills: 0,
        hero_kills: 0,
        observer_kills: 0,
        sentry_kills: 0,
        roshan_kills: 0,
        necronomicon_kills: 0,
        ancient_kills: 0,
        buyback_count: 0,
        observer_uses: 0,
        sentry_uses: 0,
        lane_efficiency: 0,
        lane_efficiency_pct: 0,
        lane: 0,
        lane_role: 0,
        is_roaming: false,
        purchase_time: {},
        first_purchase_time: {},
        item_win: {},
        item_usage: {},
        purchase_tpscroll: {},
        actions_per_min: 0,
        life_state_dead: 0,
        rank_tier: 0,
        cosmetics: [],
        benchmarks: {}
      } : undefined
  };

  return (
    <MatchDetails
      match={matchForDetails}
      currentTeam={currentTeam}
      isLoading={isLoading}
      error={error}
      onShowPlayerPopup={handleShowPlayerPopup}
    />
  );
} 