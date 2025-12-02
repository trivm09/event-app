export interface ValidationResult<T = void> {
  isValid: boolean;
  error?: string;
  data?: T;
}

export enum ValidationErrorCode {
  REQUIRED = 'REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  TOO_SHORT = 'TOO_SHORT',
  TOO_LONG = 'TOO_LONG',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  CONTAINS_MALICIOUS_CODE = 'CONTAINS_MALICIOUS_CODE',
}

export interface ValidationRule<T = string> {
  validate: (value: T) => ValidationResult;
  errorMessage: string;
}
