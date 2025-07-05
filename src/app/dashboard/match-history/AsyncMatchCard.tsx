"use client";
import { useTeam } from "@/contexts/team-context";
import { useSuspenseMatchData } from "@/lib/hooks/useSuspenseMatchData";
import type { Team } from "@/types/team";
import type { Match } from "./match-utils";
import MatchCard from './MatchCard';

interface AsyncMatchCardProps {
  match: Match;
  currentTeam: Team;
  preferredSite: string;
  isSelected: boolean;
  onSelect: (matchId: string) => void;
  onHide: (matchId: string) => void;
  teamSide?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export default function AsyncMatchCard(props: AsyncMatchCardProps) {
  const { match, currentTeam, ...otherProps } = props;

  // Use suspense-enabled hook
  const teamContext = useTeam();
  const team = currentTeam || teamContext.currentTeam;
  const processedMatch = useSuspenseMatchData(match.id!, team?.id || '');

  return (
    <MatchCard
      match={processedMatch}
      currentTeam={team}
      {...otherProps}
    />
  );
} 