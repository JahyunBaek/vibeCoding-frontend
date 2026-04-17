import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, PenLine, Ban } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  SIGNED: "bg-green-100 text-green-700",
  REVOKED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
};

const STATUS_KEYS: Record<string, string> = {
  PENDING: "genomics.consent.pending",
  SIGNED: "genomics.consent.signed",
  REVOKED: "genomics.consent.revoked",
  EXPIRED: "genomics.consent.expired",
};

const TYPE_KEYS: Record<string, string> = {
  GENETIC_TEST: "genomics.consent.geneticTest",
  RESEARCH_USE: "genomics.consent.researchUse",
  DATA_SHARING: "genomics.consent.dataSharing",
  BIOBANK: "genomics.consent.biobank",
};

export default function ConsentsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [signTarget, setSignTarget] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["genomics", "consents", page, status],
    queryFn: () => api.consentList(page, PAGE_SIZE, undefined, status || undefined),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.consentDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "consents"] });
      toast.success(t("genomics.consent.deleted"));
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id: number) => api.consentRevoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "consents"] });
      toast.success(t("genomics.consent.revokedMsg"));
    },
  });

  const signMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { signedByName: string; witnessName?: string } }) =>
      api.consentSign(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "consents"] });
      toast.success(t("genomics.consent.signedMsg"));
      setSignTarget(null);
    },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.consentCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genomics", "consents"] });
      toast.success(t("genomics.consent.created"));
      setShowCreate(false);
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("genomics.consent.pageTitle")}</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("genomics.consent.createConsent")}
        </Button>
      </div>

      <div className="flex gap-3">
        <select
          className="h-9 rounded-md border bg-surface px-3 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("genomics.consent.allStatus")}</option>
          <option value="PENDING">{t("genomics.consent.pending")}</option>
          <option value="SIGNED">{t("genomics.consent.signed")}</option>
          <option value="REVOKED">{t("genomics.consent.revoked")}</option>
          <option value="EXPIRED">{t("genomics.consent.expired")}</option>
        </select>
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.consent.patientId")}</th>
              <th className="px-4 py-2 text-left font-medium">Sample</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.consent.consentType")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.consent.status")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.consent.signedBy")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.consent.signedAt")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.consent.expiresAt")}</th>
              <th className="px-4 py-2 text-center font-medium">{t("common.edit")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  {t("common.noData")}
                </td>
              </tr>
            )}
            {items.map((c: any) => (
              <tr key={c.consentId} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2">#{c.patientId}</td>
                <td className="px-4 py-2 font-mono text-xs">{c.sampleNo ?? "-"}</td>
                <td className="px-4 py-2">{t(TYPE_KEYS[c.consentType] ?? c.consentType)}</td>
                <td className="px-4 py-2">
                  <Badge className={STATUS_COLORS[c.status] ?? ""}>{t(STATUS_KEYS[c.status] ?? c.status)}</Badge>
                </td>
                <td className="px-4 py-2">{c.signedByName ?? "-"}</td>
                <td className="px-4 py-2 text-xs">{c.signedAt?.slice(0, 16).replace("T", " ") ?? "-"}</td>
                <td className="px-4 py-2 text-xs">{c.expiresAt ?? "-"}</td>
                <td className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {c.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSignTarget(c.consentId)}
                      >
                        <PenLine className="mr-0.5 h-3 w-3" />
                        {t("genomics.consent.sign")}
                      </Button>
                    )}
                    {c.status === "SIGNED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-orange-600"
                        onClick={() => revokeMut.mutate(c.consentId)}
                      >
                        <Ban className="mr-0.5 h-3 w-3" />
                        {t("genomics.consent.revoke")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive"
                      onClick={() => deleteMut.mutate(c.consentId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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

      {/* Sign Dialog */}
      {signTarget !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSignTarget(null)}
        >
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">{t("genomics.consent.sign")}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                signMut.mutate({
                  id: signTarget,
                  data: {
                    signedByName: fd.get("signedByName") as string,
                    witnessName: (fd.get("witnessName") as string) || undefined,
                  },
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.consent.signedBy")}</label>
                <input name="signedByName" required className="h-9 w-full rounded-md border px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.consent.witness")}</label>
                <input name="witnessName" className="h-9 w-full rounded-md border px-3 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSignTarget(null)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={signMut.isPending}>
                  {t("genomics.consent.sign")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCreate(false)}
        >
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">{t("genomics.consent.createConsent")}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createMut.mutate({
                  patientId: Number(fd.get("patientId")),
                  sampleId: fd.get("sampleId") ? Number(fd.get("sampleId")) : undefined,
                  consentType: fd.get("consentType") as string,
                  expiresAt: (fd.get("expiresAt") as string) || undefined,
                  note: (fd.get("note") as string) || undefined,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.consent.patientId")}</label>
                <input name="patientId" type="number" required className="h-9 w-full rounded-md border px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Sample ID</label>
                <input name="sampleId" type="number" className="h-9 w-full rounded-md border px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.consent.consentType")}</label>
                <select name="consentType" required className="h-9 w-full rounded-md border px-3 text-sm">
                  <option value="GENETIC_TEST">{t("genomics.consent.geneticTest")}</option>
                  <option value="RESEARCH_USE">{t("genomics.consent.researchUse")}</option>
                  <option value="DATA_SHARING">{t("genomics.consent.dataSharing")}</option>
                  <option value="BIOBANK">{t("genomics.consent.biobank")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("genomics.consent.expiresAt")}</label>
                <input name="expiresAt" type="date" className="h-9 w-full rounded-md border px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Note</label>
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
