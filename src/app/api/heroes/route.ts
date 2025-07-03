/**
 * @openapi
 * /heroes:
 *   get:
 *     tags:
 *       - Heroes
 *     summary: Get all heroes
 *     responses:
 *       200:
 *         description: List of heroes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpenDotaHero'
 */
import { getHeroes } from '@/lib/api';
import { createSimpleRouteHandler } from '@/lib/api/route-utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return createSimpleRouteHandler(request, getHeroes);
}
