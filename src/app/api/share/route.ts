import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

import { cache, getSharedPayload, setSharedPayload } from '@/app/api/share/cache';
import { getEnv } from '@/lib/config/environment';
import type { CacheValue } from '@/types/cache';

type ActiveTeam = { teamId: number; leagueId: number } | null;

type ShareSerializable = {
  teams: Record<string, CacheValue>;
  activeTeam: ActiveTeam;
  globalManualMatches: number[];
  globalManualPlayers: number[];
};

export interface SharePayload {
  teams: Record<string, CacheValue>;
  activeTeam: ActiveTeam;
  globalManualMatches: number[];
  globalManualPlayers: number[];
}

interface ShareRequestBody {
  key?: string;
  data: SharePayload;
}

function buildCacheKey(key: string): string {
  return `config:share:${key}`;
}

function generateKey(): string {
  // 6-character base62 (0-9, a-z, A-Z) key: 3 chars time + 3 chars random
  const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const TIME_MOD = 62 * 62 * 62; // 62^3 = 238,328

  function encodeBase62Fixed(num: number, length: number): string {
    let n = Math.max(0, Math.floor(num));
    let out = '';
    for (let i = 0; i < length; i += 1) {
      out = BASE62[n % 62] + out;
      n = Math.floor(n / 62);
    }
    return out;
  }

  const timeVal = Date.now() % TIME_MOD;

  // Prefer Web Crypto when available
  type GlobalWithCrypto = typeof globalThis & { crypto?: { getRandomValues: (array: Uint32Array) => Uint32Array } };
  const g = globalThis as GlobalWithCrypto;
  let rand32: number;
  if (typeof g.crypto?.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    g.crypto.getRandomValues(arr);
    rand32 = arr[0];
  } else {
    rand32 = randomBytes(4).readUInt32BE(0);
  }
  const randVal = rand32 % TIME_MOD;

  const timePart = encodeBase62Fixed(timeVal, 3);
  const randPart = encodeBase62Fixed(randVal, 3);
  return `${timePart}${randPart}`;
}

async function generateUniqueKey(): Promise<string> {
  // Attempt multiple times to avoid collisions with short keys
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateKey();
    const cacheKey = buildCacheKey(candidate);
    const existing = await getSharedPayload<Record<string, CacheValue> | null>(cacheKey);
    if (!existing) return candidate;
  }
  throw new Error('Failed to generate a unique share key');
}

function isValidShareBody(body: object | null | undefined): body is ShareRequestBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as { key?: string; data?: object };
  if (!b.data || typeof b.data !== 'object') return false;
  return true;
}

function toSerializable(data: SharePayload): ShareSerializable {
  return {
    teams: data.teams,
    activeTeam: data.activeTeam,
    globalManualMatches: data.globalManualMatches,
    globalManualPlayers: data.globalManualPlayers,
  };
}

async function writeMockShare(key: string, value: ShareSerializable): Promise<void> {
  if (!getEnv.WRITE_REAL_DATA_TO_MOCK()) return;
  try {
    const folder = path.join(process.cwd(), 'mock-data', 'share');
    await fs.mkdir(folder, { recursive: true });
    const filePath = path.join(folder, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write share payload to mock file:', e);
  }
}

/**
 * @swagger
 * /api/share:
 *   post:
 *     summary: Create or update a shareable dashboard configuration
 *     description: Stores a shareable snapshot of dashboard state in cache under a permanent key.
 *     tags:
 *       - Share
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: Existing share key to overwrite. If omitted, a new key is generated.
 *               data:
 *                 type: object
 *                 required: [teams, activeTeam, globalManualMatches, globalManualPlayers]
 *                 properties:
 *                   teams:
 *                     type: object
 *                     additionalProperties: true
 *                   activeTeam:
 *                     oneOf:
 *                       - type: 'null'
 *                       - type: object
 *                         properties:
 *                           teamId:
 *                             type: integer
 *                           leagueId:
 *                             type: integer
 *                   globalManualMatches:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   globalManualPlayers:
 *                     type: array
 *                     items:
 *                       type: integer
 *           examples:
 *             create:
 *               summary: Create a new share
 *               value:
 *                 data:
 *                   teams: { "team:9517508": { "id": 9517508 } }
 *                   activeTeam: { teamId: 9517508, leagueId: 16435 }
 *                   globalManualMatches: [8054301932]
 *                   globalManualPlayers: [123456789]
 *             update:
 *               summary: Update an existing share
 *               value:
 *                 key: "abc123"
 *                 data:
 *                   teams: { "team:9517508": { "id": 9517508 } }
 *                   activeTeam: { teamId: 9517508, leagueId: 16435 }
 *                   globalManualMatches: [8054301932, 8054337855]
 *                   globalManualPlayers: [123456789, 987654321]
 *     responses:
 *       200:
 *         description: Share snapshot stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 backend:
 *                   type: string
 *                   enum: [redis, memory]
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * Create or update a share payload.
 *
 * Request body: { key?: string, data: SharePayload }
 * - If key is provided, upserts under the same key.
 * - If key is omitted, generates a new key and returns it.
 *
 * Response: { key: string }
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = await request.json();
    if (!isValidShareBody(parsed)) {
      return NextResponse.json(
        { error: 'Invalid request body', status: 400, details: 'Missing or invalid data field' },
        { status: 400 },
      );
    }
    const body = parsed as ShareRequestBody;

    let key: string;
    let cacheKey: string;
    if (body.key && typeof body.key === 'string' && body.key.trim().length > 0) {
      // If key is provided, reject if it already exists
      key = body.key;
      cacheKey = buildCacheKey(key);
      const exists = await getSharedPayload<Record<string, CacheValue> | null>(cacheKey);
      if (exists) {
        return NextResponse.json(
          { error: 'Key already exists', status: 409, details: 'Provided key conflicts with an existing share' },
          { status: 409 },
        );
      }
    } else {
      // Create a new unique key
      key = await generateUniqueKey();
      cacheKey = buildCacheKey(key);
    }

    const value = toSerializable(body.data);

    // Store permanently (no TTL) and mirror in in-process store for test determinism
    await setSharedPayload(cacheKey, value);

    await writeMockShare(key, value);

    return NextResponse.json(
      { key, timestamp: new Date().toISOString(), backend: cache.getBackendType() },
      { status: 200 },
    );
  } catch (error) {
    console.error('Share POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to store share payload',
        status: 500,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
