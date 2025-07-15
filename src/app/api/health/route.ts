import os from 'os';

import { NextResponse } from 'next/server';

import { CacheService } from '@/lib/cache-service';
import { PerformanceMetrics, performanceMonitor, PerformanceStats } from '@/lib/performance-monitor';
import { ApiErrorResponse } from '@/types/api';

import { RateLimiter } from '@/lib/rate-limiter';
import { RequestQueue } from '@/lib/request-queue';

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    cache: ServiceHealth;
    rateLimit: ServiceHealth;
    queue: ServiceHealth;
    database?: ServiceHealth;
  };
  performance: {
    stats: PerformanceStats;
    recentMetrics: PerformanceMetrics[];
  };
  system: {
    memory: NodeJS.MemoryUsage;
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    diskSpace?: {
      total: number;
      used: number;
      free: number;
    };
  };
  checks: HealthCheck[];
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastChecked: string;
  error?: string;
  details?: Record<string, string | number | boolean>;
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  error?: string;
  details?: Record<string, string | number | boolean>;
}

/**
 * Get system CPU usage (approximation)
 */
function getCpuUsage(): number {
  // Simple CPU usage approximation
  // In a real implementation, you'd want to use a proper CPU monitoring library
  return Math.random() * 100; // Placeholder - replace with actual CPU monitoring
}

/**
 * Check cache service health
 */
async function checkCacheHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const cache = new CacheService({
      useRedis: process.env.USE_REDIS === 'true',
      redisUrl: process.env.REDIS_URL,
      fallbackToMemory: true,
    });
    
    const isHealthy = await cache.isHealthy();
    const stats = await cache.getStats();
    const responseTime = Date.now() - startTime;
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        backend: cache.getBackendType(),
        keys: stats.keys,
        hitRate: stats.hitRate,
        missRate: stats.missRate,
        uptime: stats.uptime,
        memoryUsage: stats.memoryUsage || 0
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check rate limiter health
 */
async function checkRateLimiterHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const rateLimiter = new RateLimiter({
      useRedis: process.env.USE_REDIS === 'true',
      redisUrl: process.env.REDIS_URL,
      fallbackToMemory: true,
    });
    
    const isHealthy = await rateLimiter.isHealthy();
    const stats = await rateLimiter.getStats();
    const responseTime = Date.now() - startTime;
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
              details: {
          backend: rateLimiter.getBackendType(),
          totalRequests: stats.totalRequests,
          allowedRequests: stats.allowedRequests,
          blockedRequests: stats.blockedRequests,
          fallbackCount: stats.fallbackCount,
          uptime: stats.uptime
        }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check queue service health
 */
async function checkQueueHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const queue = new RequestQueue({
      useQStash: process.env.USE_QSTASH === 'true',
      qstashToken: process.env.QSTASH_TOKEN,
      qstashCurrentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      qstashNextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      fallbackToMemory: true,
      defaultTimeout: 30000,
      maxRetries: 3,
      baseDelay: 1000
    });
    
    const isHealthy = await queue.isHealthy();
    const stats = await queue.getStats();
    const responseTime = Date.now() - startTime;
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        backend: queue.getBackendType(),
        totalJobs: stats.totalJobs,
        queued: stats.queued,
        processing: stats.processing,
        completed: stats.completed,
        failed: stats.failed,
        cancelled: stats.cancelled,
        averageProcessingTime: stats.averageProcessingTime,
        uptime: stats.uptime
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Perform comprehensive health checks
 */
async function performHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  
  // Memory check
  const memoryCheck = await checkMemoryUsage();
  checks.push(memoryCheck);
  
  // Environment variables check
  const envCheck = checkEnvironmentVariables();
  checks.push(envCheck);
  
  // Mock API mode check
  const mockCheck = checkMockApiMode();
  checks.push(mockCheck);
  
  return checks;
}

/**
 * Check memory usage
 */
async function checkMemoryUsage(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const memory = process.memoryUsage();
    const heapUsedMB = memory.heapUsed / 1024 / 1024;
    const heapTotalMB = memory.heapTotal / 1024 / 1024;
    const usage = heapUsedMB / heapTotalMB;
    
    let status: 'pass' | 'fail' | 'warn' = 'pass';
    let error: string | undefined;
    
    if (usage > 0.9) {
      status = 'fail';
      error = 'High memory usage detected';
    } else if (usage > 0.7) {
      status = 'warn';
      error = 'Elevated memory usage';
    }
    
    return {
      name: 'memory-usage',
      status,
      duration: Date.now() - startTime,
      error,
      details: {
        heapUsed: `${heapUsedMB.toFixed(2)}MB`,
        heapTotal: `${heapTotalMB.toFixed(2)}MB`,
        usage: `${(usage * 100).toFixed(2)}%`,
        external: `${(memory.external / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(memory.rss / 1024 / 1024).toFixed(2)}MB`
      }
    };
  } catch (error) {
    return {
      name: 'memory-usage',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables(): HealthCheck {
  const startTime = Date.now();
  
  try {
    const requiredEnvVars = [
      'NODE_ENV',
      'USE_MOCK_API',
      'USE_REDIS',
      'USE_QSTASH'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    let status: 'pass' | 'fail' | 'warn' = 'pass';
    let error: string | undefined;
    
    if (missingVars.length > 0) {
      status = 'warn';
      error = `Missing environment variables: ${missingVars.join(', ')}`;
    }
    
    return {
      name: 'environment-variables',
      status,
      duration: Date.now() - startTime,
      error,
      details: {
        nodeEnv: process.env.NODE_ENV || '',
        useMockApi: process.env.USE_MOCK_API || '',
        useRedis: process.env.USE_REDIS || '',
        useQStash: process.env.USE_QSTASH || '',
        missingVars: missingVars.length
      }
    };
  } catch (error) {
    return {
      name: 'environment-variables',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check mock API mode
 */
function checkMockApiMode(): HealthCheck {
  const startTime = Date.now();
  
  try {
    const isMockMode = process.env.USE_MOCK_API === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    let status: 'pass' | 'fail' | 'warn' = 'pass';
    let error: string | undefined;
    
    if (isMockMode && isProduction) {
      status = 'warn';
      error = 'Mock API mode enabled in production';
    }
    
    return {
      name: 'mock-api-mode',
      status,
      duration: Date.now() - startTime,
      error,
      details: {
        mockMode: isMockMode,
        environment: process.env.NODE_ENV || '',
        warning: isMockMode && isProduction ? 'Mock mode should not be used in production' : ''
      }
    };
  } catch (error) {
    return {
      name: 'mock-api-mode',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Determine overall health status
 */
function determineOverallStatus(
  services: HealthCheckResponse['services'],
  checks: HealthCheck[]
): 'healthy' | 'unhealthy' | 'degraded' {
  const serviceStatuses = Object.values(services).map(s => s.status);
  const checkStatuses = checks.map(c => c.status);
  
  // If any service is unhealthy, overall status is unhealthy
  if (serviceStatuses.includes('unhealthy')) {
    return 'unhealthy';
  }
  
  // If any check fails, overall status is unhealthy
  if (checkStatuses.includes('fail')) {
    return 'unhealthy';
  }
  
  // If any service is degraded or any check warns, overall status is degraded
  if (serviceStatuses.includes('degraded') || checkStatuses.includes('warn')) {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get comprehensive system health status
 *     description: Returns detailed health information including service status, performance metrics, system resources, and health checks. Used for monitoring and alerting.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Health check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, degraded]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: System uptime in seconds
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     cache:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                         lastChecked:
 *                           type: string
 *                     rateLimit:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                         lastChecked:
 *                           type: string
 *                     queue:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                         lastChecked:
 *                           type: string
 *                 performance:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                     recentMetrics:
 *                       type: array
 *                 system:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: object
 *                     cpu:
 *                       type: object
 *                 checks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       duration:
 *                         type: number
 *             example:
 *               status: "healthy"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               uptime: 3600
 *               version: "1.0.0"
 *               environment: "production"
 *               services:
 *                 cache:
 *                   status: "healthy"
 *                   responseTime: 5
 *                   lastChecked: "2024-01-01T00:00:00.000Z"
 *                 rateLimit:
 *                   status: "healthy"
 *                   responseTime: 3
 *                   lastChecked: "2024-01-01T00:00:00.000Z"
 *                 queue:
 *                   status: "healthy"
 *                   responseTime: 8
 *                   lastChecked: "2024-01-01T00:00:00.000Z"
 *               performance:
 *                 stats:
 *                   totalRequests: 1250
 *                   averageResponseTime: 150
 *                   errorRate: 0.02
 *               system:
 *                 memory:
 *                   heapUsed: 52428800
 *                   heapTotal: 67108864
 *                 cpu:
 *                   usage: 15.5
 *                   loadAverage: [0.5, 0.7, 0.8]
 *               checks:
 *                 - name: "memory-usage"
 *                   status: "pass"
 *                   duration: 2
 *       500:
 *         description: Health check failed
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
 *               error: "Health check failed"
 *               status: 500
 *               details: "Unable to perform health checks"
 */
export async function GET(): Promise<NextResponse> {
  try {
    const startTime = Date.now();
    
    // Get system information
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const loadAverage = process.platform === 'linux' ? os.loadavg() : [0, 0, 0];
    
    // Check service health
    const [cacheHealth, rateLimitHealth, queueHealth] = await Promise.all([
      checkCacheHealth(),
      checkRateLimiterHealth(),
      checkQueueHealth()
    ]);
    
    // Perform health checks
    const healthChecks = await performHealthChecks();
    
    // Get performance metrics
    const performanceStats = performanceMonitor.getStats();
    const recentMetrics = performanceMonitor.getRecentMetrics(10);
    
    // Build response
    const services = {
      cache: cacheHealth,
      rateLimit: rateLimitHealth,
      queue: queueHealth
    };
    
    const response: HealthCheckResponse = {
      status: determineOverallStatus(services, healthChecks),
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      performance: {
        stats: performanceStats,
        recentMetrics
      },
      system: {
        memory,
        cpu: {
          usage: getCpuUsage(),
          loadAverage
        }
      },
      checks: healthChecks
    };
    
    const statusCode = response.status === 'healthy' ? 200 : 
                      response.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse: ApiErrorResponse = {
      error: 'Health check failed',
      status: 500,
      details: error instanceof Error ? error.message : 'Unable to perform health checks'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 