import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Plus, X, Search, KeyRound, Link2, Copy, Check, Download, Mail } from "lucide-react";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
import { useAuthStore } from "@/stores/auth";
import TenantSelector from "@/components/TenantSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 10;

function flattenOrgs(nodes: any[], depth = 0): { orgId: number; label: string; name: string }[] {
  return (nodes ?? []).flatMap((n) => [
    { orgId: n.orgId, label: `${"  ".repeat(depth)}${n.name}`, name: n.name },
    ...flattenOrgs(n.children ?? [], depth + 1),
  ]);
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.roleKey === "SUPER_ADMIN";
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["admin", "users", selectedTenantId],
    queryFn: () => api.usersList(undefined, 1, 500, selectedTenantId),
  });
  const { data: roles } = useQuery({ queryKey: ["admin", "roles", "all"], queryFn: () => api.rolesAll() });
  const assignableRoles = (roles ?? []).filter((r: any) => isSuperAdmin || r.roleKey !== "SUPER_ADMIN");
  const { data: orgTree } = useQuery({ queryKey: ["admin", "orgs", "tree"], queryFn: () => api.orgTree() });
  const flatOrgs = flattenOrgs(orgTree ?? []);
  const orgNameMap = new Map(flatOrgs.map((o) => [o.orgId, o.name]));

  // --- Search & Pagination ---
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const allItems: any[] = data?.items ?? [];
  const filtered = allItems.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.roleKey?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);

  const createUserSchema = z.object({
    username: z.string().min(1, t("auth.usernameRequired")),
    password: z.string().min(1, t("auth.passwordRequired")),
    name: z.string().min(1, t("auth.nameRequired")),
    roleKey: z.string().min(1, t("admin.roleRequired")),
    orgId: z.string(),
  });
  type CreateUserFormData = z.infer<typeof createUserSchema>;

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: createErrors } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: "", password: "User1234!", name: "", roleKey: "USER", orgId: "1" },
  });

  const createMut = useMutation({
    mutationFn: (data: CreateUserFormData) => api.userCreate({ username: data.username, password: data.password, name: data.name, roleKey: data.roleKey, orgId: data.orgId ? Number(data.orgId) : null, enabled: true, tenantId: selectedTenantId }),
    onSuccess: () => {
      resetCreate();
      setShowCreate(false);
      refetch();
      toast.success(t("admin.userCreated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Edit ---
  const [editUser, setEditUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editRoleKey, setEditRoleKey] = useState("");
  const [editOrgId, setEditOrgId] = useState<string>("");

  const startEdit = (u: any) => {
    setEditUser(u);
    setEditName(u.name);
    setEditRoleKey(u.roleKey);
    setEditOrgId(u.orgId != null ? String(u.orgId) : "");
    setShowCreate(false);
  };

  const saveMut = useMutation({
    mutationFn: () => api.userUpdate(editUser.userId, {
      name: editName,
      roleKey: editRoleKey,
      orgId: editOrgId ? Number(editOrgId) : null,
    }),
    onSuccess: () => {
      setEditUser(null);
      refetch();
      toast.success(t("admin.userUpdated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const deleteMut = useMutation({
    mutationFn: () => api.userDelete(deleteTarget.userId),
    onSuccess: () => {
      refetch();
      toast.success(t("admin.userDeleted"));
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setDeleteTarget(null);
    },
  });

  // --- Password Reset ---
  const [resetUser, setResetUser] = useState<any>(null);
  const [resetPassword, setResetPassword] = useState("User1234!");
  const [resetError, setResetError] = useState<string | null>(null);

  const startReset = (u: any) => {
    setResetUser(u);
    setResetPassword("User1234!");
    setResetError(null);
    setShowCreate(false);
    setEditUser(null);
  };

  const resetMut = useMutation({
    mutationFn: () => api.userResetPassword(resetUser.userId, resetPassword),
    onSuccess: () => {
      setResetUser(null);
      toast.success(t("admin.passwordResetSuccess"));
    },
    onError: (e: Error) => {
      setResetError(e.message ?? t("admin.passwordResetFailed"));
      toast.error(e.message ?? t("admin.passwordResetFailed"));
    },
  });

  // --- Reset Token Link ---
  const [resetLinkUser, setResetLinkUser] = useState<any>(null);
  const [resetLinkUrl, setResetLinkUrl] = useState<string | null>(null);
  const [resetLinkExpiry, setResetLinkExpiry] = useState<number>(0);
  const [resetLinkCopied, setResetLinkCopied] = useState(false);

  const resetTokenMut = useMutation({
    mutationFn: (userId: number) => api.userResetToken(userId),
    onSuccess: (data) => {
      const url = `${window.location.origin}/reset-password?token=${data.token}`;
      setResetLinkUrl(url);
      setResetLinkExpiry(data.expiresInMinutes);
      setResetLinkCopied(false);
    },
    onError: (e: Error) => {
      toast.error(e.message ?? t("admin.tokenGenerateFailed"));
      setResetLinkUser(null);
    },
  });

  const startResetLink = (u: any) => {
    setResetLinkUser(u);
    setResetLinkUrl(null);
    setResetLinkCopied(false);
    resetTokenMut.mutate(u.userId);
  };

  const copyResetLink = async () => {
    if (!resetLinkUrl) return;
    try {
      await navigator.clipboard.writeText(resetLinkUrl);
      setResetLinkCopied(true);
      toast.success(t("common.clipboardCopied"));
      setTimeout(() => setResetLinkCopied(false), 2000);
    } catch {
      toast.error(t("common.clipboardFailed"));
    }
  };

  // --- Invitation ---
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleKey, setInviteRoleKey] = useState("USER");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  const inviteMut = useMutation({
    mutationFn: () => api.invitationCreate(inviteEmail, inviteRoleKey),
    onSuccess: (data) => {
      const url = `${window.location.origin}/signup?token=${data.token}`;
      setInviteLink(url);
      setInviteLinkCopied(false);
      toast.success(t("admin.inviteSent"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteLinkCopied(true);
      toast.success(t("common.clipboardCopied"));
      setTimeout(() => setInviteLinkCopied(false), 2000);
    } catch {
      toast.error(t("common.clipboardFailed"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("admin.usersPageTitle")}</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>{t("admin.userList")}</CardTitle>
          <div className="flex items-center gap-2">
            <TenantSelector value={selectedTenantId} onChange={(id) => { setSelectedTenantId(id); setPage(1); }} />
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-52"
                placeholder={t("admin.userSearchPlaceholder")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-fg">{filtered.length}{t("common.persons")}</span>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.usersExport(selectedTenantId);
                  toast.success(t("admin.csvExported"));
                } catch (e: any) { toast.error(e.message); }
              }}
            >
              <Download className="mr-1.5 h-4 w-4" />{t("common.export")}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowInvite(true); setInviteEmail(""); setInviteRoleKey("USER"); setInviteLink(null); }}
            >
              <Mail className="mr-1.5 h-4 w-4" />{t("admin.inviteUser")}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowCreate((v) => !v); setEditUser(null); }}
            >
              {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showCreate ? t("common.close") : t("admin.newUser")}
            </Button>
          </div>
        </CardHeader>

        {/* Create Form */}
        {showCreate && (
          <form
            className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3"
            onSubmit={handleSubmitCreate((data) => createMut.mutate(data))}
          >
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">{t("admin.newUserLabel")}</div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Input {...registerCreate("username")} placeholder="username" />
                {createErrors.username && <p className="text-xs text-red-500 mt-1">{createErrors.username.message}</p>}
              </div>
              <div>
                <Input {...registerCreate("name")} placeholder={t("common.name")} />
                {createErrors.name && <p className="text-xs text-red-500 mt-1">{createErrors.name.message}</p>}
              </div>
              <div>
                <Input type="password" {...registerCreate("password")} placeholder={t("auth.password")} />
                {createErrors.password && <p className="text-xs text-red-500 mt-1">{createErrors.password.message}</p>}
              </div>
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm"
                {...registerCreate("roleKey")}
              >
                {assignableRoles.map((r: any) => (
                  <option key={r.roleKey} value={r.roleKey}>{r.roleKey}</option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm"
                {...registerCreate("orgId")}
              >
                <option value="">{t("common.unassigned")}</option>
                {flatOrgs.map((o) => (
                  <option key={o.orgId} value={o.orgId}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMut.isPending}>{t("common.create")}</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel")}</Button>
            </div>
          </form>
        )}

        {/* Edit Panel */}
        {editUser && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              {t("admin.editing")} — {editUser.username} <span className="text-blue-400">(ID: {editUser.userId})</span>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t("common.name")} />
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm"
                value={editRoleKey}
                onChange={(e) => setEditRoleKey(e.target.value)}
              >
                {assignableRoles.map((r: any) => (
                  <option key={r.roleKey} value={r.roleKey}>{r.roleKey}</option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm"
                value={editOrgId}
                onChange={(e) => setEditOrgId(e.target.value)}
              >
                <option value="">{t("common.unassigned")}</option>
                {flatOrgs.map((o) => (
                  <option key={o.orgId} value={o.orgId}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMut.mutate()} disabled={!editName.trim() || saveMut.isPending}>{t("common.save")}</Button>
              <Button variant="outline" onClick={() => setEditUser(null)}>{t("common.cancel")}</Button>
            </div>
          </div>
        )}

        {/* Password Reset Panel */}
        {resetUser && (
          <div className="mx-6 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
            <div className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              {t("admin.passwordReset")} — {resetUser.username} <span className="text-amber-400">(ID: {resetUser.userId})</span>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                className="w-56"
                type="password"
                value={resetPassword}
                onChange={(e) => { setResetPassword(e.target.value); setResetError(null); }}
                placeholder={t("admin.newPasswordPlaceholder")}
              />
              <Button onClick={() => { if (resetPassword.length < 8) { setResetError(t("admin.passwordResetMinLength")); return; } resetMut.mutate(); }} disabled={resetMut.isPending}>{t("admin.resetAction")}</Button>
              <Button variant="outline" onClick={() => setResetUser(null)}>{t("common.cancel")}</Button>
            </div>
            {resetError && <p className="text-xs text-red-400">{resetError}</p>}
          </div>
        )}

        {/* Table */}
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">{t("admin.loginId")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("common.name")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("admin.role")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("admin.org")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((u: any) => (
                <tr
                  key={u.userId}
                  className={`hover:bg-muted/60 transition-colors ${editUser?.userId === u.userId ? "bg-blue-500/10/30" : ""}`}
                >
                  <td className="px-4 py-3 text-xs text-muted-fg font-mono">{u.userId}</td>
                  <td className="px-4 py-3 font-mono font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{u.roleKey}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-fg text-xs">
                    {u.orgId != null ? (orgNameMap.get(u.orgId) ?? u.orgId) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(!isSuperAdmin && u.roleKey === "SUPER_ADMIN") ? (
                      <span className="text-xs text-muted-fg">—</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(u)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />{t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startReset(u)}>
                            <KeyRound className="mr-2 h-3.5 w-3.5" />{t("admin.passwordReset")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startResetLink(u)}>
                            <Link2 className="mr-2 h-3.5 w-3.5" />{t("admin.resetLink")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />{t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {search ? t("common.noSearchResults") : t("admin.noUsers")}
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
        title={t("admin.userDeleteTitle")}
        description={t("admin.userDeleteConfirm", { username: deleteTarget?.username })}
        confirmLabel={t("common.delete")}
        onConfirm={() => deleteMut.mutate()}
      />

      {/* Reset Link Dialog */}
      {resetLinkUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setResetLinkUser(null)}>
          <div className="w-full max-w-lg rounded-lg border bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{t("admin.resetLink")}</h3>
            <p className="mt-1 text-sm text-muted-fg">
              {t("admin.resetLinkDescription", { username: resetLinkUser.username })}
            </p>

            {resetTokenMut.isPending ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-fg">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("admin.generatingToken")}
              </div>
            ) : resetLinkUrl ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={resetLinkUrl}
                    className="h-9 flex-1 rounded-md border bg-muted px-3 font-mono text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button variant="outline" className="h-9 shrink-0" onClick={copyResetLink}>
                    {resetLinkCopied
                      ? <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />{t("common.copied")}</>
                      : <><Copy className="mr-1.5 h-3.5 w-3.5" />{t("common.copy")}</>
                    }
                  </Button>
                </div>
                <p className="text-xs text-muted-fg">
                  {t("admin.linkExpiry", { minutes: resetLinkExpiry })}
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex justify-end">
              <Button variant="outline" onClick={() => setResetLinkUser(null)}>{t("common.close")}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Dialog */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-lg rounded-lg border bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{t("admin.inviteTitle")}</h3>
            <p className="mt-1 text-sm text-muted-fg">
              {t("admin.inviteDescription")}
            </p>

            {!inviteLink ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-fg">{t("admin.inviteEmailLabel")}</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-fg">{t("admin.inviteRoleLabel")}</label>
                  <select
                    className="h-9 w-full rounded-md border bg-surface px-3 text-sm"
                    value={inviteRoleKey}
                    onChange={(e) => setInviteRoleKey(e.target.value)}
                  >
                    {assignableRoles.map((r: any) => (
                      <option key={r.roleKey} value={r.roleKey}>{r.roleKey}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowInvite(false)}>{t("common.cancel")}</Button>
                  <Button
                    onClick={() => inviteMut.mutate()}
                    disabled={!inviteEmail.trim() || inviteMut.isPending}
                  >
                    {inviteMut.isPending ? t("admin.inviteSending") : t("admin.inviteSend")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-emerald-500 font-medium">{t("admin.inviteSent")}</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="h-9 flex-1 rounded-md border bg-muted px-3 font-mono text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button variant="outline" className="h-9 shrink-0" onClick={copyInviteLink}>
                    {inviteLinkCopied
                      ? <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />{t("common.copied")}</>
                      : <><Copy className="mr-1.5 h-3.5 w-3.5" />{t("common.copy")}</>
                    }
                  </Button>
                </div>
                <p className="text-xs text-muted-fg">
                  {t("admin.inviteLinkGuide")}
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowInvite(false)}>{t("common.close")}</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
