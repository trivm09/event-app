import { supabase } from '../config/supabase';
import { ValidationService } from '../utils/validation.utils';
import { RateLimitService } from '../utils/rateLimit.utils';
import type { LoginCredentials } from '../types/auth.types';

interface AuthResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    const emailValidation = ValidationService.validateEmail(email);
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: {
          message: emailValidation.error || 'Email không hợp lệ',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    const sanitizedEmail = ValidationService.sanitizeEmail(email);

    const rateLimit = RateLimitService.checkRateLimit(sanitizedEmail);
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime
        ? RateLimitService.formatResetTime(rateLimit.resetTime)
        : '30 phút';
      return {
        success: false,
        error: {
          message: `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ${resetTime}`,
          code: 'RATE_LIMIT_EXCEEDED',
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        RateLimitService.recordFailedAttempt(sanitizedEmail);

        let errorMessage = 'Đăng nhập thất bại';

        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email hoặc mật khẩu không đúng';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email chưa được xác nhận';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Tài khoản không tồn tại';
        }

        return {
          success: false,
          error: {
            message: errorMessage,
            code: error.status?.toString(),
          },
        };
      }

      RateLimitService.clearAttempts(sanitizedEmail);

      return {
        success: true,
        data,
      };
    } catch (err: any) {
      RateLimitService.recordFailedAttempt(sanitizedEmail);

      return {
        success: false,
        error: {
          message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại',
          code: 'UNEXPECTED_ERROR',
        },
      };
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: {
            message: 'Đăng xuất thất bại',
            code: error.status?.toString(),
          },
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: {
          message: 'Đã xảy ra lỗi khi đăng xuất',
          code: 'UNEXPECTED_ERROR',
        },
      };
    }
  }

  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          success: false,
          error: {
            message: 'Không thể lấy thông tin phiên đăng nhập',
            code: error.status?.toString(),
          },
        };
      }

      return {
        success: true,
        data: data.session,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          message: 'Đã xảy ra lỗi khi lấy thông tin phiên đăng nhập',
          code: 'UNEXPECTED_ERROR',
        },
      };
    }
  }

  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return {
          success: false,
          error: {
            message: 'Không thể làm mới phiên đăng nhập',
            code: error.status?.toString(),
          },
        };
      }

      return {
        success: true,
        data: data.session,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          message: 'Đã xảy ra lỗi khi làm mới phiên đăng nhập',
          code: 'UNEXPECTED_ERROR',
        },
      };
    }
  }
}

export const authService = new AuthService();
