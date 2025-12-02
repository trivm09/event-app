import { VALIDATION_RULES, VALIDATION_MESSAGES } from '../config/validation.config';
import type { ValidationResult } from '../types/validation.types';

export class ValidationService {
  private static isNullOrEmpty(value: unknown): boolean {
    return !value || typeof value !== 'string' || value.trim().length === 0;
  }

  private static containsMaliciousCode(value: string): boolean {
    return VALIDATION_RULES.SECURITY.XSS_PATTERN.test(value);
  }

  private static createErrorResult(message: string): ValidationResult {
    return { isValid: false, error: message };
  }

  private static createSuccessResult<T>(data?: T): ValidationResult<T> {
    return { isValid: true, data };
  }

  static validateEmail(email: string): ValidationResult<string> {
    if (this.isNullOrEmpty(email)) {
      return this.createErrorResult(VALIDATION_MESSAGES.EMAIL.REQUIRED);
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
      return this.createErrorResult(VALIDATION_MESSAGES.EMAIL.TOO_LONG);
    }

    if (!VALIDATION_RULES.EMAIL.REGEX.test(trimmedEmail)) {
      return this.createErrorResult(VALIDATION_MESSAGES.EMAIL.INVALID_FORMAT);
    }

    if (this.containsMaliciousCode(trimmedEmail)) {
      return this.createErrorResult(VALIDATION_MESSAGES.EMAIL.MALICIOUS);
    }

    return this.createSuccessResult(trimmedEmail);
  }

  static validatePassword(password: string): ValidationResult {
    if (this.isNullOrEmpty(password)) {
      return this.createErrorResult(VALIDATION_MESSAGES.PASSWORD.REQUIRED);
    }

    const { MIN_LENGTH, MAX_LENGTH, UPPERCASE_REGEX, LOWERCASE_REGEX, NUMBER_REGEX } = VALIDATION_RULES.PASSWORD;

    if (password.length < MIN_LENGTH) {
      return this.createErrorResult(VALIDATION_MESSAGES.PASSWORD.TOO_SHORT(MIN_LENGTH));
    }

    if (password.length > MAX_LENGTH) {
      return this.createErrorResult(VALIDATION_MESSAGES.PASSWORD.TOO_LONG);
    }

    const hasRequiredChars =
      UPPERCASE_REGEX.test(password) &&
      LOWERCASE_REGEX.test(password) &&
      NUMBER_REGEX.test(password);

    if (!hasRequiredChars) {
      return this.createErrorResult(VALIDATION_MESSAGES.PASSWORD.WEAK);
    }

    return this.createSuccessResult();
  }

  static validateFullName(name: string): ValidationResult<string> {
    if (this.isNullOrEmpty(name)) {
      return this.createErrorResult(VALIDATION_MESSAGES.NAME.REQUIRED);
    }

    const trimmedName = name.trim();

    if (trimmedName.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
      return this.createErrorResult(VALIDATION_MESSAGES.NAME.TOO_LONG);
    }

    if (this.containsMaliciousCode(trimmedName)) {
      return this.createErrorResult(VALIDATION_MESSAGES.NAME.MALICIOUS);
    }

    return this.createSuccessResult(trimmedName);
  }

  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(VALIDATION_RULES.SECURITY.HTML_TAG_PATTERN, '');
  }

  static validateBatch(validations: Array<() => ValidationResult>): ValidationResult {
    for (const validation of validations) {
      const result = validation();
      if (!result.isValid) {
        return result;
      }
    }
    return this.createSuccessResult();
  }
}
