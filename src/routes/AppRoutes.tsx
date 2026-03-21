import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin, RequireAuth, RequireSuperAdmin } from "./guards";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AppLayout from "@/components/layout/AppLayout";
import BoardListPage from "@/pages/boards/BoardListPage";
import BoardWritePage from "@/pages/boards/BoardWritePage";
import BoardPostPage from "@/pages/boards/BoardPostPage";
import AdminBoardsPage from "@/pages/admin/AdminBoardsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminOrgsPage from "@/pages/admin/AdminOrgsPage";
import AdminCodesPage from "@/pages/admin/AdminCodesPage";
import AdminRolesPage from "@/pages/admin/AdminRolesPage";
import AdminMenusPage from "@/pages/admin/AdminMenusPage";
import AdminScreensPage from "@/pages/admin/AdminScreensPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import MyInfoPage from "@/pages/MyInfoPage";
import SuperAdminTenantsPage from "@/pages/super-admin/SuperAdminTenantsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="boards/:boardId" element={<BoardListPage />} />
        <Route path="boards/:boardId/new" element={<BoardWritePage />} />
        <Route path="boards/:boardId/posts/:postId" element={<BoardPostPage />} />

        <Route path="me" element={<MyInfoPage />} />

        <Route
          path="admin/boards"
          element={
            <RequireAdmin>
              <AdminBoardsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/users"
          element={
            <RequireAdmin>
              <AdminUsersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/orgs"
          element={
            <RequireAdmin>
              <AdminOrgsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/codes"
          element={
            <RequireAdmin>
              <AdminCodesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/roles"
          element={
            <RequireAdmin>
              <AdminRolesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/menus"
          element={
            <RequireAdmin>
              <AdminMenusPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/screens"
          element={
            <RequireAdmin>
              <AdminScreensPage />
            </RequireAdmin>
          }
        />

        <Route
          path="admin/settings"
          element={
            <RequireAdmin>
              <AdminSettingsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/audit"
          element={
            <RequireAdmin>
              <AdminAuditPage />
            </RequireAdmin>
          }
        />

        <Route
          path="super-admin/tenants"
          element={
            <RequireSuperAdmin>
              <SuperAdminTenantsPage />
            </RequireSuperAdmin>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}