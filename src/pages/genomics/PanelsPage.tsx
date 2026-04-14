import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

const CATEGORY_COLORS: Record<string, string> = {
  TARGETED: "bg-blue-100 text-blue-700",
  WES: "bg-purple-100 text-purple-700",
  WGS: "bg-orange-100 text-orange-700",
};

export default function PanelsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["genomics", "panels", page, search],
    queryFn: () => api.panelList(page, PAGE_SIZE, search || undefined),
  });

  const { data: detail } = useQuery({
    queryKey: ["genomics", "panel", detailId],
    queryFn: () => api.panelDetail(detailId!),
    enabled: detailId !== null,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.panelDelete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["genomics", "panels"] }); toast.success(t("genomics.panel.deleted")); },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.panelCreate(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["genomics", "panels"] }); toast.success(t("genomics.panel.created")); setShowCreate(false); },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("genomics.panel.pageTitle")}</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("genomics.panel.createPanel")}
        </Button>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder={t("common.search")}
          className="h-9 w-60 rounded-md border bg-surface px-3 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.panel.panelCode")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.panel.name")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.panel.category")}</th>
              <th className="px-4 py-2 text-center font-medium">{t("genomics.panel.geneCount")}</th>
              <th className="px-4 py-2 text-center font-medium">{t("common.use")}</th>
              <th className="px-4 py-2 text-center font-medium">{t("common.edit")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
            )}
            {items.map((p: any) => (
              <tr key={p.panelId} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{p.panelCode}</td>
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2">
                  <Badge className={CATEGORY_COLORS[p.category] ?? ""}>{p.category}</Badge>
                </td>
                <td className="px-4 py-2 text-center">{p.geneCount}</td>
                <td className="px-4 py-2 text-center">
                  <Badge variant={p.useYn ? "default" : "outline"}>{p.useYn ? "Y" : "N"}</Badge>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => setDetailId(p.panelId)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-destructive"
                            onClick={() => deleteMut.mutate(p.panelId)}>
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Detail Drawer */}
      {detailId !== null && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailId(null)}>
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{detail.name} ({detail.panelCode})</h2>
              <Button variant="ghost" size="sm" onClick={() => setDetailId(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">{t("genomics.panel.category")}:</span> {detail.category}</p>
              <p><span className="font-medium">{t("common.description")}:</span> {detail.description || "-"}</p>
              <p><span className="font-medium">{t("genomics.panel.geneCount")}:</span> {detail.geneCount}</p>
            </div>
            {detail.genes?.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold">{t("genomics.panel.genes")}</h3>
                <div className="max-h-60 overflow-auto rounded border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 text-left">{t("genomics.panel.geneSymbol")}</th>
                        <th className="px-3 py-1.5 text-left">{t("genomics.panel.chromosome")}</th>
                        <th className="px-3 py-1.5 text-left">{t("common.description")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.genes.map((g: any) => (
                        <tr key={g.panelGeneId} className="border-t">
                          <td className="px-3 py-1 font-mono font-medium">{g.geneSymbol}</td>
                          <td className="px-3 py-1">{g.chromosome ?? "-"}</td>
                          <td className="px-3 py-1 text-muted-foreground">{g.description ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && <PanelCreateDialog onClose={() => setShowCreate(false)} onSubmit={(d) => createMut.mutate(d)} isPending={createMut.isPending} />}
    </div>
  );
}

function PanelCreateDialog({ onClose, onSubmit, isPending }: { onClose: () => void; onSubmit: (data: any) => void; isPending: boolean }) {
  const { t } = useTranslation();
  const [genes, setGenes] = useState<{ geneSymbol: string; chromosome: string; description: string }[]>([]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">{t("genomics.panel.createPanel")}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onSubmit({
            panelCode: fd.get("panelCode"),
            name: fd.get("name"),
            description: fd.get("description") || undefined,
            category: fd.get("category"),
            genes,
          });
        }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("genomics.panel.panelCode")}</label>
              <input name="panelCode" required className="h-9 w-full rounded-md border px-3 text-sm" placeholder="ONCO-50" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("genomics.panel.name")}</label>
              <input name="name" required className="h-9 w-full rounded-md border px-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("genomics.panel.category")}</label>
            <select name="category" required className="h-9 w-full rounded-md border px-3 text-sm">
              <option value="TARGETED">Targeted Panel</option>
              <option value="WES">Whole Exome (WES)</option>
              <option value="WGS">Whole Genome (WGS)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("common.description")}</label>
            <textarea name="description" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>

          {/* Gene list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">{t("genomics.panel.genes")} ({genes.length})</label>
              <Button type="button" variant="outline" size="sm" onClick={() => setGenes([...genes, { geneSymbol: "", chromosome: "", description: "" }])}>
                <Plus className="mr-1 h-3 w-3" /> {t("genomics.panel.addGene")}
              </Button>
            </div>
            {genes.map((g, i) => (
              <div key={i} className="mb-1.5 flex gap-2">
                <input
                  placeholder="BRCA1"
                  className="h-8 w-24 rounded border px-2 text-xs font-mono"
                  value={g.geneSymbol}
                  onChange={(e) => { const ng = [...genes]; ng[i].geneSymbol = e.target.value; setGenes(ng); }}
                />
                <input
                  placeholder="chr17"
                  className="h-8 w-16 rounded border px-2 text-xs"
                  value={g.chromosome}
                  onChange={(e) => { const ng = [...genes]; ng[i].chromosome = e.target.value; setGenes(ng); }}
                />
                <input
                  placeholder={t("common.description")}
                  className="h-8 flex-1 rounded border px-2 text-xs"
                  value={g.description}
                  onChange={(e) => { const ng = [...genes]; ng[i].description = e.target.value; setGenes(ng); }}
                />
                <Button type="button" variant="ghost" size="sm" className="h-8 text-destructive"
                        onClick={() => setGenes(genes.filter((_, j) => j !== i))}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isPending}>{t("common.save")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
