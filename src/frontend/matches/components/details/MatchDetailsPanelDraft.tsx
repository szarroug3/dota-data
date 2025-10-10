import { Check, Crown, List, X } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DraftPhase, Hero, Match, Team, TeamMatchParticipation } from '@/frontend/lib/app-data-types';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { getTeamDisplayNames } from '@/frontend/matches/utils/match-name-helpers';

interface MatchDetailsPanelDraftProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  filter?: DraftFilter;
  onFilterChange?: (filter: DraftFilter) => void;
  className?: string;
  allMatches: Match[];
  selectedTeam: Team;
}

type DraftFilter = 'picks' | 'bans' | 'both';

const FilterButtons: React.FC<{ filter: DraftFilter; setFilter: (filter: DraftFilter) => void }> = ({
  filter,
  setFilter,
}) => (
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

const DraftEntryRow: React.FC<{
  hero: Hero;
  heroName: string;
  phase: DraftPhase;
  isHighPerforming: boolean;
}> = ({ hero, heroName, phase, isHighPerforming }) => (
  <div className="flex items-center justify-between h-6">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <div className="hidden @[160px]:block">
        <HeroAvatar hero={hero} avatarSize={{ width: 'w-6', height: 'h-6' }} isHighPerforming={isHighPerforming} />
      </div>
      <div className="@[125px]:hidden block w-6 h-6"></div>
      <span className="text-sm font-medium truncate @[300px]:block hidden">{heroName}</span>
      <Badge variant="outline" className="text-xs flex-shrink-0 @[530px]:block hidden">
        #{phase.time}
      </Badge>
    </div>
    <Badge
      variant={phase.phase === 'pick' ? 'default' : 'secondary'}
      className="text-xs flex-shrink-0 ml-2 @[270px]:block hidden"
    >
      {phase.phase.toUpperCase()}
    </Badge>
  </div>
);

const isHeroHighPerforming = (
  hero: Hero,
  isOnActiveTeamSide: boolean,
  isPick: boolean,
  allMatches: Match[],
): boolean => {
  return (
    isOnActiveTeamSide && isPick && (allMatches[0]?.computed?.heroPerformance?.get(hero.id)?.isHighPerforming || false)
  );
};

const DraftEntry: React.FC<{
  phase: DraftPhase;
  team: 'radiant' | 'dire';
  teamMatch?: TeamMatchParticipation;
  allMatches: Match[];
}> = ({ phase, team, teamMatch, allMatches }) => {
  const hero = phase.hero;
  const heroName = hero.localizedName || `Hero ${hero.id}`;
  const isTeamPhase = phase.team === team;

  if (!isTeamPhase) return <div className="h-6"></div>;

  const isOnActiveTeamSide = team === teamMatch?.side;
  const isPick = phase.phase === 'pick';
  const isHighPerforming = isHeroHighPerforming(hero, isOnActiveTeamSide, isPick, allMatches);

  return <DraftEntryRow hero={hero} heroName={heroName} phase={phase} isHighPerforming={isHighPerforming} />;
};

const DraftTimeline: React.FC<{
  filteredDraft: DraftPhase[];
  leftDisplayName: string;
  rightDisplayName: string;
  isRadiantWin: boolean;
  teamMatch?: TeamMatchParticipation;
  allMatches: Match[];
}> = ({ filteredDraft, leftDisplayName, rightDisplayName, isRadiantWin, teamMatch, allMatches = [] }) => (
  <div>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="hidden @[210px]:flex items-center gap-2 h-6">
        <div className="font-semibold truncate flex-1 flex items-center gap-2">
          <span className="truncate">{leftDisplayName}</span>
          {isRadiantWin && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
        </div>
      </div>
      <div className="hidden @[210px]:flex items-center gap-2 h-6">
        <div className="font-semibold truncate flex-1 flex items-center gap-2">
          <span className="truncate">{rightDisplayName}</span>
          {!isRadiantWin && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
        </div>
      </div>
    </div>
    <div className="@[210px]:hidden h-2 mb-4"></div>
    <div className="w-full h-px bg-border mb-4"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2 pr-4">
        {filteredDraft.map((phase, index) => (
          <DraftEntry
            key={`radiant-${phase.time ?? index}`}
            phase={phase}
            team="radiant"
            teamMatch={teamMatch}
            allMatches={allMatches}
          />
        ))}
      </div>
      <div className="space-y-2 pl-4">
        {filteredDraft.map((phase, index) => (
          <DraftEntry
            key={`dire-${phase.time ?? index}`}
            phase={phase}
            team="dire"
            teamMatch={teamMatch}
            allMatches={allMatches}
          />
        ))}
      </div>
    </div>
  </div>
);

const filterDraftPhases = (processedDraft: DraftPhase[], filter: DraftFilter) =>
  processedDraft.filter((phase) => {
    if (filter === 'picks') return phase.phase === 'pick';
    if (filter === 'bans') return phase.phase === 'ban';
    return true;
  });

const DraftSummary: React.FC<{
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  filter: DraftFilter;
  onFilterChange: (filter: DraftFilter) => void;
  allMatches: Match[];
  selectedTeam: Team;
}> = ({ match, teamMatch, filter, onFilterChange, allMatches, selectedTeam }) => {
  if (!match?.processedDraft)
    return <div className="text-center text-muted-foreground py-8">No draft data available</div>;

  if (!teamMatch)
    return <div className="text-center text-muted-foreground py-8">No team participation data available</div>;

  const { processedDraft } = match;
  const isRadiantWin = match.result === 'radiant';
  const { leftDisplayName, rightDisplayName } = getTeamDisplayNames(teamMatch, selectedTeam, match);
  const filteredDraft = filterDraftPhases(processedDraft, filter);

  return (
    <div className="space-y-4">
      <FilterButtons filter={filter} setFilter={onFilterChange} />
      <div className="border rounded-lg p-4 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2"></div>
        <DraftTimeline
          filteredDraft={filteredDraft}
          leftDisplayName={leftDisplayName}
          rightDisplayName={rightDisplayName}
          isRadiantWin={isRadiantWin}
          teamMatch={teamMatch}
          allMatches={allMatches}
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
  selectedTeam,
}) => {
  if (!match) return <div className="text-center text-muted-foreground py-8">No match data available</div>;
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <DraftSummary
        match={match}
        teamMatch={_teamMatch}
        filter={filter}
        onFilterChange={onFilterChange}
        allMatches={allMatches}
        selectedTeam={selectedTeam}
      />
    </div>
  );
};
