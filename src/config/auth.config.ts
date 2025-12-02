export const AUTH_ERROR_MESSAGES = {
  LOGIN_FAILED: 'Đăng nhập thất bại',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  EMAIL_NOT_CONFIRMED: 'Email chưa được xác nhận',
  USER_NOT_FOUND: 'Tài khoản không tồn tại',
  LOGOUT_FAILED: 'Đăng xuất thất bại',
  SESSION_FETCH_FAILED: 'Không thể lấy thông tin phiên đăng nhập',
  SESSION_REFRESH_FAILED: 'Không thể làm mới phiên đăng nhập',
  UNEXPECTED_ERROR: 'Đã xảy ra lỗi không mong muốn',
} as const;

export const AUTH_ERROR_PATTERNS = {
  INVALID_CREDENTIALS: 'Invalid login credentials',
  EMAIL_NOT_CONFIRMED: 'Email not confirmed',
  USER_NOT_FOUND: 'User not found',
} as const;
