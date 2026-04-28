import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Send, Info, X, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { TemplateStep } from "@/lib/api/approval";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** 결재 기능 코드 (업무 화면에서 전달) */
  approvalCode: string;
  /** 업무 원문서 참조 */
  businessType?: string;
  businessId?: string;
  /** 결재 제목 기본값 */
  defaultTitle?: string;
  /** 결재 본문 기본값 */
  defaultBody?: string;
  /** 상신 성공 시 콜백 — documentId 전달 */
  onSuccess?: (documentId: number) => void;
};

/**
 * 공통 결재 요청 다이얼로그.
 * 업무 화면에서 approvalCode 만 넘기면 정책+기본양식이 자동 로드되어 상신까지 처리.
 *
 * 사용 예시:
 *   <ApprovalRequestDialog
 *     open={open} onOpenChange={setOpen}
 *     approvalCode="PURCHASE_APPROVAL"
 *     businessType="PURCHASE" businessId="1234"
 *     defaultTitle="구매요청 - 노트북 5대"
 *     onSuccess={(id) => toast.success("상신됨 #" + id)}
 *   />
 */
export default function ApprovalRequestDialog(props: Props) {
  const { open, onOpenChange, approvalCode, businessType, businessId, defaultTitle, defaultBody, onSuccess } = props;
  const { t } = useTranslation();

  const [title, setTitle] = useState(defaultTitle ?? "");
  const [body, setBody] = useState(defaultBody ?? "");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [supervisingDeptId, setSupervisingDeptId] = useState<number | null>(null);

  const { data: init } = useQuery({
    queryKey: ["approval", "popup-init", approvalCode, open],
    queryFn: () => api.popupInit(approvalCode),
    enabled: open && !!approvalCode,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["my", "orgs"],
    queryFn: () => api.orgTree(null),
    enabled: open,
  });

  // Init defaults when opened
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle ?? "");
      setBody(defaultBody ?? "");
    }
  }, [open, defaultTitle, defaultBody]);

  useEffect(() => {
    if (init?.defaultTemplate) {
      setTemplateId(init.defaultTemplate.templateId);
    } else {
      setTemplateId(null);
    }
    if (init?.definition?.useSupervisingDepartment) {
      setSupervisingDeptId(init.definition.defaultSupervisingDepartmentId ?? null);
    }
  }, [init]);

  const selectedTemplate = init?.templates.find((t) => t.templateId === templateId);
  const previewSteps: TemplateStep[] =
    templateId && init?.defaultTemplate?.templateId === templateId
      ? (init?.defaultTemplate?.steps ?? [])
      : (init?.previewSteps ?? []);
  // 선택한 양식이 default와 다르면 추가 조회 필요 — 간단화를 위해 기본 양식의 단계만 표시
  // (추후 선택 양식 상세 조회 확장)

  const requestMut = useMutation({
    mutationFn: () => {
      if (!title.trim()) throw new Error(t("approval.dialog.titleRequired"));
      return api.documentRequest({
        approvalCode,
        businessType,
        businessId,
        title,
        body,
        supervisingDepartmentId: supervisingDeptId,
        templateId: templateId ?? undefined,
      });
    },
    onSuccess: (docId) => {
      toast.success(t("approval.dialog.submitted"));
      onOpenChange(false);
      onSuccess?.(docId);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!open) return null;

  const orgOptions = flattenOrgs(orgs);
  const def = init?.definition;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-5 py-3">
          <div>
            <div className="text-sm font-semibold">{t("approval.dialog.title")}</div>
            {def && (
              <div className="text-xs text-muted-fg mt-0.5">
                {def.approvalName} <span className="font-mono">({def.approvalCode})</span>
              </div>
            )}
          </div>
          <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!init ? (
          <div className="p-8 text-center text-sm text-muted-fg">{t("common.loading")}</div>
        ) : (
          <div className="p-5 space-y-4">
            {!def?.activeYn && (
              <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                <Info className="h-4 w-4" />
                {t("approval.dialog.inactiveDef")}
              </div>
            )}

            {/* 제목 */}
            <div>
              <label className="text-xs text-muted-fg">{t("approval.dialog.docTitle")} *</label>
              <Input
                className="mt-1 h-9"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("approval.dialog.docTitlePlaceholder")}
              />
            </div>

            {/* 본문 */}
            <div>
              <label className="text-xs text-muted-fg">{t("approval.dialog.docBody")}</label>
              <textarea
                className="mt-1 w-full resize-none rounded-md border bg-surface px-3 py-2 text-sm"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* 주관부서 */}
            {def?.useSupervisingDepartment && (
              <div>
                <label className="text-xs text-muted-fg">{t("approval.dialog.supervisingDept")}</label>
                <select
                  className="mt-1 h-9 w-full rounded-md border bg-surface px-3 text-sm"
                  value={supervisingDeptId ?? ""}
                  onChange={(e) => setSupervisingDeptId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">—</option>
                  {orgOptions.map((o) => (
                    <option key={o.orgId} value={o.orgId}>
                      {"—".repeat(o.depth)} {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 결재선 양식 선택 */}
            {def?.usePersonalLineTemplate && init.templates.length > 0 && (
              <div>
                <label className="text-xs text-muted-fg">{t("approval.dialog.chooseTemplate")}</label>
                <select
                  className="mt-1 h-9 w-full rounded-md border bg-surface px-3 text-sm"
                  value={templateId ?? ""}
                  onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t("approval.dialog.noTemplate")}</option>
                  {init.templates.map((tpl) => (
                    <option key={tpl.templateId} value={tpl.templateId}>
                      {tpl.defaultYn ? "★ " : ""}
                      {tpl.templateName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 결재선 미리보기 */}
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="text-xs font-medium mb-2">{t("approval.dialog.linePreview")}</div>
              {previewSteps.length === 0 && (init.requiredSteps ?? []).length === 0 ? (
                <div className="text-xs text-muted-fg">{t("approval.dialog.noLine")}</div>
              ) : (
                <ol className="space-y-1.5">
                  {previewSteps.map((s, i) => (
                    <li key={`u-${i}`} className="flex items-center gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-mono text-primary">
                        {i + 1}
                      </span>
                      <span className="font-medium">{s.stepName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {s.targetDepartmentType === "REQUEST"
                          ? t("approval.line.typeRequest")
                          : s.targetDepartmentType === "SUPERVISING"
                            ? t("approval.line.typeSupervising")
                            : s.targetDepartmentType === "USER"
                              ? `👤 ${s.targetUserName ?? `#${s.targetUserId}`}`
                              : (s.targetDepartmentName ?? t("approval.line.typeCustom"))}
                      </Badge>
                      {s.groupApprovalYn && <span className="text-[10px] text-primary">[Group]</span>}
                    </li>
                  ))}
                  {/* 정책 필수 단계 — 사용자 단계 뒤에 자동 추가됨 */}
                  {(init.requiredSteps ?? []).map((rs, i) => (
                    <li
                      key={`r-${rs.requiredStepId}`}
                      className="flex items-center gap-2 text-sm rounded bg-amber-500/10 px-1.5 py-1"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs font-mono text-amber-700">
                        {previewSteps.length + i + 1}
                      </span>
                      <Lock className="h-3 w-3 text-amber-600" />
                      <span className="font-medium">{rs.stepName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {rs.targetDepartmentType === "REQUEST"
                          ? t("approval.line.typeRequest")
                          : rs.targetDepartmentType === "SUPERVISING"
                            ? t("approval.line.typeSupervising")
                            : rs.targetDepartmentType === "USER"
                              ? `👤 ${rs.targetUserName ?? `#${rs.targetUserId}`}`
                              : (rs.targetDepartmentName ?? t("approval.line.typeCustom"))}
                      </Badge>
                      {rs.groupApprovalYn && <span className="text-[10px] text-primary">[Group]</span>}
                      <span className="ml-auto text-[10px] text-amber-700">
                        {t("approval.dialog.policyRequiredBadge")}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {selectedTemplate?.templateId !== init.defaultTemplate?.templateId && selectedTemplate && (
                <div className="mt-2 text-[11px] text-amber-600">{t("approval.dialog.previewNote")}</div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => requestMut.mutate()}
                disabled={requestMut.isPending || !def?.activeYn || !title.trim()}
              >
                <Send className="mr-1 h-4 w-4" />
                {requestMut.isPending ? t("approval.dialog.submitting") : t("approval.dialog.submit")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function flattenOrgs(tree: any[], depth = 0): { orgId: number; name: string; depth: number }[] {
  const out: { orgId: number; name: string; depth: number }[] = [];
  for (const n of tree ?? []) {
    out.push({ orgId: n.orgId, name: n.name, depth });
    if (n.children?.length) out.push(...flattenOrgs(n.children, depth + 1));
  }
  return out;
}
