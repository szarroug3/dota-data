/**
 * Minimal tagged logger for API routes
 *
 * Provides structured logging with tags for better debugging and monitoring.
 * Replaces direct console usage in API routes with a more structured approach.
 */

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  timestamp: string;
  data?: unknown; // Using unknown for logging data - can be objects, primitives, errors, etc.
}

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production, we might want to set this via environment variable
const CURRENT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

// ============================================================================
// LOGGER IMPLEMENTATION
// ============================================================================

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL];
  }

  private formatLogEntry(level: LogLevel, tag: string, message: string, data?: unknown): LogEntry {
    return {
      level,
      tag,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  private log(level: LogLevel, tag: string, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.formatLogEntry(level, tag, message, data);

    // Use appropriate console method based on level
    switch (level) {
      case 'debug':
        console.debug(`[${logEntry.timestamp}] [${tag}] ${message}`, data || '');
        break;
      case 'info':
        console.info(`[${logEntry.timestamp}] [${tag}] ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`[${logEntry.timestamp}] [${tag}] ${message}`, data || '');
        break;
      case 'error':
        console.error(`[${logEntry.timestamp}] [${tag}] ${message}`, data || '');
        break;
    }
  }

  debug(tag: string, message: string, data?: unknown): void {
    this.log('debug', tag, message, data);
  }

  info(tag: string, message: string, data?: unknown): void {
    this.log('info', tag, message, data);
  }

  warn(tag: string, message: string, data?: unknown): void {
    this.log('warn', tag, message, data);
  }

  error(tag: string, message: string, data?: unknown): void {
    this.log('error', tag, message, data);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Create a singleton logger instance
export const logger = new Logger();

// Convenience function to create tagged loggers for specific modules
export function createTaggedLogger(tag: string) {
  return {
    debug: (message: string, data?: unknown) => logger.debug(tag, message, data),
    info: (message: string, data?: unknown) => logger.info(tag, message, data),
    warn: (message: string, data?: unknown) => logger.warn(tag, message, data),
    error: (message: string, data?: unknown) => logger.error(tag, message, data),
  };
}

// Pre-configured loggers for common API routes
export const apiLogger = createTaggedLogger('API');
export const cacheLogger = createTaggedLogger('CACHE');
export const shareLogger = createTaggedLogger('SHARE');
