import fs from 'fs/promises';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

import { getSharedPayload, setSharedPayload } from '@/app/api/share/cache';
import { getEnv } from '@/lib/config/environment';

function buildCacheKey(key: string): string {
  return `config:share:${key}`;
}

async function readMockShareFromDisk(key: string): Promise<Record<string, import('@/types/cache').CacheValue> | null> {
  try {
    const filePath = path.join(process.cwd(), 'mock-data', 'share', `${key}.json`);
    const file = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(file) as Record<string, import('@/types/cache').CacheValue>;
  } catch {
    return null;
  }
}

async function loadSharePayload(
  cacheKey: string,
  key: string,
): Promise<Record<string, import('@/types/cache').CacheValue> | null> {
  const cached = await getSharedPayload<Record<string, import('@/types/cache').CacheValue>>(cacheKey);
  if (cached) return cached;

  if (getEnv.USE_MOCK_API() || getEnv.USE_MOCK_DB()) {
    const mockData = await readMockShareFromDisk(key);
    if (mockData) {
      await setSharedPayload(cacheKey, mockData);
      return mockData;
    }
  }
  return null;
}

/**
 * @swagger
 * /api/share/{key}:
 *   get:
 *     summary: Retrieve a shared dashboard configuration
 *     description: Returns the stored share payload for a given key.
 *     tags:
 *       - Share
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Share key returned from POST /api/share
 *     responses:
 *       200:
 *         description: Share payload found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: object
 *                   additionalProperties: true
 *                 activeTeam:
 *                   oneOf:
 *                     - type: 'null'
 *                     - type: object
 *                       properties:
 *                         teamId:
 *                           type: integer
 *                         leagueId:
 *                           type: integer
 *                 globalManualMatches:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 globalManualPlayers:
 *                   type: array
 *                   items:
 *                     type: integer
 *       404:
 *         description: Share key not found
 *       400:
 *         description: Missing or invalid key
 *       500:
 *         description: Internal server error
 */

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string }> | { key: string } },
): Promise<NextResponse> {
  try {
    const resolved = 'then' in context.params ? await context.params : context.params;
    const key = resolved?.key;
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    const cacheKey = buildCacheKey(key);
    const payload = await loadSharePayload(cacheKey, key);
    if (!payload) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Share GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve share payload',
        status: 500,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
