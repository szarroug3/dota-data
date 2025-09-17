export type ExternalApiErrorType =
  | 'rate_limited'
  | 'not_found'
  | 'timeout'
  | 'connection_failed'
  | 'invalid_response'
  | 'service_unavailable'
  | 'network_error';

export type ExternalApiService = 'opendota' | 'steam';

export interface ExternalApiError extends Error {
  type: ExternalApiErrorType;
  service: ExternalApiService;
  statusCode?: number;
  retryAfter?: number;
  retryable: boolean;
}
