import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useConfigContext } from '@/contexts/config-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { EditManualMatchButton } from '../common/EditManualMatchButton';
import { ExternalSiteButton } from '../common/ExternalSiteButton';
import { HeroAvatar } from '../common/HeroAvatar';
import { HideButton } from '../common/HideButton';
import { RefreshButton } from '../common/RefreshButton';
import { RemoveManualMatchButton } from '../common/RemoveManualMatchButton';
import { EditManualMatchSheet } from '../EditManualMatchSheet';

// Custom hook for responsive grid columns
const useResponsiveGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const newColumns = Math.floor(width / 200) || 1;
      setColumns(newColumns);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef?.current?.offsetWidth]); // <— re-run if ref changes

  return { containerRef, columns };
};

interface HeroAvatarsProps {
  heroes: Hero[];
  avatarSize?: {
    width: string;
    height: string;
  };
  className?: string;
}

const HeroAvatars: React.FC<HeroAvatarsProps> = ({ 
  heroes, 
  avatarSize = { width: 'w-8', height: 'h-8' },
  className = ''
}) => {
  const totalHeroes = heroes.length;

  // Helper function to render large container (5 heroes)
  const renderLargeContainer = () => (
    <div className="@[300px]:flex hidden">
      {heroes.slice(0, 5).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
      ))}
    </div>
  );
  
  // Helper function to render medium container (3 heroes + indicator)
  const renderMediumContainer = () => (
    <div className="@[250px]:flex @[300px]:hidden hidden">
      {heroes.slice(0, 3).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
      ))}
      {totalHeroes > 3 && (
        <HeroIndicator count={totalHeroes - 3} avatarSize={avatarSize} />
      )}
    </div>
  );
  
  // Helper function to render small container (2 heroes + indicator)
  const renderSmallContainer = () => (
    <div className="@[200px]:flex @[250px]:hidden hidden">
      {heroes.slice(0, 2).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
      ))}
      {totalHeroes > 2 && (
        <HeroIndicator count={totalHeroes - 2} avatarSize={avatarSize} />
      )}
    </div>
  );
  
  // Helper function to render very small container (1 hero + indicator)
  const renderVerySmallContainer = () => (
    <div className="@[100px]:flex @[200px]:hidden hidden">
      {heroes.slice(0, 1).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
      ))}
      {totalHeroes > 1 && (
        <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />
      )}
    </div>
  );
  
  // Helper function to render default fallback (1 hero + indicator)
  const renderDefaultFallback = () => (
    <div className="@[100px]:hidden flex">
      {heroes.slice(0, 1).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
      ))}
      {totalHeroes > 1 && (
        <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />
      )}
    </div>
  );

  return (
    <div className={`flex -space-x-1 @[100px]:block hidden ${className}`}>
      {renderLargeContainer()}
      {renderMediumContainer()}
      {renderSmallContainer()}
      {renderVerySmallContainer()}
      {renderDefaultFallback()}
    </div>
  );
}; 

interface HeroIndicatorProps {
  count: number;
  avatarSize: { width: string; height: string };
}

const HeroIndicator: React.FC<HeroIndicatorProps> = ({ count, avatarSize }) => {
  const { width, height } = avatarSize;
  
  return (
    <div className={`${width} ${height} bg-muted rounded-full border-2 border-background flex items-center justify-center`}>
      <span className="text-xs font-medium text-muted-foreground">
        +{count}
      </span>
    </div>
  );
};

interface MatchListViewCardProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  className?: string;
  teamMatches?: Record<number, TeamMatchParticipation>;
  onScrollToMatch?: (matchId: number) => void;
}

interface MatchCardProps {
  match: Match;
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  teamMatch?: TeamMatchParticipation;
  onScrollToMatch?: (matchId: number) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  selectedMatchId, 
  onSelectMatch, 
  onHideMatch,
  onRefreshMatch,
  teamMatch,
  onScrollToMatch
}) => {
  const { config } = useConfigContext();
  const { getSelectedTeam, removeManualMatch, editManualMatch } = useTeamContext();
  
  // Edit sheet state
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  
  // Check if match has an error
  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);
  
  // Check if this is a manual match
  const isManualMatch = useMemo(() => {
    const selectedTeam = getSelectedTeam();
    if (!selectedTeam?.manualMatches) {
      return false;
    }
    const isManual = match.id in selectedTeam.manualMatches;
    return isManual;
  }, [match.id, getSelectedTeam]);
  
  // Get current team side for manual matches
  const currentTeamSide = useMemo(() => {
    if (!isManualMatch) return 'radiant' as const;
    const selectedTeam = getSelectedTeam();
    return selectedTeam?.manualMatches?.[match.id]?.side || 'radiant';
  }, [isManualMatch, match.id, getSelectedTeam]);

  // Get actual heroes from the match data based on team match participation
  const matchHeroes = useMemo(() => {
    if (!teamMatch?.side) return [];
    
    // Get heroes from the team's side
    const teamPlayers = match.players[teamMatch.side] || [];
    return teamPlayers
      .map(player => player.hero)
      .filter((hero): hero is Hero => hero !== undefined && hero !== null);
  }, [match, teamMatch]);

  // Get opponent name from team data
  const opponentName = teamMatch?.opponentName || `Match ${match.id}`;

  // Handle click - only allow selection if no error
  const handleClick = () => {
    if (!hasError) {
      onSelectMatch(match.id);
    }
  };

  // Handle remove manual match
  const handleRemoveManualMatch = () => {
    removeManualMatch(match.id);
  };

  // Handle edit manual match
  const handleEditManualMatch = async (newMatchId: number, teamSide: 'radiant' | 'dire') => {
    // Close the modal immediately and set submitting state
    setShowEditSheet(false);
    setIsSubmitting(true);
    setError(undefined);
    
    try {
      await editManualMatch(match.id, newMatchId, teamSide);
      
      // Scroll to the new match ID (whether it changed or not)
      onScrollToMatch?.(newMatchId);
      
      // Select the new match after editing
      onSelectMatch(newMatchId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit match');
      // Could potentially reopen the modal on error, but for now just log
      console.error('Failed to edit match:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      className={`transition-all ${
        selectedMatchId === match.id 
          ? 'ring-2 ring-primary' 
          : hasError
          ? 'border-destructive bg-destructive/5 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-md'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={hasError ? -1 : 0}
      aria-label={hasError ? `Match ${match.id} - Error: ${match.error}` : `Select match vs ${opponentName}`}
    >
      <CardContent className="p-4 h-[140px] relative">
        {/* Top row: Opponent name (centered) - hidden below 150px */}
        <div className="absolute top-4 left-0 right-0 text-center @[100px]:block hidden h-5 flex items-center justify-center">
          <h3 className="font-medium text-sm truncate">
            {isLoading && !hasError ? 'Loading...' : opponentName}
          </h3>
        </div>

        {/* Middle row: Hero badges (centered) or Loading indicator */}
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-center h-8 flex items-center justify-center">
          {isLoading && !hasError ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <HeroAvatars 
              heroes={matchHeroes} 
              avatarSize={{ width: 'w-8', height: 'h-8' }}
            />
          )}
        </div>

        {/* Bottom row: Action buttons (centered) - hidden below 200px */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1 @[200px]:flex hidden h-8" onClick={(e) => e.stopPropagation()}>
          <ExternalSiteButton
            matchId={match.id}
            preferredSite={config.preferredExternalSite}
            size="sm"
          />
          <RefreshButton
            onClick={() => onRefreshMatch(match.id)}
            ariaLabel={`Refresh match vs ${opponentName}`}
          />
          {isManualMatch ? (
            <>
              <EditManualMatchButton
                onClick={() => setShowEditSheet(true)}
                ariaLabel={`Edit manual match`}
              />
              <RemoveManualMatchButton
                onClick={handleRemoveManualMatch}
                ariaLabel={`Remove manual match`}
              />
            </>
          ) : (
            <>
              <HideButton
                onClick={() => onHideMatch(match.id)}
                ariaLabel={`Hide match`}
              />
            </>
          )}
        </div>
      </CardContent>
      
      {/* Edit Manual Match Sheet */}
      <EditManualMatchSheet
        isOpen={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        matchId={match.id}
        currentTeamSide={currentTeamSide}
        onEditMatch={handleEditManualMatch}
        isSubmitting={isSubmitting}
        error={error}
      />
    </Card>
  );
};

const MatchListViewCard: React.FC<MatchListViewCardProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  className = '',
  teamMatches = {},
  onScrollToMatch
}) => {
  
  const { containerRef, columns } = useResponsiveGrid();

  return (
    <div 
      ref={containerRef}
      className={`grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {matches.map((match) => (
        <div key={match.id} data-match-id={match.id}>
          <MatchCard
            match={match}
            selectedMatchId={selectedMatchId}
            onSelectMatch={onSelectMatch}
            onHideMatch={onHideMatch}
            onRefreshMatch={onRefreshMatch}
            teamMatch={teamMatches[match.id]}
            onScrollToMatch={onScrollToMatch}
          />
        </div>
      ))}
    </div>
  );
};

export { MatchListViewCard };
