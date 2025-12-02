// Reusable loading spinner component
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export const LoadingSpinner = ({ message, size = 'md' }: LoadingSpinnerProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full border-b-2 border-blue-600 mb-4 ${sizeClasses[size]}`}
        />
        {message && <p className="text-slate-600">{message}</p>}
      </div>
    </div>
  );
};
