import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
// 헬퍼 컴포넌트 RequiredStepsSection에서 사용
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Plus, X, Search, Lock } from "lucide-react";
import { api } from "@/lib/api";
import TenantSelector from "@/components/TenantSelector";
import ConfirmDialog from "@/components/ConfirmDialog";
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
import UserPickerDialog from "@/components/UserPickerDialog";
import type { DefinitionListRow, RequiredStepRow } from "@/lib/api/approval";

type FormState = {
  approvalCode: string;
  approvalName: string;
  description: string;
  useRequestDepartment: boolean;
  useSupervisingDepartment: boolean;
  defaultSupervisingDepartmentId: number | null;
  useGroupApproval: boolean;
  usePersonalLineTemplate: boolean;
  activeYn: boolean;
  sortOrder: number;
  remark: string;
};

const initialForm: FormState = {
  approvalCode: "",
  approvalName: "",
  description: "",
  useRequestDepartment: true,
  useSupervisingDepartment: false,
  defaultSupervisingDepartmentId: null,
  useGroupApproval: true,
  usePersonalLineTemplate: true,
  activeYn: true,
  sortOrder: 0,
  remark: "",
};

export default function AdminApprovalDefinitionsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DefinitionListRow | null>(null);

  const { data = [], refetch } = useQuery({
    queryKey: ["approval", "definitions", tenantId, search],
    queryFn: () => api.adminDefinitions(false, search || undefined, tenantId),
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin", "orgs", tenantId],
    queryFn: () => api.orgTree(tenantId),
  });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const resetForm = () => {
    setForm(initialForm);
    setEditId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setForm(initialForm);
    setEditId(null);
    setShowForm(true);
  };

  const startEdit = (d: DefinitionListRow) => {
    setForm({
      approvalCode: d.approvalCode,
      approvalName: d.approvalName,
      description: d.description ?? "",
      useRequestDepartment: d.useRequestDepartment,
      useSupervisingDepartment: d.useSupervisingDepartment,
      defaultSupervisingDepartmentId: d.defaultSupervisingDepartmentId ?? null,
      useGroupApproval: d.useGroupApproval,
      usePersonalLineTemplate: d.usePersonalLineTemplate,
      activeYn: d.activeYn,
      sortOrder: d.sortOrder,
      remark: "",
    });
    setEditId(d.definitionId);
    setShowForm(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editId) {
        await api.adminDefinitionUpdate(editId, form, tenantId);
      } else {
        await api.adminDefinitionCreate(form as any, tenantId);
      }
    },
    onSuccess: () => {
      toast.success(editId ? t("approval.def.updated") : t("approval.def.created"));
      resetForm();
      refetch();
      qc.invalidateQueries({ queryKey: ["approval"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.adminDefinitionDelete(deleteTarget!.definitionId, tenantId),
    onSuccess: () => {
      toast.success(t("approval.def.deleted"));
      setDeleteTarget(null);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orgOptions = flattenOrgs(orgs);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">{t("approval.def.pageTitle")}</div>
        <TenantSelector value={tenantId} onChange={setTenantId} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>{t("approval.def.list")}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-56"
                placeholder={t("approval.def.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {!showForm && (
              <Button size="sm" onClick={startCreate}>
                <Plus className="mr-1 h-4 w-4" />
                {t("approval.def.new")}
              </Button>
            )}
            {showForm && (
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="mr-1 h-4 w-4" />
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </CardHeader>

        {showForm && (
          <div className="mx-4 mb-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
            <div className="text-sm font-medium">{editId ? t("approval.def.editing") : t("approval.def.new")}</div>
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput
                label={t("approval.def.code")}
                required
                disabled={!!editId}
                value={form.approvalCode}
                onChange={(v) => setForm({ ...form, approvalCode: v })}
              />
              <LabeledInput
                label={t("approval.def.name")}
                required
                value={form.approvalName}
                onChange={(v) => setForm({ ...form, approvalName: v })}
              />
              <LabeledInput
                label={t("approval.def.description")}
                className="col-span-2"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
              />
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.useRequestDepartment}
                    onChange={(e) => setForm({ ...form, useRequestDepartment: e.target.checked })}
                  />{" "}
                  {t("approval.def.useRequestDept")}
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.useSupervisingDepartment}
                    onChange={(e) => setForm({ ...form, useSupervisingDepartment: e.target.checked })}
                  />{" "}
                  {t("approval.def.useSupervisingDept")}
                </label>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.useGroupApproval}
                    onChange={(e) => setForm({ ...form, useGroupApproval: e.target.checked })}
                  />{" "}
                  {t("approval.def.useGroupApproval")}
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.usePersonalLineTemplate}
                    onChange={(e) => setForm({ ...form, usePersonalLineTemplate: e.target.checked })}
                  />{" "}
                  {t("approval.def.usePersonalTemplate")}
                </label>
              </div>
              {form.useSupervisingDepartment && (
                <div className="col-span-2">
                  <label className="text-xs text-muted-fg">{t("approval.def.defaultSupervisingDept")}</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border bg-surface px-3 text-sm"
                    value={form.defaultSupervisingDepartmentId ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        defaultSupervisingDepartmentId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">{t("common.unassigned")}</option>
                    {orgOptions.map((o) => (
                      <option key={o.orgId} value={o.orgId}>
                        {"—".repeat(o.depth)} {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.activeYn}
                    onChange={(e) => setForm({ ...form, activeYn: e.target.checked })}
                  />{" "}
                  {t("approval.def.active")}
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  {t("approval.def.sortOrder")}
                  <Input
                    type="number"
                    className="h-7 w-20"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                {saveMut.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </div>

            {/* 편집 모드(=이미 저장된 정책)에서만 필수 단계 관리 */}
            {editId && <RequiredStepsSection definitionId={editId} tenantId={tenantId} orgOptions={orgOptions} />}
          </div>
        )}

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">{t("approval.def.code")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.def.name")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.def.useRequestDept")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.def.useSupervisingDept")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.def.defaultSupervisingDept")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.def.useGroupApproval")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("approval.def.active")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((d) => (
                <tr key={d.definitionId} className="hover:bg-muted/60">
                  <td className="px-4 py-3 font-mono text-xs">{d.approvalCode}</td>
                  <td className="px-4 py-3 font-medium">{d.approvalName}</td>
                  <td className="px-4 py-3">{d.useRequestDepartment ? "✓" : "—"}</td>
                  <td className="px-4 py-3">{d.useSupervisingDepartment ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-muted-fg">{d.defaultSupervisingDepartmentName ?? "—"}</td>
                  <td className="px-4 py-3">{d.useGroupApproval ? "✓" : "—"}</td>
                  <td className="px-4 py-3">
                    {d.activeYn ? (
                      <Badge>{t("approval.def.active")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("approval.def.inactive")}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(d)}>
                          <Pencil className="mr-2 h-4 w-4" /> {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(d)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {t("approval.def.empty")}
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
        title={t("approval.def.deleteTitle")}
        description={t("approval.def.deleteConfirm", { code: deleteTarget?.approvalCode ?? "" })}
        onConfirm={() => deleteMut.mutate()}
      />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  required,
  className,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-fg">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input className="mt-1 h-9" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
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

// ────────────────────────────────────────────────────────────
// 정책 필수 단계 관리 섹션
// ────────────────────────────────────────────────────────────

type NewStep = {
  stepName: string;
  targetDepartmentType: "REQUEST" | "SUPERVISING" | "CUSTOM" | "USER";
  targetDepartmentId: number | null;
  targetUserId: number | null;
  targetUserName: string | null;
  groupApprovalYn: boolean;
};

const initialNewStep: NewStep = {
  stepName: "",
  targetDepartmentType: "SUPERVISING",
  targetDepartmentId: null,
  targetUserId: null,
  targetUserName: null,
  groupApprovalYn: true,
};

function RequiredStepsSection({
  definitionId,
  tenantId,
  orgOptions,
}: {
  definitionId: number;
  tenantId: number | null;
  orgOptions: { orgId: number; name: string; depth: number }[];
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: detail, refetch } = useQuery({
    queryKey: ["approval", "definition", definitionId, tenantId],
    queryFn: () => api.adminDefinitionDetail(definitionId, tenantId),
  });

  const requiredSteps: RequiredStepRow[] = detail?.requiredSteps ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [newStep, setNewStep] = useState<NewStep>(initialNewStep);
  const [pickUserOpen, setPickUserOpen] = useState(false);

  const addMut = useMutation({
    mutationFn: () =>
      api.adminRequiredStepAdd(
        definitionId,
        {
          stepName: newStep.stepName,
          targetDepartmentType: newStep.targetDepartmentType,
          targetDepartmentId: newStep.targetDepartmentType === "CUSTOM" ? newStep.targetDepartmentId : null,
          targetUserId: newStep.targetDepartmentType === "USER" ? newStep.targetUserId : null,
          groupApprovalYn: newStep.groupApprovalYn,
        },
        tenantId,
      ),
    onSuccess: () => {
      toast.success(t("approval.def.requiredStepAdded"));
      setNewStep(initialNewStep);
      setShowAdd(false);
      refetch();
      qc.invalidateQueries({ queryKey: ["approval"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (requiredStepId: number) => api.adminRequiredStepDelete(definitionId, requiredStepId, tenantId),
    onSuccess: () => {
      toast.success(t("approval.def.requiredStepDeleted"));
      refetch();
      qc.invalidateQueries({ queryKey: ["approval"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit =
    newStep.stepName.trim() !== "" &&
    (newStep.targetDepartmentType !== "CUSTOM" || newStep.targetDepartmentId != null) &&
    (newStep.targetDepartmentType !== "USER" || newStep.targetUserId != null);

  return (
    <div className="mt-4 rounded-md border bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-amber-600" />
          {t("approval.def.requiredSteps")}
        </div>
        {!showAdd && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t("approval.def.addRequiredStep")}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-fg mb-2">{t("approval.def.requiredStepsDesc")}</p>

      {/* 기존 필수 단계 목록 */}
      <div className="space-y-1.5">
        {requiredSteps.length === 0 ? (
          <div className="text-xs text-muted-fg py-3 text-center border border-dashed rounded">
            {t("approval.def.noRequiredSteps")}
          </div>
        ) : (
          requiredSteps.map((s) => (
            <div
              key={s.requiredStepId}
              className="flex items-center gap-2 rounded border bg-amber-500/5 px-3 py-2 text-sm"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs font-mono text-amber-700">
                {s.stepOrder}
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
              <Button
                variant="ghost"
                className="ml-auto h-6 w-6 p-0 text-red-600"
                onClick={() => deleteMut.mutate(s.requiredStepId)}
                disabled={deleteMut.isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* 새 단계 추가 폼 */}
      {showAdd && (
        <div className="mt-3 rounded border bg-background p-3 space-y-2">
          <div className="grid grid-cols-12 gap-2 items-start">
            <Input
              className="col-span-3 h-9"
              placeholder={t("approval.line.stepName")}
              value={newStep.stepName}
              onChange={(e) => setNewStep({ ...newStep, stepName: e.target.value })}
            />
            <select
              className="col-span-2 h-9 rounded-md border bg-surface px-2 text-sm"
              value={newStep.targetDepartmentType}
              onChange={(e) =>
                setNewStep({
                  ...newStep,
                  targetDepartmentType: e.target.value as NewStep["targetDepartmentType"],
                  targetDepartmentId: null,
                  targetUserId: null,
                  targetUserName: null,
                })
              }
            >
              <option value="REQUEST">{t("approval.line.typeRequest")}</option>
              <option value="SUPERVISING">{t("approval.line.typeSupervising")}</option>
              <option value="CUSTOM">{t("approval.line.typeCustom")}</option>
              <option value="USER">{t("approval.line.typeUser")}</option>
            </select>

            {newStep.targetDepartmentType === "CUSTOM" && (
              <select
                className="col-span-4 h-9 rounded-md border bg-surface px-2 text-sm"
                value={newStep.targetDepartmentId ?? ""}
                onChange={(e) =>
                  setNewStep({
                    ...newStep,
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
            )}
            {newStep.targetDepartmentType === "USER" && (
              <Button
                variant="outline"
                size="sm"
                className="col-span-4 h-9 justify-start"
                onClick={() => setPickUserOpen(true)}
              >
                {newStep.targetUserName ?? t("approval.line.pickUser")}
              </Button>
            )}
            {(newStep.targetDepartmentType === "REQUEST" || newStep.targetDepartmentType === "SUPERVISING") && (
              <div className="col-span-4 text-xs text-muted-fg self-center">{t("approval.line.autoDept")}</div>
            )}

            <label className="col-span-2 flex items-center gap-1.5 text-xs self-center">
              <input
                type="checkbox"
                checked={newStep.groupApprovalYn}
                onChange={(e) => setNewStep({ ...newStep, groupApprovalYn: e.target.checked })}
              />{" "}
              {t("approval.line.groupApproval")}
            </label>

            <div className="col-span-1 flex gap-1 justify-end">
              <Button
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => {
                  setShowAdd(false);
                  setNewStep(initialNewStep);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={!canSubmit || addMut.isPending} onClick={() => addMut.mutate()}>
              {addMut.isPending ? t("common.saving") : t("approval.def.addRequiredStep")}
            </Button>
          </div>
        </div>
      )}

      <UserPickerDialog
        open={pickUserOpen}
        onClose={() => setPickUserOpen(false)}
        onSelect={(u) => {
          setNewStep({ ...newStep, targetUserId: u.userId, targetUserName: u.name });
          setPickUserOpen(false);
        }}
        selectedUserId={newStep.targetUserId}
      />
    </div>
  );
}
