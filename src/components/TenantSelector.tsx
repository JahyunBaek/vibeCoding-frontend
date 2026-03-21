import { useQuery } from "@tanstack/react-query";
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
  if (user?.roleKey !== "SUPER_ADMIN") return null;

  const { data } = useQuery({
    queryKey: ["super-admin", "tenants", "all"],
    queryFn: () => api.superAdminTenants(1, 200),
  });
  const tenants: TenantListRow[] = (data?.items ?? []).filter((t: TenantListRow) => t.tenantId !== 0);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-fg whitespace-nowrap">테넌트</span>
      <select
        className="h-8 rounded-md border bg-surface px-2 text-xs text-foreground min-w-[140px]"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">전체 테넌트</option>
        {tenants.map((t) => (
          <option key={t.tenantId} value={t.tenantId}>
            {t.tenantName} ({t.tenantKey})
          </option>
        ))}
      </select>
    </div>
  );
}
