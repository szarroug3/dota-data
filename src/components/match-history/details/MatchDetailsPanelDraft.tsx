import { Check, Crown, List, X } from 'lucide-react';
import React from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';
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
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
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

// Helper function to determine if a hero is high-performing
const isHighPerformingHero = (hero: Hero, allMatches: Match[], teamMatches: Record<number, TeamMatchParticipation>, hiddenMatchIds: Set<number>): boolean => {
  const heroStats: { count: number; wins: number; totalGames: number } = { count: 0, wins: 0, totalGames: 0 };
  
  console.log('🔍 isHighPerformingHero:', JSON.stringify({
    heroId: hero?.id,
    heroName: hero?.localizedName,
    allMatchesCount: allMatches.length,
    teamMatchesCount: Object.keys(teamMatches).length,
    hiddenMatchIdsCount: hiddenMatchIds.size
  }));
  
  // Aggregate hero statistics from unhidden matches
  allMatches.forEach(matchData => {
    // Skip manually hidden matches
    if (hiddenMatchIds.has(matchData.id)) {
      return;
    }
    
    const matchTeamData = teamMatches[matchData.id];
    if (!matchTeamData?.side) {
      return;
    }
    
    const teamPlayers = matchData.players[matchTeamData.side] || [];
    const isWin = matchTeamData.result === 'won';
    
    // Debug: Log the hero IDs in this match's player data
    console.log('🔍 Match players:', JSON.stringify({
      matchId: matchData.id,
      side: matchTeamData.side,
      playerCount: teamPlayers.length,
      playerHeroIds: teamPlayers.map(p => p.hero?.id),
      playerHeroNames: teamPlayers.map(p => p.hero?.localizedName),
      targetHeroId: hero?.id,
      targetHeroName: hero?.localizedName
    }));
    
    teamPlayers.forEach(player => {
      if (player.hero?.id === hero.id) {
        heroStats.count++;
        heroStats.totalGames++;
        if (isWin) {
          heroStats.wins++;
        }
      }
    });
  });
  
  // High-performing criteria: 5+ games, 60%+ win rate
  const isHighPerforming = heroStats.count >= 5 && (heroStats.wins / heroStats.count) >= 0.6;
  
  console.log('📊 Hero stats:', JSON.stringify({
    heroId: hero?.id,
    heroName: hero?.localizedName,
    count: heroStats.count,
    wins: heroStats.wins,
    totalGames: heroStats.totalGames,
    winRate: heroStats.count > 0 ? (heroStats.wins / heroStats.count) : 0,
    isHighPerforming
  }));
  
  return isHighPerforming;
};

const DraftEntry: React.FC<{ 
  phase: DraftPhase; 
  heroes: Record<string, Hero>; 
  team: 'radiant' | 'dire';
  teamMatch?: TeamMatchParticipation;
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}> = ({ phase, heroes, team, teamMatch, allMatches = [], teamMatches = {}, hiddenMatchIds = new Set() }) => {
  const hero = heroes[phase.hero];
  const heroName = hero?.localizedName || `Hero ${phase.hero}`;
  const isTeamPhase = phase.team === team;
  
  // Determine if this hero is on the active team's side AND is a pick (not ban) AND is high-performing
  const isOnActiveTeamSide = team === teamMatch?.side;
  const isPick = phase.phase === 'pick';
  const isHighPerforming = isOnActiveTeamSide && isPick && isHighPerformingHero(hero, allMatches, teamMatches, hiddenMatchIds);
  
  console.log('🎯 DraftEntry:', JSON.stringify({
    matchId: teamMatch?.matchId,
    heroId: hero?.id,
    heroName: hero?.localizedName,
    phase: phase.phase,
    team: team,
    teamMatchSide: teamMatch?.side,
    isOnActiveTeamSide,
    isPick,
    isHighPerforming,
    allMatchesCount: allMatches.length,
    teamMatchesCount: Object.keys(teamMatches).length,
    teamMatch: JSON.stringify(teamMatch),
    allMatchesIds: allMatches.map(m => m.id),
    teamMatchesKeys: Object.keys(teamMatches)
  }));
  

  if (!isTeamPhase) {
    return <div className="h-6"></div>; // Empty space for non-team picks
  }
  
  return (
    <div className="flex items-center justify-between h-6">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <HeroAvatar 
          hero={hero}
          avatarSize={{ width: 'w-6', height: 'h-6' }}
          isHighPerforming={isHighPerforming}
        />
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
  teamMatch?: TeamMatchParticipation;
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}> = ({ filteredDraft, heroes, leftDisplayName, rightDisplayName, isRadiantWin, teamMatch, allMatches = [], teamMatches = {}, hiddenMatchIds = new Set() }) => (
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
          <DraftEntry key={index} phase={phase} heroes={heroes} team="radiant" teamMatch={teamMatch} allMatches={allMatches} teamMatches={teamMatches} hiddenMatchIds={hiddenMatchIds} />
        ))}
      </div>

      {/* Dire Column */}
      <div className="space-y-2 pl-4">
        {filteredDraft.map((phase, index) => (
          <DraftEntry key={index} phase={phase} heroes={heroes} team="dire" teamMatch={teamMatch} allMatches={allMatches} teamMatches={teamMatches} hiddenMatchIds={hiddenMatchIds} />
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
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}> = ({ match, teamMatch, filter, onFilterChange, allMatches = [], teamMatches = {}, hiddenMatchIds = new Set() }) => {
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
          teamMatch={teamMatch}
          allMatches={allMatches}
          teamMatches={teamMatches}
          hiddenMatchIds={hiddenMatchIds}
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
  className,
  allMatches = [],
  teamMatches = {},
  hiddenMatchIds = new Set()
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
        allMatches={allMatches}
        teamMatches={teamMatches}
        hiddenMatchIds={hiddenMatchIds}
      />
    </div>
  );
};
