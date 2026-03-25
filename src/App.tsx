import { useEffect, useRef } from "react";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuthStore, UserSummary } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import AppRoutes from "@/routes/AppRoutes";
import { api, apiRequest } from "@/lib/api";

export default function App() {
  const { initialized, setInitialized, setAuth, clear, setPermissions } = useAuthStore();
  const { isDark } = useThemeStore();
  const bootRanRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    if (initialized) return;
    if (bootRanRef.current) return;
    bootRanRef.current = true;

    (async () => {
      try {
        const data = await apiRequest<{ accessToken: string; user: UserSummary }>(
          "POST",
          "/api/auth/refresh"
        );
        if (data?.accessToken) {
          setAuth(data.accessToken, data.user);
          try {
            const perms = await api.permissionsMyList();
            const permMap: Record<string, string[]> = {};
            for (const p of perms) permMap[p.screenKey] = p.actions;
            setPermissions(permMap);
          } catch { /* ignore, permissions will be empty */ }
        } else {
          clear();
        }
      } catch {
        clear();
      } finally {
        setInitialized(true);
      }
    })();
  }, [initialized, setInitialized, setAuth, clear, setPermissions]);

  return (
    <ErrorBoundary>
      <AppRoutes />
      <Toaster richColors position="top-right" theme={isDark ? "dark" : "light"} />
    </ErrorBoundary>
  );
}