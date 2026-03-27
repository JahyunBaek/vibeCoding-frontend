import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, RefreshCw, Download } from "lucide-react";
import Pagination from "@/components/Pagination";
import TenantSelector from "@/components/TenantSelector";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAGE_SIZE = 50;

const ACTION_COLORS: Record<string, string> = {
  LOGIN:  "bg-emerald-500/10 text-emerald-700 border-emerald-300",
  LOGOUT: "bg-slate-100 text-slate-600 border-slate-300",
  CREATE: "bg-blue-500/10 text-blue-700 border-blue-300",
  UPDATE: "bg-amber-500/10 text-amber-700 border-amber-300",
  DELETE: "bg-red-500/10 text-red-600 border-red-300",
};

export default function AdminAuditPage() {
  const { t } = useTranslation();
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["admin", "audit", selectedTenantId, actionFilter, targetFilter, page],
    queryFn: () => api.auditList({
      tenantId: selectedTenantId,
      action: actionFilter || undefined,
      targetType: targetFilter || undefined,
      page,
      size: PAGE_SIZE,
    }),
  });

  const items: any[] = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("admin.auditPageTitle")}</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
          <CardTitle>{t("admin.auditLog")}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <TenantSelector value={selectedTenantId} onChange={(id) => { setSelectedTenantId(id); setPage(1); }} />
            <select
              className="h-9 rounded-md border bg-surface px-3 text-sm text-foreground w-36"
              value={actionFilter}
              onChange={(e) => handleFilterChange(setActionFilter)(e.target.value)}
            >
              <option value="">{t("admin.auditAllActions")}</option>
              {["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE"].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-36"
                placeholder={t("admin.auditTargetType")}
                value={targetFilter}
                onChange={(e) => handleFilterChange(setTargetFilter)(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-fg">{data?.total ?? 0}{t("common.cases")}</span>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.auditExport({
                    tenantId: selectedTenantId,
                    action: actionFilter || undefined,
                    targetType: targetFilter || undefined,
                  });
                  toast.success(t("admin.csvExported"));
                } catch (e: any) { toast.error(e.message); }
              }}
            >
              <Download className="mr-1.5 h-4 w-4" />{t("common.export")}
            </Button>
            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium w-40">{t("admin.auditDateTime")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("admin.auditUser")}</th>
                <th className="px-4 py-3 text-left font-medium w-24">{t("admin.auditAction")}</th>
                <th className="px-4 py-3 text-left font-medium w-28">{t("admin.auditTargetType")}</th>
                <th className="px-4 py-3 text-left font-medium w-28">{t("admin.auditTargetId")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("admin.auditDetail")}</th>
                <th className="px-4 py-3 text-left font-medium w-32">{t("admin.auditIp")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((log: any) => (
                <tr key={log.logId} className="hover:bg-muted/60 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-fg font-mono whitespace-nowrap">
                    {log.createdAt?.replace("T", " ").slice(0, 19) ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs font-medium">{log.username ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-muted text-muted-fg border-border"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-fg">{log.targetType ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-fg">{log.targetId ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-fg max-w-xs truncate">{log.detail ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-fg">{log.ipAddress ?? "—"}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {t("admin.auditNoLogs")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
