import type { AspectRatio, AspectRatioOption } from '../types/runway.types';

export const RUNWAY_CONFIG = {
  MODEL_VERSION: 'runway-gen-4',
  DEFAULT_ASPECT_RATIO: '16:9' as AspectRatio,
  API_TIMEOUT: 300000,
  POLL_INTERVAL_START: 1000,
  POLL_INTERVAL_MAX: 10000,
  POLL_INTERVAL_MULTIPLIER: 1.5,
  MAX_POLL_DURATION: 300000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
} as const;

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  {
    value: '16:9',
    label: 'Landscape (16:9)',
    width: 1920,
    height: 1080,
    cost: 1.0,
  },
  {
    value: '9:16',
    label: 'Portrait (9:16)',
    width: 1080,
    height: 1920,
    cost: 1.0,
  },
  {
    value: '1:1',
    label: 'Square (1:1)',
    width: 1080,
    height: 1080,
    cost: 0.8,
  },
  {
    value: '4:3',
    label: 'Classic (4:3)',
    width: 1440,
    height: 1080,
    cost: 0.9,
  },
  {
    value: '3:4',
    label: 'Portrait Classic (3:4)',
    width: 1080,
    height: 1440,
    cost: 0.9,
  },
  {
    value: '21:9',
    label: 'Ultrawide (21:9)',
    width: 2560,
    height: 1080,
    cost: 1.2,
  },
  {
    value: '9:21',
    label: 'Portrait Ultrawide (9:21)',
    width: 1080,
    height: 2520,
    cost: 1.2,
  },
];

export const PROMPT_VALIDATION = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 500,
  ALLOWED_CHARS: /^[a-zA-Z0-9\s.,!?'"()-]+$/,
} as const;

export const RATE_LIMITS = {
  GENERATIONS_PER_MINUTE: 5,
  CONCURRENT_GENERATIONS: 2,
  DAILY_LIMIT_FREE: 50,
  DAILY_LIMIT_ADMIN: -1,
} as const;

export const CREDITS = {
  DEFAULT_NEW_USER: 10,
  ADMIN_UNLIMITED: -1,
  MIN_BALANCE_WARNING: 5,
} as const;

export const STORAGE_CONFIG = {
  BUCKET_NAME: import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'ai-generated-images',
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_FILE_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  FOLDER_PREFIX: 'generations',
} as const;

export const ERROR_MESSAGES = {
  INSUFFICIENT_CREDITS: 'Không đủ credits để tạo ảnh',
  RATE_LIMIT_EXCEEDED: 'Bạn đã vượt quá giới hạn tạo ảnh. Vui lòng thử lại sau',
  INVALID_PROMPT: 'Prompt không hợp lệ',
  GENERATION_FAILED: 'Không thể tạo ảnh. Vui lòng thử lại',
  API_TIMEOUT: 'Quá thời gian chờ. Vui lòng thử lại',
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra internet',
  INVALID_API_TOKEN: 'Token API không hợp lệ',
  CONCURRENT_LIMIT: 'Bạn đang có quá nhiều generation đang chạy',
} as const;

export function getAspectRatioOption(aspectRatio: AspectRatio): AspectRatioOption | undefined {
  return ASPECT_RATIO_OPTIONS.find(option => option.value === aspectRatio);
}

export function calculateCost(aspectRatio: AspectRatio): number {
  const option = getAspectRatioOption(aspectRatio);
  return option?.cost || 1.0;
}

export function getReplicateAPIToken(): string {
  const token = import.meta.env.VITE_REPLICATE_API_TOKEN;
  if (!token || token === 'your_replicate_api_token_here') {
    throw new Error('VITE_REPLICATE_API_TOKEN is not configured');
  }
  return token;
}
