import { NextResponse } from 'next/server';

/**
 * Simple health check response
 */
interface SimpleHealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
}

/**
 * @swagger
 * /api/health/simple:
 *   get:
 *     summary: Simple health check endpoint
 *     description: Returns basic health status for lightweight monitoring and load balancer health checks. Fast response with minimal overhead.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, error]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: System uptime in seconds
 *                 environment:
 *                   type: string
 *             example:
 *               status: "ok"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               uptime: 3600
 *               environment: "production"
 *       500:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [error]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *             example:
 *               status: "error"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               error: "Service unavailable"
 */
export async function GET(): Promise<NextResponse> {
  try {
    const response: SimpleHealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Type': 'simple'
      }
    });
    
  } catch (error) {
    console.error('Simple health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Service unavailable'
    }, { status: 500 });
  }
} 