import { corsOptionsHandler, withCORS } from '@/lib/cors';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

/**
 * @openapi
 * /openapi:
 *   get:
 *     tags:
 *       - OpenAPI
 *     summary: Get OpenAPI spec
 *     responses:
 *       200:
 *         description: OpenAPI spec
 */

export async function GET() {
  const openapiPath = path.join(process.cwd(), 'public', 'openapi.json');
  const spec = await fs.promises.readFile(openapiPath, 'utf8');
  return withCORS(
    new NextResponse(spec, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

export async function OPTIONS() {
  return corsOptionsHandler();
}
