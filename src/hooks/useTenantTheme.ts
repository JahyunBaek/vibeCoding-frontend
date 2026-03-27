import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";

export function useTenantTheme() {
  const { i18n } = useTranslation();

  const { data: branding } = useQuery({
    queryKey: ["tenant", "branding"],
    queryFn: () => api.tenantBranding(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;
    if (branding.primaryColor) root.style.setProperty("--tenant-primary", branding.primaryColor);
    if (branding.sidebarColor) root.style.setProperty("--tenant-sidebar", branding.sidebarColor);
    if (branding.accentColor) root.style.setProperty("--tenant-accent", branding.accentColor);

    // 테넌트 locale에 따라 프론트 언어 자동 설정 (사용자가 수동 변경하지 않은 경우)
    if (branding.locale && !localStorage.getItem("language")) {
      i18n.changeLanguage(branding.locale);
    }
  }, [branding, i18n]);

  return branding;
}
