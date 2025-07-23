# Data Flow Operations

This document provides a comprehensive overview of all data flow operations in the Dota 2 data dashboard application, including the function calls, data transformations, and state management for each operation.

## Table of Contents

- [Add New Team](#add-new-team)
- [Remove Team](#remove-team)
- [Edit Team](#edit-team)
- [Refresh Team](#refresh-team)
- [Add Manual Match](#add-manual-match)
- [Add Manual Player](#add-manual-player)
- [Hide Match](#hide-match)
- [Show Match](#show-match)
- [Hide Player](#hide-player)
- [Show Player](#show-player)
- [Load Page](#load-page)
- [Key Data Flow Patterns](#key-data-flow-patterns)

## Add New Team

```
DashboardPage.handleSubmit(teamId, leagueId)
  |
  V
DashboardPage.handleAddTeam(teamId, leagueId)
  |
  V
TeamContext.addTeam(teamId, leagueId)
  |
  V
useTeamDataOperations.addTeam(teamId, leagueId)
  |
  V
generateTeamKey(teamId, leagueId) // Creates "teamId-leagueId" key
  |
  V
createInitialTeamData(teamId, leagueId) // Creates default TeamData with loading state
  |
  V
addNewTeamToState(teamKey, newTeamData, state) // Adds to teams Map
  |
  V
fetchTeamAndLeagueData(newTeamData, false) // Fetches team & league from APIs
  |
  V
teamDataFetching.fetchTeamData(teamId, false) // OpenDota API call
teamDataFetching.fetchLeagueData(leagueId, false) // Dotabuff API call
  |
  V
updateTeamInState(teamKey, finalTeamData, state) // Updates with fetched data
  |
  V
configContext.setTeams(state.teams) // Persists to localStorage
  |
  V
processTeamData(teamId, leagueId, false) // Processes matches & players
  |
  V
processTeamDataWithState(teamId, leagueId, updatedTeamData, originalTeamData, state, ...)
  |
  V
processMatchAndExtractPlayers(matchId, teamId, matchContext, playerContext) // For each match
  |
  V
matchContext.addMatch(matchId) // Fetches match data
determineTeamSideFromMatch(match, teamId) // Determines radiant/dire
playerContext.addPlayer(accountId) // Fetches player data for each player
```

## Remove Team

```
TeamCard.handleRemoveTeam(teamId, leagueId)
  |
  V
DashboardPage.handleRemoveTeam(teamId, leagueId)
  |
  V
TeamContext.removeTeam(teamId, leagueId)
  |
  V
useTeamStateOperations.removeTeam(teamId, leagueId)
  |
  V
generateTeamKey(teamId, leagueId) // Creates team key
  |
  V
state.setTeams(prev => new Map(prev).delete(key)) // Removes from teams Map
  |
  V
cleanupUnusedData(teamToRemove, remainingTeams, matchContext, playerContext)
  |
  V
matchContext.removeMatch(matchId) // Removes unused matches
playerContext.removePlayer(playerId) // Removes unused players
  |
  V
configContext.setTeams(state.teams) // Persists to localStorage
```

## Edit Team

```
EditTeamModal.handleSave(newTeamId, newLeagueId)
  |
  V
DashboardPage.handleEditTeamSave(currentTeamId, currentLeagueId, newTeamId, newLeagueId)
  |
  V
TeamContext.editTeam(currentTeamId, currentLeagueId, newTeamId, newLeagueId)
  |
  V
useTeamStateOperations.editTeam(currentTeamId, currentLeagueId, newTeamId, newLeagueId)
  |
  V
fetchTeamAndLeagueData(existingTeam, false) // Fetches new team & league data
  |
  V
state.setTeams(prev => {
    newTeams.delete(currentKey);
    newTeams.set(newKey, updatedTeamData);
    return newTeams;
  }) // Updates team key and data
  |
  V
configContext.setTeams(state.teams) // Persists to localStorage
```

## Refresh Team

```
TeamCard.handleRefreshTeam(teamId, leagueId)
  |
  V
DashboardPage.handleRefreshTeam(teamId, leagueId)
  |
  V
TeamContext.refreshTeam(teamId, leagueId)
  |
  V
useTeamDataOperations.refreshTeam(teamId, leagueId)
  |
  V
processTeamData(teamId, leagueId, true) // force = true
  |
  V
fetchTeamAndLeagueData(existingTeam, true) // Force refresh from APIs
  |
  V
processTeamDataWithState(teamId, leagueId, updatedTeamData, originalTeamData, state, ...)
  |
  V
configContext.setTeams(updatedTeams) // Persists to localStorage
```

## Add Manual Match

```
TeamContext.addMatchToTeam(matchId, teamSide)
  |
  V
useTeamCoreActions.addMatchToTeam(matchId, teamSide)
  |
  V
matchContext.getMatch(matchId) // Gets existing match data
  |
  V
updateTeamMatches(key, matchId, teamSide, match) // Updates team's matches array
  |
  V
updateTeam(key, (existingTeam) => {
    return {
      ...existingTeam,
      matches: [...existingTeam.matches, newMatchParticipation]
    };
  }) // Adds match to team's matches
```

## Add Manual Player

```
TeamContext.addPlayerToTeam(playerId)
  |
  V
useTeamCoreActions.addPlayerToTeam(playerId)
  |
  V
playerContext.addPlayer(playerId) // Fetches player data
  |
  V
updateTeamPlayers(key, player) // Updates team's players array
  |
  V
updateTeam(key, (existingTeam) => {
    return {
      ...existingTeam,
      players: [...existingTeam.players, newTeamPlayer]
    };
  }) // Adds player to team's players
```

## Hide Match

```
MatchListViewList.handleHideMatch(matchId)
  |
  V
MatchHistoryPage.handleHideMatch(matchId)
  |
  V
setHiddenMatches(prev => [...prev, matchToHide]) // Adds to hidden matches state
  |
  V
visibleMatches.filter(m => !hiddenIds.has(m.id)) // Filters out from visible
```

## Show Match

```
HiddenMatchesModal.handleUnhide(matchId)
  |
  V
MatchHistoryPage.handleUnhideMatch(matchId)
  |
  V
setHiddenMatches(prev => prev.filter(m => m.id !== matchId)) // Removes from hidden
  |
  V
visibleMatches includes the match again // Automatically shows in visible
```

## Hide Player

```
// Not implemented in current codebase - would follow similar pattern to hide match
```

## Show Player

```
// Not implemented in current codebase - would follow similar pattern to show match
```

## Load Page

```
ClientRoot.AppContent()
  |
  V
useAppHydration() // Handles initial data loading
  |
  V
contextsRef.current.constantsContext.fetchHeroes() // Fetches heroes
contextsRef.current.constantsContext.fetchItems() // Fetches items
  |
  V
contextsRef.current.configContext.getTeams() // Gets teams from localStorage
  |
  V
contextsRef.current.teamContext.loadTeamsFromConfig(teams) // Loads teams into state
  |
  V
contextsRef.current.teamContext.refreshTeamSummary(team.team.id, team.league.id) // Refreshes each team
  |
  V
contextsRef.current.teamContext.addTeam(activeTeam.teamId, activeTeam.leagueId) // Adds active team
  |
  V
AppLayout renders with hydrated data
```

## Key Data Flow Patterns

### 1. Team Operations
All team operations follow a consistent pattern:
- **Entry Point**: UI component (DashboardPage, TeamCard, etc.)
- **Context Layer**: TeamContext provides the interface
- **Operation Layer**: useTeamDataOperations or useTeamStateOperations handles business logic
- **Data Fetching**: fetchTeamAndLeagueData coordinates API calls
- **State Management**: Teams stored in `Map<string, TeamData>` with key format `"teamId-leagueId"`
- **Persistence**: All changes persisted via `configContext.setTeams()` to localStorage

### 2. State Management
- **Teams**: Stored in `Map<string, TeamData>` with key format `"teamId-leagueId"`
- **Matches**: Stored in `Map<string, Match>` in MatchContext
- **Players**: Stored in `Map<string, Player>` in PlayerContext
- **Configuration**: Stored in localStorage via ConfigContext

### 3. Error Handling
Each operation includes comprehensive error handling:
- **Try-catch blocks** around all async operations
- **Error state updates** for UI feedback
- **Graceful degradation** when operations fail
- **Error propagation** through the call chain

### 4. Loading States
Each operation manages its own loading state:
- **Component-level loading** for immediate UI feedback
- **Context-level loading** for data operations
- **Individual operation loading** for specific actions

### 5. Data Fetching Architecture
Data fetching is separated by domain:
- **Team Data**: `teamDataFetching` handles team and league information
- **Match Data**: `matchContext` handles match information and processing
- **Player Data**: `playerContext` handles player information and processing
- **Constants**: `constantsContext` handles heroes, items, and other static data

### 6. Hydration Strategy
Page load follows a coordinated hydration process:
- **Constants first**: Heroes and items loaded first
- **Teams second**: Teams loaded from localStorage
- **Active team third**: Active team processed with full data
- **Background refresh**: Non-active teams refreshed in background

### 7. Separation of Concerns
The architecture maintains clear separation:
- **Contexts**: Handle state management and provide interfaces
- **Hooks**: Handle business logic and data operations
- **Utilities**: Handle data processing and transformations
- **Components**: Handle UI rendering and user interactions

### 8. Data Flow Principles
- **Unidirectional**: Data flows down from contexts to components
- **Immutable**: State updates create new objects rather than mutating existing ones
- **Predictable**: All operations follow the same patterns
- **Testable**: Each layer can be tested independently
- **Maintainable**: Clear separation makes the codebase easy to understand and modify

This architecture ensures that all data operations are consistent, predictable, and maintainable while providing a smooth user experience with proper loading states and error handling. 