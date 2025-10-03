# Data Flow Analysis

This document provides a comprehensive analysis of all data flows in the Dota Data application to identify potential issues and inconsistencies.

## App Hydration Flows

### 1. App Hydration with 0 Active Teams and 0 Other Teams

**Initial State:**

- No teams in localStorage
- No global players in localStorage
- No global matches in localStorage
- No active team set
- Heroes/items/leagues not loaded

**Flow:**

1. `useAppHydration` runs on mount
2. Call `/api/items`, `/api/heroes`, and `/api/leagues` in parallel
3. Store data in ConstantsContext (or AppContext if preferred)
4. Hydration complete

**Expected Behavior:**

- App loads with empty team list
- Constants data (heroes, items, leagues) loads in parallel
- No changes made to localStorage
- No network requests for team data

**Cache State:**

- Heroes: Fresh (loaded via parallel API calls)
- Items: Fresh (loaded via parallel API calls)
- Leagues: Fresh (loaded via parallel API calls)
- Teams: N/A (none exist)

---

### 2. App Hydration with 1 Active Team and 0 Other Teams

**Initial State:**

- 1 team in localStorage
- Team marked as active in localStorage
- Heroes/items/leagues not loaded

**Flow:**

1. `useAppHydration` runs on mount
2. Call `/api/items`, `/api/heroes`, and `/api/leagues` in parallel
3. Store constants data in ConstantsContext (or AppContext if preferred)
4. Find league name in the league data from `/api/leagues`
5. Call `/api/teams/[id]` to get team name
6. Call `/api/leagues/[id]` to get all matches for the league (store for future use)
7. Find all matches where the team participated in the league
8. For each match found: call `/api/matches/[id]` and `/api/players/[id]` for team's players
9. Hydration complete

**Expected Behavior:**

- Constants data (heroes, items, leagues) loads in parallel
- Team name loads from `/api/teams/[id]`
- Team is marked as active in app data context
- League matches load from `/api/leagues/[id]` and stored for future use
- Team's matches and players load individually
- App data context contains team name, match data, and player data
- No changes made to localStorage

**Cache State:**

- Heroes: Fresh (loaded via parallel API calls)
- Items: Fresh (loaded via parallel API calls)
- Leagues: Fresh (loaded via parallel API calls)
- League Matches: Fresh (loaded via `/api/leagues/[id]`, stored for future use)
- Team: Fresh (loaded via `/api/teams/[id]`)
- Team Matches: Fresh (loaded via `/api/matches/[id]` for each match)
- Team Players: Fresh (loaded via `/api/players/[id]` for each player)

---

### 3. App Hydration with 1 Active Team and 1 Inactive Team

**Initial State:**

- 2 teams in localStorage
- 1 team marked as active in localStorage
- 1 team marked as inactive in localStorage
- Heroes/items/leagues not loaded

**Flow:**

1. `useAppHydration` runs on mount
2. Call `/api/items`, `/api/heroes`, and `/api/leagues` in parallel
3. Store constants data in ConstantsContext (or AppContext if preferred)
4. **Load Active Team:**
   - Find league name in the league data from `/api/leagues`
   - Call `/api/teams/[id]` to get team name
   - Call `/api/leagues/[id]` to get all matches for the league (store for future use)
   - Find all matches where the team participated in the league
   - For each match found: call `/api/matches/[id]` and `/api/players/[id]` for team's players
   - Mark team as active in app data context
5. **Load Inactive Team:**
   - Find league name in the league data from `/api/leagues`
   - Call `/api/teams/[id]` to get team name
   - Call `/api/leagues/[id]` to get all matches for the league (store for future use)
   - Find all matches where the team participated in the league
   - For each match found: call `/api/matches/[id]` and `/api/players/[id]` for team's players
   - Do NOT mark team as active
6. Hydration complete

**Expected Behavior:**

- Constants data (heroes, items, leagues) loads in parallel
- Active team loads first and is marked as active in app data context
- Inactive team loads second with same process but is not marked as active
- Both teams' matches and players load individually
- App data context contains both teams' data
- No changes made to localStorage

**Cache State:**

- Heroes: Fresh (loaded via parallel API calls)
- Items: Fresh (loaded via parallel API calls)
- Leagues: Fresh (loaded via parallel API calls)
- League Matches: Fresh (loaded via `/api/leagues/[id]` for each league, stored for future use)
- Active Team: Fresh (loaded via `/api/teams/[id]`)
- Active Team Matches: Fresh (loaded via `/api/matches/[id]` for each match)
- Active Team Players: Fresh (loaded via `/api/players/[id]` for each player)
- Inactive Team: Fresh (loaded via `/api/teams/[id]`)
- Inactive Team Matches: Fresh (loaded via `/api/matches/[id]` for each match)
- Inactive Team Players: Fresh (loaded via `/api/players/[id]` for each player)

---

### 4. App Hydration with 0 Active Teams and 1 Inactive Team

**Initial State:**

- 1 team in localStorage
- Team marked as inactive in localStorage
- No active team set
- Heroes/items/leagues not loaded

**Flow:**

1. `useAppHydration` runs on mount
2. Call `/api/items`, `/api/heroes`, and `/api/leagues` in parallel
3. Store constants data in ConstantsContext (or AppContext if preferred)
4. **Load Inactive Team:**
   - Find league name in the league data from `/api/leagues`
   - Call `/api/teams/[id]` to get team name
   - Call `/api/leagues/[id]` to get all matches for the league (store for future use)
   - Find all matches where the team participated in the league
   - For each match found: call `/api/matches/[id]` and `/api/players/[id]` for team's players
   - Do NOT mark team as active
5. Hydration complete

**Expected Behavior:**

- Constants data (heroes, items, leagues) loads in parallel
- Team loads but is not marked as active in app data context
- Team's matches and players load individually
- App data context contains team data but no active team
- No changes made to localStorage

**Cache State:**

- Heroes: Fresh (loaded via parallel API calls)
- Items: Fresh (loaded via parallel API calls)
- Leagues: Fresh (loaded via parallel API calls)
- League Matches: Fresh (loaded via `/api/leagues/[id]`, stored for future use)
- Team: Fresh (loaded via `/api/teams/[id]`)
- Team Matches: Fresh (loaded via `/api/matches/[id]` for each match)
- Team Players: Fresh (loaded via `/api/players/[id]` for each player)

---

## New Team Addition Flows

### 1. Team Addition with No Errors (All Network Calls Complete Successfully)

**Initial State:**

- User adds new team via add team form on dashboard
- Heroes, items, and league data already loaded from app hydration
- No existing team data for the new team

**Flow:**

1. User submits add team form with teamId and leagueId
2. Find league name in the already loaded league data from app hydration
3. Call `/api/teams/[id]` and `/api/leagues/[id]` in parallel
4. Find all matches where the team participated in the league
5. For each match found: call `/api/matches/[id]` and `/api/players/[id]` for team's players
6. Set team as active in app data context
7. Update localStorage with new team information
8. Set team as active in localStorage
9. Team addition complete

**Expected Behavior:**

- Team name and league data load in parallel from `/api/teams/[id]` and `/api/leagues/[id]`
- Team is marked as active in app data context
- League matches load from `/api/leagues/[id]` and stored for future use
- Team's matches and players load individually
- All loading items (team, matches, players) show loading spinners
- New team appears in app data context with name, matches, and players
- localStorage updated with new team information
- Team set as active in localStorage

**Network Requests:**

- `/api/teams/[id]`: 1 request (team name)
- `/api/leagues/[id]`: 1 request (league matches, stored for future use)
- `/api/matches/[id]`: N requests (one per match)
- `/api/players/[id]`: M requests (one per player)

**Cache State:**

- Heroes: Fresh (already loaded from app hydration)
- Items: Fresh (already loaded from app hydration)
- Leagues: Fresh (already loaded from app hydration)
- League Matches: Fresh (loaded via `/api/leagues/[id]`, stored for future use)
- New Team: Fresh (loaded via `/api/teams/[id]`)
- New Team Matches: Fresh (loaded via `/api/matches/[id]` for each match)
- New Team Players: Fresh (loaded via `/api/players/[id]` for each player)

---

### 2. Team Addition with Match/Player Errors

**Initial State:**

- User adds new team via add team form on dashboard
- Heroes, items, and league data already loaded from app hydration
- No existing team data for the new team
- Some matches and/or players will fail to load

**Flow:**

1. User submits add team form with teamId and leagueId
2. Find league name in the already loaded league data from app hydration
3. Call `/api/teams/[id]` and `/api/leagues/[id]` in parallel
4. Find all matches where the team participated in the league
5. For each match found: call `/api/matches/[id]` and `/api/players/[id]` for team's players
6. Some matches fail to load - store match error in match data
7. Some players fail to load - store player error in player data
8. Set team as active in app data context
9. Update localStorage with new team information
10. Set team as active in localStorage
11. Team addition complete

**Expected Behavior:**

- Team name and league data load in parallel from `/api/teams/[id]` and `/api/leagues/[id]`
- Team is marked as active in app data context
- League matches load from `/api/leagues/[id]` and stored for future use
- Team's matches and players load individually
- Matches that fail show error state in match list
- Players that fail show error state in player list
- All loading items (team, matches, players) show loading spinners
- New team appears in app data context with name, matches (some with errors), and players (some with errors)
- localStorage updated with new team information
- Team set as active in localStorage

**Error Handling:**

- Match errors: Stored in match data with error message, displayed in match list
- Player errors: Stored in player data with error message, displayed in player list

**Network Requests:**

- `/api/teams/[id]`: 1 request (team name)
- `/api/leagues/[id]`: 1 request (league matches, stored for future use)
- `/api/matches/[id]`: N requests (one per match, some fail)
- `/api/players/[id]`: M requests (one per player, some fail)

**Cache State:**

- Heroes: Fresh (already loaded from app hydration)
- Items: Fresh (already loaded from app hydration)
- Leagues: Fresh (already loaded from app hydration)
- League Matches: Fresh (loaded via `/api/leagues/[id]`, stored for future use)
- New Team: Fresh (loaded via `/api/teams/[id]`)
- New Team Matches: Mixed (some fresh via `/api/matches/[id]`, some with errors)
- New Team Players: Mixed (some fresh via `/api/players/[id]`, some with errors)

---

### 3. Team Addition with Teams/League Endpoint Error

**Initial State:**

- User adds new team via add team form on dashboard
- Heroes, items, and league data already loaded from app hydration
- No existing team data for the new team
- Teams endpoint and/or league endpoint will fail

**Flow:**

1. User submits add team form with teamId and leagueId
2. Find league name in the already loaded league data from app hydration
3. Call `/api/teams/[id]` and `/api/leagues/[id]` in parallel
4. If teams endpoint fails: Store user-friendly error for teams in team data
5. If league endpoint fails: Store user-friendly error for league in team data
6. If both endpoints fail: Store user-friendly error for both in team data
7. If either endpoint fails: Stop processing, update localStorage with team information (including error), do NOT set team as active
8. If both endpoints succeed: Continue with normal team loading process
9. Team addition complete

**Expected Behavior:**

- Team name and league data load in parallel from `/api/teams/[id]` and `/api/leagues/[id]`
- All loading items (team, matches, players) show loading spinners
- If teams endpoint fails: User-friendly error stored for teams in team data
- If league endpoint fails: User-friendly error stored for league in team data
- If both endpoints fail: User-friendly error stored for both in team data
- If either endpoint fails: Team is NOT marked as active in app data context (due to error)
- Error displayed in team card on dashboard
- Team appears in app data context with error state
- localStorage updated with new team information (including error)
- Team NOT set as active in localStorage
- No matches or players loaded (processing stops after error)
- If both endpoints succeed: Normal team loading process continues

**Error Handling:**

- Teams error: Stored in team data with user-friendly error message, displayed in team card
- League error: Stored in team data with user-friendly error message, displayed in team card
- Both errors: Stored in team data with user-friendly error message for both, displayed in team card

**Network Requests:**

- `/api/teams/[id]`: 1 request (may fail)
- `/api/leagues/[id]`: 1 request (may fail, called in parallel with teams)

**Cache State:**

- Heroes: Fresh (already loaded from app hydration)
- Items: Fresh (already loaded from app hydration)
- Leagues: Fresh (already loaded from app hydration)
- New Team: Error (failed to load via `/api/teams/[id]` or `/api/leagues/[id]`)
- New Team Matches: N/A (not loaded due to error)
- New Team Players: N/A (not loaded due to error)

---

## Team Refresh Flows

### 1. Team Refresh with No Errors (All Network Calls Complete Successfully)

**Initial State:**

- Team exists in cache
- User clicks refresh button

**Flow:**

1. User clicks refresh button on team
2. Call `/api/teams/[id]` and `/api/leagues/[id]` in parallel (with force)
3. Search for matches that are not already listed in the team context
4. Add new matches to team context
5. For all matches in team context: refetch any matches that have errors (with force)
6. For all players in team context: refetch any players that have errors (with force)
7. For each new match: call `/api/matches/[id]` and `/api/players/[id]` for team's players
8. Update team data with fresh information
9. Team refreshed successfully

**Expected Behavior:**

- Team shows loading spinner during refresh
- Team and league data refresh in parallel
- New matches are discovered and added to team context
- Existing matches with errors are refetched with force
- Existing players with errors are refetched with force
- All loading items (team, matches, players) show loading spinners
- All data refreshes successfully
- Loading spinners disappear when complete
- Team data updated with fresh information
- Team is NOT set as active during refresh

**Network Requests:**

- `/api/teams/[id]`: 1 request (with force)
- `/api/leagues/[id]`: 1 request (with force)
- `/api/matches/[id]`: N requests (for new matches and error matches, with force)
- `/api/players/[id]`: M requests (for new players and error players, with force)

---

### 2. Team Refresh with Match/Player Error

**Initial State:**

- Team exists in cache
- User clicks refresh button
- Some matches and/or players will fail to load

**Flow:**

1. User clicks refresh button on team
2. Call `/api/teams/[id]` and `/api/leagues/[id]` in parallel (with force)
3. Search for matches that are not already listed in the team context
4. Add new matches to team context
5. For all matches in team context: refetch any matches that have errors (with force)
6. For all players in team context: refetch any players that have errors (with force)
7. For each new match: call `/api/matches/[id]` and `/api/players/[id]` for team's players
8. Some matches fail to load - store match error in match data
9. Some players fail to load - store player error in player data
10. Update team data with fresh information and error states
11. Team refreshed with some errors

**Expected Behavior:**

- Team shows loading spinner during refresh
- Team and league data refresh in parallel
- New matches are discovered and added to team context
- Existing matches with errors are refetched with force
- Existing players with errors are refetched with force
- All loading items (team, matches, players) show loading spinners
- Matches that fail show error state in match list
- Players that fail show error state in player list
- Loading spinners disappear when complete
- Team data updated with fresh information and error states
- Team is NOT set as active during refresh

**Error Handling:**

- Match errors: Stored in match data with error message, displayed in match list
- Player errors: Stored in player data with error message, displayed in player list

**Network Requests:**

- `/api/teams/[id]`: 1 request (with force)
- `/api/leagues/[id]`: 1 request (with force)
- `/api/matches/[id]`: N requests (for new matches and error matches, with force, some fail)
- `/api/players/[id]`: M requests (for new players and error players, with force, some fail)

**Cache State:**

- Heroes: Fresh (already loaded from app hydration)
- Items: Fresh (already loaded from app hydration)
- Leagues: Fresh (already loaded from app hydration)
- Team: Fresh (loaded via `/api/teams/[id]`)
- League Matches: Fresh (loaded via `/api/leagues/[id]`, stored for future use)
- Team Matches: Mixed (some fresh via `/api/matches/[id]`, some with errors)
- Team Players: Mixed (some fresh via `/api/players/[id]`, some with errors)

---

### 3. Team Refresh with Teams/League Endpoint Error

**Initial State:**

- Team exists in cache
- User clicks refresh button
- Teams endpoint and/or league endpoint will fail

**Flow:**

1. User clicks refresh button on team
2. Call `/api/teams/[id]` and `/api/leagues/[id]` in parallel (with force)
3. If teams endpoint fails: Store user-friendly error for teams in team data
4. If league endpoint fails: Store user-friendly error for league in team data
5. If both endpoints fail: Store user-friendly error for both in team data
6. If either endpoint fails: Stop processing, update team data with error
7. If both endpoints succeed: Continue with normal refresh process
8. Team refreshed with error or success

**Expected Behavior:**

- Team shows loading spinner during refresh
- Team and league data refresh in parallel
- All loading items (team, matches, players) show loading spinners
- If teams endpoint fails: User-friendly error stored for teams in team data
- If league endpoint fails: User-friendly error stored for league in team data
- If both endpoints fail: User-friendly error stored for both in team data
- Error displayed in team card on dashboard
- Loading spinners disappear when complete
- Team data updated with error or fresh information
- Team is NOT set as active during refresh

**Error Handling:**

- Teams error: Stored in team data with user-friendly error message, displayed in team card
- League error: Stored in team data with user-friendly error message, displayed in team card
- Both errors: Stored in team data with user-friendly error message for both, displayed in team card

**Network Requests:**

- `/api/teams/[id]`: 1 request (with force, may fail)
- `/api/leagues/[id]`: 1 request (with force, may fail)

**Cache State:**

- Heroes: Fresh (already loaded from app hydration)
- Items: Fresh (already loaded from app hydration)
- Leagues: Fresh (already loaded from app hydration)
- Team: Mixed (fresh via `/api/teams/[id]` or error)
- League Matches: Mixed (fresh via `/api/leagues/[id]` or error)
- Team Matches: N/A (not loaded due to endpoint error)
- Team Players: N/A (not loaded due to endpoint error)

---

### 4. Team Refresh with New Matches Available

**Initial State:**

- Team exists in cache
- User clicks refresh button
- New matches available since last refresh

**Flow:**

1. User clicks refresh button on team
2. Call `/api/teams/[id]` and `/api/leagues/[id]` in parallel (with force)
3. Search for matches that are not already listed in the team context
4. Discover new matches that weren't previously loaded
5. Add new matches to team context
6. For all matches in team context: refetch any matches that have errors (with force)
7. For all players in team context: refetch any players that have errors (with force)
8. For each new match: call `/api/matches/[id]` and `/api/players/[id]` for team's players
9. Update team data with fresh information including new matches
10. Team refreshed with new matches

**Expected Behavior:**

- Team shows loading spinner during refresh
- Team and league data refresh in parallel
- New matches are discovered and added to team context
- Existing matches with errors are refetched with force
- Existing players with errors are refetched with force
- All loading items (team, matches, players) show loading spinners
- New matches appear in UI as they load
- All data refreshes successfully
- Loading spinners disappear when complete
- Team data updated with fresh information including new matches
- Team is NOT set as active during refresh

**Network Requests:**

- `/api/teams/[id]`: 1 request (with force)
- `/api/leagues/[id]`: 1 request (with force)
- `/api/matches/[id]`: N requests (for new matches and error matches, with force)
- `/api/players/[id]`: M requests (for new players and error players, with force)

**Cache State:**

- Heroes: Fresh (already loaded from app hydration)
- Items: Fresh (already loaded from app hydration)
- Leagues: Fresh (already loaded from app hydration)
- Team: Fresh (loaded via `/api/teams/[id]`)
- League Matches: Fresh (loaded via `/api/leagues/[id]`, stored for future use)
- Team Matches: Fresh (loaded via `/api/matches/[id]` for each match, including new ones)
- Team Players: Fresh (loaded via `/api/players/[id]` for each player)

---

## Match Refresh Flows

### 1. Match Refresh with No Error

**Initial State:**

- Match exists in cache
- User clicks refresh button on match

**Flow:**

1. User clicks refresh button on match
2. Call `/api/matches/[id]` with force parameter
3. Update match data with fresh information
4. Match refreshed successfully

**Expected Behavior:**

- Match shows loading spinner during refresh
- Match data refreshes successfully
- Loading spinner disappears when complete
- Match data updated with fresh information

**Network Requests:**

- `/api/matches/[id]`: 1 request (with force)

**Cache State:**

- Match: Fresh (loaded via `/api/matches/[id]` with force)

---

### 2. Match Refresh with Error

**Initial State:**

- Match exists in cache
- User clicks refresh button on match
- Match endpoint will fail

**Flow:**

1. User clicks refresh button on match
2. Call `/api/matches/[id]` with force parameter - FAILS
3. Store user-friendly error in match data
4. Update match data with error state
5. Match refreshed with error

**Expected Behavior:**

- Match shows loading spinner during refresh
- Match fails to load from `/api/matches/[id]`
- User-friendly error stored in match data
- Error displayed in match list
- Loading spinner disappears when complete
- Match data updated with error state

**Error Handling:**

- Match error: Stored in match data with user-friendly error message, displayed in match list

**Network Requests:**

- `/api/matches/[id]`: 1 request (with force, fails)

**Cache State:**

- Match: Error (failed to load via `/api/matches/[id]` with force)

---

## Player Refresh Flows

### 1. Player Refresh with No Error

**Initial State:**

- Player exists in cache
- User clicks refresh button on player

**Flow:**

1. User clicks refresh button on player
2. Call `/api/players/[id]` with force parameter
3. Update player data with fresh information
4. Player refreshed successfully

**Expected Behavior:**

- Player shows loading spinner during refresh
- Player data refreshes successfully
- Loading spinner disappears when complete
- Player data updated with fresh information

**Network Requests:**

- `/api/players/[id]`: 1 request (with force)

**Cache State:**

- Player: Fresh (loaded via `/api/players/[id]` with force)

---

### 2. Player Refresh with Error

**Initial State:**

- Player exists in cache
- User clicks refresh button on player
- Player endpoint will fail

**Flow:**

1. User clicks refresh button on player
2. Call `/api/players/[id]` with force parameter - FAILS
3. Store user-friendly error in player data
4. Update player data with error state
5. Player refreshed with error

**Expected Behavior:**

- Player shows loading spinner during refresh
- Player fails to load from `/api/players/[id]`
- User-friendly error stored in player data
- Error displayed in player list
- Loading spinner disappears when complete
- Player data updated with error state

**Error Handling:**

- Player error: Stored in player data with user-friendly error message, displayed in player list

**Network Requests:**

- `/api/players/[id]`: 1 request (with force, fails)

**Cache State:**

- Player: Error (failed to load via `/api/players/[id]` with force)

---

## Additional Flows

### 1. Team Removal Flow

**Initial State:**

- Team exists in cache
- User clicks remove button on team
- Team may share matches/players with other teams

**Flow:**

1. User clicks remove button on team
2. Check which matches are shared with other teams
3. Check which players are shared with other teams
4. Remove only matches that are NOT shared with other teams
5. Remove only players that are NOT shared with other teams
6. Remove team from app data context
7. Update localStorage to remove team information
8. If removed team was active, clear active team selection
9. Team removed successfully

**Expected Behavior:**

- Team disappears from UI immediately
- Team removed from app data context
- Shared matches remain in app data context (for other teams)
- Shared players remain in app data context (for other teams)
- Only team-specific matches/players are removed
- localStorage updated to remove team information
- If removed team was active, active team selection is cleared
- No loading states required (immediate removal)

**Cache State:**

- Team: Removed from app data context
- Team Matches: Removed only if not shared with other teams
- Team Players: Removed only if not shared with other teams
- Shared Matches: Remain in app data context
- Shared Players: Remain in app data context
- Active Team: Cleared if removed team was active

---

### 2. Team Edit Flow

**Initial State:**

- Team exists in cache
- User edits team (changes teamId and/or leagueId)

**Flow:**

1. User submits edit form with new teamId and/or leagueId
2. Remove old team from app data context
3. Update localStorage to remove old team information
4. Add new team with updated teamId/leagueId to app data context
5. Update localStorage with new team information
6. If edited team was active, set new team as active
7. Team edited successfully

**Expected Behavior:**

- Old team disappears from UI
- New team appears in UI with updated information
- Team data updated in app data context
- localStorage updated with new team information
- If edited team was active, new team becomes active
- No loading states required (immediate update)

**Cache State:**

- Old Team: Removed from app data context
- New Team: Added to app data context
- Active Team: Updated if edited team was active

---

### 3. Manual Match Addition Flow

**When This Occurs:**

- User manually adds a match via the UI (not from league data)
- Used for adding matches that aren't automatically discovered

**Initial State:**

- User adds manual match via UI
- May or may not have an active team

**Flow:**

1. User submits manual match form with matchId and teamSide
2. If there's an active team, add match to active team's manual matches list (for edit/delete functionality)
3. If there's no active team, add match to global manual matches list
4. Update localStorage with new match information
5. Manual match added successfully

**Expected Behavior:**

- Match added to manual matches list (for edit/delete functionality)
- If active team exists, match added to active team's manual matches list
- If no active team, match added to global manual matches list
- localStorage updated with new match information
- No loading states required (immediate addition)

**Cache State:**

- If Active Team Exists, active team manual matches: Updated with new manual match (for management)
- If No Active Team, global manual matches: Updated with new manual match

---

### 4. Manual Player Addition Flow

**When This Occurs:**

- User manually adds a player via the UI (not from match data)
- Used for adding players that aren't automatically discovered

**Initial State:**

- User adds manual player via UI
- May or may not have an active team

**Flow:**

1. User submits manual player form with playerId
2. If there's an active team, add player to active team's manual players list (for edit/delete functionality)
3. If there's no active team, add player to global manual players list
4. Update localStorage with new player information
5. Manual player added successfully

**Expected Behavior:**

- Player added to manual players list (for edit/delete functionality)
- If active team exists, player added to active team's manual players list
- If no active team, player added to global manual players list
- localStorage updated with new player information
- No loading states required (immediate addition)

**Cache State:**

- If Active Team Exists, active team manual players: Updated with new manual player (for management)
- If No Active Team, global manual players: Updated with new manual player

---

### 5. Share Mode Flow

**When This Occurs:**

- User accesses a shared dashboard via a share URL
- Used for sharing team data with others without requiring them to have the data locally

**Initial State:**

- User accesses shared dashboard via share URL
- Share payload contains team data

**Flow:**

1. Load share payload from URL parameters
2. Parse team data from share payload
3. Load teams into app data context from share payload
4. Set active team from share payload
5. Dashboard displays shared data in read-only mode

**Expected Behavior:**

- Dashboard displays shared team data immediately
- No network requests for team data (data comes from share payload)
- Read-only mode (no editing capabilities)
- No loading states required (data is pre-loaded)

**Cache State:**

- Teams: Loaded from share payload
- Matches: Loaded from share payload
- Players: Loaded from share payload
- Active Team: Set from share payload

---

### 6. Cache Invalidation Flow

**Initial State:**

- Cache contains expired data
- User triggers cache invalidation

**Flow:**

1. User triggers cache invalidation (via UI or admin action)
2. Clear relevant cache entries from cache backend
3. Clear relevant entities from app data context
4. Clear relevant data from localStorage
5. Cache invalidated successfully

**Expected Behavior:**

- Cache entries removed from backend
- Entities cleared from app data context
- localStorage cleared of relevant data
- Next request will fetch fresh data
- No loading states required (immediate invalidation)

**Cache State:**

- Cache Backend: Cleared of relevant entries
- App Data Context: Cleared of relevant entities
- localStorage: Cleared of relevant data

---

## Potential Issues Identified

### 1. Double Refresh Issue

- **Problem**: `refreshInactiveTeams` might refresh active team twice
- **Location**: `useAppHydration.ts`
- **Status**: Fixed by skipping active team in `refreshInactiveTeams`

### 2. Infinite Loop Issue

- **Problem**: Background refresh might trigger repeatedly
- **Location**: `useAppHydration.ts` and context providers
- **Status**: Fixed by using `useCallback` and proper dependency arrays

### 3. Race Condition Issue

- **Problem**: Multiple simultaneous requests for same data
- **Location**: `DataFetchingManager` and `EntityStateManager`
- **Status**: Fixed by request deduplication in `DataFetchingManager`

### 4. Cache TTL Issue

- **Problem**: Cache TTL not properly enforced
- **Location**: Cache service and `EntityStateManager`
- **Status**: Fixed by centralized TTL management in `EntityStateManager`

### 5. Error State Issue

- **Problem**: Errors not properly cleared on refresh
- **Location**: `ErrorManager` and `EntityStateManager`
- **Status**: Fixed by centralized error management in `ErrorManager`

### 6. State Synchronization Issue

- **Problem**: State not properly synchronized between components
- **Location**: Various contexts
- **Status**: Fixed by single source of truth in `EntityStateManager`

---

## Recommendations

### Implemented Improvements

1. **Request Deduplication**: ✅ Implemented in `DataFetchingManager`
2. **Centralized Error Handling**: ✅ Implemented in `ErrorManager`
3. **Centralized Loading States**: ✅ Implemented in `LoadingStateManager`
4. **Single Source of Truth**: ✅ Implemented in `EntityStateManager`
5. **Centralized Data Fetching**: ✅ Implemented in `DataFetchingManager`
6. **Generic State Management**: ✅ Implemented with `EntityStateManager<T, K>`
7. **Context Integration**: ✅ Implemented with React context providers
8. **Cache TTL Management**: ✅ Implemented with centralized TTL constants

### Future Enhancements

1. **Add Retry Logic**: Automatic retry for failed requests with exponential backoff
2. **Add Performance Monitoring**: Track request times and success rates
3. **Add User Feedback**: Better error messages and loading states
4. **Add Offline Support**: Handle offline scenarios gracefully
5. **Add Data Validation**: Validate data before storing in cache
6. **Add Cleanup Logic**: Clean up unused data and resources
7. **Add Rate Limiting**: Implement rate limiting for external API calls
8. **Add Caching Strategy**: Implement more sophisticated caching strategies
9. **Add Error Recovery**: Implement automatic error recovery mechanisms
10. **Add Testing**: Add comprehensive unit and integration tests

---

## Summary

This document provides a comprehensive analysis of all data flows in the Dota Data application, covering:

- **4 App Hydration Flows**: Initial loading scenarios with different team configurations
- **3 Team Addition Flows**: Adding new teams with various error conditions
- **4 Team Refresh Flows**: Refreshing existing teams with error handling and new data discovery
- **2 Match Refresh Flows**: Individual match refresh with error handling
- **2 Player Refresh Flows**: Individual player refresh with error handling
- **6 Additional Flows**: Team management, manual additions, sharing, and cache invalidation

### Key Patterns

1. **Parallel API Calls**: Teams and leagues are always fetched in parallel for efficiency
2. **Error Handling**: User-friendly errors are stored in data objects and displayed in UI
3. **Loading States**: All loading items show spinners during data fetching
4. **Active Team Management**: Teams are only set as active when successfully loaded
5. **Shared Data Integrity**: Shared matches/players are preserved during team removal
6. **Manual Data Management**: Manual items are stored separately for edit/delete functionality
7. **Cache Management**: Fresh data is fetched with `force` parameter when needed

### Implementation Notes

- All scenarios follow consistent patterns for error handling and loading states
- Network requests are optimized with parallel calls where possible
- Data integrity is maintained through careful management of shared resources
- User experience is prioritized with clear loading states and error messages
