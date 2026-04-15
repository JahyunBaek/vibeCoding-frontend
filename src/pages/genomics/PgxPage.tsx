import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pill, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

const EFFECT_COLORS: Record<string, string> = {
  POOR_METABOLIZER: "bg-red-100 text-red-700",
  INTERMEDIATE: "bg-orange-100 text-orange-700",
  NORMAL: "bg-green-100 text-green-700",
  RAPID: "bg-blue-100 text-blue-700",
};

const EVIDENCE_COLORS: Record<string, string> = {
  "1A": "bg-red-100 text-red-700",
  "1B": "bg-orange-100 text-orange-700",
  "2A": "bg-yellow-100 text-yellow-700",
  "2B": "bg-blue-100 text-blue-700",
};

export default function PgxPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [matchSampleId, setMatchSampleId] = useState("");

  const { data } = useQuery({
    queryKey: ["genomics", "pgx", page, search],
    queryFn: () => api.pgxList(page, PAGE_SIZE, search || undefined),
  });

  const { data: matches } = useQuery({
    queryKey: ["genomics", "pgx", "match", matchSampleId],
    queryFn: () => api.pgxMatchBySample(Number(matchSampleId)),
    enabled: !!matchSampleId,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("genomics.pgx.pageTitle")}</h1>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t("common.search") + " (gene, drug)"}
          className="h-9 w-60 rounded-md border bg-surface px-3 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-muted-foreground">{t("genomics.pgx.matchBySample")}:</label>
          <input
            type="number"
            placeholder="Sample ID"
            className="h-9 w-28 rounded-md border px-3 text-sm"
            value={matchSampleId}
            onChange={(e) => setMatchSampleId(e.target.value)}
          />
        </div>
      </div>

      {/* PGx Match Results */}
      {matchSampleId && matches && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Pill className="h-4 w-4" />
            {t("genomics.pgx.matchTitle")} (Sample #{matchSampleId})
          </h2>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("genomics.pgx.noMatch")}</p>
          ) : (
            <div className="space-y-2">
              {matches.map((m: any, i: number) => (
                <div key={i} className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold">{m.geneSymbol}</span>
                      <span className="text-muted-foreground">{m.variantName}</span>
                      <span className="mx-1">+</span>
                      <span className="font-medium">{m.drugName}</span>
                      <Badge className={EFFECT_COLORS[m.effect] ?? ""}>{m.effect}</Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {m.source} {m.evidenceLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PGx Database Table */}
      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.pgx.gene")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.pgx.variant")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.pgx.drug")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.pgx.effect")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.pgx.evidenceLevel")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.pgx.source")}</th>
              <th className="px-4 py-2 text-left font-medium">{t("genomics.pgx.recommendation")}</th>
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
            {items.map((p: any) => (
              <tr key={p.pgxId} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2 font-mono font-semibold">{p.geneSymbol}</td>
                <td className="px-4 py-2 font-mono">{p.variantName}</td>
                <td className="px-4 py-2 font-medium">{p.drugName}</td>
                <td className="px-4 py-2">
                  <Badge className={EFFECT_COLORS[p.effect] ?? ""}>{p.effect}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Badge className={EVIDENCE_COLORS[p.evidenceLevel] ?? "bg-gray-100 text-gray-600"}>
                    {p.evidenceLevel}
                  </Badge>
                </td>
                <td className="px-4 py-2">{p.source}</td>
                <td className="px-4 py-2 text-xs max-w-xs truncate" title={p.recommendation}>
                  {p.recommendation}
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
    </div>
  );
}
