import { Check, Crown, List, X } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConstantsContext } from '@/contexts/constants-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Hero } from '@/types/contexts/constants-context-value';
import { Match } from '@/types/contexts/match-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelDraftProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  filter?: DraftFilter;
  onFilterChange?: (filter: DraftFilter) => void;
  className?: string;
}

type DraftFilter = 'picks' | 'bans' | 'both';

interface DraftPhase {
  phase: 'ban' | 'pick';
  team: 'radiant' | 'dire';
  hero: string;
  time: number;
}

const FilterButtons: React.FC<{ filter: DraftFilter; setFilter: (filter: DraftFilter) => void }> = ({ filter, setFilter }) => (
  <div className="flex justify-end h-10">
    <div className="@[170px]:flex hidden gap-2">
      <Button
        variant={filter === 'picks' ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setFilter('picks')}
      >
        <Check className="w-4 h-4" />
        <span className="@[420px]:block hidden">Picks Only</span>
      </Button>
      <Button
        variant={filter === 'bans' ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setFilter('bans')}
      >
        <X className="w-4 h-4" />
        <span className="@[420px]:block hidden">Bans Only</span>
      </Button>
      <Button
        variant={filter === 'both' ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setFilter('both')}
      >
        <List className="w-4 h-4" />
        <span className="@[420px]:block hidden">Both</span>
      </Button>
    </div>
  </div>
);

const TeamHeaders: React.FC<{ 
  leftDisplayName: string; 
  rightDisplayName: string; 
  isRadiantWin: boolean 
}> = ({ leftDisplayName, rightDisplayName, isRadiantWin }) => (
  <div className="grid grid-cols-2 gap-4 @[210px]:block hidden">
    <div className="flex items-center gap-2 min-w-0 justify-start">
      <span className="font-semibold truncate">{leftDisplayName}</span>
      {isRadiantWin && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
    </div>
    <div className="flex items-center gap-2 min-w-0 justify-start">
      <span className="font-semibold truncate">{rightDisplayName}</span>
      {!isRadiantWin && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
    </div>
  </div>
);

const DraftEntry: React.FC<{ 
  phase: DraftPhase; 
  heroes: Record<string, Hero>; 
  team: 'radiant' | 'dire' 
}> = ({ phase, heroes, team }) => {
  const hero = heroes[phase.hero];
  const heroName = hero?.localizedName || `Hero ${phase.hero}`;
  const isTeamPhase = phase.team === team;
  
  if (!isTeamPhase) {
    return <div className="h-6"></div>; // Empty space for non-team picks
  }
  
  return (
    <div className="flex items-center justify-between h-6">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar className="w-6 h-6 flex-shrink-0 @[125px]:block hidden">
          <AvatarImage src={hero?.imageUrl} alt={heroName} />
          <AvatarFallback>{heroName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="@[125px]:hidden block w-6 h-6"></div>
        <span className="text-sm font-medium truncate @[300px]:block hidden">{heroName}</span>
        <Badge variant="outline" className="text-xs flex-shrink-0 @[530px]:block hidden">
          #{phase.time}
        </Badge>
      </div>
      <Badge variant={phase.phase === 'pick' ? 'default' : 'secondary'} className="text-xs flex-shrink-0 ml-2 @[230px]:block hidden">
        {phase.phase.toUpperCase()}
      </Badge>
    </div>
  );
};

const DraftTimeline: React.FC<{ 
  filteredDraft: DraftPhase[]; 
  heroes: Record<string, Hero>;
  leftDisplayName: string;
  rightDisplayName: string;
  isRadiantWin: boolean;
}> = ({ filteredDraft, heroes, leftDisplayName, rightDisplayName, isRadiantWin }) => (
  <div>
    {/* Team Headers */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="flex items-center gap-2 @[210px]:block hidden h-6">
        <div className="font-semibold truncate flex-1 flex items-center gap-2">
          <span className="truncate">{leftDisplayName}</span>
          {isRadiantWin && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
        </div>
      </div>
      <div className="flex items-center gap-2 @[210px]:block hidden h-6">
        <div className="font-semibold truncate flex-1 flex items-center gap-2">
          <span className="truncate">{rightDisplayName}</span>
          {!isRadiantWin && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
        </div>
      </div>
    </div>
    
    {/* Placeholder space when team names are hidden */}
    <div className="@[210px]:hidden h-2 mb-4"></div>
    
    {/* Horizontal separator */}
    <div className="w-full h-px bg-border mb-4"></div>
    
    {/* Draft Entries */}
    <div className="grid grid-cols-2 gap-4">
      {/* Radiant Column */}
      <div className="space-y-2 pr-4">
        {filteredDraft.map((phase, index) => (
          <DraftEntry key={index} phase={phase} heroes={heroes} team="radiant" />
        ))}
      </div>

      {/* Dire Column */}
      <div className="space-y-2 pl-4">
        {filteredDraft.map((phase, index) => (
          <DraftEntry key={index} phase={phase} heroes={heroes} team="dire" />
        ))}
      </div>
    </div>
  </div>
);

const getTeamDisplayNames = (teamMatch?: TeamMatchParticipation, selectedTeam?: TeamData) => {
  const userTeamName = selectedTeam?.team.name || 'Your Team';
  const opponentName = teamMatch?.opponentName || 'Opponent';
  
  // If user's team was Radiant (left side), show them on the left
  // If user's team was Dire (right side), show them on the right
  const isUserTeamRadiant = teamMatch?.side === 'radiant';
  
  return {
    leftDisplayName: isUserTeamRadiant ? userTeamName : opponentName || 'Radiant',
    rightDisplayName: isUserTeamRadiant ? opponentName : userTeamName || 'Dire'
  };
};

const filterDraftPhases = (processedDraft: DraftPhase[], filter: DraftFilter) => {
  return processedDraft.filter(phase => {
    if (filter === 'picks') return phase.phase === 'pick';
    if (filter === 'bans') return phase.phase === 'ban';
    return true; // 'both' shows everything
  });
};

const DraftSummary: React.FC<{ 
  match?: Match; 
  teamMatch?: TeamMatchParticipation; 
  filter: DraftFilter;
  onFilterChange: (filter: DraftFilter) => void;
}> = ({ match, teamMatch, filter, onFilterChange }) => {
  const { heroes } = useConstantsContext();
  const { getSelectedTeam } = useTeamContext();

  if (!match?.processedDraft) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No draft data available
      </div>
    );
  }

  const { processedDraft } = match;
  const isRadiantWin = match.result === 'radiant';
  
  // Get team name from selected team context
  const selectedTeam = getSelectedTeam();
  const { leftDisplayName, rightDisplayName } = getTeamDisplayNames(teamMatch, selectedTeam);

  // Filter draft phases based on selected filter
  const filteredDraft = filterDraftPhases(processedDraft, filter);

  return (
    <div className="space-y-4">
      <FilterButtons filter={filter} setFilter={onFilterChange} />

      {/* Draft Timeline */}
      <div className="border rounded-lg p-4 relative">
        {/* Continuous vertical separator */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2"></div>
        
        {/* Draft Entries */}
        <DraftTimeline 
          filteredDraft={filteredDraft} 
          heroes={heroes}
          leftDisplayName={leftDisplayName}
          rightDisplayName={rightDisplayName}
          isRadiantWin={isRadiantWin}
        />
      </div>
    </div>
  );
};

export const MatchDetailsPanelDraft: React.FC<MatchDetailsPanelDraftProps> = ({ 
  match, 
  teamMatch: _teamMatch, 
  filter = 'both',
  onFilterChange = () => {},
  className 
}) => {
  if (!match) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No match data available
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <DraftSummary 
        match={match} 
        teamMatch={_teamMatch} 
        filter={filter}
        onFilterChange={onFilterChange}
      />
    </div>
  );
};
