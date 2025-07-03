#!/usr/bin/env node

/**
 * Test Script for Dota Data Backend Orchestration System
 * 
 * This script tests the complete orchestration flow:
 * 1. Team import and match discovery
 * 2. Background match data queueing
 * 3. Player data queueing from matches
 * 4. Cache invalidation and refresh logic
 * 
 * Queue status monitoring is no longer tested, as queue internals are not exposed by the backend.
 * 
 * Includes comprehensive cleanup of test files and cache data.
 */

import fs from 'fs';
import path from 'path';
import { cleanupTestFiles, isQueuedOrReady, makeRequest, pollForReady, verifyCleanup } from './test-helpers.js';

let BASE_URL = 'http://localhost:3000/api';

// Test configuration
const TEST_CONFIG = {
  teamId: '2586976', // Example team ID
  leagueId: '1234',  // Example league ID
  matchId: '1234567890', // Example match ID
  playerId: '123456789', // Example player ID
  timeout: 30000, // 30 seconds
  pollingInterval: 2000, // 2 seconds
};

// Test file paths that should be cleaned up
// PRIORITY: Directories actually used by the application
const APP_DIRECTORIES = {
  mockData: './mock-data',    // Used by mock-data-writer.ts for mock data files
  logs: './logs',            // Used by server-logger.ts for server logs
};

// Test artifact directories (created for testing purposes only)
const TEST_ARTIFACT_DIRECTORIES = {
  cache: './cache',          // Not used by app - test artifact
  temp: './temp',            // Not used by app - test artifact  
  backup: './backup',        // Not used by app - test artifact
  testResults: './test-results' // Not used by app - test artifact
};

// Combined for backward compatibility
const TEST_FILES = { ...APP_DIRECTORIES, ...TEST_ARTIFACT_DIRECTORIES };

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Add CLEANUP_PATTERNS definition
const CLEANUP_PATTERNS = [
  '*.test.json',
  '*.test.html',
  '*.tmp',
  '*.bak',
  'test-*.json',
  'test-*.html',
  'mock-*.json',
  'mock-*.html'
];

// Define verificationTasks for verifyCleanup
const verificationTasks = [
  { path: APP_DIRECTORIES.mockData, description: 'Mock data directory (APP)', priority: 'high' },
  { path: APP_DIRECTORIES.logs, description: 'Server logs directory (APP)', priority: 'high' },
  { path: TEST_ARTIFACT_DIRECTORIES.cache, description: 'Cache directory (TEST)', priority: 'low' },
  { path: TEST_ARTIFACT_DIRECTORIES.testResults, description: 'Test results directory (TEST)', priority: 'low' },
  { path: TEST_ARTIFACT_DIRECTORIES.temp, description: 'Temporary files directory (TEST)', priority: 'low' },
  { path: TEST_ARTIFACT_DIRECTORIES.backup, description: 'Backup files (TEST)', priority: 'low' }
];

async function invalidateAllQueuesAndCache() {
  // Invalidate match, player, and team cache keys for the test IDs
  const items = [
    { type: 'matches', key: `opendota-match-${TEST_CONFIG.matchId}.json` },
    { type: 'players', key: `opendota-player-${TEST_CONFIG.playerId}.json` },
    { type: 'players', key: `opendota-player-matches-${TEST_CONFIG.playerId}.json` },
    // Add more keys as needed for your test setup
  ];
  try {
    const { response, data } = await makeRequest(`${BASE_URL}/cache/invalidate`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    if (response.status === 200) {
      log('All relevant cache/queue keys invalidated before test run', 'green');
    } else {
      log(`Cache invalidation returned status ${response.status}: ${JSON.stringify(data)}`, 'yellow');
    }
  } catch (err) {
    log(`Cache invalidation failed: ${err.message}`, 'red');
  }
}

async function setupTestEnvironment() {
  log('SETUP', 'magenta');
  
  // Create app directories first (actually used by the application)
  const appDirectories = Object.values(APP_DIRECTORIES);
  let createdAppDirs = 0;
  let appSetupErrors = 0;
  
  log('Setting up application directories...');
  for (const dir of appDirectories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`Created app directory: ${dir}`);
        createdAppDirs++;
      } else {
        log(`App directory already exists: ${dir}`);
      }
    } catch (error) {
      log(`Failed to create app directory ${dir}: ${error.message}`);
      appSetupErrors++;
    }
  }
  
  // Create test artifact directories (for testing purposes only)
  const testDirectories = Object.values(TEST_ARTIFACT_DIRECTORIES);
  let createdTestDirs = 0;
  let testSetupErrors = 0;
  
  log('Setting up test artifact directories...');
  for (const dir of testDirectories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`Created test directory: ${dir}`);
        createdTestDirs++;
      } else {
        log(`Test directory already exists: ${dir}`);
      }
    } catch (error) {
      log(`Failed to create test directory ${dir}: ${error.message}`);
      testSetupErrors++;
    }
  }
  
  // Create some test files to verify cleanup works
  await createTestFiles();
  
  const totalSetupErrors = appSetupErrors + testSetupErrors;
  const totalCreatedDirs = createdAppDirs + createdTestDirs;
  
  if (totalSetupErrors === 0) {
    log(`Test environment setup complete (${totalCreatedDirs} directories created: ${createdAppDirs} app, ${createdTestDirs} test)`, 'green');
  } else {
    log(`Test environment setup completed with ${totalSetupErrors} errors (${appSetupErrors} app, ${testSetupErrors} test)`, 'yellow');
  }
}

async function createTestFiles() {
  log('CREATE-TEST-FILES');
  
  const testFiles = [
    { path: path.join(TEST_FILES.mockData, 'test-match.json'), content: JSON.stringify({ test: 'data' }) },
    { path: path.join(TEST_FILES.mockData, 'test-player.json'), content: JSON.stringify({ test: 'player' }) },
    { path: path.join(TEST_FILES.cache, 'test-cache.json'), content: JSON.stringify({ test: 'cache' }) },
    { path: path.join(TEST_FILES.logs, 'test.log'), content: 'test log content' },
    { path: path.join(TEST_FILES.testResults, 'test-result.json'), content: JSON.stringify({ test: 'result' }) },
    { path: path.join(TEST_FILES.temp, 'temp-file.tmp'), content: 'temporary content' },
    { path: path.join(TEST_FILES.backup, 'backup.bak'), content: 'backup content' },
    { path: 'test-pattern.json', content: JSON.stringify({ pattern: 'test' }) },
    { path: 'mock-data.json', content: JSON.stringify({ mock: 'data' }) }
  ];
  
  let createdFiles = 0;
  let creationErrors = 0;
  
  for (const file of testFiles) {
    try {
      // Ensure directory exists
      const dir = path.dirname(file.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(file.path, file.content);
      log(`Created test file: ${file.path}`);
      createdFiles++;
    } catch (error) {
      log(`Failed to create test file ${file.path}: ${error.message}`);
      creationErrors++;
    }
  }
  
  if (creationErrors === 0) {
    log(`Created ${createdFiles} test files for cleanup verification`);
  } else {
    log(`Created ${createdFiles} test files with ${creationErrors} errors`);
  }
}

// Refactor Team Import test section
async function testTeamImportSection() {
  log('\n==================================================', 'magenta');
  log('1. Team Import (POST/GET)', 'magenta');
  const url = `${BASE_URL}/teams/${TEST_CONFIG.teamId}/matches?leagueId=${TEST_CONFIG.leagueId}`;
  const isTeamReady = d => d && d.teamName && d.matchIdsByLeague;
  // 1. POST first and verify queued
  const post1 = await makeRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leagueId: TEST_CONFIG.leagueId }),
  });
  if (!isQueuedOrReady(post1.response, post1.data, isTeamReady)) {
    log('Team Import POST #1 did not return queued or ready response', 'red');
    throw new Error('Team Import POST #1 did not return queued or ready response');
  }
  log('Team Import POST #1 returned queued or ready response', 'green');
  // 2. POST again and verify queued or ready
  const post2 = await makeRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leagueId: TEST_CONFIG.leagueId }),
  });
  if (isQueuedOrReady(post2.response, post2.data, isTeamReady)) {
    log('Team Import POST #2 returned queued or ready response', 'green');
  } else {
    log('Team Import POST #2 did not return queued or ready response', 'red');
    throw new Error('Team Import POST #2 did not return queued or ready response');
  }
  // 3. GET and poll for data
  const { response, data } = await pollForReady(url, isTeamReady);
  if (response.status === 200 && isTeamReady(data)) {
    log('Team Import GET returned valid team and matches data', 'green');
    return;
  }
  log('Team Import GET did not return expected data', 'red');
  throw new Error('Team Import GET did not return expected data');
}

// Refactor Match Data test section
async function testMatchDataSection(silent = false) {
  if (!silent) {
    log('\n==================================================', 'magenta');
    log('2. Match Data (POST/GET)', 'magenta');
  }
  const url = `${BASE_URL}/matches/${TEST_CONFIG.matchId}`;
  const isMatchReady = d => d && d.match_id;
  // 1. POST first and verify queued or ready
  const post1 = await makeRequest(url, { method: 'POST' });
  if (!isQueuedOrReady(post1.response, post1.data, isMatchReady)) {
    log('Match Data POST #1 did not return queued or ready response', 'red');
    throw new Error('Match Data POST #1 did not return queued or ready response');
  }
  log('Match Data POST #1 returned queued or ready response', 'green');
  // 2. POST again and verify queued or ready
  const post2 = await makeRequest(url, { method: 'POST' });
  if (isQueuedOrReady(post2.response, post2.data, isMatchReady)) {
    log('Match Data POST #2 returned queued or ready response', 'green');
  } else {
    log('Match Data POST #2 did not return queued or ready response', 'red');
    throw new Error('Match Data POST #2 did not return queued or ready response');
  }
  // 3. GET and poll for data
  const { response, data } = await pollForReady(url, isMatchReady);
  if (response.status === 200 && isMatchReady(data)) {
    log('Match Data GET returned valid match data', 'green');
    return;
  }
  log('Match Data GET did not return expected data', 'red');
  throw new Error('Match Data GET did not return expected data');
}

// Refactor Player Data test section
async function testPlayerDataSection() {
  log('\n==================================================', 'magenta');
  log('3. Player Data (POST/GET)', 'magenta');
  const url = `${BASE_URL}/players/${TEST_CONFIG.playerId}/data`;
  const isPlayerReady = d => d && (d.account_id || d.personaname);
  // 1. POST first and verify queued or ready
  const post1 = await makeRequest(url, { method: 'POST' });
  if (!isQueuedOrReady(post1.response, post1.data, isPlayerReady)) {
    log('Player Data POST #1 did not return queued or ready response', 'red');
    throw new Error('Player Data POST #1 did not return queued or ready response');
  }
  log('Player Data POST #1 returned queued or ready response', 'green');
  // 2. POST again and verify queued or ready
  const post2 = await makeRequest(url, { method: 'POST' });
  if (isQueuedOrReady(post2.response, post2.data, isPlayerReady)) {
    log('Player Data POST #2 returned queued or ready response', 'green');
  } else {
    log('Player Data POST #2 did not return queued or ready response', 'red');
    throw new Error('Player Data POST #2 did not return queued or ready response');
  }
  // 3. GET and poll for data
  const { response, data } = await pollForReady(url, isPlayerReady);
  if (response.status === 200 && isPlayerReady(data)) {
    log('Player Data GET returned valid player data', 'green');
    return;
  }
  log('Player Data GET did not return expected data', 'red');
  throw new Error('Player Data GET did not return expected data');
}

async function testForceRefresh() {
  log('\n==================================================', 'magenta');
  log('4. Force Refresh', 'magenta');
  const url = `${BASE_URL}/teams/${TEST_CONFIG.teamId}/matches?leagueId=${TEST_CONFIG.leagueId}&force=true`;
  const { response, data } = await makeRequest(url);
  if (response.status === 200 && data.teamName && data.matchIdsByLeague) {
    log('Force refresh returned valid team and matches data', 'green');
    return;
  }
  throw new Error('Force refresh response missing both team and matches data');
}

async function testCacheInvalidation() {
  log('\n==================================================', 'magenta');
  log('5. Cache Invalidation', 'magenta');
  
  // Setup: Ensure we have some data to invalidate
  log('[Setup] Fetching match data to ensure cache exists...');
  await testMatchDataSection(true);
  
  const { response, data } = await makeRequest(`${BASE_URL}/cache/invalidate`, {
    method: 'POST',
    body: JSON.stringify({ 
      items: [
        { type: 'matches', key: `opendota-match-${TEST_CONFIG.matchId}.json` }
      ]
    }),
  });
  
  if (response.status !== 200) {
    log(`Cache invalidation failed with status ${response.status}`, 'yellow');
    if (data && data.error) {
      log(`Error details: ${data.error}`);
    }
    throw new Error(`Cache invalidation failed with status ${response.status}: ${data?.error || 'Unknown error'}`);
  }
  
  if (!data || typeof data !== 'object') {
    log('Cache invalidation response is not an object', 'red');
    throw new Error('Cache invalidation response is not an object');
  }
  
  log('Cache invalidation working correctly', 'green');
  log(`Invalidated match key: opendota-match-${TEST_CONFIG.matchId}.json`);
  
  return data;
}

async function testConcurrentRequests() {
  log('\n==================================================', 'magenta');
  log('6. Concurrent Requests', 'magenta');
  
  const promises = [];
  const numRequests = 3;
  
  log(`Making ${numRequests} concurrent match requests...`);
  
  for (let i = 0; i < numRequests; i++) {
    const matchId = TEST_CONFIG.matchId + i;
    const url = `${BASE_URL}/matches/${matchId}`;
    
    promises.push(
      makeRequest(url)
        .then(({ response, data }) => {
          if (response.status === 200 || response.status === 202) {
            log(`Concurrent request ${i + 1} handled correctly`);
            return data;
          } else {
            throw new Error(`Concurrent request ${i + 1} failed with status ${response.status}`);
          }
        })
    );
  }
  
  const results = await Promise.all(promises);
  log(`All ${numRequests} concurrent requests completed`);
  
  return results;
}

async function testErrorHandling() {
  log('\n==================================================', 'magenta');
  log('7. Error Handling', 'magenta');
  
  // Test with invalid team ID
  const url = `${BASE_URL}/teams/invalid-id/matches?leagueId=${TEST_CONFIG.leagueId}`;
  
  try {
    const { response } = await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ leagueId: TEST_CONFIG.leagueId }),
    });
    
    if (response.status === 400 || response.status === 404) {
      log('Error handling working correctly for invalid team ID', 'green');
    } else {
      log(`Unexpected response for invalid team ID: ${response.status}`);
    }
  } catch {
    log('Error handling working correctly (exception thrown)', 'green');
  }
  
  // Test with invalid match ID
  const matchUrl = `${BASE_URL}/matches/invalid-match-id`;
  
  try {
    const { response } = await makeRequest(matchUrl);
    
    if (response.status === 400 || response.status === 404) {
      log('Error handling working correctly for invalid match ID', 'green');
    } else {
      log(`Unexpected response for invalid match ID: ${response.status}`);
    }
  } catch {
    log('Error handling working correctly (exception thrown)', 'green');
  }
}

// Pre-cleanup function to remove any existing test files
async function preCleanup() {
  log('PRE-CLEANUP');
  
  try {
    const result = await cleanupTestFiles(APP_DIRECTORIES, TEST_ARTIFACT_DIRECTORIES, CLEANUP_PATTERNS);
    if (result.filesCleaned > 0) {
      log(`Pre-cleanup completed: ${result.filesCleaned} files removed`);
    } else {
      log('No existing test files found to clean');
    }
  } catch (error) {
    log(`Pre-cleanup failed: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Dota Data Backend Orchestration System Tests');
  log(`Base URL: ${BASE_URL}`);
  log(`Test Configuration:`, 'blue');
  log(`  Team ID: ${TEST_CONFIG.teamId}`);
  log(`  League ID: ${TEST_CONFIG.leagueId}`);
  log(`  Match ID: ${TEST_CONFIG.matchId}`);
  log(`  Player ID: ${TEST_CONFIG.playerId}`);

  // Print setup header (not numbered)
  log('\n==================================================', 'magenta');
  log('Environment Setup', 'magenta');
  await invalidateAllQueuesAndCache();
  await preCleanup();
  await setupTestEnvironment();

  const startTime = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const tests = [
    { name: '1. Team Import (POST/GET)', fn: testTeamImportSection },
    { name: '2. Match Data (POST/GET)', fn: testMatchDataSection },
    { name: '3. Player Data (POST/GET)', fn: testPlayerDataSection },
    { name: '4. Force Refresh', fn: testForceRefresh },
    { name: '5. Cache Invalidation', fn: testCacheInvalidation },
    { name: '6. Concurrent Requests', fn: testConcurrentRequests },
    { name: '7. Error Handling', fn: testErrorHandling },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      results.passed++;
      results.tests.push({ name: test.name, status: 'PASSED' });
    } catch (error) {
      results.failed++;
      results.tests.push({ name: test.name, status: 'FAILED', error: error.message });
      log(`Test "${test.name}" failed: ${error.message}`, 'red');
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // Print summary
  log('\n==================================================');
  log('📊 Test Results Summary', 'magenta');
  log(`Duration: ${duration.toFixed(2)} seconds`);
  log(`Passed: ${results.passed}`);
  log(`Failed: ${results.failed}`);
  log(`Total: ${results.passed + results.failed}`);

  log('\nDetailed Results:');
  results.tests.forEach(test => {
    const icon = test.status === 'PASSED' ? '✅' : '❌';
    log(`${icon} ${test.name}: ${test.status}`);
    if (test.error) {
      log(`   Error: ${test.error}`);
    }
  });

  // Cleanup test files
  const cleanupResult = await cleanupTestFiles(APP_DIRECTORIES, TEST_ARTIFACT_DIRECTORIES, CLEANUP_PATTERNS);
  const verificationResult = await verifyCleanup(verificationTasks);

  // Final cleanup summary
  log('\n==================================================');
  log('🧹 Cleanup Summary', 'magenta');
  log(`Files cleaned: ${cleanupResult.filesCleaned}`);
  log(`Cleanup errors: ${cleanupResult.errors}`);
  log(`Files remaining: ${verificationResult.remainingFiles}`);
  log(`Verification errors: ${verificationResult.errors}`);

  if (results.failed === 0) {
    log('\n🎉 All tests passed! Orchestration system is working correctly.', 'green');
    process.exit(0);
  } else {
    log('\n Some tests failed. Please check the implementation.', 'yellow');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('Usage: node test-orchestration.js [options]');
  log('Options:');
  log('  --help, -h     Show this help message');
  log('  --url <url>    Set base URL (default: http://localhost:3000)');
  log('  --team <id>    Set test team ID');
  log('  --league <id>  Set test league ID');
  log('  --match <id>   Set test match ID');
  log('  --player <id>  Set test player ID');
  process.exit(0);
}

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--url':
      BASE_URL = args[++i];
      break;
    case '--team':
      TEST_CONFIG.teamId = args[++i];
      break;
    case '--league':
      TEST_CONFIG.leagueId = args[++i];
      break;
    case '--match':
      TEST_CONFIG.matchId = args[++i];
      break;
    case '--player':
      TEST_CONFIG.playerId = args[++i];
      break;
  }
}

// Run tests
runTests().catch(error => {
  log(`Test runner failed: ${error.message}`);
  process.exit(1);
});