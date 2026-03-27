import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth";
import Spinner from "@/components/ui/spinner";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken, initialized } = useAuthStore();
  const loc = useLocation();

  if (!initialized) return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
  if (!accessToken) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  if (!user) return null;
  if (user.roleKey !== "ADMIN" && user.roleKey !== "SUPER_ADMIN")
    return <div className="p-6 text-sm">{t("error.forbiddenAdmin")}</div>;
  return <>{children}</>;
}

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  if (!user) return null;
  if (user.roleKey !== "SUPER_ADMIN") return <div className="p-6 text-sm">{t("error.forbiddenSuperAdmin")}</div>;
  return <>{children}</>;
}
