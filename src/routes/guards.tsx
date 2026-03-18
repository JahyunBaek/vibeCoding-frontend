import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken, initialized } = useAuthStore();
  const loc = useLocation();

  if (!initialized) return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  if (!accessToken) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return null;
  if (user.roleKey !== "ADMIN") return <div className="p-6 text-sm">403 (Admin only)</div>;
  return <>{children}</>;
}