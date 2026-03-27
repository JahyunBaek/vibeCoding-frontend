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
  ACTIVE: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  DISCHARGED: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  FOLLOW_UP: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  INACTIVE: "bg-gray-500/15 text-gray-500 border-gray-500/20",
};

export default function SamplePatientsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sample", "patients", page, status, department, search],
    queryFn: () => api.samplePatients(page, PAGE_SIZE, status || undefined, department || undefined, search || undefined),
  });

  const { data: statuses } = useQuery({
    queryKey: ["common-codes", "PATIENT_STATUS"],
    queryFn: () => api.commonCodes("PATIENT_STATUS"),
  });

  const { data: departments } = useQuery({
    queryKey: ["common-codes", "DEPARTMENT"],
    queryFn: () => api.commonCodes("DEPARTMENT"),
  });

  const { data: genders } = useQuery({
    queryKey: ["common-codes", "GENDER"],
    queryFn: () => api.commonCodes("GENDER"),
  });

  const { data: bloodTypes } = useQuery({
    queryKey: ["common-codes", "BLOOD_TYPE"],
    queryFn: () => api.commonCodes("BLOOD_TYPE"),
  });

  const genderMap = new Map((genders ?? []).map((g) => [g.code, g.name]));
  const deptMap = new Map((departments ?? []).map((d) => [d.code, d.name]));
  const bloodTypeMap = new Map((bloodTypes ?? []).map((b) => [b.code, b.name]));

  const items: any[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("sample.patientsPageTitle")}</div>

      {/* Mock data notice */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-600">
        <Info className="h-4 w-4 shrink-0" />
        {t("sample.mockDataNotice")}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>{t("sample.patients")}</CardTitle>
          <div className="flex items-center gap-2">
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
            <select
              className="h-9 rounded-md border bg-surface px-3 text-sm"
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            >
              <option value="">{t("sample.allDepartments")}</option>
              {(departments ?? []).map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-56"
                placeholder={t("sample.searchPatient")}
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
                <th className="px-4 py-3 text-left font-medium">{t("sample.patientNo")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.patientName")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.gender")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.birthDate")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.department")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.bloodType")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.status")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("sample.diagnosis")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((p: any) => (
                <tr key={p.patientNo} className="hover:bg-muted/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{p.patientNo}</td>
                  <td className="px-4 py-3 font-medium">{p.patientName}</td>
                  <td className="px-4 py-3 text-muted-fg">{genderMap.get(p.gender) ?? p.gender}</td>
                  <td className="px-4 py-3 text-muted-fg text-xs">{p.birthDate}</td>
                  <td className="px-4 py-3 text-muted-fg">{deptMap.get(p.department) ?? p.department}</td>
                  <td className="px-4 py-3 text-muted-fg">{bloodTypeMap.get(p.bloodType) ?? p.bloodType}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[p.status] ?? ""}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-fg text-xs">{p.diagnosis}</td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {search ? t("common.noSearchResults") : t("sample.noPatients")}
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
