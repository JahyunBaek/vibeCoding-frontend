import { useEffect, useRef } from "react";
import { useAuthStore, UserSummary } from "@/stores/auth";
import AppRoutes from "@/routes/AppRoutes";
import { api, apiRequest } from "@/lib/api";

export default function App() {
  const { initialized, setInitialized, setAuth, clear } = useAuthStore();
  const bootRanRef = useRef(false);

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
        if (data?.accessToken) setAuth(data.accessToken, data.user);
        else clear();
      } catch {
        clear();
      } finally {
        setInitialized(true);
      }
    })();
  }, [initialized, setInitialized, setAuth, clear]);

  return <AppRoutes />;
}