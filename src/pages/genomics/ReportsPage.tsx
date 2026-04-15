import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-700",
  FINAL: "bg-green-100 text-green-700",
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["genomics", "reports", page],
    queryFn: () => api.reportList(page, PAGE_SIZE),
  });

  const { data: detail } = useQuery({
    queryKey: ["genomics", "report", detailId],
    queryFn: () => api.reportDetail(detailId!),
    enabled: detailId !== null,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.reportDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "reports"] });
      toast.success(t("genomics.report.deleted"));
    },
  });

  const finalizeMut = useMutation({
    mutationFn: (id: number) => api.reportUpdateStatus(id, "FINAL"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "reports"] });
      qc.invalidateQueries({ queryKey: ["genomics", "report", detailId] });
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("genomics.report.pageTitle")}</h1>

      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.report.title")}</th>
              <th className="px-4 py-2 text-left font-medium">Sample</th>
              <th className="px-4 py-2 text-center font-medium">{t("genomics.report.variantCount")}</th>
              <th className="px-4 py-2 text-center font-medium">{t("genomics.report.pathogenicCount")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.report.status")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("common.create")}</th>
              <th className="px-4 py-2 text-center font-medium">{t("common.edit")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  {t("common.noData")}
                </td>
              </tr>
            )}
            {items.map((r: any) => (
              <tr
                key={r.reportId}
                className="border-t hover:bg-muted/30 cursor-pointer"
                onClick={() => setDetailId(r.reportId)}
              >
                <td className="px-4 py-2 font-medium">{r.title}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.sampleNo}</td>
                <td className="px-4 py-2 text-center">{r.variantCount}</td>
                <td className="px-4 py-2 text-center">
                  {r.pathogenicCount > 0 ? <Badge className="bg-red-100 text-red-700">{r.pathogenicCount}</Badge> : "0"}
                </td>
                <td className="px-4 py-2">
                  <Badge className={STATUS_COLORS[r.status] ?? ""}>
                    {r.status === "DRAFT" ? t("genomics.report.draft") : t("genomics.report.final")}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{r.createdAt?.slice(0, 10)}</td>
                <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive"
                    onClick={() => deleteMut.mutate(r.reportId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Report Detail Modal */}
      {detailId !== null && detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDetailId(null)}
        >
          <div
            className="w-full max-w-3xl rounded-lg bg-background p-6 shadow-xl max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{detail.title}</h2>
                <p className="text-xs text-muted-foreground">
                  Sample: {detail.sampleNo} | {detail.createdAt?.slice(0, 10)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {detail.status === "DRAFT" && (
                  <Button size="sm" variant="outline" onClick={() => finalizeMut.mutate(detail.reportId)}>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {t("genomics.report.makeFinal")}
                  </Button>
                )}
                <Badge className={STATUS_COLORS[detail.status] ?? ""}>{detail.status}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setDetailId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{detail.variantCount}</div>
                <div className="text-xs text-muted-foreground">{t("genomics.report.variantCount")}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{detail.pathogenicCount}</div>
                <div className="text-xs text-muted-foreground">{t("genomics.report.pathogenicCount")}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{detail.variantCount - detail.pathogenicCount}</div>
                <div className="text-xs text-muted-foreground">Other</div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">{t("genomics.report.summary")}</h3>
              <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap">{detail.summary || "-"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
