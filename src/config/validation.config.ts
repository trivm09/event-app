export const VALIDATION_RULES = {
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254,
    MIN_LENGTH: 3,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    UPPERCASE_REGEX: /[A-Z]/,
    LOWERCASE_REGEX: /[a-z]/,
    NUMBER_REGEX: /[0-9]/,
    SPECIAL_CHAR_REGEX: /[!@#$%^&*(),.?":{}|<>]/,
  },
  NAME: {
    MAX_LENGTH: 100,
    MIN_LENGTH: 1,
  },
  SECURITY: {
    XSS_PATTERN: /<script|javascript:|on\w+=/i,
    HTML_TAG_PATTERN: /<[^>]*>/g,
  },
} as const;

export const VALIDATION_MESSAGES = {
  EMAIL: {
    REQUIRED: 'Email là bắt buộc',
    EMPTY: 'Email không được để trống',
    TOO_LONG: 'Email quá dài',
    INVALID_FORMAT: 'Định dạng email không hợp lệ',
    MALICIOUS: 'Email chứa ký tự không hợp lệ',
  },
  PASSWORD: {
    REQUIRED: 'Mật khẩu là bắt buộc',
    TOO_SHORT: (min: number) => `Mật khẩu phải có ít nhất ${min} ký tự`,
    TOO_LONG: 'Mật khẩu quá dài',
    WEAK: 'Mật khẩu phải chứa chữ hoa, chữ thường và số',
  },
  NAME: {
    REQUIRED: 'Tên là bắt buộc',
    EMPTY: 'Tên không được để trống',
    TOO_LONG: 'Tên quá dài',
    MALICIOUS: 'Tên chứa ký tự không hợp lệ',
  },
} as const;
