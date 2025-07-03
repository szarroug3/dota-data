import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Clean a directory and return the number of files cleaned and errors.
 * @param {string} dirPath
 * @param {string} description
 * @returns {{ filesCleaned: number, errors: number }}
 */
export function cleanDirectory(dirPath, description) {
  let filesCleaned = 0;
  let errors = 0;
  if (!fs.existsSync(dirPath)) {
    return { filesCleaned, errors };
  }
  if (!fs.statSync(dirPath).isDirectory()) {
    try {
      fs.unlinkSync(dirPath);
      filesCleaned++;
    } catch (error) {
      errors++;
    }
    return { filesCleaned, errors };
  }
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        filesCleaned++;
      } else if (fs.statSync(filePath).isDirectory()) {
        // Recursively clean subdirectories
        const subFiles = fs.readdirSync(filePath);
        for (const subFile of subFiles) {
          const subFilePath = path.join(filePath, subFile);
          if (fs.statSync(subFilePath).isFile()) {
            fs.unlinkSync(subFilePath);
            filesCleaned++;
          }
        }
        fs.rmdirSync(filePath);
      }
    } catch (fileError) {
      errors++;
    }
  }
  return { filesCleaned, errors };
}

/**
 * Clean files in the current directory matching any of the given patterns.
 * @param {string[]} patterns
 * @returns {{ filesCleaned: number, errors: number }}
 */
export function cleanPatternFiles(patterns) {
  let filesCleaned = 0;
  let errors = 0;
  const currentDir = process.cwd();
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    if (!fs.statSync(filePath).isFile()) continue;
    const shouldClean = patterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(file);
    });
    if (shouldClean) {
      try {
        fs.unlinkSync(filePath);
        filesCleaned++;
      } catch (fileError) {
        errors++;
      }
    }
  }
  return { filesCleaned, errors };
}

/**
 * Clean up all test files and cache directories.
 * @param {object} appDirectories
 * @param {object} testArtifactDirectories
 * @param {string[]} cleanupPatterns
 * @returns {Promise<{ filesCleaned: number, errors: number }>}
 */
export async function cleanupTestFiles(appDirectories, testArtifactDirectories, cleanupPatterns) {
  const appCleanupTasks = [
    { path: appDirectories.mockData, description: 'Mock data files (APP)' },
  ];
  const testCleanupTasks = [
    { path: testArtifactDirectories.cache, description: 'Cache files (TEST)' },
    { path: testArtifactDirectories.testResults, description: 'Test result files (TEST)' },
    { path: testArtifactDirectories.temp, description: 'Temporary files (TEST)' },
    { path: testArtifactDirectories.backup, description: 'Backup files (TEST)' },
  ];
  const cleanupTasks = [...appCleanupTasks, ...testCleanupTasks];
  let totalFilesCleaned = 0;
  let totalErrors = 0;
  for (const task of cleanupTasks) {
    const { filesCleaned, errors } = cleanDirectory(task.path, task.description);
    totalFilesCleaned += filesCleaned;
    totalErrors += errors;
  }
  const { filesCleaned: patternFilesCleaned, errors: patternErrors } = cleanPatternFiles(cleanupPatterns);
  totalFilesCleaned += patternFilesCleaned;
  totalErrors += patternErrors;
  return { filesCleaned: totalFilesCleaned, errors: totalErrors };
}

/**
 * Verify that all test and app directories are empty or do not exist.
 * @param {object[]} verificationTasks
 * @returns {{ totalRemainingFiles: number, verificationErrors: number }}
 */
export function verifyCleanup(verificationTasks) {
  let totalRemainingFiles = 0;
  let verificationErrors = 0;
  for (const task of verificationTasks) {
    try {
      if (fs.existsSync(task.path)) {
        const files = fs.readdirSync(task.path);
        if (files.length !== 0) {
          totalRemainingFiles += files.length;
        }
      }
    } catch (error) {
      verificationErrors++;
    }
  }
  return { totalRemainingFiles, verificationErrors };
}

/**
 * Validate the contents of a file as JSON or HTML.
 * @param {string} filePath
 * @param {string} type - 'json' or 'html'
 * @returns {{ valid: boolean, reason?: string }}
 */
export function checkFileValidity(filePath, type) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, reason: 'File does not exist' };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (type === 'html') {
    return validateHtmlContent(content);
  } else if (type === 'json') {
    return validateJsonContent(content);
  }
  return { valid: false, reason: 'Unknown file type' };
}

/**
 * Validate HTML content for required tags.
 * @param {string} content
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateHtmlContent(content) {
  if (content.includes('<html') || content.includes('<!DOCTYPE html')) {
    return { valid: true };
  }
  return { valid: false, reason: 'HTML missing <html> or <!DOCTYPE html>' };
}

/**
 * Validate JSON content for parseability.
 * @param {string} content
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateJsonContent(content) {
  try {
    JSON.parse(content);
    return { valid: true };
  } catch (_) {
    return { valid: false, reason: 'Invalid JSON' };
  }
}

/**
 * Check both mock and cache files for a given base name and type.
 * @param {string} baseName
 * @param {string} type
 * @returns {boolean}
 */
export function checkMockAndCacheFiles(baseName, type) {
  const mockFile = path.resolve(__dirname, `../mock-data/${baseName}`);
  const cacheFile = path.resolve(__dirname, `../mock-data/cache-${baseName}`);
  const mockCheck = checkFileValidity(mockFile, type);
  const cacheCheck = checkFileValidity(cacheFile, type);
  return mockCheck.valid && cacheCheck.valid;
}

/**
 * After match fetch, check expected file.
 * @param {string} matchId
 * @returns {boolean}
 */
export function checkMatchFile(matchId) {
  const jsonBase = `opendota-match-${matchId}.json`;
  return checkMockAndCacheFiles(jsonBase, 'json');
}

/**
 * After player fetch, check expected file.
 * @param {string} playerId
 * @returns {boolean}
 */
export function checkPlayerFile(playerId) {
  const jsonBase = `opendota-player-${playerId}.json`;
  return checkMockAndCacheFiles(jsonBase, 'json');
}

/**
 * Makes an HTTP request and tries to parse the response as JSON.
 * @param {string} url
 * @param {object} options
 * @returns {Promise<{response: Response, data: any, error?: any}>}
 */
export async function makeRequest(url, options = {}) {
  let response, data;
  try {
    response = await fetch(url, options);
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }
  } catch (err) {
    return { response: { status: 0 }, data: null, error: err };
  }
  return { response, data };
}

/**
 * Waits for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if a response is queued or ready.
 * @param {Response} response
 * @param {any} data
 * @param {function} isReadyFn
 * @returns {boolean}
 */
export function isQueuedOrReady(response, data, isReadyFn) {
  let parsed = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch (_) {
      // Not JSON, leave as is
    }
  }
  return (
    response.status === 202 ||
    (response.status === 200 && (
      (parsed && (parsed.status === 'queued' || parsed.status === 'ready')) ||
      isReadyFn(parsed)
    ))
  );
}

/**
 * Helper for polling logic (split out for complexity reduction)
 */
function shouldContinuePolling(response, data, isReadyFn) {
  if (response.status === 200 && isReadyFn(data)) return false;
  if (response.status === 202) return true;
  if (response.status === 200 && (data.status === 'queued' || data.status === 'ready')) return true;
  return false;
}

/**
 * Polls an endpoint until the data is ready or times out.
 * @param {string} url
 * @param {function} isReadyFn
 * @param {number} [maxAttempts=30]
 * @param {string} [method='GET']
 * @param {object} [body]
 * @returns {Promise<{response: Response, data: any}>}
 */
export async function pollForReady(url, isReadyFn, maxAttempts = 30, method = 'GET', body = undefined) {
  let attempt = 1;
  const options = { method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  let { response, data } = await makeRequest(url, options);
  while (attempt <= maxAttempts && shouldContinuePolling(response, data, isReadyFn)) {
    await wait(2000); // Default polling interval
    ({ response, data } = await makeRequest(url, options));
    attempt++;
  }
  return { response, data };
} 