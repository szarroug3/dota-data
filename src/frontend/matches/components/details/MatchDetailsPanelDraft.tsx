import { Check, Crown, List, X } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConstantsContext } from '@/frontend/contexts/constants-context';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';
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

const isHighPerformingHero = (
  hero: Hero,
  allMatches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  hiddenMatchIds: Set<number>,
): boolean => {
  const heroStats: { count: number; wins: number; totalGames: number } = { count: 0, wins: 0, totalGames: 0 };
  allMatches.forEach((matchData) => {
    if (hiddenMatchIds.has(matchData.id)) return;
    const matchTeamData = teamMatches[matchData.id];
    if (!matchTeamData?.side) return;
    const teamPlayers = matchData.players[matchTeamData.side] || [];
    const isWin = matchTeamData.result === 'won';
    teamPlayers.forEach((player) => {
      if (player.hero?.id === hero.id) {
        heroStats.count++;
        heroStats.totalGames++;
        if (isWin) {
          heroStats.wins++;
        }
      }
    });
  });
  return heroStats.count >= 5 && heroStats.wins / heroStats.count >= 0.6;
};

const DraftEntryRow: React.FC<{
  hero: Hero | undefined;
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
  const isOnActiveTeamSide = team === teamMatch?.side;
  const isPick = phase.phase === 'pick';
  const isHigh = isOnActiveTeamSide && isPick && isHighPerformingHero(hero, allMatches, teamMatches, hiddenMatchIds);
  if (!isTeamPhase) return <div className="h-6"></div>;
  return <DraftEntryRow hero={hero} heroName={heroName} phase={phase} isHighPerforming={isHigh} />;
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
}> = ({
  filteredDraft,
  heroes,
  leftDisplayName,
  rightDisplayName,
  isRadiantWin,
  teamMatch,
  allMatches = [],
  teamMatches = {},
  hiddenMatchIds = new Set(),
}) => (
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
            heroes={heroes}
            team="radiant"
            teamMatch={teamMatch}
            allMatches={allMatches}
            teamMatches={teamMatches}
            hiddenMatchIds={hiddenMatchIds}
          />
        ))}
      </div>
      <div className="space-y-2 pl-4">
        {filteredDraft.map((phase, index) => (
          <DraftEntry
            key={`dire-${phase.time ?? index}`}
            phase={phase}
            heroes={heroes}
            team="dire"
            teamMatch={teamMatch}
            allMatches={allMatches}
            teamMatches={teamMatches}
            hiddenMatchIds={hiddenMatchIds}
          />
        ))}
      </div>
    </div>
  </div>
);

const getTeamDisplayNames = (teamMatch?: TeamMatchParticipation, selectedTeam?: TeamData) => {
  if (!selectedTeam || !teamMatch?.side) {
    return { leftDisplayName: 'Radiant', rightDisplayName: 'Dire' } as const;
  }
  const userTeamName = selectedTeam.team.name;
  const opponentName = teamMatch.opponentName || (teamMatch.side === 'radiant' ? 'Dire' : 'Radiant');
  const isUserTeamRadiant = teamMatch.side === 'radiant';
  return {
    leftDisplayName: isUserTeamRadiant ? userTeamName : opponentName,
    rightDisplayName: isUserTeamRadiant ? opponentName : userTeamName,
  } as const;
};

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
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}> = ({ match, teamMatch, filter, onFilterChange, allMatches = [], teamMatches = {}, hiddenMatchIds = new Set() }) => {
  const { heroes } = useConstantsContext();
  const { getSelectedTeam } = useTeamContext();
  if (!match?.processedDraft)
    return <div className="text-center text-muted-foreground py-8">No draft data available</div>;
  const { processedDraft } = match;
  const isRadiantWin = match.result === 'radiant';
  const selectedTeam = getSelectedTeam();
  const { leftDisplayName, rightDisplayName } = getTeamDisplayNames(teamMatch, selectedTeam);
  const filteredDraft = filterDraftPhases(processedDraft, filter);
  return (
    <div className="space-y-4">
      <FilterButtons filter={filter} setFilter={onFilterChange} />
      <div className="border rounded-lg p-4 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2"></div>
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
  hiddenMatchIds = new Set(),
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
        teamMatches={teamMatches}
        hiddenMatchIds={hiddenMatchIds}
      />
    </div>
  );
};
