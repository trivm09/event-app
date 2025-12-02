export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationService {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly MIN_PASSWORD_LENGTH = 8;
  private static readonly MAX_PASSWORD_LENGTH = 128;
  private static readonly MAX_EMAIL_LENGTH = 254;
  private static readonly MAX_NAME_LENGTH = 100;

  static validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email là bắt buộc' };
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0) {
      return { isValid: false, error: 'Email không được để trống' };
    }

    if (trimmedEmail.length > this.MAX_EMAIL_LENGTH) {
      return { isValid: false, error: 'Email quá dài' };
    }

    if (!this.EMAIL_REGEX.test(trimmedEmail)) {
      return { isValid: false, error: 'Định dạng email không hợp lệ' };
    }

    if (/<script|javascript:|on\w+=/i.test(trimmedEmail)) {
      return { isValid: false, error: 'Email chứa ký tự không hợp lệ' };
    }

    return { isValid: true };
  }

  static validatePassword(password: string): ValidationResult {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Mật khẩu là bắt buộc' };
    }

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      return {
        isValid: false,
        error: `Mật khẩu phải có ít nhất ${this.MIN_PASSWORD_LENGTH} ký tự`,
      };
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      return { isValid: false, error: 'Mật khẩu quá dài' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return {
        isValid: false,
        error: 'Mật khẩu phải chứa chữ hoa, chữ thường và số',
      };
    }

    return { isValid: true };
  }

  static validateFullName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Tên là bắt buộc' };
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return { isValid: false, error: 'Tên không được để trống' };
    }

    if (trimmedName.length > this.MAX_NAME_LENGTH) {
      return { isValid: false, error: 'Tên quá dài' };
    }

    if (/<script|javascript:|on\w+=/i.test(trimmedName)) {
      return { isValid: false, error: 'Tên chứa ký tự không hợp lệ' };
    }

    return { isValid: true };
  }

  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/<[^>]*>/g, '');
  }
}
