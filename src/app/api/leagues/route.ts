import { NextRequest, NextResponse } from 'next/server';

import { fetchLeaguesFromOpendota } from '@/lib/api/opendota/leagues';
import { ApiErrorResponse } from '@/types/api';

export const runtime = 'nodejs';

/**
 * @swagger
 * /api/leagues:
 *   get:
 *     summary: Fetch OpenDota leagues list
 *     description: Returns the full list of leagues from OpenDota. Frontend filters this list by leagueid to find a league name. Supports forcing a refresh of the cached list.
 *     tags:
 *       - Leagues
 *     parameters:
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached leagues list
 *     responses:
 *       200:
 *         description: Successfully retrieved leagues list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leagues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       leagueid:
 *                         type: integer
 *                       name:
 *                         type: string
 *             example:
 *               leagues:
 *                 - leagueid: 17805
 *                   name: The International 2024
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 status:
 *                   type: integer
 *                 details:
 *                   type: string
 *             example:
 *               error: Failed to fetch leagues from OpenDota
 *               status: 500
 *               details: Unknown error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const leagues = await fetchLeaguesFromOpendota(force);
    return NextResponse.json({ leagues });
  } catch (error) {
    const err: ApiErrorResponse = {
      error: 'Failed to fetch leagues from OpenDota',
      status: 500,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(err, { status: 500 });
  }
}
