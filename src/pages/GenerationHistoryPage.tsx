import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Search } from 'lucide-react';
import { useRunwayContext } from '../contexts/RunwayContext';
import { GenerationCard } from '../components/GenerationCard';
import type { GenerationStatus } from '../types/runway.types';

export function GenerationHistoryPage() {
  const navigate = useNavigate();
  const { generations, deleteGeneration, refreshGenerations } = useRunwayContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<GenerationStatus | 'all'>('all');

  useEffect(() => {
    refreshGenerations();
  }, [refreshGenerations]);

  const filteredGenerations = generations.filter((gen) => {
    const matchesSearch = gen.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gen.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: generations.length,
    succeeded: generations.filter((g) => g.status === 'succeeded').length,
    failed: generations.filter((g) => g.status === 'failed').length,
    processing: generations.filter((g) => g.status === 'processing' || g.status === 'starting').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Lịch sử tạo ảnh</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-500">Tổng số</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-500">Thành công</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{stats.succeeded}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-500">Đang xử lý</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{stats.processing}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-500">Thất bại</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo prompt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as GenerationStatus | 'all')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="succeeded">Thành công</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="starting">Đang khởi động</option>
                  <option value="failed">Thất bại</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          {filteredGenerations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500">Không tìm thấy ảnh nào</p>
              {searchTerm || statusFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Xóa bộ lọc
                </button>
              ) : (
                <button
                  onClick={() => navigate('/generate')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tạo ảnh đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGenerations.map((generation) => (
                <GenerationCard
                  key={generation.id}
                  generation={generation}
                  onDelete={deleteGeneration}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
