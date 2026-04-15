import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6", "#ec4899", "#6b7280"];
const IMPACT_COLORS: Record<string, string> = {
  HIGH: "#ef4444",
  MODERATE: "#f97316",
  LOW: "#eab308",
  MODIFIER: "#9ca3af",
  UNKNOWN: "#d1d5db",
};
const ACMG_COLORS: Record<string, string> = {
  PATHOGENIC: "#ef4444",
  LIKELY_PATHOGENIC: "#f97316",
  VUS: "#eab308",
  LIKELY_BENIGN: "#22c55e",
  BENIGN: "#10b981",
  UNCLASSIFIED: "#d1d5db",
};

export default function GenomicsDashboardPage() {
  const { t } = useTranslation();
  const [sampleId, setSampleId] = useState<string>("");

  const { data: stats } = useQuery({
    queryKey: ["genomics", "stats", sampleId],
    queryFn: () => api.variantStats(sampleId ? Number(sampleId) : undefined),
  });

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("genomics.dashboard.pageTitle")}</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">{t("genomics.dashboard.sampleFilter")}:</label>
          <input
            type="number"
            placeholder={t("genomics.dashboard.allSamples")}
            className="h-9 w-32 rounded-md border px-3 text-sm"
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{stats.totalVariants?.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{t("genomics.dashboard.totalVariants")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{stats.totalSamples}</div>
            <div className="text-sm text-muted-foreground">{t("genomics.dashboard.totalSamples")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-600">
              {stats.byAcmgClass
                ?.filter((c: any) => c.label === "PATHOGENIC" || c.label === "LIKELY_PATHOGENIC")
                .reduce((sum: number, c: any) => sum + c.count, 0) ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Pathogenic</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-orange-500">
              {stats.byImpact?.find((c: any) => c.label === "HIGH")?.count ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">HIGH Impact</div>
          </CardContent>
        </Card>
      </div>

      {/* Chromosome Bar Chart */}
      {stats.byChromosome?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("genomics.dashboard.byChromosome")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.byChromosome}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Variant Type Pie */}
        {stats.byVariantType?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("genomics.dashboard.byVariantType")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.byVariantType}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.byVariantType.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Impact Pie */}
        {stats.byImpact?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("genomics.dashboard.byImpact")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.byImpact} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.byImpact.map((d: any, i: number) => (
                      <Cell key={i} fill={IMPACT_COLORS[d.label] ?? PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ACMG Pie */}
        {stats.byAcmgClass?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("genomics.dashboard.byAcmgClass")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.byAcmgClass}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.byAcmgClass.map((d: any, i: number) => (
                      <Cell key={i} fill={ACMG_COLORS[d.label] ?? PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Genes Bar Chart */}
      {stats.topGenes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("genomics.dashboard.topGenes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topGenes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
