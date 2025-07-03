# Dota Data Dashboard

A comprehensive dashboard for analyzing Dota 2 team and player data, with support for multiple data sources including OpenDota, Dotabuff, Stratz, and Dota2ProTracker.

## Features

- **Team Management & Analysis**: Import teams from Dotabuff with automatic match and player data queueing
- **Player Statistics & Performance Tracking**: Comprehensive player analytics with background data fetching
- **Match History with Detailed Insights**: Complete match analysis with draft information and player stats
- **Draft Suggestions and Meta Analysis**: AI-powered draft recommendations based on team performance
- **Real-time Data Fetching**: Intelligent queueing system with rate limiting and background processing
- **Advanced Caching System**: Redis-based caching with mock support for development
- **Background Job Orchestration**: Automatic queueing of match and player data when teams are imported
- **Queue Status Monitoring**: Real-time monitoring of background job progress
- **Force Refresh Support**: Unified cache invalidation and data refresh capabilities

## Data Flow, Mocking, and Environment Variables

### Architecture Overview

All external data access in this project is centralized and controlled through API route handlers. The flow for any data request is:

1. **API Route Handler**: Receives the request and delegates to the data service layer.
2. **Queue & Rate Limiting**: All external API calls are queued and rate-limited to avoid hitting service limits and to deduplicate requests.
3. **Cache Service**: Checks for fresh data in the cache (Redis or in-memory mock DB). If found, returns it immediately.
4. **Mock Data Layer**:
   - If mock mode is enabled, checks for mock data on disk.
   - If mock data is missing, generates fake data and (optionally) writes it to disk.
5. **Real API Call**: If not in mock mode, or if mock data is missing and not required, makes a real API call.
6. **Write to Mock (Optional)**: If `WRITE_REAL_DATA_TO_MOCK` is true, real or generated data is written to the mock-data directory for future use.
7. **Cache Update**: All returned data is cached for future requests.

### Refreshing and Invalidating Data

- **All refresh and cache invalidation is now handled via the `force=true` query parameter on GET endpoints.**
- To force a refresh and bypass the cache, simply add `?force=true` to any supported GET endpoint (e.g., `/api/teams/[id]/matches?force=true`, `/api/matches/[id]?force=true`, `/api/players/[id]/data?force=true`).
- There are no longer any POST refresh endpoints or batch refresh endpoints. All refresh logic is unified under the `force` parameter.

### Environment Variables

- `USE_MOCK_API`: If `true`, all external API calls are mocked (uses mock data or generates fake data).
- `USE_MOCK_OPENDOTA`, `USE_MOCK_DOTABUFF`, etc.: Fine-grained control for mocking specific services.
- `WRITE_REAL_DATA_TO_MOCK`: If `true`, any real or generated data will be written to the `mock-data/` directory for future use.
- `MOCK_RATE_LIMIT`: Controls the rate limit for mock mode (requests per minute).

### How to Use and Generate Mock Data

- To run the app in mock mode, set `USE_MOCK_API=true` in your environment.
- To generate new mock data files as you use the app, also set `WRITE_REAL_DATA_TO_MOCK=true`.
- When a request is made for an endpoint with no existing mock data, fake data will be generated and (if enabled) written to disk.
- All mock data is stored in the `mock-data/` directory at the project root.

### Running in Mock and Real API Modes

- **Mock Mode:**
  - Set `USE_MOCK_API=true` (and optionally `WRITE_REAL_DATA_TO_MOCK=true`).
  - All API calls will use mock data, and new endpoints will auto-generate mock files as needed.
- **Real API Mode:**
  - Unset or set `USE_MOCK_API=false`.
  - API calls will go to the real external services. If `WRITE_REAL_DATA_TO_MOCK=true`, real responses will be saved for future mock use.

### Testing

- Integration tests can be run in mock mode for deterministic, fast, and isolated results.
- To test the real API flow, run tests with `USE_MOCK_API=false`.
- To build up a realistic mock dataset, run the app or tests with both `USE_MOCK_API=false` and `WRITE_REAL_DATA_TO_MOCK=true`.

### Troubleshooting

- If you see errors about missing mock data, ensure `WRITE_REAL_DATA_TO_MOCK=true` is set to allow auto-generation.
- All file operations for mock data are async and will create parent directories as needed.
- For more details, see the code in `src/lib/mock-data-writer.ts` and `src/lib/cache-service.ts`.

### Mock/Real Data Utilities and Behavior

#### Centralized Utilities
- `shouldMockService(service: string)`: Returns true if the given service should be mocked, based on env vars.
- `shouldWriteMockData({ isFake, isReal })`: Returns true if fake or real data should be written to disk as mock data.
  - Always true for fake data in mock mode.
  - True for real data in real mode if `WRITE_REAL_DATA_TO_MOCK` is true.

#### Data Write Behavior Table

| Mode         | Data Source      | Write to Disk?         | Condition                        |
|--------------|------------------|:----------------------:|----------------------------------|
| Mock         | Fake data        |      Yes               | Always                           |
| Real         | Real data        |      Yes               | If `WRITE_REAL_DATA_TO_MOCK`     |
| Real         | Real data        |      No                | If `WRITE_REAL_DATA_TO_MOCK` is false |

#### Example Usage

```js
import { shouldMockService, shouldWriteMockData } from './mock-data-writer';

if (shouldMockService('opendota')) {
  // Use mock/fake data, always write fake data to disk
} else {
  // Fetch real data
  if (shouldWriteMockData({ isReal: true })) {
    // Write real data to disk if not present
  }
}
```

#### Notes
- All fake/mock data generation in mock mode is always written to disk for future use.
- Real data is only written to disk if `WRITE_REAL_DATA_TO_MOCK` is set to `true`.
- The utilities ensure consistent, maintainable logic across the codebase.

---

## Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000` (or the next available port).

## Data Sources

- **OpenDota**: Match details, player statistics, hero data
- **Dotabuff**: Team information, league data
- **Stratz**: Advanced analytics and insights
- **Dota2ProTracker**: Professional player data

## Architecture

- **Next.js 15 with App Router**: Modern React framework with server-side rendering
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Redis Caching**: Upstash Redis for production caching and session storage
- **Rate Limiting**: Intelligent rate limiting for external API protection
- **Background Job Queue**: In-memory job queue with service-specific processing
- **Orchestration System**: High-level service for managing complex data dependencies
- **Mock Data Support**: Comprehensive mocking system for development and testing

## Team Management, Match, and Player Data Flow (Design Context)

### Team Management Page
- Purpose: Lets users view and switch between teams.
- Data needed for display: Only the team's name and league name.
- When a team is added: Team data (including matches and players) should start being fetched in the background so that when the user switches to another page, the data is either ready or queued to be fetched.

### Player Data Sourcing
- Player data should be derived from the matches.
- Only fetch player data for players who have played on the team (do not fetch data for opponent players).

### Match History Page
- Shows a list of matches with minimal summary data:
  - Win/Loss
  - Radiant/Dire
  - First pick/Second pick
  - Duration
  - Opponent team name
  - Score
- When a match is clicked:
  - Show a detailed summary, including:
    - Draft order
    - Who played what hero on each side
    - Stats for each player in that match (kills, deaths, assists, etc.)
    - For players on the active team:
      - Quick Player Info button: Pops up a quick info box with top 5 most played heroes (all time and last 5 months), win rate, match count, player rank, etc.
      - Full Player Info button: Navigates to the player stats page for that player.
- Also includes a table of hero statistics for the team:
  - Number of times the team picked/banned a hero
  - Number of times enemy teams picked/banned a hero

### Player Stats Page
- Shows detailed information for the active team's players.
- The exact data to display is still to be decided, but this is where player data will be used most extensively.

### Data Fetching and Queueing Principles
- When a team is added, begin fetching all relevant data (matches, players) in the background.
- Player data requests should be limited to players who have played for the team (not opponents).
- Data should be available or in the queue by the time the user navigates to a page that needs it.

---

## Architectural Decision: Match & Player Data Fetching

### Options for Team Match Import and Refresh

- **All refresh and cache invalidation is now handled via the `force=true` query parameter on GET endpoints.**
- To force a refresh and bypass the cache, simply add `?force=true` to any supported GET endpoint (e.g., `/api/teams/[id]/matches?force=true`, `/api/matches/[id]?force=true`, `/api/players/[id]/data?force=true`).
- There are no longer any POST refresh endpoints or batch refresh endpoints. All refresh logic is unified under the `force` parameter.

### Recommendation
- This approach fits best with your queue-based, observable architecture.
- The route can return quickly, and the queue system will handle match and player enrichment in the background.
- You can monitor progress via the queue stats, and the UI can show loading/progress indicators.
- This also makes it easy to retry or re-enqueue failed jobs.

---

## Backend Orchestration System

The Dota Data dashboard features a comprehensive backend orchestration system that handles complex data dependencies and background processing:

### Key Components

- **Orchestration Service** (`src/lib/orchestration-service.ts`): High-level API for team import, match queueing, and player queueing
- **Cache Service** (`src/lib/cache-service.ts`): Redis/mock caching with integrated background job queueing
- **Request Queue** (`src/lib/request-queue.ts`): In-memory job queue with service-specific processing and deduplication

### Data Flow

1. **Team Import**: When a team is imported, the system automatically:
   - Fetches team information from Dotabuff
   - Extracts match IDs from team pages
   - Queues background jobs for match data fetching
   - Queues player data fetching when match data becomes available

2. **Background Processing**: All data fetching happens in the background:
   - Jobs are queued immediately and return "queued" status
   - Frontend polls for status updates
   - Data is cached when ready for instant access

3. **Cache Management**: Intelligent caching with refresh support:
   - Force refresh invalidates all related cache
   - Normal refresh bypasses cache for new data only
   - Mock mode supports file-based caching for development

### Frontend Integration

- **Queue Status Hook** (`src/lib/hooks/useQueueStatus.ts`): React hook for polling queue status
- **Queue Status Component** (`src/components/QueueStatusIndicator.tsx`): UI component for displaying background job progress
- **Real-time Updates**: Automatic polling with configurable intervals

### Testing

- **Integration Tests** (`tests/orchestration.integration.test.ts`): Comprehensive test suite for the orchestration system
- **Manual Testing** (`scripts/test-orchestration.js`): Node.js script for manual testing and validation

For detailed implementation information, see `docs/orchestration-implementation.md`.

## Summary
- Team management triggers background fetching of matches and player data for team members
- Player data is only fetched for players who have played for the team
- All refresh and cache invalidation is handled via the `force=true` query parameter on GET endpoints
- Background job orchestration ensures responsive user experience with comprehensive data availability

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Documentation

This project uses [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) to generate the OpenAPI spec from JSDoc comments in the API route files. To update the OpenAPI spec:

```sh
pnpm generate:openapi
```

This will scan all `src/app/api/**/*.ts` files for JSDoc blocks in the [OpenAPI YAML format](https://swagger.io/specification/), and output the spec to `public/openapi.json`.

### JSDoc Example

```js
/**
 * @openapi
 * /heroes:
 *   get:
 *     tags:
 *       - Heroes
 *     summary: Get all heroes
 *     responses:
 *       200:
 *         description: List of heroes
 */
```

You can view the documentation in Swagger UI by running:

```sh
make swagger-docker-ip
```

## Orchestration API Pattern

All major endpoints now support both POST (to queue or check data) and GET (to poll for readiness):
- POST: Returns 'queued' if work is needed, 'ready' if data is present.
- GET: Returns data if ready, or status if not.
- Endpoints: /teams/[id]/matches, /players/[id]/data, /matches/[id], /players/[id]/stats, /leagues/[id]

See `docs/orchestration-implementation.md` for details.
