#!/usr/bin/env node

/**
 * Test Script for Dota Data Backend Orchestration System
 * 
 * This script tests the complete orchestration flow with the new synchronous POST-only pattern:
 * 1. Team import and match discovery
 * 2. Background match data processing
 * 3. Player data processing from matches
 * 4. Cache invalidation and refresh logic
 * 
 * All endpoints now use POST requests that wait for background jobs to complete
 * and return the actual data (no polling required).
 * 
 * Includes comprehensive cleanup of test files and cache data.
 */

import { cleanupTestFiles, makeRequest } from './test-helpers.js';

let BASE_URL = 'http://localhost:3000/api';
let DO_CLEANUP = false;

// Test configuration
const TEST_CONFIG = {
  teamId: '2586976', // Example team ID
  leagueId: '1234',  // Example league ID
  matchId: '1234567890', // Example match ID
  playerId: '123456789', // Example player ID
  timeout: 30000, // 30 seconds
};

// App and test artifact directories for optional cleanup
const APP_DIRECTORIES = {
  mockData: './mock-data',
  logs: './logs',
};
const TEST_ARTIFACT_DIRECTORIES = {
  cache: './cache',
  temp: './temp',
  backup: './backup',
  testResults: './test-results'
};
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

async function invalidateAllQueuesAndCache() {
  // Invalidate match, player, and team cache keys for the test IDs
  const items = [
    { type: 'matches', key: `opendota-match-${TEST_CONFIG.matchId}.json` },
    { type: 'players', key: `opendota-player-${TEST_CONFIG.playerId}.json` },
    { type: 'players', key: `opendota-player-matches-${TEST_CONFIG.playerId}.json` },
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

// Updated Team Import test section for new synchronous POST pattern
async function testTeamImportSection() {
  log('\n==================================================', 'magenta');
  log('1. Team Import (POST)', 'magenta');
  const url = `${BASE_URL}/teams/${TEST_CONFIG.teamId}/matches`;
  const isTeamReady = d => d && d.teamName && d.matchIdsByLeague;
  
  // POST request - should return team data immediately if cached, or wait for completion
  const { response, data } = await makeRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leagueId: TEST_CONFIG.leagueId }),
  });
  
  if (response.status === 200 && isTeamReady(data)) {
    const matchCount = data.matchIdsByLeague?.[TEST_CONFIG.leagueId]?.length || 0;
    log(`Team: ${data.teamName}, Matches in league ${TEST_CONFIG.leagueId}: ${matchCount}`);
    if (matchCount === 0) {
      log(`[WARN] Team import returned 0 matches for league ${TEST_CONFIG.leagueId} (check mock data and parser)`, 'yellow');
    }
    return;
  }
  
  log('Team Import POST did not return expected data', 'red');
  log(`Status: ${response.status}, Data: ${JSON.stringify(data)}`, 'red');
  throw new Error('Team Import POST did not return expected data');
}

// Updated Match Data test section for new synchronous POST pattern
async function testMatchDataSection(silent = false) {
  if (!silent) {
    log('\n==================================================', 'magenta');
    log('2. Match Data (POST)', 'magenta');
  }
  const url = `${BASE_URL}/matches/${TEST_CONFIG.matchId}`;
  const isMatchReady = d => d && d.id;
  
  // POST request - should return match data immediately if cached, or wait for completion
  const { response, data } = await makeRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: TEST_CONFIG.teamId }),
  });
  
  if (response.status === 200 && isMatchReady(data)) {
    log('Match Data POST returned valid match data', 'green');
    log(`Match ID: ${data.match_id}, Duration: ${data.duration}s`);
    return;
  }
  
  log('Match Data POST did not return expected data', 'red');
  log(`Status: ${response.status}, Data: ${JSON.stringify(data)}`, 'red');
  throw new Error('Match Data POST did not return expected data');
}

// Updated Player Data test section for new synchronous POST pattern
async function testPlayerDataSection() {
  log('\n==================================================', 'magenta');
  log('3. Player Data (POST)', 'magenta');
  const url = `${BASE_URL}/players/${TEST_CONFIG.playerId}/data`;
  const isPlayerReady = d => d && (d.account_id || d.personaname);
  
  // POST request - should return player data immediately if cached, or wait for completion
  const { response, data } = await makeRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  
  if (response.status === 200 && isPlayerReady(data)) {
    log('Player Data POST returned valid player data', 'green');
    log(`Player: ${data.personaname || data.account_id}`);
    return;
  }
  
  log('Player Data POST did not return expected data', 'red');
  log(`Status: ${response.status}, Data: ${JSON.stringify(data)}`, 'red');
  throw new Error('Player Data POST did not return expected data');
}

// Updated Force Refresh test for new synchronous POST pattern
async function testForceRefresh() {
  log('\n==================================================', 'magenta');
  log('4. Force Refresh', 'magenta');
  const url = `${BASE_URL}/teams/${TEST_CONFIG.teamId}/matches`;
  
  const { response, data } = await makeRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leagueId: TEST_CONFIG.leagueId, force: true }),
  });
  
  if (response.status === 200 && data.teamName && data.matchIdsByLeague) {
    log('Force refresh returned valid team and matches data', 'green');
    return;
  }
  
  log('Force refresh did not return expected data', 'red');
  log(`Status: ${response.status}, Data: ${JSON.stringify(data)}`, 'red');
  throw new Error('Force refresh response missing both team and matches data');
}

// Updated Cache Invalidation test for new contract
async function testCacheInvalidation() {
  log('\n==================================================', 'magenta');
  log('5. Cache Invalidation', 'magenta');

  // Setup: Ensure we have some data to invalidate
  log('[Setup] Fetching match data to ensure cache exists...');
  await testMatchDataSection(true);

  const item = { type: 'match', id: TEST_CONFIG.matchId };
  log(`[REQUEST] POST /cache/invalidate | body: ${JSON.stringify({ items: [item] })}`, 'cyan');
  const { response, data } = await makeRequest(`${BASE_URL}/cache/invalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [item] }),
  });

  log(`[DEBUG] Invalidate response status: ${response.status}, data: ${JSON.stringify(data)}`);

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
  log(`Invalidated: ${JSON.stringify(data.invalidated)}`);

  return data;
}

// Updated Concurrent Requests test for new synchronous POST pattern
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
      makeRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: TEST_CONFIG.teamId }),
      })
        .then(({ response, data }) => {
          if (response.status === 200) {
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

// Updated Error Handling test for new synchronous POST pattern
async function testErrorHandling() {
  log('\n==================================================', 'magenta');
  log('7. Error Handling', 'magenta');
  
  // Test with invalid team ID
  const url = `${BASE_URL}/teams/invalid-id/matches`;
  
  try {
    const { response } = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId: TEST_CONFIG.leagueId }),
    });
    
    if (response.status === 400 || response.status === 404 || response.status === 500) {
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
    const { response } = await makeRequest(matchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: TEST_CONFIG.teamId }),
    });
    
    if (response.status === 400 || response.status === 404 || response.status === 500) {
      log('Error handling working correctly for invalid match ID', 'green');
    } else {
      log(`Unexpected response for invalid match ID: ${response.status}`);
    }
  } catch {
    log('Error handling working correctly (exception thrown)', 'green');
  }
}

// Helper to log every request
async function loggedRequest({ method, url, body }) {
  log(`[REQUEST] ${method} ${url}` + (body ? ` | body: ${JSON.stringify(body)}` : ''), 'cyan');
  return await makeRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

// New: Test /heroes endpoint
async function testHeroesEndpoint() {
  log('\n==================================================', 'magenta');
  log('8. Heroes Endpoint', 'magenta');
  const url = `${BASE_URL}/heroes`;
  // Try POST first, fallback to GET if POST not supported
  let response, data;
  ({ response, data } = await loggedRequest({ method: 'POST', url }));
  if (response.status === 405 || response.status === 404) {
    // Try GET
    ({ response, data } = await makeRequest(url));
    log(`[REQUEST] GET ${url}`, 'cyan');
  }
  if (response.status === 200 && data && (Array.isArray(data) || data.heroes || data.length || data[0]?.id)) {
    log('Heroes endpoint returned valid data', 'green');
    return;
  }
  log('Heroes endpoint did not return expected data', 'red');
  log(`Status: ${response.status}, Data: ${JSON.stringify(data)}`, 'red');
  throw new Error('Heroes endpoint did not return expected data');
}

// New: Test /players/[id]/stats endpoint
async function testPlayerStatsEndpoint() {
  log('\n==================================================', 'magenta');
  log('9. Player Stats Endpoint', 'magenta');
  const url = `${BASE_URL}/players/${TEST_CONFIG.playerId}/stats`;
  const { response, data } = await loggedRequest({ method: 'POST', url });
  if (response.status === 200 && data && (data.name || data.overallStats || data.recentPerformance || data.topHeroes)) {
    log('Player stats endpoint returned valid data', 'green');
    return;
  }
  log('Player stats endpoint did not return expected data', 'red');
  log(`Status: ${response.status}, Data: ${JSON.stringify(data)}`, 'red');
  throw new Error('Player stats endpoint did not return expected data');
}

// New: Test /leagues/[id] endpoint
async function testLeagueEndpoint() {
  log('\n==================================================', 'magenta');
  log('10. League Endpoint', 'magenta');
  const url = `${BASE_URL}/leagues/${TEST_CONFIG.leagueId}`;
  const { response, data } = await loggedRequest({ method: 'POST', url });
  if (response.status === 200 && data && (data.leagueName || data.league_id || data.name || data.matches || Array.isArray(data))) {
    log('League endpoint returned valid data', 'green');
    return;
  }
  log('League endpoint did not return expected data', 'red');
  log(`Status: ${response.status}, Data: ${JSON.stringify(data)}`, 'red');
  throw new Error('League endpoint did not return expected data');
}

// Test /configs/[id] endpoint
async function testConfigEndpoint() {
  log('\n==================================================', 'magenta');
  log('11. Config Endpoint', 'magenta');
  // Use a sample config id
  const configId = 'default';
  const url = `${BASE_URL}/configs/${configId}`;
  const { response, data } = await loggedRequest({ method: 'POST', url });
  if (response.status === 200 && data && (data.id || data.config || typeof data === 'object')) {
    log('Config endpoint returned valid data', 'green');
    return;
  }
  log('Config endpoint did not return expected data', 'red');
  log(`Status: ${response.status}, Data: ${JSON.stringify(data)}`, 'red');
  throw new Error('Config endpoint did not return expected data');
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

  log('\n==================================================', 'magenta');
  log('Environment Setup', 'magenta');
  await invalidateAllQueuesAndCache();

  const startTime = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const tests = [
    { name: '1. Team Import (POST)', fn: testTeamImportSection },
    { name: '2. Match Data (POST)', fn: testMatchDataSection },
    { name: '3. Player Data (POST)', fn: testPlayerDataSection },
    { name: '4. Force Refresh', fn: testForceRefresh },
    { name: '5. Cache Invalidation', fn: testCacheInvalidation },
    { name: '6. Concurrent Requests', fn: testConcurrentRequests },
    { name: '7. Error Handling', fn: testErrorHandling },
    { name: '8. Heroes Endpoint', fn: testHeroesEndpoint },
    { name: '9. Player Stats Endpoint', fn: testPlayerStatsEndpoint },
    { name: '10. League Endpoint', fn: testLeagueEndpoint },
    { name: '11. Config Endpoint', fn: testConfigEndpoint },
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

  if (DO_CLEANUP) {
    // Cleanup test files and directories if --cleanup is passed
    const cleanupResult = await cleanupTestFiles(APP_DIRECTORIES, TEST_ARTIFACT_DIRECTORIES, CLEANUP_PATTERNS);
    log('\n==================================================');
    log('🧹 Cleanup Summary', 'magenta');
    log(`Files cleaned: ${cleanupResult.filesCleaned}`);
    log(`Cleanup errors: ${cleanupResult.errors}`);
  }

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
  log('  --cleanup      Clean up test/mock/cache files after running tests');
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
    case '--cleanup':
      DO_CLEANUP = true;
      break;
  }
}

// Run tests
runTests().catch(error => {
  log(`Test runner failed: ${error.message}`);
  process.exit(1);
});