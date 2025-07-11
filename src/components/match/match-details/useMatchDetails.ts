import { useState } from 'react';

import { useMatchData } from '@/hooks/use-match-data';

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  heroId: string;
  heroName: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  gpm: number;
  xpm: number;
  lastHits: number;
  denies: number;
  netWorth: number;
  heroDamage: number;
  heroHealing: number;
  towerDamage: number;
  items: string[];
  level: number;
  side: 'radiant' | 'dire';
}

export interface MatchTimeline {
  timestamp: number;
  event: string;
  player?: string;
  hero?: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
}

export interface DetailedMatch {
  id: string;
  duration: number;
  winner: 'radiant' | 'dire';
  radiantScore: number;
  direScore: number;
  gameMode: string;
  patch: string;
  startTime: string;
  endTime: string;
  players: PlayerPerformance[];
  timeline: MatchTimeline[];
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  objectives: {
    towers: { radiant: number; dire: number };
    barracks: { radiant: number; dire: number };
    roshan: number;
  };
  bans: Array<{
    heroId: string;
    heroName: string;
    team: 'radiant' | 'dire';
    order: number;
  }>;
  picks: Array<{
    heroId: string;
    heroName: string;
    team: 'radiant' | 'dire';
    order: number;
    playerId: string;
    playerName: string;
  }>;
}

export interface UseMatchDetailsReturn {
  matchDetails: DetailedMatch | null;
  isLoading: boolean;
  error: string | null;
  currentLevel: 'basic' | 'advanced' | 'expert';
  setCurrentLevel: (level: 'basic' | 'advanced' | 'expert') => void;
  formatDuration: (seconds: number) => string;
  formatTimestamp: (timestamp: number) => string;
  formatNumber: (num: number) => string;
  getKDAColor: (kda: number) => string;
  getEventIcon: (event: string) => string;
}

// Utility functions
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatTimestamp = (timestamp: number): string => {
  const minutes = Math.floor(timestamp / 60);
  const seconds = timestamp % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

const getKDAColor = (kda: number): string => {
  if (kda >= 3) return 'text-green-600';
  if (kda >= 2) return 'text-yellow-600';
  if (kda >= 1) return 'text-orange-600';
  return 'text-red-600';
};

const getEventIcon = (event: string): string => {
  switch (event) {
    case 'kill': return '⚔️';
    case 'death': return '💀';
    case 'tower': return '🏰';
    case 'roshan': return '🐉';
    case 'objective': return '🎯';
    default: return '📝';
  }
};

// Helper function to generate radiant player 1
const generateRadiantPlayer1 = (): PlayerPerformance => ({
  playerId: '1',
  playerName: 'Player1',
  heroId: '1',
  heroName: 'Anti-Mage',
  kills: 12,
  deaths: 2,
  assists: 8,
  kda: 10.0,
  gpm: 687,
  xpm: 698,
  lastHits: 312,
  denies: 18,
  netWorth: 25840,
  heroDamage: 31250,
  heroHealing: 0,
  towerDamage: 8920,
  items: ['Manta Style', 'Butterfly', 'Abyssal Blade', 'BKB', 'Boots of Travel', 'Aegis'],
  level: 25,
  side: 'radiant'
});

// Helper function to generate radiant player 2
const generateRadiantPlayer2 = (): PlayerPerformance => ({
  playerId: '2',
  playerName: 'Player2',
  heroId: '5',
  heroName: 'Crystal Maiden',
  kills: 3,
  deaths: 8,
  assists: 24,
  kda: 3.375,
  gpm: 298,
  xpm: 412,
  lastHits: 45,
  denies: 8,
  netWorth: 8920,
  heroDamage: 18750,
  heroHealing: 2450,
  towerDamage: 1240,
  items: ['Glimmer Cape', 'Force Staff', 'Tranquil Boots', 'Observer Ward', 'Sentry Ward'],
  level: 18,
  side: 'radiant'
});

// Helper function to generate radiant player 3
const generateRadiantPlayer3 = (): PlayerPerformance => ({
  playerId: '3',
  playerName: 'Player3',
  heroId: '2',
  heroName: 'Axe',
  kills: 8,
  deaths: 4,
  assists: 12,
  kda: 5.0,
  gpm: 450,
  xpm: 520,
  lastHits: 120,
  denies: 15,
  netWorth: 15680,
  heroDamage: 22500,
  heroHealing: 0,
  towerDamage: 3200,
  items: ['Blink Dagger', 'Vanguard', 'Crimson Guard', 'Boots of Travel', 'Heart of Tarrasque'],
  level: 22,
  side: 'radiant'
});

// Helper function to generate radiant player 4
const generateRadiantPlayer4 = (): PlayerPerformance => ({
  playerId: '4',
  playerName: 'Player4',
  heroId: '3',
  heroName: 'Lina',
  kills: 15,
  deaths: 6,
  assists: 10,
  kda: 4.167,
  gpm: 520,
  xpm: 580,
  lastHits: 180,
  denies: 12,
  netWorth: 18920,
  heroDamage: 28750,
  heroHealing: 0,
  towerDamage: 4500,
  items: ['Aghanim\'s Scepter', 'Eul\'s Scepter', 'Boots of Travel', 'Bloodstone', 'Octarine Core'],
  level: 24,
  side: 'radiant'
});

// Helper function to generate radiant player 5
const generateRadiantPlayer5 = (): PlayerPerformance => ({
  playerId: '5',
  playerName: 'Player5',
  heroId: '4',
  heroName: 'Shadow Shaman',
  kills: 2,
  deaths: 7,
  assists: 18,
  kda: 2.857,
  gpm: 320,
  xpm: 380,
  lastHits: 60,
  denies: 5,
  netWorth: 10240,
  heroDamage: 15600,
  heroHealing: 1800,
  towerDamage: 6800,
  items: ['Aghanim\'s Scepter', 'Blink Dagger', 'Arcane Boots', 'Force Staff', 'Glimmer Cape'],
  level: 19,
  side: 'radiant'
});

// Helper function to generate dire player 1
const generateDirePlayer1 = (): PlayerPerformance => ({
  playerId: '6',
  playerName: 'Player6',
  heroId: '6',
  heroName: 'Phantom Assassin',
  kills: 18,
  deaths: 5,
  assists: 6,
  kda: 4.8,
  gpm: 620,
  xpm: 650,
  lastHits: 280,
  denies: 20,
  netWorth: 22400,
  heroDamage: 32500,
  heroHealing: 0,
  towerDamage: 7800,
  items: ['Battle Fury', 'Desolator', 'BKB', 'Boots of Travel', 'Butterfly', 'Abyssal Blade'],
  level: 25,
  side: 'dire'
});

// Helper function to generate dire player 2
const generateDirePlayer2 = (): PlayerPerformance => ({
  playerId: '7',
  playerName: 'Player7',
  heroId: '7',
  heroName: 'Lion',
  kills: 4,
  deaths: 9,
  assists: 22,
  kda: 2.889,
  gpm: 280,
  xpm: 350,
  lastHits: 35,
  denies: 6,
  netWorth: 8640,
  heroDamage: 14200,
  heroHealing: 2200,
  towerDamage: 1100,
  items: ['Blink Dagger', 'Aghanim\'s Scepter', 'Tranquil Boots', 'Force Staff', 'Glimmer Cape'],
  level: 17,
  side: 'dire'
});

// Helper function to generate dire player 3
const generateDirePlayer3 = (): PlayerPerformance => ({
  playerId: '8',
  playerName: 'Player8',
  heroId: '8',
  heroName: 'Tidehunter',
  kills: 6,
  deaths: 8,
  assists: 14,
  kda: 2.5,
  gpm: 380,
  xpm: 420,
  lastHits: 95,
  denies: 10,
  netWorth: 12800,
  heroDamage: 19800,
  heroHealing: 0,
  towerDamage: 2400,
  items: ['Blink Dagger', 'Vanguard', 'Crimson Guard', 'Boots of Travel', 'Heart of Tarrasque'],
  level: 20,
  side: 'dire'
});

// Helper function to generate dire player 4
const generateDirePlayer4 = (): PlayerPerformance => ({
  playerId: '9',
  playerName: 'Player9',
  heroId: '9',
  heroName: 'Storm Spirit',
  kills: 12,
  deaths: 7,
  assists: 8,
  kda: 2.857,
  gpm: 480,
  xpm: 520,
  lastHits: 160,
  denies: 14,
  netWorth: 16800,
  heroDamage: 26500,
  heroHealing: 0,
  towerDamage: 3600,
  items: ['Bloodstone', 'Aghanim\'s Scepter', 'Boots of Travel', 'Octarine Core', 'Eul\'s Scepter'],
  level: 23,
  side: 'dire'
});

// Helper function to generate dire player 5
const generateDirePlayer5 = (): PlayerPerformance => ({
  playerId: '10',
  playerName: 'Player10',
  heroId: '10',
  heroName: 'Dazzle',
  kills: 1,
  deaths: 6,
  assists: 20,
  kda: 3.5,
  gpm: 260,
  xpm: 320,
  lastHits: 40,
  denies: 4,
  netWorth: 7840,
  heroDamage: 11800,
  heroHealing: 2800,
  towerDamage: 900,
  items: ['Aghanim\'s Scepter', 'Glimmer Cape', 'Tranquil Boots', 'Force Staff', 'Arcane Boots'],
  level: 16,
  side: 'dire'
});

// Helper function to generate radiant players
const generateRadiantPlayers = (): PlayerPerformance[] => [
  generateRadiantPlayer1(),
  generateRadiantPlayer2(),
  generateRadiantPlayer3(),
  generateRadiantPlayer4(),
  generateRadiantPlayer5()
];

// Helper function to generate dire players
const generateDirePlayers = (): PlayerPerformance[] => [
  generateDirePlayer1(),
  generateDirePlayer2(),
  generateDirePlayer3(),
  generateDirePlayer4(),
  generateDirePlayer5()
];

// Helper function to generate timeline events
const generateTimelineEvents = (): MatchTimeline[] => [
  {
    timestamp: 180,
    event: 'kill',
    player: 'Player1',
    hero: 'Anti-Mage',
    description: 'First blood on enemy carry',
    importance: 'high'
  },
  {
    timestamp: 420,
    event: 'tower',
    description: 'Bottom tier 1 tower destroyed',
    importance: 'medium'
  },
  {
    timestamp: 1260,
    event: 'roshan',
    description: 'Radiant team secures Roshan',
    importance: 'high'
  },
  {
    timestamp: 1800,
    event: 'kill',
    player: 'Player6',
    hero: 'Phantom Assassin',
    description: 'Triple kill in team fight',
    importance: 'high'
  },
  {
    timestamp: 2400,
    event: 'objective',
    description: 'Radiant team destroys all tier 2 towers',
    importance: 'medium'
  }
];

// Helper function to generate bans
const generateBans = () => [
  { heroId: '11', heroName: 'Invoker', team: 'radiant' as const, order: 1 },
  { heroId: '12', heroName: 'Pudge', team: 'dire' as const, order: 2 },
  { heroId: '13', heroName: 'Sniper', team: 'radiant' as const, order: 3 },
  { heroId: '14', heroName: 'Zeus', team: 'dire' as const, order: 4 },
  { heroId: '15', heroName: 'Witch Doctor', team: 'radiant' as const, order: 5 },
  { heroId: '16', heroName: 'Bounty Hunter', team: 'dire' as const, order: 6 }
];

// Helper function to generate picks
const generatePicks = () => [
  { heroId: '1', heroName: 'Anti-Mage', team: 'radiant' as const, order: 1, playerId: '1', playerName: 'Player1' },
  { heroId: '6', heroName: 'Phantom Assassin', team: 'dire' as const, order: 2, playerId: '6', playerName: 'Player6' },
  { heroId: '5', heroName: 'Crystal Maiden', team: 'radiant' as const, order: 3, playerId: '2', playerName: 'Player2' },
  { heroId: '7', heroName: 'Lion', team: 'dire' as const, order: 4, playerId: '7', playerName: 'Player7' },
  { heroId: '2', heroName: 'Axe', team: 'radiant' as const, order: 5, playerId: '3', playerName: 'Player3' },
  { heroId: '8', heroName: 'Tidehunter', team: 'dire' as const, order: 6, playerId: '8', playerName: 'Player8' },
  { heroId: '3', heroName: 'Lina', team: 'radiant' as const, order: 7, playerId: '4', playerName: 'Player4' },
  { heroId: '9', heroName: 'Storm Spirit', team: 'dire' as const, order: 8, playerId: '9', playerName: 'Player9' },
  { heroId: '4', heroName: 'Shadow Shaman', team: 'radiant' as const, order: 9, playerId: '5', playerName: 'Player5' },
  { heroId: '10', heroName: 'Dazzle', team: 'dire' as const, order: 10, playerId: '10', playerName: 'Player10' }
];

// Mock data generator - in real app this would come from API
const generateMockMatchDetails = (matchId: string): DetailedMatch => {
  const radiantPlayers = generateRadiantPlayers();
  const direPlayers = generateDirePlayers();
  const timeline = generateTimelineEvents();
  const bans = generateBans();
  const picks = generatePicks();

  return {
    id: matchId,
    duration: 2847,
    winner: 'radiant',
    radiantScore: 35,
    direScore: 28,
    gameMode: 'All Pick',
    patch: '7.34e',
    startTime: '2024-01-15T14:30:00Z',
    endTime: '2024-01-15T15:17:27Z',
    players: [...radiantPlayers, ...direPlayers],
    timeline,
    totalKills: 63,
    totalDeaths: 63,
    totalAssists: 142,
    objectives: {
      towers: { radiant: 8, dire: 3 },
      barracks: { radiant: 2, dire: 0 },
      roshan: 2
    },
    bans,
    picks
  };
};

export function useMatchDetails(matchId: string, initialLevel: 'basic' | 'advanced' | 'expert' = 'basic'): UseMatchDetailsReturn {
  const [currentLevel, setCurrentLevel] = useState<'basic' | 'advanced' | 'expert'>(initialLevel);
  const { loading: isLoadingMatches, error: matchesError } = useMatchData();

  // In a real app, this would fetch match details from the API
  // For now, we'll use mock data
  const matchDetails = generateMockMatchDetails(matchId);

  return {
    matchDetails,
    isLoading: isLoadingMatches,
    error: matchesError,
    currentLevel,
    setCurrentLevel,
    formatDuration,
    formatTimestamp,
    formatNumber,
    getKDAColor,
    getEventIcon
  };
} 