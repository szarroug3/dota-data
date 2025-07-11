import { NextRequest } from 'next/server';

import { GET } from '@/app/api/heroes/route';
import { fetchOpenDotaHeroes } from '@/lib/api/opendota/heroes';
import { GracefulShutdown } from '@/lib/graceful-shutdown';
import { performanceMonitor } from '@/lib/performance-monitor';
import { RequestTracer } from '@/lib/request-tracer';
import { processHero } from '@/lib/services/hero-processor';
import { ApiErrorResponse } from '@/types/api';
import { OpenDotaHero } from '@/types/external-apis';

// Mock dependencies
jest.mock('@/lib/api/opendota/heroes');
jest.mock('@/lib/services/hero-processor');

const mockFetchOpenDotaHeroes = fetchOpenDotaHeroes as jest.MockedFunction<typeof fetchOpenDotaHeroes>;
const mockProcessHero = processHero as jest.MockedFunction<typeof processHero>;

// Setup and teardown to prevent hanging
beforeAll(() => {
  // Clear any existing timers
  jest.clearAllTimers();
});

afterAll(() => {
  // Clean up background services
  try {
    const requestTracer = RequestTracer.getInstance();
    requestTracer.cleanup();
  } catch {
    // Ignore cleanup errors
  }

  try {
    const gracefulShutdown = GracefulShutdown.getInstance();
    gracefulShutdown.cleanup();
  } catch {
    // Ignore cleanup errors
  }

  try {
    // Use the global performance monitor instance
    performanceMonitor.cleanup();
  } catch {
    // Ignore cleanup errors
  }

  // Clear all timers and intervals
  jest.clearAllTimers();
  
  // Force cleanup of any remaining handles
  if (global.gc) {
    global.gc();
  }
});

afterEach(() => {
  // Clear timers after each test
  jest.clearAllTimers();
});

// Mock data
const mockRawHeroes: OpenDotaHero[] = [
  {
    id: 1,
    name: 'npc_dota_hero_antimage',
    localized_name: 'Anti-Mage',
    primary_attr: 'agi',
    attack_type: 'Melee',
    roles: ['Carry', 'Escape', 'Nuker'],
    img: '/apps/dota2/images/dota_react/heroes/antimage.png',
    icon: '/apps/dota2/images/dota_react/heroes/icons/antimage.png',
    base_health: 200,
    base_mana: 75,
    base_armor: -1,
    base_attack_min: 29,
    base_attack_max: 33,
    move_speed: 310,
    base_attack_time: 1.4,
    attack_point: 0.3,
    attack_range: 150,
    projectile_speed: 0,
    turn_rate: 0.65,
    cm_enabled: true,
    legs: 2,
    day_vision: 1800,
    night_vision: 800,
    hero_id: 1,
    turbo_picks: 100,
    turbo_wins: 50,
    pro_ban: 10,
    pro_win: 5,
    pro_pick: 10,
    "1_pick": 1000,
    "1_win": 500,
    "2_pick": 2000,
    "2_win": 1000,
    "3_pick": 3000,
    "3_win": 1500,
    "4_pick": 4000,
    "4_win": 2000,
    "5_pick": 5000,
    "5_win": 2500,
    "6_pick": 6000,
    "6_win": 3000,
    "7_pick": 7000,
    "7_win": 3500,
    "8_pick": 8000,
    "8_win": 4000,
    null_pick: 1000,
    null_win: 500
  },
  {
    id: 2,
    name: 'npc_dota_hero_axe',
    localized_name: 'Axe',
    primary_attr: 'str',
    attack_type: 'Melee',
    roles: ['Initiator', 'Durable', 'Disabler'],
    img: '/apps/dota2/images/dota_react/heroes/axe.png',
    icon: '/apps/dota2/images/dota_react/heroes/icons/axe.png',
    base_health: 200,
    base_mana: 75,
    base_armor: -1,
    base_attack_min: 27,
    base_attack_max: 31,
    move_speed: 310,
    base_attack_time: 1.7,
    attack_point: 0.5,
    attack_range: 150,
    projectile_speed: 0,
    turn_rate: 0.6,
    cm_enabled: true,
    legs: 2,
    day_vision: 1800,
    night_vision: 800,
    hero_id: 2,
    turbo_picks: 200,
    turbo_wins: 100,
    pro_ban: 20,
    pro_win: 10,
    pro_pick: 20,
    "1_pick": 1500,
    "1_win": 750,
    "2_pick": 2500,
    "2_win": 1250,
    "3_pick": 3500,
    "3_win": 1750,
    "4_pick": 4500,
    "4_win": 2250,
    "5_pick": 5500,
    "5_win": 2750,
    "6_pick": 6500,
    "6_win": 3250,
    "7_pick": 7500,
    "7_win": 3750,
    "8_pick": 8500,
    "8_win": 4250,
    null_pick: 1500,
    null_win: 750
  }
];

const mockProcessedHeroes = [
  {
    heroId: 1,
    name: 'Anti-Mage',
    displayName: 'Anti-Mage',
    attributes: {
      primaryAttribute: 'agi' as const,
      attackType: 'Melee' as const,
      roles: ['Carry', 'Escape', 'Nuker'],
      complexity: 'intermediate' as const,
      baseStats: {
        health: 200,
        mana: 75,
        armor: -1,
        attackDamage: { min: 29, max: 33 },
        moveSpeed: 310,
        attackTime: 1.4,
        attackRange: 150,
        turnRate: 0.65,
        vision: { day: 1800, night: 800 },
        legs: 2
      },
      growth: {
        healthPerLevel: 80,
        manaPerLevel: 35,
        damagePerLevel: 2.8
      },
      urls: {
        image: '/apps/dota2/images/dota_react/heroes/antimage.png',
        icon: '/apps/dota2/images/dota_react/heroes/icons/antimage.png'
      }
    },
    statistics: {
      totalPicks: 1000,
      totalWins: 500,
      globalWinRate: 50,
      pickRate: 15,
      banRate: 8,
      contestRate: 23,
      bySkillBracket: {
        herald: { picks: 100, wins: 48, winRate: 48 },
        guardian: { picks: 200, wins: 100, winRate: 50 },
        crusader: { picks: 300, wins: 153, winRate: 51 },
        archon: { picks: 400, wins: 208, winRate: 52 },
        legend: { picks: 500, wins: 265, winRate: 53 },
        ancient: { picks: 600, wins: 324, winRate: 54 },
        divine: { picks: 700, wins: 385, winRate: 55 },
        immortal: { picks: 800, wins: 448, winRate: 56 }
      },
      professional: {
        picks: 100,
        wins: 48,
        winRate: 48,
        banRate: 15,
        contestRate: 63,
        averageGameDuration: 35
      },
      turbo: {
        picks: 200,
        wins: 100,
        winRate: 50
      }
    },
    performance: {
      strengths: ['High mobility', 'Strong late game'],
      weaknesses: ['Weak early game', 'Squishy'],
      optimalGameDuration: { early: 20, mid: 40, late: 60 },
      roleEffectiveness: {
        carry: 90,
        mid: 70,
        offlane: 30,
        support: 10,
        hardSupport: 5
      },
      teamfightContribution: {
        damage: 80,
        control: 20,
        utility: 30,
        tankiness: 40,
        mobility: 95
      },
      farmingEfficiency: 85,
      pusherPotential: 60,
      soloKillPotential: 70,
      teamDependency: 30,
      skillCeiling: 85,
      skillFloor: 45
    },
    meta: {
      tier: 'A' as const,
      metaScore: 75,
      popularityTrend: 'stable' as const,
      winRateTrend: 'stable' as const,
      patchNotes: [],
      recommendedFor: {
        beginners: false,
        intermediate: true,
        advanced: true,
        professional: true
      },
      currentMeta: {
        isViable: true,
        metaRank: 15,
        reasonsForViability: ['Strong late game', 'High mobility'],
        reasonsAgainstViability: ['Weak early game']
      }
    },
    matchups: {
      strongAgainst: [],
      weakAgainst: [],
      synergizes: [],
      struggles: [],
      neutralMatchups: []
    },
    builds: {
      popularBuilds: [],
      itemRecommendations: {
        startingItems: [],
        coreItems: [],
        luxuryItems: [],
        situationalItems: []
      },
      skillProgression: {
        maxFirst: [],
        popularProgression: [],
        alternatives: []
      }
    },
    trends: {
      pickTrend: 'stable' as const,
      winRateTrend: 'stable' as const,
      banTrend: 'stable' as const,
      professionalTrend: 'stable' as const,
      predictions: {
        nextPatchImpact: 'neutral' as const,
        metaForecast: 'stable' as const,
        recommendedAction: 'monitor' as const
      }
    },
    processed: {
      timestamp: '2024-01-01T00:00:00Z',
      version: '1.0.0'
    }
  },
  {
    heroId: 2,
    name: 'Axe',
    displayName: 'Axe',
    attributes: {
      primaryAttribute: 'strength' as const,
      attackType: 'Melee' as const,
      roles: ['Initiator', 'Durable', 'Disabler'],
      complexity: 'beginner' as const,
      baseStats: {
        health: 200,
        mana: 75,
        armor: -1,
        attackDamage: { min: 27, max: 31 },
        moveSpeed: 310,
        attackTime: 1.7,
        attackRange: 150,
        turnRate: 0.6,
        vision: { day: 1800, night: 800 },
        legs: 2
      },
      growth: {
        healthPerLevel: 85,
        manaPerLevel: 30,
        damagePerLevel: 2.5
      },
      urls: {
        image: '/apps/dota2/images/dota_react/heroes/axe.png',
        icon: '/apps/dota2/images/dota_react/heroes/icons/axe.png'
      }
    },
    statistics: {
      totalPicks: 1500,
      totalWins: 750,
      globalWinRate: 50,
      pickRate: 12,
      banRate: 5,
      contestRate: 17,
      bySkillBracket: {
        herald: { picks: 150, wins: 80, winRate: 53 },
        guardian: { picks: 250, wins: 130, winRate: 52 },
        crusader: { picks: 350, wins: 179, winRate: 51 },
        archon: { picks: 450, wins: 225, winRate: 50 },
        legend: { picks: 550, wins: 270, winRate: 49 },
        ancient: { picks: 650, wins: 312, winRate: 48 },
        divine: { picks: 750, wins: 345, winRate: 46 },
        immortal: { picks: 850, wins: 368, winRate: 43 }
      },
      professional: {
        picks: 50,
        wins: 23,
        winRate: 46,
        banRate: 2,
        contestRate: 52,
        averageGameDuration: 30
      },
      turbo: {
        picks: 300,
        wins: 150,
        winRate: 50
      }
    },
    performance: {
      strengths: ['Strong initiation', 'Durable'],
      weaknesses: ['Low mobility', 'Mana dependent'],
      optimalGameDuration: { early: 15, mid: 35, late: 45 },
      roleEffectiveness: {
        carry: 20,
        mid: 40,
        offlane: 85,
        support: 60,
        hardSupport: 30
      },
      teamfightContribution: {
        damage: 60,
        control: 85,
        utility: 70,
        tankiness: 90,
        mobility: 30
      },
      farmingEfficiency: 50,
      pusherPotential: 40,
      soloKillPotential: 60,
      teamDependency: 70,
      skillCeiling: 65,
      skillFloor: 35
    },
    meta: {
      tier: 'B' as const,
      metaScore: 65,
      popularityTrend: 'stable' as const,
      winRateTrend: 'stable' as const,
      patchNotes: [],
      recommendedFor: {
        beginners: true,
        intermediate: true,
        advanced: false,
        professional: false
      },
      currentMeta: {
        isViable: true,
        metaRank: 25,
        reasonsForViability: ['Strong initiation', 'Durable'],
        reasonsAgainstViability: ['Low mobility']
      }
    },
    matchups: {
      strongAgainst: [],
      weakAgainst: [],
      synergizes: [],
      struggles: [],
      neutralMatchups: []
    },
    builds: {
      popularBuilds: [],
      itemRecommendations: {
        startingItems: [],
        coreItems: [],
        luxuryItems: [],
        situationalItems: []
      },
      skillProgression: {
        maxFirst: [],
        popularProgression: [],
        alternatives: []
      }
    },
    trends: {
      pickTrend: 'stable' as const,
      winRateTrend: 'stable' as const,
      banTrend: 'stable' as const,
      professionalTrend: 'stable' as const,
      predictions: {
        nextPatchImpact: 'neutral' as const,
        metaForecast: 'stable' as const,
        recommendedAction: 'monitor' as const
      }
    },
    processed: {
      timestamp: '2024-01-01T00:00:00Z',
      version: '1.0.0'
    }
  }
];

describe('Heroes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchOpenDotaHeroes.mockResolvedValue(mockRawHeroes);
    mockProcessHero.mockImplementation((data) => {
      // Return appropriate mock based on the hero
      if (data.hero.id === 1) return mockProcessedHeroes[0] as any;
      if (data.hero.id === 2) return mockProcessedHeroes[1] as any;
      return mockProcessedHeroes[0] as any;
    });
  });

  describe('GET /api/heroes', () => {
    describe('Success Cases', () => {
      it('should return all heroes with default parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(2);
        expect(data.count).toBe(2);
        expect(data.totalCount).toBe(2);
        expect(data.timestamp).toBeDefined();
        expect(data.filters).toEqual({
          complexity: null,
          role: null,
          primaryAttribute: null,
          tier: null
        });

        expect(mockFetchOpenDotaHeroes).toHaveBeenCalledWith(false);
        expect(mockProcessHero).toHaveBeenCalledTimes(2);
      });

      it('should handle force refresh parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?force=true');
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(mockFetchOpenDotaHeroes).toHaveBeenCalledWith(true);
      });

      it('should filter heroes by complexity', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?complexity=beginner');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].complexity).toBe('beginner');
        expect(data.count).toBe(1);
        expect(data.totalCount).toBe(2);
        expect(data.filters.complexity).toBe('beginner');
      });

      it('should filter heroes by role', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?role=carry');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].roles).toContain('Carry');
        expect(data.filters.role).toBe('carry');
      });

      it('should filter heroes by primary attribute', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?primaryAttribute=strength');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].primaryAttribute).toBe('strength');
        expect(data.filters.primaryAttribute).toBe('strength');
      });

      it('should filter heroes by tier', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?tier=A');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].tier).toBe('A');
        expect(data.filters.tier).toBe('A');
      });

      it('should apply multiple filters', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?complexity=beginner&tier=B');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].complexity).toBe('beginner');
        expect(data.data[0].tier).toBe('B');
        expect(data.filters.complexity).toBe('beginner');
        expect(data.filters.tier).toBe('B');
      });

      it('should return empty results when no heroes match filters', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?complexity=advanced');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(0);
        expect(data.count).toBe(0);
        expect(data.totalCount).toBe(2);
        expect(data.filters.complexity).toBe('advanced');
      });
    });

    describe('Error Cases', () => {
      it('should handle rate limiting errors', async () => {
        mockFetchOpenDotaHeroes.mockRejectedValue(new Error('Rate limited by OpenDota API'));
        
        const request = new NextRequest('http://localhost:3000/api/heroes');
        const response = await GET(request);
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(429);
        expect(data.error).toBe('Rate limited by OpenDota API');
        expect(data.status).toBe(429);
        expect(data.details).toBe('Too many requests to OpenDota API. Please try again later.');
      });

      it('should handle data not found errors', async () => {
        mockFetchOpenDotaHeroes.mockRejectedValue(new Error('Failed to load OpenDota heroes from mock data'));
        
        const request = new NextRequest('http://localhost:3000/api/heroes');
        const response = await GET(request);
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(404);
        expect(data.error).toBe('Data Not Found');
        expect(data.status).toBe(404);
        expect(data.details).toBe('Heroes data could not be found or loaded.');
      });

      it('should handle processing errors', async () => {
        mockProcessHero.mockImplementation(() => {
          throw new Error('Processing failed');
        });
        
        const request = new NextRequest('http://localhost:3000/api/heroes');
        const response = await GET(request);
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process heroes');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Processing failed');
      });

      it('should handle unexpected errors', async () => {
        mockFetchOpenDotaHeroes.mockRejectedValue(new Error('Unexpected error'));
        
        const request = new NextRequest('http://localhost:3000/api/heroes');
        const response = await GET(request);
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process heroes');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Unexpected error');
      });

      it('should handle non-Error exceptions', async () => {
        mockFetchOpenDotaHeroes.mockRejectedValue('String error');
        
        const request = new NextRequest('http://localhost:3000/api/heroes');
        const response = await GET(request);
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process heroes');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Unknown error occurred');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty heroes array', async () => {
        mockFetchOpenDotaHeroes.mockResolvedValue([]);
        
        const request = new NextRequest('http://localhost:3000/api/heroes');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(0);
        expect(data.count).toBe(0);
        expect(data.totalCount).toBe(0);
      });

      it('should handle case insensitive role filtering', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?role=CARRY');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].roles).toContain('Carry');
      });

      it('should handle case insensitive primary attribute filtering', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?primaryAttribute=STRENGTH');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].primaryAttribute).toBe('strength');
      });

      it('should handle partial role matches', async () => {
        const request = new NextRequest('http://localhost:3000/api/heroes?role=init');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].roles).toContain('Initiator');
      });
    });
  });
}); 