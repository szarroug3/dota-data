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
- **Hybrid Loading Pattern**: Immediate responses when cached, background loading for heavy operations
- **Serverless-Optimized**: Designed for Vercel free tier with instance-local rate limiting and queueing

## Architecture Overview

### API Orchestration Pattern
All external data access follows a simplified POST-only pattern:

- **POST**: Check cache and return data immediately if available, or queue background job and wait for completion, then return data
- **No polling required**: POST requests are synchronous and always return the requested data
- **Simplified frontend**: No need to handle different response types or implement polling logic

### Serverless Environment Design
The application is optimized for Vercel's free tier deployment:

- **Instance-local rate limiting**: Each serverless function manages its own rate limits
- **Fire-and-forget background jobs**: Queue jobs and return immediately, no blocking
- **No cross-instance coordination**: Each instance operates independently
- **Graceful rate limit handling**: Uses retry headers and exponential backoff

### Data Flow
1. **API Route Handler**: Receives request and checks cache
2. **Cache Service**: Returns data if available, or queues background job
3. **Background Processing**: Queue processor handles external API calls with rate limiting
4. **Mock Data Layer**: Supports development with mock data generation
5. **Cache Update**: All returned data is cached for future requests

### Frontend Integration
The frontend uses a simplified synchronous loading approach:

- **Synchronous requests** that always return data
- **No polling required** - POST requests wait for background processing to complete
- **Simple error handling** - clear success/error states
- **Responsive UI** with loading states during data processing

## Data Sources

- **OpenDota**: Match details, player statistics, hero data
- **Dotabuff**: Team information, league data
- **Stratz**: Advanced analytics and insights
- **Dota2ProTracker**: Professional player data

## Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000` (or the next available port).

## Environment Variables

- `USE_MOCK_API`: If `true`, all external API calls are mocked
- `USE_MOCK_OPENDOTA`, `USE_MOCK_DOTABUFF`, etc.: Fine-grained control for mocking specific services
- `WRITE_REAL_DATA_TO_MOCK`: If `true`, real data will be written to mock files for development
- `MOCK_RATE_LIMIT`: Controls the rate limit for mock mode (requests per minute)

## Architecture

- **Next.js 15 with App Router**: Modern React framework with server-side rendering
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Redis Caching**: Upstash Redis for production caching (optional)
- **Instance-Local Rate Limiting**: Per-instance rate limiting for external APIs
- **Background Job Queue**: In-memory job queue with service-specific processing
- **Orchestration System**: High-level service for managing complex data dependencies
- **Mock Data Support**: Comprehensive mocking system for development and testing

## Team Management Flow

### Synchronous Loading Pattern
When data is requested:

1. **Cache Check**: Check if data is available in cache
2. **Immediate Return**: Return data immediately if cached
3. **Background Processing**: If not cached, queue background job and wait for completion
4. **Data Return**: Always return the requested data (never 202 "queued" status)

### Example Implementation
```typescript
// Team management page
const loadTeam = async () => {
  const response = await fetch('/api/teams/123/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false })
  });
  
  if (response.ok) {
    const data = await response.json();
    setTeamData(data); // Complete team data available
  } else {
    setError('Failed to load team data');
  }
};
```

## Rate Limiting and Error Handling

### Graceful Rate Limit Handling
When external services return 429 (rate limited):

1. **Uses retry headers** if provided by the service
2. **Waits default amount of time** (60 seconds) if no retry header
3. **Implements exponential backoff** for repeated failures
4. **Logs rate limit events** for monitoring

### Trade-offs Accepted
- **Higher rate limit usage** (multiple instances)
- **Potential duplicate processing** (mitigated by queue deduplication)
- **No cross-instance coordination** (each instance operates independently)
- **Imperfect rate limiting** (but functional for most use cases)

## Future Considerations

### When to Upgrade
Consider upgrading to external services when:
- **Rate limiting becomes problematic** (frequent 429s)
- **Queue coordination is needed** (cross-instance state)
- **Higher reliability required** (persistent queue state)
- **Budget allows** for paid services

### Potential Upgrades
- **Redis-based rate limiting** for cross-instance coordination
- **Bull/BullMQ** for robust queue management
- **Database persistence** for critical state
- **External queue services** (AWS SQS, Google Cloud Tasks)

## Testing

- Integration tests can be run in mock mode for deterministic, fast, and isolated results
- To test the real API flow, run tests with `USE_MOCK_API=false`
- To build up a realistic mock dataset, run the app or tests with both `USE_MOCK_API=false` and `WRITE_REAL_DATA_TO_MOCK=true`

## Troubleshooting

- If you see errors about missing mock data, ensure `WRITE_REAL_DATA_TO_MOCK=true` is set to allow auto-generation
- All file operations for mock data are async and will create parent directories as needed
- Rate limiting events are logged for monitoring and debugging
- Queue statistics are available for monitoring background job progress

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
