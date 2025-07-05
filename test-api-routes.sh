#!/bin/bash

set -e


BASE_URL="http://localhost:3000/api"

# REMOVE ALL PREVIOUSLY CREATED CACHE AND DATA
rm mock-data/cache-* mock-data/*9999* mock-data/*8888* || true

# FIRST CALL TO ALL ROUTES

echo "=== FIRST CALL TO ALL ROUTES (should queue or generate) ==="

echo "--- /api/players/[id]/data (existing: 2345, non-existing: 9999) ---"
curl -s "$BASE_URL/players/2345/data" | jq .
curl -s "$BASE_URL/players/9999/data" | jq .

echo "--- /api/players/[id]/stats (existing: 2345, non-existing: 9999) ---"
curl -s "$BASE_URL/players/2345/stats" | jq .
curl -s "$BASE_URL/players/9999/stats" | jq .

echo "--- /api/teams/[id]/matches?leagueId=123 (existing: 9517508, non-existing: 8888888) ---"
curl -s "$BASE_URL/teams/9517508/matches?leagueId=123" | head -c 500
echo
curl -s "$BASE_URL/teams/8888888/matches?leagueId=123" | head -c 500
echo

echo "--- /api/leagues/[id] (existing: 16435, non-existing: 99999) ---"
curl -s "$BASE_URL/leagues/16435" | head -c 500
echo
curl -s "$BASE_URL/leagues/99999" | head -c 500
echo

echo "--- /api/heroes (no existing mock file) ---"
curl -s "$BASE_URL/heroes" | jq .

echo "--- /api/matches/[id] (no existing mock file, id: 1234567890) ---"
curl -s "$BASE_URL/matches/1234567890" | jq .

echo

# SLEEP TO ALLOW BACKGROUND WORK

echo "=== Sleeping 5 seconds to allow background work and caching... ==="
sleep 5
echo

# SECOND CALL TO ALL ROUTES

echo "=== SECOND CALL TO ALL ROUTES (should return data from cache/file) ==="

echo "--- /api/players/[id]/data (existing: 2345, non-existing: 9999) ---"
curl -s "$BASE_URL/players/2345/data" | jq .
curl -s "$BASE_URL/players/9999/data" | jq .

echo "--- /api/players/[id]/stats (existing: 2345, non-existing: 9999) ---"
curl -s "$BASE_URL/players/2345/stats" | jq .
curl -s "$BASE_URL/players/9999/stats" | jq .

echo "--- /api/teams/[id]/matches?leagueId=123 (existing: 9517508, non-existing: 8888888) ---"
curl -s "$BASE_URL/teams/9517508/matches?leagueId=123" | head -c 500
echo
curl -s "$BASE_URL/teams/8888888/matches?leagueId=123" | head -c 500
echo

echo "--- /api/leagues/[id] (existing: 16435, non-existing: 99999) ---"
curl -s "$BASE_URL/leagues/16435" | head -c 500
echo
curl -s "$BASE_URL/leagues/99999" | head -c 500
echo

echo "--- /api/heroes (no existing mock file) ---"
curl -s "$BASE_URL/heroes" | jq .

echo "--- /api/matches/[id] (no existing mock file, id: 1234567890) ---"
curl -s "$BASE_URL/matches/1234567890" | jq .

echo

echo "=== Checking mock-data directory for files ==="
ls -lh mock-data

echo

echo "=== Done ==="