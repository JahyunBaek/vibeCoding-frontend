import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { X, RotateCcw, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

const IMPACT_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MODERATE: "bg-orange-100 text-orange-700",
  LOW: "bg-yellow-100 text-yellow-700",
  MODIFIER: "bg-gray-100 text-gray-600",
};

const ACMG_COLORS: Record<string, string> = {
  PATHOGENIC: "bg-red-100 text-red-700",
  LIKELY_PATHOGENIC: "bg-orange-100 text-orange-700",
  VUS: "bg-yellow-100 text-yellow-700",
  LIKELY_BENIGN: "bg-green-100 text-green-700",
  BENIGN: "bg-emerald-100 text-emerald-700",
};

const EMPTY_FILTERS = {
  sampleId: undefined as number | undefined,
  geneSymbol: "",
  variantType: "",
  impact: "",
  acmgClass: "",
  gnomadAfMax: "" as string | number,
  search: "",
};

export default function VariantsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSampleId = searchParams.get("sampleId");

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    sampleId: initialSampleId ? Number(initialSampleId) : undefined,
  });
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["genomics", "variants", page, filters],
    queryFn: () => api.variantList(page, PAGE_SIZE, filters),
  });

  const { data: detail } = useQuery({
    queryKey: ["genomics", "variant", detailId],
    queryFn: () => api.variantDetail(detailId!),
    enabled: detailId !== null,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setSearchParams({});
    setPage(1);
  };

  const hasActiveFilters = filters.sampleId || filters.geneSymbol || filters.variantType ||
    filters.impact || filters.acmgClass || filters.gnomadAfMax || filters.search;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("genomics.variant.pageTitle")}</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder={t("genomics.variant.gene")}
          className="h-8 w-28 rounded-md border px-2 text-xs"
          value={filters.geneSymbol}
          onChange={(e) => updateFilter("geneSymbol", e.target.value)}
        />
        <select className="h-8 rounded-md border px-2 text-xs" value={filters.variantType}
                onChange={(e) => updateFilter("variantType", e.target.value)}>
          <option value="">{t("genomics.variant.allType")}</option>
          <option value="SNV">SNV</option>
          <option value="INDEL">InDel</option>
          <option value="CNV">CNV</option>
          <option value="SV">SV</option>
        </select>
        <select className="h-8 rounded-md border px-2 text-xs" value={filters.impact}
                onChange={(e) => updateFilter("impact", e.target.value)}>
          <option value="">{t("genomics.variant.allImpact")}</option>
          <option value="HIGH">HIGH</option>
          <option value="MODERATE">MODERATE</option>
          <option value="LOW">LOW</option>
          <option value="MODIFIER">MODIFIER</option>
        </select>
        <select className="h-8 rounded-md border px-2 text-xs" value={filters.acmgClass}
                onChange={(e) => updateFilter("acmgClass", e.target.value)}>
          <option value="">{t("genomics.variant.allAcmg")}</option>
          <option value="PATHOGENIC">Pathogenic</option>
          <option value="LIKELY_PATHOGENIC">Likely Pathogenic</option>
          <option value="VUS">VUS</option>
          <option value="LIKELY_BENIGN">Likely Benign</option>
          <option value="BENIGN">Benign</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder={t("genomics.variant.gnomadAfMax")}
          className="h-8 w-28 rounded-md border px-2 text-xs"
          value={filters.gnomadAfMax}
          onChange={(e) => updateFilter("gnomadAfMax", e.target.value ? Number(e.target.value) : "")}
        />
        <input
          type="text"
          placeholder={t("common.search")}
          className="h-8 w-40 rounded-md border px-2 text-xs"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
        {filters.sampleId && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            {t("genomics.variant.sampleFilter")}: #{filters.sampleId}
            <button onClick={() => updateFilter("sampleId", undefined)} className="ml-1 hover:text-destructive">x</button>
          </Badge>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetFilters}>
            <RotateCcw className="mr-1 h-3 w-3" />{t("genomics.variant.resetFilters")}
          </Button>
        )}
        <span className="ml-auto self-center text-xs text-muted-foreground">
          {total} results
        </span>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.gene")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.hgvsC")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.hgvsP")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.variantType")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.consequence")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.impact")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.acmgClass")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.zygosity")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("genomics.variant.gnomadAf")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("genomics.variant.clinvarId")}</th>
              <th className="px-3 py-2 text-left font-medium">Sample</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                {hasActiveFilters ? t("genomics.variant.noResults") : t("common.noData")}
              </td></tr>
            )}
            {items.map((v: any) => (
              <tr key={v.variantId} className="border-t hover:bg-muted/30 cursor-pointer"
                  onClick={() => setDetailId(v.variantId)}>
                <td className="px-3 py-1.5 font-mono font-semibold">{v.geneSymbol}</td>
                <td className="px-3 py-1.5 font-mono">{v.hgvsC ?? "-"}</td>
                <td className="px-3 py-1.5 font-mono">{v.hgvsP ?? "-"}</td>
                <td className="px-3 py-1.5"><Badge variant="outline">{v.variantType}</Badge></td>
                <td className="px-3 py-1.5">{v.consequence ?? "-"}</td>
                <td className="px-3 py-1.5">
                  {v.impact && <Badge className={IMPACT_COLORS[v.impact] ?? ""}>{v.impact}</Badge>}
                </td>
                <td className="px-3 py-1.5">
                  {v.acmgClass && <Badge className={ACMG_COLORS[v.acmgClass] ?? ""}>{v.acmgClass}</Badge>}
                </td>
                <td className="px-3 py-1.5">{v.zygosity ?? "-"}</td>
                <td className="px-3 py-1.5 text-right font-mono">
                  {v.gnomadAf != null ? v.gnomadAf.toFixed(4) : "-"}
                </td>
                <td className="px-3 py-1.5">{v.clinvarId ?? "-"}</td>
                <td className="px-3 py-1.5 font-mono text-muted-foreground">{v.sampleNo}</td>
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

      {/* Variant Detail Modal */}
      {detailId !== null && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailId(null)}>
          <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-xl max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t("genomics.variant.detail")}: {detail.geneSymbol}</h2>
              <Button variant="ghost" size="sm" onClick={() => setDetailId(null)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.gene")}:</span> <span className="font-mono font-semibold">{detail.geneSymbol}</span></div>
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.chromosome")}:</span> {detail.chromosome}:{detail.position?.toLocaleString()}</div>
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.refAllele")} / {t("genomics.variant.altAllele")}:</span> <span className="font-mono">{detail.refAllele} &rarr; {detail.altAllele}</span></div>
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.variantType")}:</span> <Badge variant="outline">{detail.variantType}</Badge></div>

              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.hgvsC")}:</span> <span className="font-mono text-xs">{detail.hgvsC ?? "-"}</span></div>
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.hgvsP")}:</span> <span className="font-mono text-xs">{detail.hgvsP ?? "-"}</span></div>

              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.consequence")}:</span> {detail.consequence ?? "-"}</div>
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.impact")}:</span> {detail.impact && <Badge className={IMPACT_COLORS[detail.impact] ?? ""}>{detail.impact}</Badge>}</div>

              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.acmgClass")}:</span> {detail.acmgClass && <Badge className={ACMG_COLORS[detail.acmgClass] ?? ""}>{detail.acmgClass}</Badge>}</div>
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.zygosity")}:</span> {detail.zygosity ?? "-"}</div>

              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.quality")}:</span> {detail.quality?.toFixed(1) ?? "-"}</div>
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.readDepth")}:</span> {detail.readDepth ?? "-"}</div>

              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.alleleFreq")}:</span> {detail.alleleFreq != null ? (detail.alleleFreq * 100).toFixed(1) + "%" : "-"}</div>
              <div><span className="font-medium text-muted-foreground">{t("genomics.variant.gnomadAf")}:</span> {detail.gnomadAf != null ? detail.gnomadAf.toFixed(6) : "-"}</div>
            </div>

            {/* External DB Links */}
            <div className="mt-5 border-t pt-4">
              <h3 className="mb-2 text-sm font-semibold">{t("genomics.variant.externalLinks")}</h3>
              <div className="flex flex-wrap gap-2">
                {detail.clinvarId && (
                  <a href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${detail.clinvarId}/`}
                     target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs hover:bg-muted transition-colors">
                    <ExternalLink className="h-3 w-3" /> ClinVar: {detail.clinvarId}
                  </a>
                )}
                {detail.cosmicId && (
                  <a href={`https://cancer.sanger.ac.uk/cosmic/mutation/overview?id=${detail.cosmicId.replace("COSM", "")}`}
                     target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs hover:bg-muted transition-colors">
                    <ExternalLink className="h-3 w-3" /> COSMIC: {detail.cosmicId}
                  </a>
                )}
                <a href={`https://gnomad.broadinstitute.org/region/${detail.chromosome?.replace("chr", "")}-${detail.position}-${(detail.position ?? 0) + 1}?dataset=gnomad_r4`}
                   target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs hover:bg-muted transition-colors">
                  <ExternalLink className="h-3 w-3" /> gnomAD
                </a>
                <a href={`https://www.genenames.org/tools/search/#!/genes?query=${detail.geneSymbol}`}
                   target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs hover:bg-muted transition-colors">
                  <ExternalLink className="h-3 w-3" /> HGNC: {detail.geneSymbol}
                </a>
                <a href={`https://www.ncbi.nlm.nih.gov/gene/?term=${detail.geneSymbol}`}
                   target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs hover:bg-muted transition-colors">
                  <ExternalLink className="h-3 w-3" /> NCBI Gene
                </a>
              </div>
            </div>

            {detail.sampleNo && (
              <div className="mt-3 text-xs text-muted-foreground">
                Sample: {detail.sampleNo} {detail.panelName && `| Panel: ${detail.panelName}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
