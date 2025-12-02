interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

export class RateLimitService {
  private static readonly attempts = new Map<string, RateLimitEntry>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000;
  private static readonly BLOCK_DURATION_MS = 30 * 60 * 1000;

  static checkRateLimit(identifier: string): {
    allowed: boolean;
    remainingAttempts?: number;
    resetTime?: number;
  } {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      this.attempts.set(identifier, {
        attempts: 1,
        firstAttemptTime: now,
      });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    if (entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        resetTime: entry.blockedUntil,
      };
    }

    if (entry.blockedUntil && entry.blockedUntil <= now) {
      this.attempts.delete(identifier);
      this.attempts.set(identifier, {
        attempts: 1,
        firstAttemptTime: now,
      });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    if (now - entry.firstAttemptTime > this.WINDOW_MS) {
      this.attempts.set(identifier, {
        attempts: 1,
        firstAttemptTime: now,
      });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    if (entry.attempts >= this.MAX_ATTEMPTS) {
      entry.blockedUntil = now + this.BLOCK_DURATION_MS;
      this.attempts.set(identifier, entry);
      return {
        allowed: false,
        resetTime: entry.blockedUntil,
      };
    }

    entry.attempts += 1;
    this.attempts.set(identifier, entry);

    return {
      allowed: true,
      remainingAttempts: this.MAX_ATTEMPTS - entry.attempts,
    };
  }

  static recordFailedAttempt(identifier: string): void {
    this.checkRateLimit(identifier);
  }

  static clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (
        entry.blockedUntil &&
        entry.blockedUntil <= now &&
        now - entry.blockedUntil > this.WINDOW_MS
      ) {
        this.attempts.delete(key);
      } else if (
        !entry.blockedUntil &&
        now - entry.firstAttemptTime > this.WINDOW_MS * 2
      ) {
        this.attempts.delete(key);
      }
    }
  }

  static formatResetTime(resetTime: number): string {
    const minutes = Math.ceil((resetTime - Date.now()) / 60000);
    return minutes > 1 ? `${minutes} phút` : '1 phút';
  }
}

setInterval(() => RateLimitService.cleanup(), 60000);
