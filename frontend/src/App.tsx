import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth";
import { Layout } from "@/components/layout/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { HomePage } from "@/pages/HomePage";
import { PostsPage } from "@/pages/PostsPage";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { CreatePostPage } from "@/pages/CreatePostPage";
import { EditPostPage } from "@/pages/EditPostPage";
import { MissionsPage } from "@/pages/MissionsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { CellsPage } from "@/pages/CellsPage";
import { CellDetailPage } from "@/pages/CellDetailPage";
import { NotificationSettingsPage } from "@/pages/NotificationSettingsPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminMissionsPage } from "@/pages/AdminMissionsPage";
import { AdminCellsPage } from "@/pages/AdminCellsPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
      gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (구 cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="posts/:id" element={<PostDetailPage />} />
              <Route
                path="posts/new"
                element={
                  <ProtectedRoute>
                    <CreatePostPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="posts/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditPostPage />
                  </ProtectedRoute>
                }
              />
              <Route path="missions" element={<MissionsPage />} />
              <Route path="cells" element={<CellsPage />} />
              <Route path="cells/:id" element={<CellDetailPage />} />
              <Route
                path="notifications"
                element={
                  <ProtectedRoute>
                    <NotificationSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              {/* Admin Routes */}
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/missions"
                element={
                  <AdminRoute>
                    <AdminMissionsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/cells"
                element={
                  <AdminRoute>
                    <AdminCellsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <AdminRoute>
                    <AdminUsersPage />
                  </AdminRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      {/* React Query 개발자 도구 (개발 환경에서만) */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
