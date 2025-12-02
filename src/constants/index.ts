// Tập hợp tất cả constants vào một file central
export const STYLES = {
  input: {
    base: 'block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 outline-none',
    error: 'border-red-500 focus:ring-red-600',
  },
  label: 'block text-xs sm:text-sm font-medium text-slate-700 mb-2',
  button: {
    primary: 'w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed',
  },
  icon: {
    input: 'h-4 w-4 sm:h-5 sm:w-5 text-slate-400',
  },
  container: {
    page: 'min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8',
    card: 'w-full max-w-md',
    cardInner: 'bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10',
  },
} as const;

export const MESSAGES = {
  errors: {
    loginFailed: 'Đăng nhập thất bại',
    sessionInitFailed: 'Không thể khởi tạo phiên đăng nhập',
    logoutFailed: 'Đăng xuất thất bại',
    profileFetchFailed: 'Không thể tải thông tin người dùng',
    unauthorized: 'Bạn không có quyền truy cập',
  },
  success: {
    loginSuccess: 'Đăng nhập thành công',
    logoutSuccess: 'Đăng xuất thành công',
  },
  loading: {
    checkingAuth: 'Đang kiểm tra quyền truy cập...',
    loggingIn: 'Đang đăng nhập...',
    loggingOut: 'Đang đăng xuất...',
  },
} as const;

export const ROUTES = {
  login: '/',
  admin: '/admin',
} as const;
