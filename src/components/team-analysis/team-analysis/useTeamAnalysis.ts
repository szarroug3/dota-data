import { useMemo } from 'react';

import type { Match, Player } from '@/types/contexts/team-context-value';

export interface TeamAnalysis {
  overall: {
    winRate: number;
    totalMatches: number;
    averageMatchDuration: number;
    mostSuccessfulStrategy: string;
    preferredSide: 'radiant' | 'dire';
  };
  strengths: Array<{
    category: string;
    score: number;
    description: string;
    examples: string[];
  }>;
  weaknesses: Array<{
    category: string;
    score: number;
    description: string;
    improvements: string[];
  }>;
  heroPerformance: {
    mostSuccessful: Array<{
      heroName: string;
      winRate: number;
      matches: number;
      averageKDA: number;
    }>;
    underperforming: Array<{
      heroName: string;
      winRate: number;
      matches: number;
      averageKDA: number;
    }>;
  };
  timePatterns: {
    earlyGame: { performance: number; trend: 'improving' | 'declining' | 'stable' };
    midGame: { performance: number; trend: 'improving' | 'declining' | 'stable' };
    lateGame: { performance: number; trend: 'improving' | 'declining' | 'stable' };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    actionItems: string[];
  }>;
}

const generateStrengths = () => [
  {
    category: 'Team Fighting',
    score: 85 + Math.random() * 15,
    description: 'Excellent coordination in team fights with good positioning and ability timing.',
    examples: ['5-man deathball pushes', 'Coordinated smoke ganks', 'Counter-initiation plays']
  },
  {
    category: 'Objective Control',
    score: 78 + Math.random() * 15,
    description: 'Strong Roshan control and tower timing.',
    examples: ['Early Roshan attempts', 'Strategic tower diving', 'Map control through vision']
  },
  {
    category: 'Late Game Scaling',
    score: 72 + Math.random() * 15,
    description: 'Team performs well in extended matches.',
    examples: ['Carry farming efficiency', 'Support itemization', 'High ground defense']
  }
];

const generateWeaknesses = () => [
  {
    category: 'Early Game Aggression',
    score: 45 + Math.random() * 15,
    description: 'Struggles to apply early pressure and secure advantage.',
    improvements: ['Improve laning efficiency', 'Better early game rotations', 'Aggressive warding']
  },
  {
    category: 'Draft Flexibility',
    score: 52 + Math.random() * 15,
    description: 'Limited hero pool affecting draft options.',
    improvements: ['Expand hero pool', 'Practice unconventional strategies', 'Better ban phase']
  },
  {
    category: 'Vision Game',
    score: 48 + Math.random() * 15,
    description: 'Inconsistent ward placement and dewarding.',
    improvements: ['Dedicated support training', 'Better vision timing', 'Counter-warding practice']
  }
];

const generateHeroPerformance = () => ({
  mostSuccessful: [
    { heroName: 'Pudge', winRate: 75, matches: 12, averageKDA: 2.8 },
    { heroName: 'Invoker', winRate: 72, matches: 18, averageKDA: 3.2 },
    { heroName: 'Crystal Maiden', winRate: 69, matches: 16, averageKDA: 2.1 },
    { heroName: 'Anti-Mage', winRate: 67, matches: 9, averageKDA: 3.5 },
    { heroName: 'Enigma', winRate: 65, matches: 8, averageKDA: 2.9 }
  ],
  underperforming: [
    { heroName: 'Techies', winRate: 25, matches: 8, averageKDA: 1.2 },
    { heroName: 'Meepo', winRate: 30, matches: 10, averageKDA: 1.5 },
    { heroName: 'Chen', winRate: 35, matches: 6, averageKDA: 1.8 },
    { heroName: 'Visage', winRate: 38, matches: 7, averageKDA: 1.9 }
  ]
});

const generateTimePatterns = () => ({
  earlyGame: { performance: 62 + Math.random() * 20, trend: 'improving' as const },
  midGame: { performance: 75 + Math.random() * 15, trend: 'stable' as const },
  lateGame: { performance: 82 + Math.random() * 15, trend: 'declining' as const }
});

const generateRecommendations = () => [
  {
    priority: 'high' as const,
    category: 'Strategy',
    title: 'Improve Early Game Presence',
    description: 'Focus on securing early advantages through aggressive laning and ganking.',
    actionItems: [
      'Practice lane rotations in scrimmages',
      'Study early game ward patterns',
      'Develop signature early game strategies'
    ]
  },
  {
    priority: 'high' as const,
    category: 'Draft',
    title: 'Expand Hero Pool',
    description: 'Increase flexibility in drafting phase by learning meta heroes.',
    actionItems: [
      'Each player learns 2-3 new meta heroes',
      'Practice against common counter-picks',
      'Develop backup strategies for banned heroes'
    ]
  },
  {
    priority: 'medium' as const,
    category: 'Mechanics',
    title: 'Team Fight Coordination',
    description: 'While strong, coordination can be improved with better communication.',
    actionItems: [
      'Implement standardized call-outs',
      'Practice specific team fight scenarios',
      'Review team fight replays weekly'
    ]
  },
  {
    priority: 'low' as const,
    category: 'Mental',
    title: 'Late Game Consistency',
    description: 'Maintain focus and decision-making quality in extended matches.',
    actionItems: [
      'Mental coaching sessions',
      'Stamina building exercises',
      'Late game scenario practice'
    ]
  }
];

const generateTeamAnalysis = (
  matches: Match[],
  players: Player[],
  activeTeamId: string
): TeamAnalysis => {
  if (!matches || !players || !activeTeamId) {
    return {
      overall: {
        winRate: 0,
        totalMatches: 0,
        averageMatchDuration: 0,
        mostSuccessfulStrategy: 'Unknown',
        preferredSide: 'radiant'
      },
      strengths: [],
      weaknesses: [],
      heroPerformance: { mostSuccessful: [], underperforming: [] },
      timePatterns: {
        earlyGame: { performance: 0, trend: 'stable' },
        midGame: { performance: 0, trend: 'stable' },
        lateGame: { performance: 0, trend: 'stable' }
      },
      recommendations: []
    };
  }

  const winRate = 55 + Math.random() * 30;
  const totalMatches = 45 + Math.floor(Math.random() * 50);

  return {
    overall: {
      winRate,
      totalMatches,
      averageMatchDuration: 35 + Math.random() * 20,
      mostSuccessfulStrategy: ['Push Strategy', 'Team Fight', 'Split Push', 'Ganking'][Math.floor(Math.random() * 4)],
      preferredSide: Math.random() > 0.5 ? 'radiant' : 'dire'
    },
    strengths: generateStrengths(),
    weaknesses: generateWeaknesses(),
    heroPerformance: generateHeroPerformance(),
    timePatterns: generateTimePatterns(),
    recommendations: generateRecommendations()
  };
};

export const useTeamAnalysis = (matches: Match[], players: Player[], activeTeamId: string) => {
  const teamAnalysis = useMemo(() => {
    return generateTeamAnalysis(matches, players, activeTeamId);
  }, [matches, players, activeTeamId]);

  return {
    teamAnalysis
  };
}; 