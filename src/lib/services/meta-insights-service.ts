/**
 * Meta insights processing service
 * 
 * Handles generating meta analysis and insights
 */

import type { MetaInsights } from "../types/data-service";
import { logWithTimestamp } from "../utils";

/**
 * Generate meta insights for a given time range
 */
export async function getMetaInsights(
  timeRange: "week" | "month" | "patch" = "week"
): Promise<MetaInsights> {
  try {
    logWithTimestamp(`Generating meta insights for time range: ${timeRange}`);

    // Generate current meta analysis
    const currentMeta = generateCurrentMeta(timeRange);
    
    // Generate meta trends
    const metaTrends = generateMetaTrends(timeRange);
    
    // Generate role statistics
    const roleStats = generateRoleStats(timeRange);

    return {
      currentMeta,
      metaTrends,
      roleStats
    };
  } catch (error) {
    logWithTimestamp(`Error generating meta insights:`, error);
    return generateDefaultMetaInsights();
  }
}

/**
 * Generate current meta analysis
 */
function generateCurrentMeta(timeRange: string) {
  const keyHeroes = [
    { hero: 'Anti-Mage', pickRate: 15.2, winRate: 52.1, banRate: 8.3 },
    { hero: 'Invoker', pickRate: 12.8, winRate: 48.9, banRate: 12.1 },
    { hero: 'Crystal Maiden', pickRate: 18.5, winRate: 51.3, banRate: 5.2 },
    { hero: 'Axe', pickRate: 14.7, winRate: 53.2, banRate: 9.8 },
    { hero: 'Phantom Assassin', pickRate: 11.3, winRate: 49.8, banRate: 15.4 }
  ];

  const strategies = [
    'Early game aggression with strong laning',
    'Mid game team fighting and objective control',
    'Late game scaling with carry protection',
    'Split pushing and map pressure',
    'High tempo with early Roshan attempts'
  ];

  return {
    description: `Current meta favors ${timeRange === 'week' ? 'aggressive early game' : 'balanced compositions'} with strong team fighting capabilities.`,
    keyHeroes,
    strategies
  };
}

/**
 * Generate meta trends
 */
function generateMetaTrends(timeRange: string) {
  logWithTimestamp('log', `[MetaInsightsService] Generating meta trends for ${timeRange}`)
  const trends = [
    {
      title: 'Early Game Dominance',
      description: 'Teams are prioritizing early game heroes and aggressive strategies',
      impact: 'High',
      trend: 'up' as const,
      details: 'Win rate for early game focused compositions increased by 8% this patch'
    },
    {
      title: 'Support Role Evolution',
      description: 'Supports are taking on more responsibility for map control and vision',
      impact: 'Medium',
      trend: 'up' as const,
      details: 'Average support GPM increased by 15% while maintaining utility focus'
    },
    {
      title: 'Carry Diversity',
      description: 'More carry heroes are becoming viable in competitive play',
      impact: 'Medium',
      trend: 'neutral' as const,
      details: 'Top 10 carries now represent 8 different heroes vs 5 last patch'
    },
    {
      title: 'Mid Lane Pressure',
      description: 'Mid laners are expected to create more map pressure early',
      impact: 'High',
      trend: 'up' as const,
      details: 'Average mid lane rotations before 10 minutes increased by 25%'
    }
  ];

  return trends;
}

/**
 * Generate role statistics
 */
function generateRoleStats(timeRange: string) {
  logWithTimestamp('log', `[MetaInsightsService] Generating role stats for ${timeRange}`)
  return {
    carry: { 
      avgGPM: 580, 
      avgKDA: '2.8', 
      winRate: 51.2 
    },
    mid: { 
      avgGPM: 520, 
      avgKDA: '3.1', 
      winRate: 50.8 
    },
    offlane: { 
      avgGPM: 450, 
      avgKDA: '2.9', 
      winRate: 49.7 
    },
    support: { 
      avgGPM: 380, 
      avgKDA: '2.4', 
      winRate: 48.9 
    }
  };
}

/**
 * Generate default meta insights when data is unavailable
 */
function generateDefaultMetaInsights(): MetaInsights {
  return {
    currentMeta: {
      description: 'Meta analysis is currently unavailable. Please try again later.',
      keyHeroes: [],
      strategies: []
    },
    metaTrends: [
      {
        title: 'Data Unavailable',
        description: 'Meta trend data is not currently available',
        impact: 'Unknown',
        trend: 'neutral' as const,
        details: 'Please check back later for updated meta insights'
      }
    ],
    roleStats: {
      carry: { avgGPM: 0, avgKDA: '0.0', winRate: 0 },
      mid: { avgGPM: 0, avgKDA: '0.0', winRate: 0 },
      offlane: { avgGPM: 0, avgKDA: '0.0', winRate: 0 },
      support: { avgGPM: 0, avgKDA: '0.0', winRate: 0 }
    }
  };
} 