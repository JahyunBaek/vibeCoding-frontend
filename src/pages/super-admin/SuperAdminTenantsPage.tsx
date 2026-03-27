import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Plus, X, Copy, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TenantListRow } from "@/types/tenant";

const PAGE_SIZE = 10;

export default function SuperAdminTenantsPage() {
  const { t } = useTranslation();
  const { data, refetch } = useQuery({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => api.superAdminTenants(1, 200),
  });

  const [page, setPage] = useState(1);
  const allItems: TenantListRow[] = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const paged = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ tenantId: number; adminUsername: string; adminPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const createTenantSchema = z.object({
    tenantKey: z.string().min(1, t("tenant.tenantKeyRequired")),
    tenantName: z.string().min(1, t("tenant.tenantNameRequired")),
    planType: z.string().min(1, t("tenant.planRequired")),
    adminUsername: z.string().min(1, t("tenant.adminIdRequired")),
    adminPassword: z.string().min(1, t("tenant.adminPasswordRequired")),
  });
  type CreateTenantFormData = z.infer<typeof createTenantSchema>;

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: createErrors } } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { tenantKey: "", tenantName: "", planType: "FREE", adminUsername: "", adminPassword: "Admin1234!" },
  });

  const createMut = useMutation({
    mutationFn: (data: CreateTenantFormData) => api.superAdminTenantCreate({
      tenantKey: data.tenantKey, tenantName: data.tenantName, planType: data.planType,
      adminUsername: data.adminUsername, adminPassword: data.adminPassword,
    }),
    onSuccess: (result) => {
      resetCreate();
      setShowCreate(false);
      setCreatedCreds(result);
      toast.success(t("tenant.created"));
      refetch();
    },
    onError: (e: Error) => toast.error(e.message ?? t("tenant.createFailed")),
  });

  const copyCredsToClipboard = () => {
    if (!createdCreds) return;
    navigator.clipboard.writeText(`ID: ${createdCreds.adminUsername}\nPW: ${createdCreds.adminPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Edit ---
  const [editTenant, setEditTenant] = useState<TenantListRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editActive, setEditActive] = useState(true);

  const startEdit = (t_: TenantListRow) => {
    setEditTenant(t_);
    setEditName(t_.tenantName);
    setEditPlan(t_.planType);
    setEditActive(t_.active);
    setShowCreate(false);
  };

  const saveMut = useMutation({
    mutationFn: () => api.superAdminTenantUpdate(editTenant!.tenantId, { tenantName: editName, planType: editPlan, active: editActive }),
    onSuccess: () => {
      toast.success(t("tenant.updated"));
      setEditTenant(null);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message ?? t("tenant.updateFailed")),
  });

  const [deleteTarget, setDeleteTarget] = useState<TenantListRow | null>(null);

  const deleteMut = useMutation({
    mutationFn: () => api.superAdminTenantDelete(deleteTarget!.tenantId),
    onSuccess: () => {
      toast.success(t("tenant.deleted"));
      refetch();
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message ?? t("tenant.deleteFailed"));
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("tenant.pageTitle")}</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>{t("tenant.list")}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-fg">{allItems.length}{t("common.items")}</span>
            <Button
              variant="outline"
              onClick={() => { setShowCreate((v) => !v); setEditTenant(null); }}
            >
              {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showCreate ? t("common.close") : t("tenant.newTenant")}
            </Button>
          </div>
        </CardHeader>

        {/* Created credentials banner */}
        {createdCreds && (
          <div className="mx-6 mb-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {t("tenant.createdBanner")}
              </div>
              <button onClick={() => setCreatedCreds(null)} className="text-muted-fg hover:text-foreground text-xs">{t("common.close")}</button>
            </div>
            <div className="rounded-md bg-surface border px-4 py-3 font-mono text-sm space-y-1">
              <div><span className="text-muted-fg text-xs">{t("tenant.loginIdLabel")}</span><br /><span className="font-semibold">{createdCreds.adminUsername}</span></div>
              <div><span className="text-muted-fg text-xs">{t("tenant.passwordLabel")}</span><br /><span className="font-semibold">{createdCreds.adminPassword}</span></div>
            </div>
            <Button variant="outline" className="h-7 text-xs gap-1.5" onClick={copyCredsToClipboard}>
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("common.copied") : t("tenant.clipboardCopy")}
            </Button>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <form
            className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3"
            onSubmit={handleSubmitCreate((data) => createMut.mutate(data))}
          >
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">{t("tenant.newTenantLabel")}</div>
            <div className="flex gap-2 flex-wrap">
              <div>
                <Input className="w-36" {...registerCreate("tenantKey")} placeholder={t("tenant.tenantKey")} />
                {createErrors.tenantKey && <p className="text-xs text-red-500 mt-1">{createErrors.tenantKey.message}</p>}
              </div>
              <div>
                <Input className="w-48" {...registerCreate("tenantName")} placeholder={t("tenant.tenantName")} />
                {createErrors.tenantName && <p className="text-xs text-red-500 mt-1">{createErrors.tenantName.message}</p>}
              </div>
              <div>
                <Input className="w-28" {...registerCreate("planType")} placeholder={t("tenant.tenantPlan")} />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-end">
              <div className="space-y-1">
                <div className="text-xs text-muted-fg">{t("tenant.adminId")}</div>
                <Input className="w-40" {...registerCreate("adminUsername")} placeholder="admin" />
                {createErrors.adminUsername && <p className="text-xs text-red-500 mt-1">{createErrors.adminUsername.message}</p>}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-fg">{t("tenant.adminPassword")}</div>
                <Input className="w-40" {...registerCreate("adminPassword")} placeholder="Admin1234!" />
                {createErrors.adminPassword && <p className="text-xs text-red-500 mt-1">{createErrors.adminPassword.message}</p>}
              </div>
              <Button type="submit" disabled={createMut.isPending}>{t("common.create")}</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel")}</Button>
            </div>
            <div className="text-xs text-muted-fg">{t("tenant.autoInitNote")}</div>
          </form>
        )}

        {/* Edit Panel */}
        {editTenant && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              {t("admin.editing")} — {editTenant.tenantName} <span className="text-blue-400">(Key: {editTenant.tenantKey})</span>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Input className="w-48" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t("tenant.tenantName")} />
              <Input className="w-28" value={editPlan} onChange={(e) => setEditPlan(e.target.value)} placeholder={t("tenant.plan")} />
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="h-4 w-4"
                />
                {t("tenant.activeLabel")}
              </label>
              <Button onClick={() => saveMut.mutate()} disabled={!editName.trim() || saveMut.isPending}>{t("common.save")}</Button>
              <Button variant="outline" onClick={() => setEditTenant(null)}>{t("common.cancel")}</Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">{t("tenant.key")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("common.name")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("tenant.plan")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("tenant.status")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("tenant.userCount")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("tenant.createdAt")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((t_) => (
                <tr
                  key={t_.tenantId}
                  className={`hover:bg-muted/60 transition-colors ${editTenant?.tenantId === t_.tenantId ? "bg-blue-500/5" : ""}`}
                >
                  <td className="px-4 py-3 text-xs text-muted-fg font-mono">{t_.tenantId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t_.tenantKey}</td>
                  <td className="px-4 py-3 font-medium">{t_.tenantName}</td>
                  <td className="px-4 py-3 text-xs">{t_.planType}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t_.active ? "default" : "secondary"}>
                      {t_.active ? t("tenant.active") : t("tenant.inactive")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-fg">{t_.userCount}{t("common.persons")}</td>
                  <td className="px-4 py-3 text-xs text-muted-fg">{t_.createdAt?.slice(0, 10) ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(t_)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />{t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() => setDeleteTarget(t_)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />{t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {t("tenant.noTenants")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t("tenant.deleteTitle")}
        description={t("tenant.deleteConfirm", { name: deleteTarget?.tenantName })}
        confirmLabel={t("common.delete")}
        onConfirm={() => deleteMut.mutate()}
      />
    </div>
  );
}
