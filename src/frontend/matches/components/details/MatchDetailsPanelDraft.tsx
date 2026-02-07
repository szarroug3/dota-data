import { Check, Crown, List, X } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/contexts/app-data-context';
import type { DraftPhase, Hero, Match, TeamMatchParticipation } from '@/frontend/lib/app-data/app-data-types';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { getTeamDisplayNames } from '@/frontend/matches/utils/match-name-helpers';

interface MatchDetailsPanelDraftProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  filter?: DraftFilter;
  onFilterChange?: (filter: DraftFilter) => void;
  className?: string;
  allMatches?: Match[];
  teamMatches?: Map<number, TeamMatchParticipation>;
  hiddenMatchIds: Set<number>;
}

type DraftFilter = 'picks' | 'bans' | 'both';

function buildDraftPhasesFromPicks(match: Match): DraftPhase[] {
  const radiantPicks = match.draft?.radiantPicks ?? [];
  const direPicks = match.draft?.direPicks ?? [];
  const phases: DraftPhase[] = [];

  radiantPicks.forEach((pick, index) => {
    phases.push({
      phase: 'pick',
      team: 'radiant',
      hero: pick.hero,
      time: pick.order ?? index + 1,
    });
  });

  direPicks.forEach((pick, index) => {
    phases.push({
      phase: 'pick',
      team: 'dire',
      hero: pick.hero,
      time: pick.order ?? index + 1,
    });
  });

  return phases;
}

function buildDraftPhasesFromPlayers(match: Match): DraftPhase[] {
  const radiantPlayers = match.players?.radiant ?? [];
  const direPlayers = match.players?.dire ?? [];
  const phases: DraftPhase[] = [];

  radiantPlayers.forEach((player, index) => {
    phases.push({
      phase: 'pick',
      team: 'radiant',
      hero: player.hero,
      time: index + 1,
    });
  });

  direPlayers.forEach((player, index) => {
    phases.push({
      phase: 'pick',
      team: 'dire',
      hero: player.hero,
      time: index + 1,
    });
  });

  return phases;
}

function buildFallbackDraftPhases(match: Match): DraftPhase[] {
  const picksDraft = buildDraftPhasesFromPicks(match);
  if (picksDraft.length > 0) {
    return picksDraft;
  }
  return buildDraftPhasesFromPlayers(match);
}

function getDraftViewState(
  appData: ReturnType<typeof useAppData>,
  match: Match,
  filter: DraftFilter,
): {
  status: 'loading' | 'empty' | 'ready';
  filteredDraft: DraftPhase[];
  showPickOrder: boolean;
  isStaggered: boolean;
} {
  if (match.isLoading) {
    return { status: 'loading', filteredDraft: [], showPickOrder: false, isStaggered: false };
  }

  const hasProcessedDraft = Boolean(match.processedDraft?.length);
  const fallbackDraft = hasProcessedDraft ? [] : buildFallbackDraftPhases(match);

  if (!hasProcessedDraft && fallbackDraft.length === 0) {
    return { status: 'empty', filteredDraft: [], showPickOrder: false, isStaggered: false };
  }

  const filteredDraft = hasProcessedDraft ? appData.getDraftPhases(match.id, filter) : fallbackDraft;
  return {
    status: 'ready',
    filteredDraft,
    showPickOrder: hasProcessedDraft,
    isStaggered: hasProcessedDraft,
  };
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

const DraftEntryRow: React.FC<{
  hero: Hero;
  heroName: string;
  phase: DraftPhase;
  isHighPerforming: boolean;
  showPickOrder: boolean;
}> = ({ hero, heroName, phase, isHighPerforming, showPickOrder }) => (
  <div className="flex items-center justify-between h-6">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <div className="hidden @[160px]:block">
        <HeroAvatar hero={hero} avatarSize={{ width: 'w-6', height: 'h-6' }} isHighPerforming={isHighPerforming} />
      </div>
      <div className="@[125px]:hidden block w-6 h-6"></div>
      <span className="text-sm font-medium truncate @[300px]:block hidden">{heroName}</span>
      {showPickOrder && (
        <Badge variant="outline" className="text-xs shrink-0 @[530px]:block hidden">
          #{phase.time}
        </Badge>
      )}
    </div>
    <Badge
      variant={phase.phase === 'pick' ? 'default' : 'secondary'}
      className="text-xs shrink-0 ml-2 @[270px]:block hidden"
    >
      {phase.phase.toUpperCase()}
    </Badge>
  </div>
);

const DraftEntry: React.FC<{
  phase: DraftPhase;
  team: 'radiant' | 'dire';
  teamMatch?: TeamMatchParticipation;
  selectedTeamId: string;
  hiddenMatchIds: Set<number>;
  showPickOrder: boolean;
}> = ({ phase, team, teamMatch, selectedTeamId, hiddenMatchIds, showPickOrder }) => {
  const appData = useAppData();
  const hero = phase.hero;
  const heroName = hero.localizedName || `Hero ${hero.id}`;
  const isTeamPhase = phase.team === team;
  const isOnActiveTeamSide = team === teamMatch?.side;
  const isPick = phase.phase === 'pick';
  const isHigh = isOnActiveTeamSide && isPick && appData.isHighPerformingHero(hero.id, selectedTeamId, hiddenMatchIds);
  if (!isTeamPhase) return <div className="h-6"></div>;
  return (
    <DraftEntryRow
      hero={hero}
      heroName={heroName}
      phase={phase}
      isHighPerforming={isHigh}
      showPickOrder={showPickOrder}
    />
  );
};

const DraftTimeline: React.FC<{
  radiantDraft: DraftPhase[];
  direDraft: DraftPhase[];
  timelineDraft: DraftPhase[];
  leftDisplayName: string;
  rightDisplayName: string;
  isRadiantWin: boolean;
  teamMatch?: TeamMatchParticipation;
  selectedTeamId: string;
  hiddenMatchIds: Set<number>;
  showPickOrder: boolean;
  isStaggered: boolean;
}> = ({
  radiantDraft,
  direDraft,
  timelineDraft,
  leftDisplayName,
  rightDisplayName,
  isRadiantWin,
  teamMatch,
  selectedTeamId,
  hiddenMatchIds = new Set(),
  showPickOrder,
  isStaggered,
}) => (
  <div>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="hidden @[210px]:flex items-center gap-2 h-6">
        <div className="font-semibold truncate flex-1 flex items-center gap-2">
          <span className="truncate">{leftDisplayName}</span>
          {isRadiantWin && <Crown className="h-4 w-4 text-yellow-500 shrink-0" />}
        </div>
      </div>
      <div className="hidden @[210px]:flex items-center gap-2 h-6">
        <div className="font-semibold truncate flex-1 flex items-center gap-2">
          <span className="truncate">{rightDisplayName}</span>
          {!isRadiantWin && <Crown className="h-4 w-4 text-yellow-500 shrink-0" />}
        </div>
      </div>
    </div>
    <div className="@[210px]:hidden h-2 mb-4"></div>
    <div className="w-full h-px bg-border mb-4"></div>
    {isStaggered ? (
      <div className="space-y-2">
        {timelineDraft.map((phase, index) => (
          <div key={`${phase.team}-${phase.time}-${index}`} className="grid grid-cols-2 gap-4" data-testid="draft-row">
            <div className="pr-4">
              <DraftEntry
                phase={phase}
                team="radiant"
                teamMatch={teamMatch}
                selectedTeamId={selectedTeamId}
                hiddenMatchIds={hiddenMatchIds}
                showPickOrder={showPickOrder}
              />
            </div>
            <div className="pl-4">
              <DraftEntry
                phase={phase}
                team="dire"
                teamMatch={teamMatch}
                selectedTeamId={selectedTeamId}
                hiddenMatchIds={hiddenMatchIds}
                showPickOrder={showPickOrder}
              />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 pr-4">
          {radiantDraft.map((phase, index) => (
            <DraftEntry
              key={`radiant-${phase.time ?? index}`}
              phase={phase}
              team="radiant"
              teamMatch={teamMatch}
              selectedTeamId={selectedTeamId}
              hiddenMatchIds={hiddenMatchIds}
              showPickOrder={showPickOrder}
            />
          ))}
        </div>
        <div className="space-y-2 pl-4">
          {direDraft.map((phase, index) => (
            <DraftEntry
              key={`dire-${phase.time ?? index}`}
              phase={phase}
              team="dire"
              teamMatch={teamMatch}
              selectedTeamId={selectedTeamId}
              hiddenMatchIds={hiddenMatchIds}
              showPickOrder={showPickOrder}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);

const DraftSummary: React.FC<{
  match: Match;
  teamMatch?: TeamMatchParticipation;
  filter: DraftFilter;
  onFilterChange: (filter: DraftFilter) => void;
  hiddenMatchIds: Set<number>;
}> = ({ match, teamMatch, filter, onFilterChange, hiddenMatchIds }) => {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;

  const selectedTeam = appData.getTeam(selectedTeamId);
  if (!selectedTeam) {
    throw new Error(`Selected team ${selectedTeamId} not found`);
  }

  const draftView = getDraftViewState(appData, match, filter);

  if (draftView.status === 'loading') {
    return <div className="text-center text-muted-foreground py-8">Loading draft data...</div>;
  }
  if (draftView.status === 'empty') {
    return <div className="text-center text-muted-foreground py-8">No draft data available</div>;
  }
  if (!teamMatch)
    return <div className="text-center text-muted-foreground py-8">No team participation data available</div>;

  const isRadiantWin = match.result === 'radiant';
  const { leftDisplayName, rightDisplayName } = getTeamDisplayNames(teamMatch, selectedTeam, match);
  const { filteredDraft, showPickOrder, isStaggered } = draftView;
  const radiantDraft = filteredDraft.filter((phase) => phase.team === 'radiant');
  const direDraft = filteredDraft.filter((phase) => phase.team === 'dire');

  return (
    <div className="space-y-4">
      <FilterButtons filter={filter} setFilter={onFilterChange} />
      <div className="border rounded-lg p-4 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border transform -translate-x-1/2"></div>
        <DraftTimeline
          radiantDraft={radiantDraft}
          direDraft={direDraft}
          timelineDraft={filteredDraft}
          leftDisplayName={leftDisplayName}
          rightDisplayName={rightDisplayName}
          isRadiantWin={isRadiantWin}
          teamMatch={teamMatch}
          selectedTeamId={selectedTeamId}
          hiddenMatchIds={hiddenMatchIds}
          showPickOrder={showPickOrder}
          isStaggered={isStaggered}
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
        hiddenMatchIds={hiddenMatchIds}
      />
    </div>
  );
};
