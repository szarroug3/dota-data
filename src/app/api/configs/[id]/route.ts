import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getDashboardConfigCacheFilename, getDashboardConfigCacheKey } from '@/lib/utils/cache-keys';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: configId } = await params;
  
  try {
    logWithTimestampToFile('log', `Config endpoint called for config ID: ${configId}`);
    
    const cacheKey = getDashboardConfigCacheKey(configId);
    const filename = getDashboardConfigCacheFilename(configId);
    
    // Check if config is already cached
    let configData = await cacheService.get(cacheKey, filename);
    
    if (!configData) {
      logWithTimestampToFile('log', `Config ${configId} not found in cache, generating mock data`);
      
      // Generate mock config data
      configData = {
        id: configId,
        name: `${configId.charAt(0).toUpperCase() + configId.slice(1)} Configuration`,
        description: `Configuration settings for ${configId}`,
        settings: {
          refreshInterval: 300, // 5 minutes
          maxCacheAge: 3600, // 1 hour
          enableNotifications: true,
          defaultLeagueId: '1234',
          defaultTeamId: '2586976',
          heroStatsEnabled: true,
          matchHistoryLimit: 50,
          playerStatsEnabled: true,
          teamAnalysisEnabled: true,
          metaInsightsEnabled: true,
          draftSuggestionsEnabled: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Cache the generated config directly
      await cacheService.set('config', cacheKey, configData, undefined, filename);
      logWithTimestampToFile('log', `Config ${configId} cached successfully`);
    }
    
    return NextResponse.json(configData);
    
  } catch (error) {
    logWithTimestampToFile('error', `Error in config endpoint for ${configId}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support GET for backward compatibility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
} 