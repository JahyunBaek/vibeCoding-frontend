import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Star, MoreHorizontal, X, ArrowUp, ArrowDown, User, Lock } from "lucide-react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import UserPickerDialog from "@/components/UserPickerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TemplateListRow, TemplateStep } from "@/lib/api/approval";

export default function MyApprovalLinesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: defs = [] } = useQuery({
    queryKey: ["approval", "defs", "active"],
    queryFn: () => api.approvalDefinitions(),
  });

  const [approvalCode, setApprovalCode] = useState<string>("");
  useEffect(() => {
    if (!approvalCode && defs.length > 0) setApprovalCode(defs[0].approvalCode);
  }, [defs, approvalCode]);

  const selectedDef = defs.find((d) => d.approvalCode === approvalCode);

  const { data: templates = [], refetch } = useQuery({
    queryKey: ["approval", "my-lines", approvalCode],
    queryFn: () => api.myLines(approvalCode),
    enabled: !!approvalCode,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["my", "orgs"],
    queryFn: () => api.orgsDirectoryTree(),
  });

  // 정책 필수 단계 — 사용자 단계 뒤에 자동으로 붙는 readonly 영역
  const { data: popupInit } = useQuery({
    queryKey: ["approval", "popup-init", approvalCode],
    queryFn: () => api.popupInit(approvalCode),
    enabled: !!approvalCode,
  });
  const requiredSteps = popupInit?.requiredSteps ?? [];

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [defaultYn, setDefaultYn] = useState(false);
  const [activeYn, setActiveYn] = useState(true);
  const [steps, setSteps] = useState<TemplateStep[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<TemplateListRow | null>(null);
  const [userPickerStep, setUserPickerStep] = useState<number | null>(null);

  const orgOptions = flattenOrgs(orgs);

  const resetForm = () => {
    setEditId(null);
    setTemplateName("");
    setDefaultYn(false);
    setActiveYn(true);
    setSteps([]);
    setShowEdit(false);
  };

  const startCreate = () => {
    resetForm();
    setSteps([newStep(1, "REQUEST")]);
    setShowEdit(true);
  };

  const startEdit = async (t: TemplateListRow) => {
    const detail = await api.myLineDetail(t.templateId);
    setEditId(detail.templateId);
    setTemplateName(detail.templateName);
    setDefaultYn(detail.defaultYn);
    setActiveYn(detail.activeYn);
    setSteps(detail.steps);
    setShowEdit(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!approvalCode) throw new Error("No approval code");
      const payload = {
        templateName,
        defaultYn,
        activeYn,
        steps: steps.map((s, i) => ({ ...s, stepOrder: i + 1 })),
      };
      if (editId) {
        await api.myLineUpdate(editId, payload);
      } else {
        await api.myLineCreate({ approvalCode, ...payload });
      }
    },
    onSuccess: () => {
      toast.success(editId ? t("approval.line.updated") : t("approval.line.created"));
      resetForm();
      refetch();
      qc.invalidateQueries({ queryKey: ["approval"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.myLineDelete(deleteTarget!.templateId),
    onSuccess: () => {
      toast.success(t("approval.line.deleted"));
      setDeleteTarget(null);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStep = (i: number, patch: Partial<TemplateStep>) => {
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addStep = () => setSteps([...steps, newStep(steps.length + 1, "REQUEST")]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("approval.line.pageTitle")}</div>

      {/* Approval Code 선택 */}
      <Card>
        <CardContent className="py-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">{t("approval.line.approvalCode")}:</label>
          <select
            className="h-9 rounded-md border bg-surface px-3 text-sm min-w-[260px]"
            value={approvalCode}
            onChange={(e) => {
              setApprovalCode(e.target.value);
              resetForm();
            }}
          >
            {defs.map((d) => (
              <option key={d.approvalCode} value={d.approvalCode}>
                {d.approvalName} ({d.approvalCode})
              </option>
            ))}
          </select>
          {selectedDef && selectedDef.useSupervisingDepartment && (
            <Badge variant="outline" className="text-xs">
              {t("approval.line.usesSupervising")}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* 양식 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>{t("approval.line.myTemplates")}</CardTitle>
          {!showEdit && (
            <Button size="sm" onClick={startCreate} disabled={!approvalCode}>
              <Plus className="mr-1 h-4 w-4" />
              {t("approval.line.new")}
            </Button>
          )}
        </CardHeader>

        {showEdit && (
          <div className="mx-4 mb-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {editId ? t("approval.line.editing") : t("approval.line.new")} · {selectedDef?.approvalName}
              </div>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-fg">{t("approval.line.templateName")} *</label>
                <Input className="mt-1 h-9" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 mt-5 text-sm">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={defaultYn} onChange={(e) => setDefaultYn(e.target.checked)} />{" "}
                  {t("approval.line.setAsDefault")}
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={activeYn} onChange={(e) => setActiveYn(e.target.checked)} />{" "}
                  {t("approval.line.active")}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t("approval.line.steps")}</div>
                <Button size="sm" variant="outline" onClick={addStep}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t("approval.line.addStep")}
                </Button>
              </div>
              {steps.length === 0 && (
                <div className="text-xs text-muted-fg py-4 text-center border border-dashed rounded">
                  {t("approval.line.noSteps")}
                </div>
              )}
              {steps.map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start rounded-md border bg-surface p-2">
                  <div className="col-span-1 flex items-center justify-center text-xs font-mono text-muted-fg">
                    {i + 1}
                  </div>
                  <Input
                    className="col-span-3 h-9"
                    placeholder={t("approval.line.stepName")}
                    value={s.stepName}
                    onChange={(e) => updateStep(i, { stepName: e.target.value })}
                  />
                  <select
                    className="col-span-2 h-9 rounded-md border bg-surface px-2 text-sm"
                    value={s.targetDepartmentType}
                    onChange={(e) =>
                      updateStep(i, {
                        targetDepartmentType: e.target.value as any,
                        targetDepartmentId: null,
                        targetUserId: null,
                      })
                    }
                  >
                    <option value="REQUEST">{t("approval.line.typeRequest")}</option>
                    <option value="SUPERVISING">{t("approval.line.typeSupervising")}</option>
                    <option value="CUSTOM">{t("approval.line.typeCustom")}</option>
                    <option value="USER">{t("approval.line.typeUser")}</option>
                  </select>
                  {s.targetDepartmentType === "CUSTOM" ? (
                    <select
                      className="col-span-3 h-9 rounded-md border bg-surface px-2 text-sm"
                      value={s.targetDepartmentId ?? ""}
                      onChange={(e) =>
                        updateStep(i, {
                          targetDepartmentId: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">—</option>
                      {orgOptions.map((o) => (
                        <option key={o.orgId} value={o.orgId}>
                          {"—".repeat(o.depth)} {o.name}
                        </option>
                      ))}
                    </select>
                  ) : s.targetDepartmentType === "USER" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="col-span-3 h-9 justify-start text-sm"
                      onClick={() => setUserPickerStep(i)}
                    >
                      <User className="mr-1.5 h-3.5 w-3.5" />
                      {s.targetUserName ? (
                        <span className="truncate">{s.targetUserName}</span>
                      ) : (
                        <span className="text-muted-fg">{t("approval.line.selectUser")}</span>
                      )}
                    </Button>
                  ) : (
                    <div className="col-span-3 text-xs text-muted-fg self-center">{t("approval.line.autoDept")}</div>
                  )}
                  <label className="col-span-2 flex items-center gap-1.5 text-xs self-center">
                    <input
                      type="checkbox"
                      checked={s.groupApprovalYn ?? true}
                      onChange={(e) => updateStep(i, { groupApprovalYn: e.target.checked })}
                    />{" "}
                    {t("approval.line.groupApproval")}
                  </label>
                  <div className="col-span-1 flex gap-1 justify-end">
                    <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => moveStep(i, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => moveStep(i, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => removeStep(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* 정책 필수 단계 — 사용자 단계 뒤에 강제로 붙는 영역 (readonly) */}
              {requiredSteps.length > 0 && (
                <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                    <Lock className="h-3 w-3" />
                    {t("approval.line.policyRequired")}
                    <span className="text-[10px] text-muted-fg font-normal">
                      ({t("approval.line.policyRequiredDesc")})
                    </span>
                  </div>
                  {requiredSteps.map((rs) => (
                    <div
                      key={rs.requiredStepId}
                      className="grid grid-cols-12 gap-2 items-center rounded bg-background px-2 py-1.5 text-sm"
                    >
                      <div className="col-span-1 flex items-center justify-center text-xs font-mono text-amber-700">
                        {steps.length + rs.stepOrder}
                      </div>
                      <div className="col-span-3 font-medium">{rs.stepName}</div>
                      <div className="col-span-2 text-xs text-muted-fg">
                        {rs.targetDepartmentType === "REQUEST"
                          ? t("approval.line.typeRequest")
                          : rs.targetDepartmentType === "SUPERVISING"
                            ? t("approval.line.typeSupervising")
                            : rs.targetDepartmentType === "USER"
                              ? t("approval.line.typeUser")
                              : t("approval.line.typeCustom")}
                      </div>
                      <div className="col-span-4 text-xs text-muted-fg truncate">
                        {rs.targetDepartmentType === "USER"
                          ? `👤 ${rs.targetUserName ?? `#${rs.targetUserId}`}`
                          : (rs.targetDepartmentName ?? t("approval.line.autoDept"))}
                      </div>
                      <div className="col-span-2 text-xs text-amber-700 self-center">
                        {rs.groupApprovalYn ? `[Group] ` : ""}
                        🔒 {t("approval.line.locked")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending || !templateName || steps.length === 0}
              >
                {saveMut.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">{t("approval.line.templateName")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.line.stepCount")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.line.default")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.line.active")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((tpl) => (
                <tr key={tpl.templateId} className="hover:bg-muted/60">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    {tpl.defaultYn && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                    {tpl.templateName}
                  </td>
                  <td className="px-4 py-3 text-muted-fg">{tpl.stepCount}</td>
                  <td className="px-4 py-3">{tpl.defaultYn ? "✓" : "—"}</td>
                  <td className="px-4 py-3">{tpl.activeYn ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(tpl)}>
                          <Pencil className="mr-2 h-4 w-4" /> {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(tpl)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {t("approval.line.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("approval.line.deleteTitle")}
        description={t("approval.line.deleteConfirm", { name: deleteTarget?.templateName ?? "" })}
        onConfirm={() => deleteMut.mutate()}
      />

      <UserPickerDialog
        open={userPickerStep !== null}
        onClose={() => setUserPickerStep(null)}
        selectedUserId={userPickerStep !== null ? steps[userPickerStep]?.targetUserId : null}
        onSelect={(u) => {
          if (userPickerStep !== null) {
            updateStep(userPickerStep, { targetUserId: u.userId, targetUserName: u.name });
          }
        }}
      />
    </div>
  );
}

function newStep(order: number, type: "REQUEST" | "SUPERVISING" | "CUSTOM" | "USER"): TemplateStep {
  return {
    stepOrder: order,
    stepName: "",
    approvalType: "APPROVE",
    targetDepartmentType: type,
    targetDepartmentId: null,
    targetUserId: null,
    groupApprovalYn: true,
    requiredYn: true,
  };
}

function flattenOrgs(tree: any[], depth = 0): { orgId: number; name: string; depth: number }[] {
  const out: { orgId: number; name: string; depth: number }[] = [];
  for (const n of tree ?? []) {
    out.push({ orgId: n.orgId, name: n.name, depth });
    if (n.children?.length) out.push(...flattenOrgs(n.children, depth + 1));
  }
  return out;
}
