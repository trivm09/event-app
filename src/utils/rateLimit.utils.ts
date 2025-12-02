import { RATE_LIMIT_CONFIG, TIME_UNITS } from '../config/rateLimit.config';
import type { RateLimitEntry, RateLimitCheckResult } from '../types/rateLimit.types';

export class RateLimitService {
  private static readonly attempts = new Map<string, RateLimitEntry>();

  private static isCurrentlyBlocked(entry: RateLimitEntry, now: number): boolean {
    return !!entry.blockedUntil && entry.blockedUntil > now;
  }

  private static hasBlockExpired(entry: RateLimitEntry, now: number): boolean {
    return !!entry.blockedUntil && entry.blockedUntil <= now;
  }

  private static isWindowExpired(entry: RateLimitEntry, now: number): boolean {
    return now - entry.firstAttemptTime > RATE_LIMIT_CONFIG.WINDOW_DURATION_MS;
  }

  private static createNewEntry(now: number): RateLimitEntry {
    return {
      attempts: 1,
      firstAttemptTime: now,
    };
  }

  private static createAllowedResult(remainingAttempts: number): RateLimitCheckResult {
    return {
      allowed: true,
      remainingAttempts,
    };
  }

  private static createBlockedResult(resetTime: number): RateLimitCheckResult {
    return {
      allowed: false,
      resetTime,
    };
  }

  private static resetEntry(identifier: string, now: number): void {
    this.attempts.set(identifier, this.createNewEntry(now));
  }

  private static incrementAttempts(identifier: string, entry: RateLimitEntry): void {
    entry.attempts += 1;
    this.attempts.set(identifier, entry);
  }

  private static blockIdentifier(identifier: string, entry: RateLimitEntry, now: number): void {
    entry.blockedUntil = now + RATE_LIMIT_CONFIG.BLOCK_DURATION_MS;
    this.attempts.set(identifier, entry);
  }

  static checkRateLimit(identifier: string): RateLimitCheckResult {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      this.resetEntry(identifier, now);
      return this.createAllowedResult(RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1);
    }

    if (this.isCurrentlyBlocked(entry, now)) {
      return this.createBlockedResult(entry.blockedUntil!);
    }

    if (this.hasBlockExpired(entry, now)) {
      this.resetEntry(identifier, now);
      return this.createAllowedResult(RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1);
    }

    if (this.isWindowExpired(entry, now)) {
      this.resetEntry(identifier, now);
      return this.createAllowedResult(RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1);
    }

    if (entry.attempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
      this.blockIdentifier(identifier, entry, now);
      return this.createBlockedResult(entry.blockedUntil!);
    }

    this.incrementAttempts(identifier, entry);
    return this.createAllowedResult(RATE_LIMIT_CONFIG.MAX_ATTEMPTS - entry.attempts);
  }

  static recordFailedAttempt(identifier: string): void {
    this.checkRateLimit(identifier);
  }

  static clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  static cleanup(): void {
    const now = Date.now();
    const extendedWindow = RATE_LIMIT_CONFIG.WINDOW_DURATION_MS * RATE_LIMIT_CONFIG.EXTENDED_WINDOW_MULTIPLIER;

    for (const [key, entry] of this.attempts.entries()) {
      const shouldRemoveBlockedEntry =
        entry.blockedUntil &&
        entry.blockedUntil <= now &&
        now - entry.blockedUntil > RATE_LIMIT_CONFIG.WINDOW_DURATION_MS;

      const shouldRemoveExpiredEntry =
        !entry.blockedUntil &&
        now - entry.firstAttemptTime > extendedWindow;

      if (shouldRemoveBlockedEntry || shouldRemoveExpiredEntry) {
        this.attempts.delete(key);
      }
    }
  }

  static formatResetTime(resetTime: number): string {
    const millisUntilReset = resetTime - Date.now();
    const minutes = Math.ceil(millisUntilReset / TIME_UNITS.MILLISECONDS_PER_MINUTE);

    if (minutes <= 1) {
      return TIME_UNITS.SINGLE_MINUTE;
    }

    return `${minutes} ${TIME_UNITS.MINUTES_SUFFIX}`;
  }

  static getAttemptCount(identifier: string): number {
    return this.attempts.get(identifier)?.attempts ?? 0;
  }

  static isBlocked(identifier: string): boolean {
    const entry = this.attempts.get(identifier);
    if (!entry) return false;
    return this.isCurrentlyBlocked(entry, Date.now());
  }
}

if (typeof window !== 'undefined') {
  setInterval(() => RateLimitService.cleanup(), RATE_LIMIT_CONFIG.CLEANUP_INTERVAL_MS);
}
