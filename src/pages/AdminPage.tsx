// Trang Admin - chỉ admin mới truy cập được
import { useAuthContext } from '../contexts/AuthContext';
import { Shield, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InfoCard } from '../components/ui/InfoCard';

export const AdminPage = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.full_name || user?.email || 'Admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-600">Quản trị hệ thống</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Chào mừng, {displayName}!
              </h2>
              <p className="text-slate-600 mt-1">
                Bạn đã đăng nhập với quyền <span className="font-semibold text-blue-600">Administrator</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard
            label="Email"
            value={user?.email || ''}
            icon={Shield}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />

          <InfoCard
            label="Quyền truy cập"
            value="Admin"
            icon={Users}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            valueColor="text-green-600"
          />

          <InfoCard
            label="Trạng thái"
            value="Đang hoạt động"
            icon={() => <div className="h-6 w-6 bg-green-500 rounded-full animate-pulse" />}
            iconBgColor="bg-purple-100"
            iconColor=""
            valueColor="text-blue-600"
          />
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Nội dung được bảo vệ</h3>
          <div className="space-y-4">
            <p className="text-slate-700 leading-relaxed">
              Đây là trang admin được bảo vệ. Chỉ những người dùng có quyền admin mới có thể truy cập vào đây.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Thông tin bảo mật:</strong> Trang này được bảo vệ bởi Supabase Authentication và Row Level Security (RLS).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
