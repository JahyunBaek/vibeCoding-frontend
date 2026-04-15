import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import igv from "igv";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACMG_COLORS: Record<string, string> = {
  PATHOGENIC: "#ef4444",
  LIKELY_PATHOGENIC: "#f97316",
  VUS: "#eab308",
  LIKELY_BENIGN: "#22c55e",
  BENIGN: "#10b981",
};

export default function BrowserPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialSampleId = searchParams.get("sampleId") ?? "";

  const igvDiv = useRef<HTMLDivElement>(null);
  const browserRef = useRef<any>(null);
  const [sampleId, setSampleId] = useState(initialSampleId);
  const [locus, setLocus] = useState("chr17:41,196,312-41,277,500");

  const { data: variants } = useQuery({
    queryKey: ["genomics", "variants", "browser", sampleId],
    queryFn: () => api.variantList(1, 5000, { sampleId: Number(sampleId) }),
    enabled: !!sampleId,
  });

  // Initialize IGV browser
  useEffect(() => {
    if (!igvDiv.current || browserRef.current) return;

    igv
      .createBrowser(igvDiv.current, {
        genome: "hg38",
        locus: locus,
        tracks: [],
      })
      .then((browser: any) => {
        browserRef.current = browser;
      });

    return () => {
      if (browserRef.current) {
        igv.removeBrowser(browserRef.current);
        browserRef.current = null;
      }
    };
  }, []);

  // Load variants as annotation track
  const loadVariants = () => {
    if (!browserRef.current || !variants?.items?.length) return;

    // Remove existing variant tracks
    const existingTracks = browserRef.current.trackViews
      ?.map((tv: any) => tv.track)
      .filter((tr: any) => tr.name === "Variants");
    existingTracks?.forEach((tr: any) => browserRef.current.removeTrack(tr));

    // Convert variants to BED-like features
    const features = variants.items.map((v: any) => ({
      chr: v.chromosome.startsWith("chr") ? v.chromosome : `chr${v.chromosome}`,
      start: v.position - 1,
      end: v.position + Math.max(v.refAllele?.length ?? 1, 1),
      name: `${v.geneSymbol} ${v.hgvsP ?? v.hgvsC ?? `${v.refAllele}>${v.altAllele}`}`,
      score: 0,
      strand: ".",
      color: ACMG_COLORS[v.acmgClass] ?? "#6b7280",
    }));

    browserRef.current.loadTrack({
      name: "Variants",
      type: "annotation",
      format: "bed",
      features: features,
      displayMode: "EXPANDED",
      color: "#6366f1",
      height: 120,
    });

    // Navigate to first variant
    if (features.length > 0) {
      const first = features[0];
      const padding = 1000;
      browserRef.current.search(`${first.chr}:${Math.max(0, first.start - padding)}-${first.end + padding}`);
    }
  };

  useEffect(() => {
    if (variants?.items?.length && browserRef.current) {
      loadVariants();
    }
  }, [variants]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("genomics.browser.pageTitle")}</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Sample ID:</label>
          <input
            type="number"
            className="h-9 w-28 rounded-md border px-3 text-sm"
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
            placeholder="Sample ID"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">{t("genomics.browser.locus")}:</label>
          <input
            type="text"
            className="h-9 w-72 rounded-md border px-3 text-sm font-mono"
            value={locus}
            onChange={(e) => setLocus(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && browserRef.current) {
                browserRef.current.search(locus);
              }
            }}
          />
        </div>
        {variants?.items?.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {variants.items.length} variants loaded
          </Badge>
        )}
      </div>

      {!sampleId && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("genomics.browser.noSample")}
          </CardContent>
        </Card>
      )}

      {/* IGV Container */}
      <Card>
        <CardContent className="p-0">
          <div ref={igvDiv} style={{ minHeight: 500 }} />
        </CardContent>
      </Card>
    </div>
  );
}
