// Component form đăng nhập
import { useState, FormEvent } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InputField } from './InputField';
import { ErrorAlert } from './ui/ErrorAlert';
import { useAuthContext } from '../contexts/AuthContext';
import { STYLES, MESSAGES, ROUTES } from '../constants';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await login({ email, password });

    if (result.success) {
      navigate(ROUTES.admin);
    } else {
      setError(result.error?.message || MESSAGES.errors.loginFailed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <InputField
        id="email"
        type="email"
        label="Địa chỉ Email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        icon={Mail}
        required
      />

      <InputField
        id="password"
        type="password"
        label="Mật khẩu"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        icon={Lock}
        required
      />

      <button
        type="submit"
        disabled={isLoading}
        className={STYLES.button.primary}
      >
        {isLoading ? MESSAGES.loading.loggingIn : 'Đăng nhập'}
      </button>
    </form>
  );
};
