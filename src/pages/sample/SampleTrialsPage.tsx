import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Info } from "lucide-react";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-slate-500/15 text-slate-600 border-slate-500/20",
  RECRUITING: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  ACTIVE: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  COMPLETED: "bg-emerald-600/15 text-emerald-700 border-emerald-600/20",
  SUSPENDED: "bg-red-500/15 text-red-600 border-red-500/20",
};

export default function SampleTrialsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sample", "trials", page, phase, status, search],
    queryFn: () => api.sampleTrials(page, PAGE_SIZE, phase || undefined, status || undefined, search || undefined),
  });

  const { data: phases } = useQuery({
    queryKey: ["common-codes", "TRIAL_PHASE"],
    queryFn: () => api.commonCodes("TRIAL_PHASE"),
  });

  const { data: statuses } = useQuery({
    queryKey: ["common-codes", "TRIAL_STATUS"],
    queryFn: () => api.commonCodes("TRIAL_STATUS"),
  });

  const items: any[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("sample.trialsPageTitle")}</div>

      {/* Mock data notice */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-600">
        <Info className="h-4 w-4 shrink-0" />
        {t("sample.mockDataNotice")}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>{t("sample.trials")}</CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border bg-surface px-3 text-sm"
              value={phase}
              onChange={(e) => { setPhase(e.target.value); setPage(1); }}
            >
              <option value="">{t("sample.allPhases")}</option>
              {(phases ?? []).map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-surface px-3 text-sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">{t("sample.allStatuses")}</option>
              {(statuses ?? []).map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-56"
                placeholder={t("sample.searchTrial")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-fg">{t("sample.totalCount", { count: total })}</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">{t("sample.trialNo")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.trialTitle")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.phase")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.status")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.sponsor")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.period")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.enrollment")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((tr: any) => {
                const pct = tr.targetCount > 0 ? Math.round((tr.enrolledCount / tr.targetCount) * 100) : 0;
                return (
                  <tr key={tr.trialNo} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{tr.trialNo}</td>
                    <td className="px-4 py-3 font-medium max-w-[240px] truncate">{tr.title}</td>
                    <td className="px-4 py-3 text-muted-fg">{tr.phase}</td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[tr.status] ?? ""}>{tr.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-fg">{tr.sponsor}</td>
                    <td className="px-4 py-3 text-muted-fg text-xs">
                      {tr.startDate} ~ {tr.endDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-fg whitespace-nowrap">
                          {t("sample.enrolled", { enrolled: tr.enrolledCount, target: tr.targetCount })}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {search ? t("common.noSearchResults") : t("sample.noTrials")}
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
