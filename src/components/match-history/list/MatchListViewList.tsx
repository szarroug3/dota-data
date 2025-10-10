import { AlertCircle } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useConfigContext } from '@/contexts/config-context';
import { useTeamContext } from '@/contexts/team-context';
import { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { EditManualMatchButton } from '../common/EditManualMatchButton';
import { ExternalSiteButton } from '../common/ExternalSiteButton';
import { HeroAvatar } from '../common/HeroAvatar';
import { HideButton } from '../common/HideButton';
import { RefreshButton } from '../common/RefreshButton';
import { RemoveManualMatchButton } from '../common/RemoveManualMatchButton';
import { EditManualMatchSheet } from '../EditManualMatchSheet';

// Helper functions for date and duration formatting
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

interface MatchListViewProps {
  matches: Match[]; 
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  className?: string;
  teamMatches?: Record<number, TeamMatchParticipation>; // Team match data for opponent names and team sides
  hiddenMatchIds?: Set<number>;
  allMatches?: Match[]; // Unfiltered matches for hero performance calculation
  onScrollToMatch?: (matchId: number) => void;
}

interface HeroAvatarsProps {
  heroes: Hero[];
  avatarSize?: {
    width: string;
    height: string;
  };
  className?: string;
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}

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



const HeroAvatars: React.FC<HeroAvatarsProps> = ({ 
  heroes, 
  avatarSize = { width: 'w-8', height: 'h-8' },
  className = '',
  allMatches = [],
  teamMatches = {},
  hiddenMatchIds = new Set()
}) => {
  const { highPerformingHeroes } = useTeamContext();
  const totalHeroes = heroes.length;

  // Helper function to render large container (5 heroes)
  const renderLargeContainer = () => (
    <div className="@[400px]:flex hidden">
      {heroes.slice(0, 5).map((hero, index) => (
        <HeroAvatar 
          key={index} 
          hero={hero} 
          avatarSize={avatarSize}
          isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
        />
      ))}
    </div>
  );
  
  // Helper function to render medium container (3 heroes + indicator)
  const renderMediumContainer = () => (
    <div className="@[350px]:flex @[400px]:hidden hidden">
      {heroes.slice(0, 3).filter(hero => hero).map((hero, index) => (
        <HeroAvatar 
          key={index} 
          hero={hero} 
          avatarSize={avatarSize}
          isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
        />
      ))}
      {totalHeroes > 3 && (
        <HeroIndicator count={totalHeroes - 3} avatarSize={avatarSize} />
      )}
    </div>
  );
  
  // Helper function to render small container (2 heroes + indicator)
  const renderSmallContainer = () => (
    <div className="@[290px]:flex @[350px]:hidden hidden">
      {heroes.slice(0, 2).map((hero, index) => (
        <HeroAvatar 
          key={index} 
          hero={hero} 
          avatarSize={avatarSize}
          isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
        />
      ))}
      {totalHeroes > 2 && (
        <HeroIndicator count={totalHeroes - 2} avatarSize={avatarSize} />
      )}
    </div>
  );
  
  // Helper function to render very small container (1 hero + indicator)
  const renderVerySmallContainer = () => (
    <div className="@[270px]:flex @[290px]:hidden hidden">
      {heroes.slice(0, 1).map((hero, index) => (
        <HeroAvatar 
          key={index} 
          hero={hero} 
          avatarSize={avatarSize}
          isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
        />
      ))}
      {totalHeroes > 1 && (
        <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />
      )}
    </div>
  );
  
  // Helper function to render default fallback (1 hero + indicator)
  const renderDefaultFallback = () => (
    <div className="@[270px]:hidden flex">
      {heroes.slice(0, 1).map((hero, index) => (
        <HeroAvatar 
          key={index} 
          hero={hero} 
          avatarSize={avatarSize}
          isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
        />
      ))}
      {totalHeroes > 1 && (
        <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />
      )}
    </div>
  );

  return (
    <div className={`flex -space-x-1 @[150px]:block hidden ${className}`}>
      {renderLargeContainer()}
      {renderMediumContainer()}
      {renderSmallContainer()}
      {renderVerySmallContainer()}
      {renderDefaultFallback()}
    </div>
  );
}; 

interface MatchInfoProps {
  match: Match;
  onSelectMatch: (matchId: number) => void;
  teamMatches?: Record<number, TeamMatchParticipation>;
}

const MatchInfo: React.FC<MatchInfoProps> = ({ match, onSelectMatch, teamMatches }) => {
  // Get opponent name from team match participation data
  const teamMatch = teamMatches?.[match.id];
  const opponentName = teamMatch?.opponentName || `Match ${match.id}`;
  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);
  
  return (
    <div 
      className={`min-w-0 flex-1 @[170px]:opacity-100 opacity-0 invisible @[170px]:visible ${
        hasError ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => !hasError && onSelectMatch(match.id)}
    >
      <div className="flex items-center gap-2">
        <div className="font-medium truncate">
          {hasError ? `Match ${match.id}` : isLoading ? 'Loading...' : opponentName}
        </div>
        {/* Loading indicator */}
        {isLoading && !hasError && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        )}
      </div>
      <div className="text-sm text-muted-foreground truncate">
        {hasError ? (
          <span className="text-destructive">{match.error}</span>
        ) : isLoading ? (
          <span>Loading...</span>
        ) : (
          <>
            {/* Show date and duration on larger containers */}
            <span className="@[350px]:inline hidden">
              {formatDate(match.date)} • {formatDuration(match.duration)}
            </span>
            
            {/* Show only date on medium containers */}
            <span className="@[280px]:inline @[350px]:hidden hidden">
              {formatDate(match.date)}
            </span>
            
            {/* Show only date on smaller containers */}
            <span className="@[220px]:inline @[280px]:hidden hidden">
              {formatDate(match.date)}
            </span>
            
            {/* Hide on very small containers */}
            <span className="@[220px]:hidden">
              {formatDate(match.date)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

 
interface MatchBadgesProps {
  match: Match;
  teamMatches?: Record<number, TeamMatchParticipation>;
}

// Helper function to determine if the active team won using TeamMatchParticipation
const didActiveTeamWin = (teamMatch: TeamMatchParticipation | undefined): boolean => {
  if (!teamMatch) return false;
  return teamMatch.result === 'won';
};

// Helper function to determine pick order from TeamMatchParticipation
const getPickOrder = (teamMatch: TeamMatchParticipation | undefined): string | null => {
  if (!teamMatch?.pickOrder) {
    return null;
  }
  
  return teamMatch.pickOrder === 'first' ? 'First Pick' : 'Second Pick';
};

const MatchBadges: React.FC<MatchBadgesProps> = ({ match, teamMatches }) => {
  const teamMatch = teamMatches?.[match.id];
  const teamWon = didActiveTeamWin(teamMatch);
  const pickOrder = getPickOrder(teamMatch);
  const teamSide = teamMatch?.side;
  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);
  
  return (
    <div className="flex items-center gap-2">
      {/* Error Badge */}
      {hasError && (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      )}
      
      {/* Result Badge - only show if no error and not loading */}
      {!hasError && !isLoading && (
        <Badge 
          variant={teamWon ? 'success' : 'default'} 
          className="text-xs w-fit @[300px]:block hidden"
        >
          <span className="@[450px]:block hidden">{teamWon ? 'Victory' : 'Defeat'}</span>
          <span className="@[450px]:hidden block">{teamWon ? 'W' : 'L'}</span>
        </Badge>
      )}
      
      {/* Team Side Badge - only show if no error and not loading */}
      {!hasError && !isLoading && (
        <Badge 
          variant="outline" 
          className="text-xs w-fit @[300px]:block hidden"
        >
          <span className="@[450px]:block hidden">{teamSide === 'radiant' ? 'Radiant' : 'Dire'}</span>
          <span className="@[450px]:hidden block">{teamSide === 'radiant' ? 'R' : 'D'}</span>
        </Badge>
      )}
      
      {/* Pick Order Badge - only show if no error and not loading */}
      {!hasError && !isLoading && (
        <Badge 
          variant="secondary" 
          className="text-xs w-fit @[300px]:block hidden"
        >
          <span className="@[450px]:block hidden">{pickOrder}</span>
          <span className="@[450px]:hidden block">{pickOrder === 'First Pick' ? '1P' : pickOrder === 'Second Pick' ? '2P' : 'PO'}</span>
        </Badge>
      )}
    </div>
  );
};

interface MatchCardProps {
  match: Match;
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  teamMatches?: Record<number, TeamMatchParticipation>; // Team match data for opponent names
  allMatches?: Match[];
  hiddenMatchIds?: Set<number>;
  onScrollToMatch?: (matchId: number) => void;
}

const getHeroesFromDraft = (match: Match, teamSide: 'radiant' | 'dire'): Hero[] => {
  const draftPicks = teamSide === 'radiant' ? match.draft.radiantPicks : match.draft.direPicks;
  const heroes = draftPicks?.map(pick => pick.hero).slice(0, 5) || [];
  
  return heroes;
};

export const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  selectedMatchId, 
  onSelectMatch, 
  onHideMatch,
  onRefreshMatch,
  teamMatches,
  allMatches = [],
  hiddenMatchIds = new Set(),
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
    return match.id in selectedTeam.manualMatches;
  }, [match.id, getSelectedTeam]);
  
  // Get current team side for manual matches
  const currentTeamSide = useMemo(() => {
    if (!isManualMatch) return 'radiant' as const;
    const selectedTeam = getSelectedTeam();
    return selectedTeam?.manualMatches?.[match.id]?.side || 'radiant';
  }, [isManualMatch, match.id, getSelectedTeam]);
  
  // Get actual heroes from the match data based on team match participation
  const matchHeroes = useMemo(() => {
    const teamMatch = teamMatches?.[match.id];
    if (!teamMatch?.side) {
      return [];
    }
    
    // Get heroes from the team's side
    const teamPlayers = match.players[teamMatch.side] || [];
    
    let heroes = teamPlayers.map(player => player.hero).filter(hero => hero);
    
    // Fallback: if no heroes from players, try to get them from draft data
    if (heroes.length === 0 && match.draft) {
      heroes = getHeroesFromDraft(match, teamMatch.side).filter(hero => hero);
    }
    
    // Temporary fallback: if no heroes found, show some placeholder data for debugging
    if (heroes.length === 0) {
      return [];
    }
    
    return heroes;
  }, [match, teamMatches]);

  // Handle click - only allow selection if no error
  const handleClick = () => {
    if (!hasError) {
      onSelectMatch(match.id);
    }
  };

  // Handle keyboard navigation - only allow selection if no error
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasError && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
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
      className={`transition-all duration-200 ${
        selectedMatchId === match.id 
          ? 'ring-2 ring-primary bg-primary/5' 
          : hasError
          ? 'border-destructive bg-destructive/5 cursor-not-allowed'
          : 'hover:bg-accent/50 cursor-pointer hover:shadow-md'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={hasError ? -1 : 0}
      onKeyDown={handleKeyDown}
      aria-label={hasError ? `Match ${match.id} - Error: ${match.error}` : `Select match`}
    >
      <CardContent>
        <div className="flex flex-col gap-2">
          {/* Row 1: Opponent name + date/duration on left, avatars on right */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <MatchInfo match={match} onSelectMatch={onSelectMatch} teamMatches={teamMatches} />
            <HeroAvatars
              heroes={matchHeroes} 
              avatarSize={{ width: 'w-8', height: 'h-8' }}
              allMatches={allMatches}
              teamMatches={teamMatches}
              hiddenMatchIds={hiddenMatchIds}
            />
          </div>

          {/* Row 2: Badges on left, buttons on right aligned with avatar */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <MatchBadges match={match} teamMatches={teamMatches} />
            <div className="flex items-center gap-0.5 opacity-0 invisible @[200px]:opacity-100 @[200px]:visible" style={{ marginRight: '-0.2rem' }}>
              <ExternalSiteButton
                matchId={match.id}
                preferredSite={config.preferredExternalSite}
                size="sm"
              />
              <RefreshButton
                onClick={() => onRefreshMatch(match.id)}
                ariaLabel={`Refresh match`}
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
                <HideButton
                  onClick={() => onHideMatch(match.id)}
                  ariaLabel={`Hide match`}
                />
              )}
            </div>
          </div>
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

export const MatchListViewList: React.FC<MatchListViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  className,
  teamMatches,
  hiddenMatchIds = new Set(),
  allMatches = [],
  onScrollToMatch
}) => {
  if (matches.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No matches found</div>
          <div className="text-sm">Try adjusting your filters or adding more matches.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {matches.map((match) => (
        <div key={match.id} className="p-1" data-match-id={match.id}>
          <MatchCard
            match={match}
            selectedMatchId={selectedMatchId}
            onSelectMatch={onSelectMatch}
            onHideMatch={onHideMatch}
            onRefreshMatch={onRefreshMatch}
            teamMatches={teamMatches}
            allMatches={allMatches}
            hiddenMatchIds={hiddenMatchIds}
            onScrollToMatch={onScrollToMatch}
          />
        </div>
      ))}
    </div>
  );
}; 