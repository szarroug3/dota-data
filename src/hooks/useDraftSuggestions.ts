import { useCallback, useMemo, useState } from 'react';

export interface DraftPhase {
  picks: string[];
  bans: string[];
  currentTurn: 'pick' | 'ban';
  currentTeam: 'radiant' | 'dire';
}

export interface HeroSuggestion {
  heroId: string;
  heroName: string;
  priority: 'high' | 'medium' | 'low';
  winRate: number;
  pickRate: number;
  banRate: number;
  synergy: number;
  counter: number;
  reasons: string[];
  roles: string[];
}

export interface MetaStats {
  topPicks: HeroSuggestion[];
  topBans: HeroSuggestion[];
  emergingHeroes: HeroSuggestion[];
  counterPicks: HeroSuggestion[];
}

const generateHeroSuggestions = (): HeroSuggestion[] => {
  const mockHeroes = [
    'Pudge',
    'Invoker',
    'Crystal Maiden',
    'Anti-Mage',
    'Phantom Assassin',
    'Shadow Fiend',
    'Drow Ranger',
    'Lion',
    'Rubick',
    'Ember Spirit',
    'Storm Spirit',
    'Queen of Pain',
    'Mirana',
    'Techies',
    'Tinker',
    "Nature's Prophet",
    'Enigma',
    'Chen',
    'Enchantress',
    'Visage',
  ];

  return mockHeroes.map((heroName, index) => ({
    heroId: `hero_${index + 1}`,
    heroName,
    priority: (['high', 'medium', 'low'] as const)[index % 3],
    winRate: 45 + Math.random() * 30,
    pickRate: 5 + Math.random() * 40,
    banRate: Math.random() * 25,
    synergy: Math.random() * 100,
    counter: Math.random() * 100,
    reasons: [
      'Strong in current meta',
      'Good synergy with team',
      'Counters enemy picks',
      'High win rate this patch',
    ].slice(0, Math.floor(Math.random() * 4) + 1),
    roles: [
      ['Carry', 'Mid'],
      ['Support', 'Roamer'],
      ['Offlane', 'Initiator'],
      ['Jungle', 'Pusher'],
    ][index % 4],
  }));
};

const generateMetaStats = (heroSuggestions: HeroSuggestion[]): MetaStats => {
  const sortedByPickRate = [...heroSuggestions].sort((a, b) => b.pickRate - a.pickRate);
  const sortedByBanRate = [...heroSuggestions].sort((a, b) => b.banRate - a.banRate);
  const sortedByWinRate = [...heroSuggestions].sort((a, b) => b.winRate - a.winRate);

  return {
    topPicks: sortedByPickRate.slice(0, 10),
    topBans: sortedByBanRate.slice(0, 10),
    emergingHeroes: sortedByWinRate.filter((h) => h.pickRate < 15).slice(0, 5),
    counterPicks: heroSuggestions.filter((h) => h.counter > 70).slice(0, 5),
  };
};

const getFilteredSuggestions = (
  heroSuggestions: HeroSuggestion[],
  showMetaOnly: boolean,
  roleFilter: string,
  currentDraft: DraftPhase,
): HeroSuggestion[] => {
  let filtered = heroSuggestions;

  if (showMetaOnly) {
    filtered = filtered.filter((h) => h.pickRate > 20 || h.banRate > 15);
  }

  if (roleFilter !== 'all') {
    filtered = filtered.filter((h) => h.roles.some((role) => role.toLowerCase().includes(roleFilter.toLowerCase())));
  }

  const usedHeroes = [...currentDraft.picks, ...currentDraft.bans];
  filtered = filtered.filter((h) => !usedHeroes.includes(h.heroId));

  return filtered.sort((a, b) => {
    if (a.priority !== b.priority) {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }

    if (currentDraft.currentTurn === 'ban') {
      return b.banRate - a.banRate;
    } else {
      return b.winRate - a.winRate;
    }
  });
};

const getUpdatedDraft = (prevDraft: DraftPhase, heroId: string): DraftPhase => {
  const updated = { ...prevDraft };

  if (prevDraft.currentTurn === 'pick') {
    updated.picks = [...prevDraft.picks, heroId];
  } else {
    updated.bans = [...prevDraft.bans, heroId];
  }

  if (updated.picks.length + updated.bans.length < 20) {
    updated.currentTeam = prevDraft.currentTeam === 'radiant' ? 'dire' : 'radiant';

    const totalSelections = updated.picks.length + updated.bans.length;
    if (totalSelections < 6) {
      updated.currentTurn = 'ban';
    } else if (totalSelections < 10) {
      updated.currentTurn = 'pick';
    } else if (totalSelections < 14) {
      updated.currentTurn = 'ban';
    } else {
      updated.currentTurn = 'pick';
    }
  }

  return updated;
};

const initialDraftState: DraftPhase = {
  picks: [],
  bans: [],
  currentTurn: 'ban',
  currentTeam: 'radiant',
};

export function useDraftSuggestions() {
  const [currentDraft, setCurrentDraft] = useState<DraftPhase>(initialDraftState);
  const [teamSide, setTeamSide] = useState<'radiant' | 'dire'>('radiant');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showMetaOnly, setShowMetaOnly] = useState(false);

  const heroSuggestions = useMemo(() => generateHeroSuggestions(), []);
  const metaStats = useMemo(() => generateMetaStats(heroSuggestions), [heroSuggestions]);

  const filteredSuggestions = useMemo(() => {
    return getFilteredSuggestions(heroSuggestions, showMetaOnly, roleFilter, currentDraft);
  }, [heroSuggestions, showMetaOnly, roleFilter, currentDraft]);

  const handleHeroAction = useCallback((heroId: string) => {
    setCurrentDraft((prev) => getUpdatedDraft(prev, heroId));
  }, []);

  const handleResetDraft = useCallback(() => {
    setCurrentDraft(initialDraftState);
  }, []);

  const handleTeamSideChange = useCallback((side: 'radiant' | 'dire') => {
    setTeamSide(side);
  }, []);

  const handleRoleFilterChange = useCallback((filter: string) => {
    setRoleFilter(filter);
  }, []);

  const handleShowMetaOnlyChange = useCallback((show: boolean) => {
    setShowMetaOnly(show);
  }, []);

  return {
    currentDraft,
    teamSide,
    roleFilter,
    showMetaOnly,
    heroSuggestions,
    metaStats,
    filteredSuggestions,
    handleHeroAction,
    handleResetDraft,
    handleTeamSideChange,
    handleRoleFilterChange,
    handleShowMetaOnlyChange,
  };
}
