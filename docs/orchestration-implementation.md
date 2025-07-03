# Dota Data Backend Orchestration System - Implementation Guide

## Overview

This document provides a comprehensive guide to the implemented backend orchestration system for the Dota Data dashboard. The system handles team import, background queueing of match and player data, and intelligent cache management with polling support.

## Architecture Summary

The orchestration system implements the architecture described in `architecture.md` with the following key components:

### 1. Core Infrastructure

#### Cache Service (`src/lib/cache-service.ts`)
- **Redis/Mock Support**: Uses Redis in production, in-memory/file cache in development
- **Queue Management**: Integrated background job queueing with `queueRequest()`
- **Cache Invalidation**: Comprehensive cache clearing for force refresh scenarios
- **Rate Limiting**: Built-in rate limiting for external API calls

#### Request Queue (`src/lib/request-queue.ts`)
- **Background Processing**: In-memory job queue with service-specific processing
- **Deduplication**: Prevents duplicate requests for the same data
- **Queue Statistics**: Real-time queue status monitoring
- **Error Handling**: Graceful error handling and retry logic

#### Orchestration Service (`src/lib/orchestration-service.ts`)
- **High-Level API**: Simplified interface for complex operations
- **Team Import**: Complete team import with match/player queueing
- **Cache Management**: Intelligent cache invalidation and refresh
- **Configuration**: Configurable timeouts and concurrency limits

### 2. API Endpoints

#### Team Import (`/api/teams/[id]/matches`)
```typescript
POST /api/teams/{id}/matches?leagueId={leagueId}&force={boolean}
```
Imports team data and queues match/player fetching:
```json
{
  "id": "2586976-1234",
  "teamId": "2586976",
  "teamName": "Team Liquid",
  "leagueId": "1234",
  "leagueName": "The International",
  "matchIds": ["1234567890", "1234567891"],
  "matches": [],
  "players": [],
  "status": "queued"
}
```

#### Match Data (`/api/matches/[id]`)
```typescript
GET /api/matches/{id}?force={boolean}
```
Fetches match data with automatic player queueing:
```json
{
  "match_id": 1234567890,
  "radiant_team_id": 2586976,
  "dire_team_id": 2586977,
  "players": [...],
  "duration": 2400,
  "radiant_win": true
}
```

#### Player Data (`/api/players/[id]/data`)
```typescript
GET /api/players/{id}/data?force={boolean}
```
Fetches player data:
```json
{
  "profile": {
    "account_id": 123456789,
    "personaname": "Miracle-",
    "avatarfull": "..."
  },
  "mmr_estimate": {
    "estimate": 8500
  }
}
```

### 3. Frontend Integration

#### Queue Status Hook (`src/lib/hooks/useQueueStatus.ts`)
```typescript
import { useQueueStatus } from '@/lib/hooks/useQueueStatus';

function MyComponent() {
  const { status, isLoading, error, isPolling } = useQueueStatus({
    pollingInterval: 2000,
    enabled: true,
  });

  if (isLoading) return <div>Loading queue status...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Background Jobs</h3>
      {Object.entries(status?.services || {}).map(([service, data]) => (
        <div key={service}>
          {service}: {data.activeSignatures} active requests
        </div>
      ))}
    </div>
  );
}
```

#### Queue Status Component (`src/components/QueueStatusIndicator.tsx`)
```typescript
import { QueueStatusIndicator } from '@/components/QueueStatusIndicator';

function Dashboard() {
  return (
    <div>
      <QueueStatusIndicator 
        serviceNames={['dotabuff', 'opendota']}
        showDetails={true}
        compact={false}
      />
    </div>
  );
}
```

## Implementation Details

### Data Flow

1. **Team Import Flow**:
   ```
   User Action → Team Import API → Dotabuff HTML Fetch → Match ID Extraction → 
   Match Queueing → Player Queueing → Background Processing → Cache Storage
   ```

2. **Polling Flow**:
   ```
   Frontend Request → Cache Check → Queue Status → Background Job → 
   Data Ready → Cache Update → Frontend Poll → Data Return
   ```

3. **Refresh Flow**:
   ```
   Force Refresh → Cache Invalidation → Re-queue Jobs → 
   Background Processing → Cache Update → Data Return
   ```

### Cache Strategy

- **Team Data**: Raw HTML cached, parsed as side effect
- **Match Data**: JSON objects cached with 14-day TTL
- **Player Data**: JSON objects cached with 1-day TTL
- **Mock Mode**: Files written to `mock-data/` directory
- **Real Mode**: Redis cache only

### Queue Management

- **Immediate Response**: Always return "queued" status for background jobs
- **Side Effects**: Parse and queue dependent jobs in background functions
- **Cache Separation**: Never cache "queued" status, only actual data
- **Error Handling**: Comprehensive logging and graceful degradation

### Configuration

The orchestration service supports configuration via the `OrchestrationConfig` interface:

```typescript
interface OrchestrationConfig {
  maxConcurrentMatches?: number;    // Default: 5
  maxConcurrentPlayers?: number;    // Default: 10
  matchQueueTimeout?: number;       // Default: 30000ms
  playerQueueTimeout?: number;      // Default: 15000ms
  enableAutoRefresh?: boolean;      // Default: false
}
```

## Usage Examples

### Basic Team Import

```typescript
import { orchestrationService } from '@/lib/orchestration-service';

// Import a team and queue all related data
const result = await orchestrationService.importTeam('2586976', '1234');

if (result.status === 'queued') {
  console.log('Team import queued, data will be available soon');
} else {
  console.log('Team import completed:', result.teamName);
  console.log('Matches found:', result.matchIds.length);
}
```

### Force Refresh

```typescript
// Force refresh all team data
const result = await orchestrationService.importTeam('2586976', '1234', {
  forceRefresh: true
});
```

### Queue Status Monitoring

```typescript
// Get current queue status
const status = orchestrationService.getQueueStatus();
console.log('Active requests:', status.services.opendota.activeSignatures);
```

### Cache Invalidation

```typescript
// Invalidate all cache for a team
await orchestrationService.invalidateTeamCache(
  '2586976', 
  '1234', 
  ['1234567890', '1234567891'], 
  ['123456789', '987654321']
);
```

## Testing

### Manual Testing

Use the provided test script to validate the complete system:

```bash
# Run all tests
node scripts/test-orchestration.js

# Test with custom configuration
node scripts/test-orchestration.js --url http://localhost:3000 --team 2586976
```

### API Testing

Test individual endpoints:

```bash
# Test team import
curl -X POST http://localhost:3000/api/teams/2586976/matches?leagueId=1234 \
  -H "Content-Type: application/json" \
  -d '{"leagueId": "1234"}'

# Test match data
curl http://localhost:3000/api/matches/1234567890

# Test player data
curl http://localhost:3000/api/players/123456789/data
```

## Monitoring and Debugging

### Logging

The system provides comprehensive logging throughout:

- **Cache Service**: Cache hits/misses, queue operations
- **Request Queue**: Job processing, rate limiting
- **Orchestration**: Team import flow, background job coordination
- **API Routes**: Request handling, response status

### Queue Status Monitoring

Monitor queue status in real-time:

```typescript
// Frontend polling
const { status } = useQueueStatus({ pollingInterval: 2000 });

// Backend monitoring
const status = orchestrationService.getQueueStatus();
```

### Error Handling

The system handles various error scenarios:

- **Network Failures**: Automatic retry with exponential backoff
- **API Limits**: Rate limiting and queue management
- **Invalid Data**: Graceful degradation and error reporting
- **Cache Failures**: Fallback to direct API calls

## Performance Considerations

### Optimization Strategies

1. **Concurrent Processing**: Multiple jobs processed simultaneously
2. **Cache Warming**: Background jobs populate cache proactively
3. **Rate Limiting**: Prevents API abuse and ensures reliability
4. **Queue Management**: Prevents duplicate requests and resource waste

### Scalability

The system is designed to scale:

- **Horizontal Scaling**: Stateless design allows multiple instances
- **Queue Persistence**: Redis-based queue for production environments
- **Load Balancing**: Multiple worker processes can handle queues
- **Resource Management**: Configurable concurrency limits

## Troubleshooting

### Common Issues

1. **Queue Not Processing**:
   - Check Redis connection (production)
   - Verify rate limiting settings
   - Review server logs for errors

2. **Cache Not Updating**:
   - Verify cache invalidation calls
   - Check TTL settings
   - Review mock vs real mode configuration

3. **Frontend Not Polling**:
   - Check network connectivity
   - Verify API endpoint availability
   - Review polling interval settings

### Debug Commands

```bash
# View server logs
tail -f logs/server.log
```

## Future Enhancements

### Planned Features

1. **WebSocket Support**: Real-time queue status updates
2. **Advanced Caching**: Multi-level cache with intelligent invalidation
3. **Job Prioritization**: Priority-based queue processing
4. **Metrics Dashboard**: Real-time performance monitoring
5. **Auto-scaling**: Dynamic worker process management

### Integration Opportunities

1. **External APIs**: Support for additional Dota data sources
2. **Analytics**: Integration with analytics platforms
3. **Notifications**: User notifications for completed jobs
4. **Scheduling**: Automated data refresh scheduling

## Conclusion

The Dota Data Backend Orchestration System provides a robust, scalable foundation for handling complex data dependencies while maintaining responsive user experience. The implementation follows the architecture design and provides comprehensive APIs, monitoring, and error handling.

For questions or issues, refer to the server logs and queue status endpoints for debugging information.

## Idempotent POST/GET Polling Pattern

All orchestration endpoints now support both POST and GET:
- **POST**: Checks cache, returns `{ status: 'ready' }` if data is present, `{ status: 'queued' }` and starts background job if not.
- **GET**: Polls for readiness, returns data if ready, or status if not.
- **Idempotency**: POST is idempotent; repeated POSTs return 'ready' if data is present.

### Endpoints:
- `/teams/[id]/matches`
- `/players/[id]/data`
- `/matches/[id]`
- `/players/[id]/stats`
- `/leagues/[id]`

## Example Flow
1. Client POSTs to endpoint to queue data.
2. If not present, receives 'queued' and polls GET until 'ready'.
3. If present, receives 'ready' immediately.
4. Repeated POSTs are safe and return 'ready' if data is present. 