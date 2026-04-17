import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronRight, Upload, ExternalLink, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-gray-100 text-gray-700",
  EXTRACTED: "bg-blue-100 text-blue-700",
  SEQUENCING: "bg-indigo-100 text-indigo-700",
  ANALYZING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  REPORTED: "bg-emerald-100 text-emerald-700",
};

const STATUS_KEYS: Record<string, string> = {
  RECEIVED: "genomics.sample.statusReceived",
  EXTRACTED: "genomics.sample.statusExtracted",
  SEQUENCING: "genomics.sample.statusSequencing",
  ANALYZING: "genomics.sample.statusAnalyzing",
  COMPLETED: "genomics.sample.statusCompleted",
  REPORTED: "genomics.sample.statusReported",
};

const STATUS_FLOW = ["RECEIVED", "EXTRACTED", "SEQUENCING", "ANALYZING", "COMPLETED", "REPORTED"];

export default function SamplesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const [vcfTarget, setVcfTarget] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["genomics", "samples", page, status, search],
    queryFn: () => api.sampleList(page, PAGE_SIZE, status || undefined, search || undefined),
  });

  const { data: panels = [] } = useQuery({
    queryKey: ["genomics", "panels", "active"],
    queryFn: () => api.panelActive(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.sampleDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "samples"] });
      toast.success(t("genomics.sample.deleted"));
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.sampleUpdateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "samples"] });
      toast.success(t("genomics.sample.statusChanged"));
    },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.sampleCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "samples"] });
      toast.success(t("genomics.sample.created"));
      setShowCreate(false);
    },
  });

  const reportMut = useMutation({
    mutationFn: (sampleId: number) => api.reportGenerate(sampleId),
    onSuccess: () => {
      toast.success(t("genomics.report.generated"));
    },
  });

  const vcfMut = useMutation({
    mutationFn: ({ sampleId, file }: { sampleId: number; file: File }) => api.sampleUploadVcf(sampleId, file),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["genomics", "samples"] });
      toast.success(t("genomics.sample.vcfUploaded", { count: data.variantCount }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const nextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("genomics.sample.pageTitle")}</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("genomics.sample.createSample")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="h-9 rounded-md border bg-surface px-3 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("genomics.sample.allStatus")}</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_KEYS[s])}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder={t("common.search")}
          className="h-9 w-60 rounded-md border bg-surface px-3 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.sample.sampleNo")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.sample.sampleType")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.sample.panel")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.sample.status")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.sample.receivedDate")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.sample.completedDate")}</th>
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
            {items.map((s: any) => {
              const next = nextStatus(s.status);
              return (
                <tr key={s.sampleId} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">{s.sampleNo}</td>
                  <td className="px-4 py-2">{s.sampleType}</td>
                  <td className="px-4 py-2">{s.panelName ?? "-"}</td>
                  <td className="px-4 py-2">
                    <Badge className={STATUS_COLORS[s.status] ?? ""}>{t(STATUS_KEYS[s.status] ?? s.status)}</Badge>
                  </td>
                  <td className="px-4 py-2">{s.receivedDate}</td>
                  <td className="px-4 py-2">{s.completedDate ?? "-"}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setVcfTarget(s.sampleId);
                          vcfInputRef.current?.click();
                        }}
                      >
                        <Upload className="mr-0.5 h-3 w-3" />
                        {t("genomics.sample.uploadVcf")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate(`/genomics/variants?sampleId=${s.sampleId}`)}
                      >
                        <ExternalLink className="mr-0.5 h-3 w-3" />
                        {t("genomics.sample.viewVariants")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={reportMut.isPending}
                        onClick={() => reportMut.mutate(s.sampleId)}
                      >
                        <FileText className="mr-0.5 h-3 w-3" />
                        {t("genomics.report.generate")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => api.exportDeidentified(s.sampleId)}
                      >
                        <Download className="mr-0.5 h-3 w-3" />
                        {t("genomics.export.deidentify")}
                      </Button>
                      {next && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => statusMut.mutate({ id: s.sampleId, status: next })}
                        >
                          <ChevronRight className="mr-0.5 h-3 w-3" />
                          {t(STATUS_KEYS[next])}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive"
                        onClick={() => deleteMut.mutate(s.sampleId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Hidden VCF file input */}
      <input
        ref={vcfInputRef}
        type="file"
        accept=".vcf,.vcf.gz"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && vcfTarget) {
            vcfMut.mutate({ sampleId: vcfTarget, file });
          }
          e.target.value = "";
          setVcfTarget(null);
        }}
      />

      {/* Create Dialog (simple) */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCreate(false)}
        >
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">{t("genomics.sample.createSample")}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createMut.mutate({
                  patientId: Number(fd.get("patientId")),
                  sampleType: fd.get("sampleType") as string,
                  panelId: fd.get("panelId") ? Number(fd.get("panelId")) : undefined,
                  note: (fd.get("note") as string) || undefined,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.sample.patientId")}</label>
                <input name="patientId" type="number" required className="h-9 w-full rounded-md border px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.sample.sampleType")}</label>
                <select name="sampleType" required className="h-9 w-full rounded-md border px-3 text-sm">
                  <option value="BLOOD">BLOOD</option>
                  <option value="TISSUE">TISSUE</option>
                  <option value="SALIVA">SALIVA</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.sample.panel")}</label>
                <select name="panelId" className="h-9 w-full rounded-md border px-3 text-sm">
                  <option value="">-</option>
                  {panels.map((p: any) => (
                    <option key={p.panelId} value={p.panelId}>
                      {p.name} ({p.panelCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.sample.note")}</label>
                <textarea name="note" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
