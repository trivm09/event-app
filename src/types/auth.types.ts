export interface LoginCredentials {
  email: string;
  password: string;
}

export enum AuthErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface AuthError {
  message: string;
  code: AuthErrorCode | string;
}

export interface AuthResult<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface AuthState {
  isLoading: boolean;
  error: AuthError | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAdminStatus: () => boolean;
}
