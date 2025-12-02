import { supabase } from '../config/supabase';
import { ValidationService } from '../utils/validation.utils';
import { RateLimitService } from '../utils/rateLimit.utils';
import { AUTH_ERROR_MESSAGES, AUTH_ERROR_PATTERNS } from '../config/auth.config';
import { RATE_LIMIT_MESSAGES } from '../config/rateLimit.config';
import { AuthErrorCode, type LoginCredentials, type AuthResult, type AuthError } from '../types/auth.types';
import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';

export class AuthService {
  private createErrorResult(message: string, code: AuthErrorCode | string): AuthResult {
    return {
      success: false,
      error: { message, code },
    };
  }

  private createSuccessResult<T>(data: T): AuthResult<T> {
    return {
      success: true,
      data,
    };
  }

  private mapSupabaseError(error: SupabaseAuthError): AuthError {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes(AUTH_ERROR_PATTERNS.INVALID_CREDENTIALS.toLowerCase())) {
      return {
        message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
        code: AuthErrorCode.INVALID_CREDENTIALS,
      };
    }

    if (errorMessage.includes(AUTH_ERROR_PATTERNS.EMAIL_NOT_CONFIRMED.toLowerCase())) {
      return {
        message: AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED,
        code: AuthErrorCode.EMAIL_NOT_CONFIRMED,
      };
    }

    if (errorMessage.includes(AUTH_ERROR_PATTERNS.USER_NOT_FOUND.toLowerCase())) {
      return {
        message: AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
        code: AuthErrorCode.USER_NOT_FOUND,
      };
    }

    return {
      message: AUTH_ERROR_MESSAGES.LOGIN_FAILED,
      code: error.status?.toString() || AuthErrorCode.UNEXPECTED_ERROR,
    };
  }

  private handleRateLimitCheck(sanitizedEmail: string): AuthResult | null {
    const rateLimit = RateLimitService.checkRateLimit(sanitizedEmail);

    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime
        ? RateLimitService.formatResetTime(rateLimit.resetTime)
        : RATE_LIMIT_MESSAGES.DEFAULT_RESET_TIME;

      return this.createErrorResult(
        RATE_LIMIT_MESSAGES.EXCEEDED(resetTime),
        AuthErrorCode.RATE_LIMIT_EXCEEDED
      );
    }

    return null;
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    const emailValidation = ValidationService.validateEmail(email);
    if (!emailValidation.isValid) {
      return this.createErrorResult(
        emailValidation.error || AUTH_ERROR_MESSAGES.LOGIN_FAILED,
        AuthErrorCode.VALIDATION_ERROR
      );
    }

    const sanitizedEmail = ValidationService.sanitizeEmail(email);

    const rateLimitResult = this.handleRateLimitCheck(sanitizedEmail);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        RateLimitService.recordFailedAttempt(sanitizedEmail);
        const mappedError = this.mapSupabaseError(error);
        return this.createErrorResult(mappedError.message, mappedError.code);
      }

      RateLimitService.clearAttempts(sanitizedEmail);
      return this.createSuccessResult(data);
    } catch (err: any) {
      RateLimitService.recordFailedAttempt(sanitizedEmail);
      return this.createErrorResult(
        AUTH_ERROR_MESSAGES.UNEXPECTED_ERROR,
        AuthErrorCode.UNEXPECTED_ERROR
      );
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return this.createErrorResult(
          AUTH_ERROR_MESSAGES.LOGOUT_FAILED,
          error.status?.toString() || AuthErrorCode.UNEXPECTED_ERROR
        );
      }

      return this.createSuccessResult(null);
    } catch (err: any) {
      return this.createErrorResult(
        AUTH_ERROR_MESSAGES.UNEXPECTED_ERROR,
        AuthErrorCode.UNEXPECTED_ERROR
      );
    }
  }

  async getCurrentSession(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return this.createErrorResult(
          AUTH_ERROR_MESSAGES.SESSION_FETCH_FAILED,
          error.status?.toString() || AuthErrorCode.UNEXPECTED_ERROR
        );
      }

      return this.createSuccessResult(data.session);
    } catch (err: any) {
      return this.createErrorResult(
        AUTH_ERROR_MESSAGES.UNEXPECTED_ERROR,
        AuthErrorCode.UNEXPECTED_ERROR
      );
    }
  }

  async refreshSession(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return this.createErrorResult(
          AUTH_ERROR_MESSAGES.SESSION_REFRESH_FAILED,
          error.status?.toString() || AuthErrorCode.UNEXPECTED_ERROR
        );
      }

      return this.createSuccessResult(data.session);
    } catch (err: any) {
      return this.createErrorResult(
        AUTH_ERROR_MESSAGES.UNEXPECTED_ERROR,
        AuthErrorCode.UNEXPECTED_ERROR
      );
    }
  }
}

export const authService = new AuthService();
