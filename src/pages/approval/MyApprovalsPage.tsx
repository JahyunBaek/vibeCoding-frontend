import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Search, Inbox } from "lucide-react";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DocumentListRow } from "@/lib/api/approval";

type InboxTab = "requested" | "pending" | "processed";
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/15 text-gray-600 border-gray-500/20",
  IN_PROGRESS: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  APPROVED: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  REJECTED: "bg-red-500/15 text-red-600 border-red-500/20",
  WITHDRAWN: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  CANCELED: "bg-gray-500/15 text-gray-500 border-gray-500/20",
};

export default function MyApprovalsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<InboxTab>("pending");
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [approvalCode, setApprovalCode] = useState("");

  const { data: defs = [] } = useQuery({
    queryKey: ["approval", "defs", "active"],
    queryFn: () => api.adminDefinitions(true),
  });

  const { data } = useQuery({
    queryKey: ["approval", "inbox", tab, page, keyword, approvalCode],
    queryFn: () =>
      api.documentList({
        inbox: tab,
        page,
        size: PAGE_SIZE,
        keyword: keyword || undefined,
        approvalCode: approvalCode || undefined,
      }),
  });

  const items: DocumentListRow[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("approval.my.pageTitle")}</div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {(["pending", "requested", "processed"] as InboxTab[]).map((key) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-fg hover:text-foreground"
            }`}
          >
            {t(`approval.my.tab.${key}`)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <select
          className="h-9 rounded-md border bg-surface px-3 text-sm min-w-[200px]"
          value={approvalCode}
          onChange={(e) => {
            setApprovalCode(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("approval.my.allCodes")}</option>
          {defs.map((d) => (
            <option key={d.approvalCode} value={d.approvalCode}>
              {d.approvalName}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
          <Input
            className="pl-9 w-72"
            placeholder={t("approval.my.searchPlaceholder")}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-xs text-muted-fg ml-auto">{t("approval.my.totalCount", { count: total })}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">{t("approval.my.documentNo")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.my.approvalName")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.my.title")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.my.requester")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.my.currentStep")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.my.status")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.my.requestedAt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((d) => (
                <tr key={d.documentId} className="hover:bg-muted/60">
                  <td className="px-4 py-3">
                    <Link
                      to={`/approval/documents/${d.documentId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {d.documentNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-fg">{d.approvalName ?? d.approvalCode}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/approval/documents/${d.documentId}`} className="hover:underline">
                      {d.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-fg">
                    {d.requesterName}
                    {d.requesterDepartmentName && <span className="text-xs"> · {d.requesterDepartmentName}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-fg">
                    {d.currentStepName ? `${d.currentStepOrder}. ${d.currentStepName}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[d.status] ?? ""}>{t(`approval.status.${d.status}`)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-fg text-xs">
                    {d.requestedAt ? new Date(d.requestedAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-fg">
                    <Inbox className="mx-auto h-8 w-8 opacity-30 mb-2" />
                    {t("approval.my.empty")}
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
