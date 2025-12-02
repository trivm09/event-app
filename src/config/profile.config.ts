export const PROFILE_ERROR_MESSAGES = {
  FETCH_FAILED: 'Không thể tải thông tin người dùng',
  UPDATE_FAILED: 'Không thể cập nhật thông tin người dùng',
  UNEXPECTED_ERROR: 'Đã xảy ra lỗi không mong muốn',
} as const;

export const PROFILE_LOG_MESSAGES = {
  FETCH_ERROR: '[ProfileService] Error fetching profile:',
  UPDATE_ERROR: '[ProfileService] Error updating profile:',
  UNEXPECTED_ERROR: '[ProfileService] Unexpected error:',
} as const;
