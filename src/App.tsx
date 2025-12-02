// Component chính của ứng dụng - thiết lập routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RunwayProvider } from './contexts/RunwayContext';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { ImageGeneratorPage } from './pages/ImageGeneratorPage';
import { GenerationHistoryPage } from './pages/GenerationHistoryPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RunwayProvider>
          <Routes>
            {/* Route trang đăng nhập */}
            <Route path="/" element={<LoginPage />} />

            {/* Route trang tạo ảnh AI - được bảo vệ */}
            <Route
              path="/generate"
              element={
                <ProtectedRoute>
                  <ImageGeneratorPage />
                </ProtectedRoute>
              }
            />

            {/* Route lịch sử tạo ảnh - được bảo vệ */}
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <GenerationHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Route trang admin - được bảo vệ */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Redirect các route không tồn tại về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RunwayProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
