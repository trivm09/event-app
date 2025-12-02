export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  WINDOW_DURATION_MS: 15 * 60 * 1000,
  BLOCK_DURATION_MS: 30 * 60 * 1000,
  CLEANUP_INTERVAL_MS: 60 * 1000,
  EXTENDED_WINDOW_MULTIPLIER: 2,
} as const;

export const RATE_LIMIT_MESSAGES = {
  EXCEEDED: (resetTime: string) =>
    `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ${resetTime}`,
  DEFAULT_RESET_TIME: '30 phút',
} as const;

export const TIME_UNITS = {
  MILLISECONDS_PER_MINUTE: 60000,
  SINGLE_MINUTE: '1 phút',
  MINUTES_SUFFIX: 'phút',
} as const;
