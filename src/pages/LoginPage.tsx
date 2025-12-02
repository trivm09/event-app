// Trang đăng nhập
import { LoginForm } from '../components/LoginForm';
import { STYLES } from '../constants';

export const LoginPage = () => {
  return (
    <div className={STYLES.container.page}>
      <div className={STYLES.container.card}>
        <div className={STYLES.container.cardInner}>
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Đăng nhập
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Vui lòng đăng nhập để tiếp tục
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
