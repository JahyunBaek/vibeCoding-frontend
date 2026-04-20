import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, Undo2, Clock, User } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/15 text-gray-600 border-gray-500/20",
  IN_PROGRESS: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  APPROVED: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  REJECTED: "bg-red-500/15 text-red-600 border-red-500/20",
  WITHDRAWN: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  CANCELED: "bg-gray-500/15 text-gray-500 border-gray-500/20",
  PENDING: "bg-blue-500/15 text-blue-600 border-blue-500/20",
};

export default function ApprovalDetailPage() {
  const { t } = useTranslation();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const docId = Number(documentId);

  const { data: doc, refetch } = useQuery({
    queryKey: ["approval", "doc", docId],
    queryFn: () => api.documentDetail(docId),
  });

  const [comment, setComment] = useState("");
  const [actionMode, setActionMode] = useState<"APPROVE" | "REJECT" | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const currentStep = doc?.steps.find((s) => s.status === "PENDING");
  const isRequester = doc?.requesterUserId === user?.userId;
  const canAct =
    doc?.status === "IN_PROGRESS" &&
    currentStep &&
    // 프론트 선반영 — 백엔드에서 최종 검증
    (currentStep.targetDepartmentId == null || currentStep.targetDepartmentId === (user?.orgId ?? null)) &&
    (currentStep.targetRoleKey == null || currentStep.targetRoleKey === user?.roleKey) &&
    currentStep.actedByUserId !== user?.userId;

  const invalidate = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ["approval", "inbox"] });
  };

  const approveMut = useMutation({
    mutationFn: () => api.documentApprove(docId, currentStep!.stepId, comment),
    onSuccess: () => {
      toast.success(t("approval.detail.approved"));
      setComment(""); setActionMode(null); invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: () => api.documentReject(docId, currentStep!.stepId, comment),
    onSuccess: () => {
      toast.success(t("approval.detail.rejected"));
      setComment(""); setActionMode(null); invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const withdrawMut = useMutation({
    mutationFn: () => api.documentWithdraw(docId),
    onSuccess: () => {
      toast.success(t("approval.detail.withdrawn"));
      setWithdrawOpen(false); invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!doc) return <div className="p-6 text-sm text-muted-fg">{t("common.loading")}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("approval.detail.back")}
        </Button>
        <Badge className={STATUS_COLORS[doc.status]}>
          {t(`approval.status.${doc.status}`)}
        </Badge>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono text-muted-fg">{doc.documentNo}</div>
              <CardTitle className="mt-1">{doc.title}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-fg">
                <span>{t("approval.detail.approvalName")}: {doc.approvalName ?? doc.approvalCode}</span>
                <span>
                  {t("approval.detail.requester")}:
                  <User className="inline h-3 w-3 mx-1" />
                  {doc.requesterName}
                  {doc.requesterDepartmentName && ` · ${doc.requesterDepartmentName}`}
                </span>
                {doc.supervisingDepartmentName && (
                  <span>{t("approval.detail.supervisingDept")}: {doc.supervisingDepartmentName}</span>
                )}
                <span>
                  <Clock className="inline h-3 w-3 mr-1" />
                  {doc.requestedAt && new Date(doc.requestedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="text-sm whitespace-pre-wrap">{doc.body || <span className="text-muted-fg">—</span>}</div>
        </CardContent>
      </Card>

      {/* 결재선 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("approval.detail.steps")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-2 text-left font-medium w-12">#</th>
                <th className="px-4 py-2 text-left font-medium">{t("approval.detail.stepName")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("approval.detail.targetDept")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("approval.detail.stepStatus")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("approval.detail.actedBy")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("approval.detail.comment")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {doc.steps.map((s) => (
                <tr key={s.stepId}>
                  <td className="px-4 py-2 font-mono text-xs">{s.stepOrder}</td>
                  <td className="px-4 py-2 font-medium">{s.stepName}</td>
                  <td className="px-4 py-2 text-muted-fg text-xs">
                    {s.targetDepartmentName ?? `(${s.targetDepartmentType})`}
                    {s.groupApprovalYn && <span className="ml-1 text-[10px] text-primary">[Group]</span>}
                  </td>
                  <td className="px-4 py-2">
                    <Badge className={STATUS_COLORS[s.status] ?? ""}>
                      {t(`approval.stepStatus.${s.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-fg">
                    {s.actedByName ? (
                      <>
                        {s.actedByName}
                        <div>{s.actedAt && new Date(s.actedAt).toLocaleString()}</div>
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2 text-xs">{s.comment ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 액션 영역 */}
      {(canAct || isRequester) && doc.status === "IN_PROGRESS" && (
        <Card>
          <CardContent className="py-4 space-y-3">
            {canAct && actionMode === null && (
              <div className="flex gap-2">
                <Button onClick={() => setActionMode("APPROVE")} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {t("approval.detail.approve")}
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setActionMode("REJECT")}>
                  <XCircle className="mr-1 h-4 w-4" />
                  {t("approval.detail.reject")}
                </Button>
                {isRequester && (
                  <Button variant="outline" onClick={() => setWithdrawOpen(true)} className="ml-auto">
                    <Undo2 className="mr-1 h-4 w-4" />
                    {t("approval.detail.withdraw")}
                  </Button>
                )}
              </div>
            )}
            {canAct && actionMode !== null && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {actionMode === "APPROVE"
                    ? t("approval.detail.approveComment")
                    : t("approval.detail.rejectComment")}
                </div>
                <textarea
                  className="w-full resize-none rounded-md border bg-surface px-3 py-2 text-sm"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("approval.detail.commentPlaceholder")}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm"
                    onClick={() => { setActionMode(null); setComment(""); }}>
                    {t("common.cancel")}
                  </Button>
                  <Button size="sm"
                    className={actionMode === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"}
                    onClick={() => (actionMode === "APPROVE" ? approveMut.mutate() : rejectMut.mutate())}
                    disabled={approveMut.isPending || rejectMut.isPending}>
                    {t(`approval.detail.${actionMode === "APPROVE" ? "approve" : "reject"}`)}
                  </Button>
                </div>
              </div>
            )}
            {!canAct && isRequester && (
              <div className="flex">
                <Button variant="outline" onClick={() => setWithdrawOpen(true)} className="ml-auto">
                  <Undo2 className="mr-1 h-4 w-4" />
                  {t("approval.detail.withdraw")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 이력 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("approval.detail.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {doc.history.map((h) => (
              <div key={h.historyId} className="flex gap-2 text-sm border-l-2 border-primary/30 pl-3 py-1">
                <div className="font-medium w-20">{t(`approval.action.${h.actionType}`)}</div>
                <div className="text-muted-fg text-xs self-center">
                  {h.actionByName} · {new Date(h.actionAt).toLocaleString()}
                </div>
                {h.actionComment && <div className="ml-2 text-xs">"{h.actionComment}"</div>}
              </div>
            ))}
            {doc.history.length === 0 && (
              <div className="text-sm text-muted-fg py-4 text-center">{t("approval.detail.noHistory")}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title={t("approval.detail.withdrawTitle")}
        description={t("approval.detail.withdrawConfirm")}
        confirmLabel={t("approval.detail.withdraw")}
        onConfirm={() => withdrawMut.mutate()}
      />
    </div>
  );
}
