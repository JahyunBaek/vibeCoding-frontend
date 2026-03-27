import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { TenantListRow } from "@/types/tenant";

export default function TenantSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (tenantId: number | null) => void;
}) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  if (user?.roleKey !== "SUPER_ADMIN") return null;

  const { data } = useQuery({
    queryKey: ["super-admin", "tenants", "all"],
    queryFn: () => api.superAdminTenants(1, 200),
  });
  const tenants: TenantListRow[] = (data?.items ?? []).filter((t_: TenantListRow) => t_.tenantId !== 0);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-fg whitespace-nowrap">{t("tenant.label")}</span>
      <select
        className="h-8 rounded-md border bg-surface px-2 text-xs text-foreground min-w-[140px]"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{t("tenant.all")}</option>
        {tenants.map((t_) => (
          <option key={t_.tenantId} value={t_.tenantId}>
            {t_.tenantName} ({t_.tenantKey})
          </option>
        ))}
      </select>
    </div>
  );
}
