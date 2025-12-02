import { } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, Sparkles } from 'lucide-react';
import { useRunwayContext } from '../contexts/RunwayContext';
import { useAuthContext } from '../contexts/AuthContext';
import { ImageGenerationForm } from '../components/ImageGenerationForm';
import { CreditBalance } from '../components/CreditBalance';
import { GenerationCard } from '../components/GenerationCard';
import type { AspectRatio } from '../types/runway.types';

export function ImageGeneratorPage() {
  const navigate = useNavigate();
  const { checkAdminStatus } = useAuthContext();
  const {
    credits,
    generations,
    activeGenerations,
    isLoading,
    error,
    generateNewImage,
    deleteGeneration,
    clearError,
  } = useRunwayContext();

  const handleGenerate = async (prompt: string, aspectRatio: AspectRatio) => {
    await generateNewImage(prompt, aspectRatio);
  };

  const handleRegenerate = async (prompt: string, aspectRatio: string) => {
    await generateNewImage(prompt, aspectRatio as AspectRatio);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const recentGenerations = generations.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">AI Image Generator</h1>
              </div>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <History className="w-5 h-5" />
              Lịch sử
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tạo ảnh mới</h2>
              <ImageGenerationForm
                onSubmit={handleGenerate}
                isLoading={isLoading}
                credits={credits?.credits || 0}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}

            {activeGenerations.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Đang xử lý</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGenerations.map((generation) => (
                    <GenerationCard
                      key={generation.id}
                      generation={generation}
                      onDelete={deleteGeneration}
                    />
                  ))}
                </div>
              </div>
            )}

            {recentGenerations.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Ảnh gần đây</h2>
                  <button
                    onClick={() => navigate('/history')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Xem tất cả →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentGenerations.map((generation) => (
                    <GenerationCard
                      key={generation.id}
                      generation={generation}
                      onDelete={deleteGeneration}
                      onRegenerate={handleRegenerate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {credits && (
              <CreditBalance credits={credits} isAdmin={checkAdminStatus()} />
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hướng dẫn</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Mô tả chi tiết về ảnh bạn muốn tạo</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Chọn tỷ lệ khung hình phù hợp</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Mỗi ảnh tốn từ 0.8 đến 1.2 credits</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Thời gian tạo khoảng 20-40 giây</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Mẹo hay</h3>
              <p className="text-sm text-blue-700">
                Sử dụng các từ khóa mô tả như "realistic", "vibrant colors", "detailed" để
                có kết quả tốt hơn.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
