# Architecture: Simplified API Orchestration with Synchronous Data Loading

## Overview
This document describes the simplified architecture for handling data loading in the Dota Data dashboard. The system uses a single POST endpoint pattern that ensures data is always returned to the client, either immediately from cache or after waiting for background processing to complete.

---

## API Design Principles

### Simplified POST-Only Pattern
All API endpoints follow a single, simplified pattern using only POST requests:

1. **POST Endpoint Behavior**:
   - Check cache for requested data
   - If data exists: Return 200 with data immediately
   - If data missing: Queue background job and wait for completion
   - Always return 200 with the actual data (never 202 "queued" status)

2. **Benefits**:
   - **Simplified Frontend**: No need to handle different response types or polling
   - **Guaranteed Data**: POST always returns the data you need
   - **Synchronous Loading**: Request waits for background processing to complete
   - **Clear Semantics**: POST = "get me this data, even if you have to fetch it"

3. **Error Handling**:
   - 400: Invalid request parameters
   - 500: Server error during processing
   - No 404 responses (data is fetched if missing)

### Migration from GET/POST Pattern
The previous GET/POST pattern has been simplified:
- **Removed**: GET endpoints that only checked cache
- **Removed**: POST endpoints that returned 202 "queued" status
- **Simplified**: Single POST endpoint that always returns data

## Data Flow Diagrams

### 1. Synchronous Data Loading Flow
The following flowchart shows how POST requests handle data loading:

```mermaid
flowchart TD
    %% Frontend Request
    FRONTEND[Frontend POST Request] --> API[API Route Handler]
    
    %% Cache Check
    API --> CACHE{Cache Check}
    
    %% Cache Hit Path
    CACHE -->|Data Found| RETURN[Return Data 200]
    
    %% Cache Miss Path
    CACHE -->|Data Missing| QUEUE[Queue Background Job]
    QUEUE --> WAIT[Wait for Completion]
    WAIT --> PROCESS[Process Background Job]
    
    %% Background Processing
    PROCESS --> RATE_LIMIT{Rate Limited?}
    RATE_LIMIT -->|Yes| RETRY[Wait & Retry]
    RETRY --> PROCESS
    RATE_LIMIT -->|No| FETCH[Fetch from External API]
    FETCH --> STORE[Store in Cache]
    STORE --> RETURN
    
    %% Response
    RETURN --> FRONTEND_RESPONSE[Frontend Receives Data]
    
    %% Notes
    N1[POST always returns data]
    N2[No polling required]
    N3[Synchronous processing]
    
    API -.-> N1
    WAIT -.-> N2
    PROCESS -.-> N3
```

### 2. Team Import Flow
The following sequence diagram shows the team import process:

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API Route
    participant C as Cache
    participant Q as Queue
    participant D as Dotabuff API
    participant O as OpenDota API
    
    F->>A: POST /api/teams/{id}/matches
    Note over F,A: { leagueId: "1234", force: false }
    
    A->>C: Check cache for team data
    
    alt Data in cache
        C->>A: Return cached data
        A->>F: Return team name + match IDs immediately
    else Data not in cache
        A->>Q: Queue team import job
        Q->>D: Fetch team HTML from Dotabuff
        D->>Q: Return team HTML
        Q->>Q: Parse team name and match IDs
        Q->>C: Store team name and match IDs in cache
        
        Note over Q: Start background jobs before returning:
        Q->>Q: Queue match data fetching for each match ID
        Q->>O: Fetch match data (background)
        O->>Q: Return match data
        Q->>Q: Parse player IDs from match data
        Q->>Q: Queue player data fetching for each player ID
        Q->>O: Fetch player data (background)
        
        C->>A: Team data ready
        A->>F: Return team name + match IDs
    end
```

### 3. Force Refresh Flow
The following flowchart shows how force refresh works:

```mermaid
flowchart TD
    %% Force Refresh Request
    FRONTEND[Frontend POST with force=true] --> API[API Route Handler]
    
    %% Force Refresh Logic
    API --> FORCE{Force Refresh?}
    FORCE -->|Yes| INVALIDATE[Invalidate Cache]
    FORCE -->|No| CACHE{Cache Check}
    
    %% Cache Invalidation
    INVALIDATE --> QUEUE[Queue Background Job]
    QUEUE --> WAIT[Wait for Completion]
    WAIT --> PROCESS[Process Background Job]
    
    %% Normal Cache Check
    CACHE -->|Data Found| RETURN[Return Data 200]
    CACHE -->|Data Missing| QUEUE
    
    %% Background Processing
    PROCESS --> FETCH[Fetch Fresh Data]
    FETCH --> STORE[Store in Cache]
    STORE --> RETURN
    
    %% Response
    RETURN --> FRONTEND_RESPONSE[Frontend Receives Fresh Data]
    
    %% Notes
    N1[Force refresh bypasses cache]
    N2[Always fetches fresh data]
    N3[Updates cache with new data]
    
    INVALIDATE -.-> N1
    FETCH -.-> N2
    STORE -.-> N3
```

### 4. Error Handling Flow
The following flowchart shows error handling patterns:

```mermaid
flowchart TD
    %% Request Flow
    REQUEST[POST Request] --> API[API Route Handler]
    
    %% Validation
    API --> VALIDATE{Valid Request?}
    VALIDATE -->|No| ERROR_400[Return 400 Bad Request]
    
    %% Processing
    VALIDATE -->|Yes| PROCESS[Process Request]
    PROCESS --> SUCCESS{Success?}
    
    %% Success Path
    SUCCESS -->|Yes| RETURN_200[Return 200 with Data]
    
    %% Error Paths
    SUCCESS -->|No| ERROR_TYPE{Error Type?}
    ERROR_TYPE -->|Rate Limited| ERROR_429[Return 429 Rate Limited]
    ERROR_TYPE -->|External API Error| ERROR_502[Return 502 Bad Gateway]
    ERROR_TYPE -->|Internal Error| ERROR_500[Return 500 Internal Error]
    
    %% Response
    RETURN_200 --> FRONTEND[Frontend Success]
    ERROR_400 --> FRONTEND_ERROR[Frontend Error]
    ERROR_429 --> FRONTEND_ERROR
    ERROR_502 --> FRONTEND_ERROR
    ERROR_500 --> FRONTEND_ERROR
    
    %% Notes
    N1[No 404 responses - data is fetched if missing]
    N2[Clear error messages for debugging]
    N3[Graceful degradation on errors]
    
    VALIDATE -.-> N1
    ERROR_TYPE -.-> N2
    FRONTEND_ERROR -.-> N3
```

## System Architecture Diagrams

### Simplified API Orchestration Flow
The following diagram shows the simplified orchestration pattern used across all API endpoints:

```mermaid
flowchart TD
    %% API Layer
    POST([POST Request])
    
    %% Cache Check Layer
    POST --> CC{Check Cache}
    
    %% Cache Hit Path
    CC --> CACHED[Return Data 200]
    
    %% Cache Miss Path
    CC --> QUEUE[Queue Background Job]
    QUEUE --> WAIT[Wait for Completion]
    WAIT --> PROCESS[Process Background Job]
    
    %% Background Job System
    PROCESS --> BJ[Background Job Queue]
    BJ --> WJ[Worker Process]
    WJ --> DC{Data Source Decision}
    
    %% Mock vs Real Data Sources
    DC --> MOCK{Is Mock Enabled?}
    MOCK -- Yes --> MG[Mock Data Generator]
    MOCK -- No --> RE[Real API Endpoint]
    
    %% Data Flow
    MG --> MF[Generate Mock Data]
    RE --> RF[Fetch Real Data]
    MF --> CACHE[Write to Cache]
    RF --> CACHE
    
    %% Rate Limiting
    RF --> RL{Rate Limited?}
    RL -- Yes --> RETRY[Wait & Retry]
    RETRY --> RF
    RL -- No --> CACHE
    
    %% Response Flow
    CACHED --> RESP[API Response 200]
    CACHE --> RESP
    
    %% Notes
    N1[POST: Always returns data]
    N2[POST: Waits for background jobs to complete]
    N3[Rate limiting is instance-local]
    N4[Queue state is instance-local]
    N5[Synchronous data loading]
    
    POST -.-> N1
    WAIT -.-> N2
    RL -.-> N3
    BJ -.-> N4
    PROCESS -.-> N5
```

### Frontend Data Loading Pattern
The following diagram shows how the frontend handles data loading with the simplified synchronous approach:

```mermaid
flowchart TD
    %% Initial Page Load
    LOAD([Page Load])
    LOAD --> POST[POST Request]
    POST --> LOADING[Show Loading State]
    
    %% Backend Processing
    POST --> CACHE{Check Cache}
    CACHE --> CACHED[Return Data Immediately]
    CACHE --> QUEUE[Queue Background Job]
    QUEUE --> WAIT[Wait for Completion]
    WAIT --> PROCESS[Process Background Job]
    PROCESS --> COMPLETE[Data Ready]
    
    %% UI Updates
    CACHED --> UI1[Show Data Immediately]
    COMPLETE --> UI2[Show Data After Loading]
    
    %% Error Handling
    POST --> ERROR[Error State]
    ERROR --> UI3[Show Error Message]
    
    %% Examples
    TEAM_LOAD([Team Management Page])
    TEAM_LOAD --> TEAM_POST[POST api teams id matches]
    TEAM_POST --> TEAM_DATA[Show Team Data]
    
    MATCH_REQ([Match History Page])
    MATCH_REQ --> MATCH_POST[POST api matches id]
    MATCH_POST --> MATCH_DATA[Show Match Data]
    
    PLAYER_REQ([Player Stats Page])
    PLAYER_REQ --> PLAYER_POST[POST api players id data]
    PLAYER_POST --> PLAYER_DATA[Show Player Data]
    
    %% Notes
    N1[All endpoints use POST]
    N2[No polling required]
    N3[Synchronous data loading]
    N4[Simple error handling]
    
    POST -.-> N1
    LOADING -.-> N2
    WAIT -.-> N3
    ERROR -.-> N4
```

### Rate Limiting and Queue Management
The following diagram shows how rate limiting and queue management work in the serverless environment:

```mermaid
flowchart TD
    %% Request Flow
    REQ([API Request])
    REQ --> INSTANCE{Which Instance?}
    
    %% Instance A
    INSTANCE --> A[Instance A]
    A --> RL_A[Rate Limiter A]
    RL_A --> CHECK_A{Can Make Request?}
    
    %% Instance B
    INSTANCE --> B[Instance B]
    B --> RL_B[Rate Limiter B]
    RL_B --> CHECK_B{Can Make Request?}
    
    %% Rate Limit Checks
    CHECK_A --> ALLOW_A[Allow Request]
    CHECK_A --> BLOCK_A[Rate Limited]
    CHECK_B --> ALLOW_B[Allow Request]
    CHECK_B --> BLOCK_B[Rate Limited]
    
    %% Queue Management
    ALLOW_A --> Q_A[Queue A]
    ALLOW_B --> Q_B[Queue B]
    
    %% Background Processing
    Q_A --> PROC_A[Process A]
    Q_B --> PROC_B[Process B]
    
    %% External API
    PROC_A --> API[External API]
    PROC_B --> API
    
    %% Rate Limit Response
    API --> RATE_LIMIT[429 Rate Limited]
    RATE_LIMIT --> RETRY[Wait and Retry]
    RETRY --> API
    
    %% Success Path
    API --> SUCCESS[200 Success]
    SUCCESS --> CACHE[Update Cache]
    
    %% Notes
    N1[Rate limiters are instance-local]
    N2[Queues are instance-local]
    N3[No cross-instance coordination]
    N4[Higher rate limit usage]
    N5[Graceful 429 handling]
    
    RL_A -.-> N1
    Q_A -.-> N2
    INSTANCE -.-> N3
    API -.-> N4
    RATE_LIMIT -.-> N5
```

## Current Architecture Decisions

### Simplified GET/POST Pattern
All data endpoints follow a consistent pattern:

- **GET**: Check cache and return data if available, 404 if not found
- **POST**: Check cache and return ready status if available, or queue background job and return queued status

### Instance-Local Rate Limiting
Rate limiting is implemented per-instance using in-memory storage:

```typescript
// rate-limiter.ts
private requestCounts: Map<string, number[]> = new Map();
private lastRequestTimes: Map<string, number> = new Map();
private backoffTimes: Map<string, number> = new Map();
```

### Fire-and-Forget Background Jobs
Background jobs are queued and processed asynchronously:

1. **Route enqueues request** and returns immediately
2. **Queue processor handles** the actual API call
3. **Results are cached** for future requests
4. **No blocking** of the main request flow

### Serverless Environment Constraints
The application is deployed on Vercel's free tier, which means:
- Multiple serverless instances may handle requests simultaneously
- No shared memory between instances
- Limited external service dependencies

### Trade-offs Accepted
- **Higher rate limit usage** (multiple instances)
- **Potential duplicate processing** (mitigated by queue deduplication)
- **No cross-instance coordination** (each instance operates independently)
- **Imperfect rate limiting** (but functional for most use cases)

## Team Management Flow

### Hybrid Loading Pattern
The frontend uses a hybrid approach for data loading:

1. **Immediate responses** when data is cached
2. **Background loading** for heavy operations
3. **Suspense/lazy loading** for responsive UI
4. **Independent endpoints** for different data types

### Example Implementation
```typescript
// Team management page
const loadTeam = async () => {
  // Kick off team import (returns immediately if cached)
  const response = await fetch('/api/teams/123/matches', {
    method: 'POST',
    body: JSON.stringify({ leagueId: '456' })
  });
  
  if (response.status === 200) {
    const data = await response.json();
    setTeamData(data); // Team name, league name available immediately
  }
  
  // Match/player data loaded independently via other endpoints
};
```

## Graceful Rate Limit Handling

When external services return 429 (rate limited), the application:

1. **Uses retry headers** if provided by the service
2. **Waits default amount of time** (60 seconds) if no retry header
3. **Implements exponential backoff** for repeated failures
4. **Logs rate limit events** for monitoring

```typescript
async function fetchWithRetry(url: string, options: RequestInit) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) { // Rate limited
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        
        console.log(`Rate limited, waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempt++;
        continue;
      }
      
      return response;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      
      // Exponential backoff
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}
```

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

## Monitoring and Debugging

### Logging
All rate limiting and queue operations are logged:

```typescript
logWithTimestampToFile('log', `[RateLimiter] Rate limit check for ${service}: ${requests.length}/${config.maxRequests}`);
logWithTimestampToFile('log', `[RequestQueue] Enqueued request ${requestId} for ${service}`);
```

### Queue Stats
Queue statistics are available for monitoring:

```typescript
const stats = cacheService.getQueueStats();
const activeSignatures = cacheService.getActiveSignatures();
```

### Error Handling
- **Rate limit events** are logged and handled gracefully
- **Queue failures** are logged and retried
- **Cache misses** are logged for debugging 