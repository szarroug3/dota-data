# Queueing Layer Architecture

## Overview
The queueing layer buffers and processes requests at a controlled rate, ensuring that rate limits and backend capacity are respected. It is essential for handling bursty traffic, slow/external APIs, and for providing a smooth user experience in modern serverless environments.

## Modern Architecture: QStash-Based Queueing

### Why QStash?
The backend uses **QStash** (managed HTTP queueing) for all background jobs to ensure reliability and statelessness in serverless environments like Vercel:

- **Stateless and Reliable:** QStash persists jobs and delivers them to API endpoints, regardless of serverless instance count
- **Automatic Retries:** Failed jobs are retried automatically, improving reliability
- **No In-Memory State:** All job state is managed externally, compatible with Vercel's statelessness
- **Simple Integration:** Send jobs to QStash via HTTP; QStash POSTs to your endpoints when ready
- **Scalable:** Handles bursty traffic and scales with your app
- **Monitoring:** Usage and delivery stats available in QStash dashboard

### Problems with Legacy Approaches
- **In-memory queues** are lost on process restart and don't work across multiple serverless instances
- **Redis-backed queues** solve distribution but require manual management, monitoring, and can be complex to scale
- **Manual rate limiting** is error-prone and hard to coordinate across distributed processes

## Key Features
- **QStash HTTP queue** for all background jobs (team, player, match processing, etc.)
- **Redis for caching and rate limiting** (unchanged from existing architecture)
- **Job state tracking** in database or cache for user-facing progress
- **Automatic retries** and error handling
- **Fallback mechanism** to legacy queueing if QStash limits are exceeded

## Module Structure
- `src/lib/request-queue.ts` — Main queueing service (QStash integration)
- `src/lib/queue-backends/qstash.ts` — QStash backend implementation
- `src/lib/queue-backends/memory.ts` — Memory fallback implementation
- `src/lib/types/queue.ts` — Shared types/interfaces

## Usage Example
```ts
import { RequestQueue } from '@/lib/request-queue';

const queue = new RequestQueue({ 
  useQStash: true,
  qstashToken: process.env.QSTASH_TOKEN 
});

// Enqueue a background job
const result = await queue.enqueue('parse:match:123', {
  endpoint: '/api/process-match',
  payload: { matchId: '123' }
});

// Check job status
const status = await queue.getJobStatus(result.jobId);
```

## Integration with Existing Layers

- **[Caching Layer](./caching-layer.md):** Remains unchanged. Continue to use Redis for distributed caching
- **[Rate Limiting Layer](./rate-limiting-layer.md):** Continue to use Redis for distributed rate limiting. QStash helps smooth bursts, but per-user/IP limits should still be enforced in your backend
- **[Backend Data Flow](./backend-data-flow.md):** QStash for all background jobs (team, player, match processing, etc.)
- **Job State Tracking:** Store job status in database or cache if you need to show progress to users

## Recommended Usage Pattern

1. **Enqueue Job:** When a background task is needed (e.g., parse match, fetch team), send a job to QStash with the relevant payload and endpoint
2. **Job Delivery:** QStash delivers the job to your API endpoint (e.g., `/api/process-job`). Any Vercel instance can process it
3. **Processing:** Your endpoint processes the job, updates job status in your DB/cache if needed, and returns a response
4. **Retries:** If the endpoint fails, QStash retries delivery up to the configured limit

## Fallback Strategy

While QStash provides reliable managed queueing, it enforces daily and monthly request limits. If your application exceeds these limits, implement a fallback mechanism:

### Fallback Implementation
```ts
try {
  await enqueueWithQStash(job);
} catch (err) {
  if (isQStashQuotaError(err)) {
    log('QStash limit hit, falling back to memory queue');
    await enqueueWithMemoryQueue(job);
  } else {
    throw err;
  }
}
```

### Best Practices
- Keep both QStash and memory queueing implementations up to date and tested
- Ensure all background jobs are idempotent and can be retried safely
- Monitor QStash and Redis usage to stay within free tier limits
- Log all fallback events and set up alerts for when fallback is triggered

## Best Practices
- Use QStash for all background jobs to ensure reliability and statelessness
- Keep using Redis for caching and distributed rate limiting
- Track job status in your DB/cache if you need to show progress to users
- Monitor QStash and Redis usage to stay within free tier limits
- Implement fallback to memory queueing for emergency situations

---

## Related Documentation

- **[Backend Data Flow](./backend-data-flow.md):** Complete backend data flow including queueing integration
- **[Caching Layer](./caching-layer.md):** Redis-first caching for job status tracking
- **[Rate Limiting Layer](./rate-limiting-layer.md):** Distributed rate limiting for API protection
- **[Project Structure](./project-structure.md):** Recommended folder structure for queueing implementation
- **[Type Organization](./type-organization.md):** TypeScript type organization for queue-related types 