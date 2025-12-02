// Reusable error alert component
interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export const ErrorAlert = ({ message, onClose }: ErrorAlertProps) => {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-red-800">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-red-600 hover:text-red-800 transition"
            aria-label="Đóng"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
