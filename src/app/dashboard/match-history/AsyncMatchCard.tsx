"use client";
import type { Team } from '@/types/team';
import MatchCard from './MatchCard';

interface AsyncMatchCardProps {
  match: any;
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

  // Simply render the MatchCard directly - loading is handled in AsyncMatchDetails
  return (
    <MatchCard
      match={match}
      currentTeam={currentTeam}
      {...otherProps}
    />
  );
} 