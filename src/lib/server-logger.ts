import fs from 'fs';
import path from 'path';

// Logging utility with timestamp that writes to file (Node.js only)
export function logWithTimestampToFile(level: 'log' | 'warn' | 'error', ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ')}\n`;
  if (level === 'log') {
    console.log(`[${timestamp}]`, ...args);
  } else if (level === 'warn') {
    console.warn(`[${timestamp}]`, ...args);
  } else if (level === 'error') {
    console.error(`[${timestamp}]`, ...args);
  }
  // Write to file
  const logDir = path.resolve(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'server.log');
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, logLine);
  } catch {
    // If logging to file fails, ignore to avoid crashing
  }
} 