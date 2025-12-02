// Component tái sử dụng cho input field với icon
import { LucideIcon } from 'lucide-react';
import { STYLES } from '../constants';

interface InputFieldProps {
  id: string;
  type: 'email' | 'password' | 'text';
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
  required?: boolean;
  error?: string;
}

export const InputField = ({
  id,
  type,
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  error,
}: InputFieldProps) => {
  return (
    <div>
      <label htmlFor={id} className={STYLES.label}>
        {label}
      </label>
      <div className="relative">
        {/* Icon bên trái input */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={STYLES.icon.input} />
        </div>

        {/* Input field */}
        <input
          type={type}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${STYLES.input.base} ${error ? STYLES.input.error : ''}`}
          placeholder={placeholder}
          required={required}
        />
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};
