export interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingAttempts?: number;
  resetTime?: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowDurationMs: number;
  blockDurationMs: number;
  cleanupIntervalMs: number;
}
