import { cacheService } from '@/lib/cache-service';
import { corsOptionsHandler, withCORS } from '@/lib/cors';
import { getDashboardConfigCacheFilename, getDashboardConfigCacheKey } from '@/lib/utils/cache-keys';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @openapi
 * /configs/{id}:
 *   get:
 *     tags:
 *       - Configs
 *     summary: Get config by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Config ID
 *     responses:
 *       200:
 *         description: Config data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *   post:
 *     tags:
 *       - Configs
 *     summary: Update config by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Config updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cacheKey = getDashboardConfigCacheKey(id);
  const filename = getDashboardConfigCacheFilename(id);
  const CONFIG_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
  if (!id || typeof id !== 'string') {
    return withCORS(NextResponse.json({ error: 'Invalid id' }, { status: 400 }));
  }
  const config = await cacheService.get(cacheKey, filename, CONFIG_TTL);
  if (!config) {
    return withCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }));
  }
  // Sliding expiry: extend TTL on access
  await cacheService.set('dashboard-config', cacheKey, config, CONFIG_TTL, filename);
  return withCORS(NextResponse.json(config));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cacheKey = getDashboardConfigCacheKey(id);
  const filename = getDashboardConfigCacheFilename(id);
  const CONFIG_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
  if (!id || typeof id !== 'string') {
    return withCORS(NextResponse.json({ error: 'Invalid id' }, { status: 400 }));
  }
  const config = await request.json();
  await cacheService.set('dashboard-config', cacheKey, config, CONFIG_TTL, filename);
  return withCORS(NextResponse.json({ success: true }));
}

export async function OPTIONS() {
  return corsOptionsHandler();
}
