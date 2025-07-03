#!/bin/bash

API_URL="http://localhost:3000/api/matches"
UNLIKELY_ID="9999999999" # unlikely to exist in mock-data
LIKELY_ID="7967574072"   # exists in mock-data

# Scenario 1: Requesting data that doesn't exist in cache or mock files
SCENARIO1_OUT="scenario1_response.json"
echo "\n=== Scenario 1: Requesting missing data (should be fake/generated) ==="
curl -s -w "\nStatus: %{http_code}\n" "$API_URL/$UNLIKELY_ID" -o $SCENARIO1_OUT
cat $SCENARIO1_OUT

# Scenario 2: Requesting data that exists in mock files but not in cache
SCENARIO2_OUT="scenario2_response.json"
echo "\n=== Scenario 2: Requesting mock data (should match mock file) ==="
curl -s -w "\nStatus: %{http_code}\n" "$API_URL/$LIKELY_ID" -o $SCENARIO2_OUT
cat $SCENARIO2_OUT

# Scenario 3: Requesting data that exists in the cache
SCENARIO3_OUT="scenario3_response.json"
echo "\n=== Scenario 3: Requesting cached data (should be same as previous) ==="
curl -s -w "\nStatus: %{http_code}\n" "$API_URL/$LIKELY_ID" -o $SCENARIO3_OUT
cat $SCENARIO3_OUT

# Scenario 4: Polling for data (simulate repeated requests)
echo "\n=== Scenario 4: Polling for data (5x requests, should be consistent) ==="
for i in {1..5}; do
  curl -s -w "\nStatus: %{http_code}\n" "$API_URL/$LIKELY_ID" -o "scenario4_response_$i.json"
  echo "--- Poll $i ---"
  cat "scenario4_response_$i.json"
  sleep 0.2
done

echo "\nAll responses saved to scenario*_response*.json for inspection." 