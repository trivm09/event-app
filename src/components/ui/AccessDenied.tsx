// Access denied message component
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Truy cập bị từ chối</h2>
        <p className="text-slate-600 mb-6">
          Bạn không có quyền truy cập vào trang này. Chỉ admin mới có thể truy cập.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
};
