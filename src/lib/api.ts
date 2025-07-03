// This is a meta-instruction for the assistant to perform the split and move operations as described above. No code to edit here, but the assistant will create new files and update imports accordingly.

// Hybrid API index: re-export all service/resource API modules here
// Example:
// export * from './opendota/players';
// export * from './dotabuff/teams';

export * from './api/dotabuff/leagues';
export * from './api/dotabuff/teams';
export * from './api/opendota/heroes';
export * from './api/opendota/matches';
export * from './api/opendota/players';

export { fetchAPI, fetchPage } from './api/shared';
export { shouldMockService, shouldWriteMockData, tryMock, writeMockData } from './mock-data-writer';

