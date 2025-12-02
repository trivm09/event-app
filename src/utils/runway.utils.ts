import { PROMPT_VALIDATION } from '../config/runway.config';
import type { AspectRatio } from '../types/runway.types';

export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return {
      valid: false,
      error: 'Prompt không được để trống',
    };
  }

  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length < PROMPT_VALIDATION.MIN_LENGTH) {
    return {
      valid: false,
      error: `Prompt phải có ít nhất ${PROMPT_VALIDATION.MIN_LENGTH} ký tự`,
    };
  }

  if (trimmedPrompt.length > PROMPT_VALIDATION.MAX_LENGTH) {
    return {
      valid: false,
      error: `Prompt không được vượt quá ${PROMPT_VALIDATION.MAX_LENGTH} ký tự`,
    };
  }

  return { valid: true };
}

export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '');
}

export function formatAspectRatio(aspectRatio: AspectRatio): string {
  const ratios: Record<AspectRatio, string> = {
    '16:9': 'Landscape (16:9)',
    '9:16': 'Portrait (9:16)',
    '1:1': 'Square (1:1)',
    '4:3': 'Classic (4:3)',
    '3:4': 'Portrait Classic (3:4)',
    '21:9': 'Ultrawide (21:9)',
    '9:21': 'Portrait Ultrawide (9:21)',
  };

  return ratios[aspectRatio] || aspectRatio;
}

export function formatGenerationTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} giây`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} phút`;
  }

  return `${minutes} phút ${remainingSeconds} giây`;
}

export function calculateEstimatedTime(): number {
  return 30;
}

export async function downloadImage(imageUrl: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Không thể tải xuống ảnh');
  }
}

export function formatCredits(credits: number): string {
  if (credits === -1) {
    return 'Không giới hạn';
  }

  return credits.toFixed(1);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Vừa xong';
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'text-green-600';
    case 'failed':
      return 'text-red-600';
    case 'cancelled':
      return 'text-gray-600';
    case 'processing':
      return 'text-blue-600';
    case 'starting':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'starting':
      return 'Đang khởi động';
    case 'processing':
      return 'Đang xử lý';
    case 'succeeded':
      return 'Hoàn thành';
    case 'failed':
      return 'Thất bại';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
