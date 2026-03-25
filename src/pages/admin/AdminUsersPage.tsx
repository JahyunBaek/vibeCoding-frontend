import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Plus, X, Search, KeyRound, Link2, Copy, Check, Download } from "lucide-react";
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
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.roleKey === "SUPER_ADMIN";
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["admin", "users", selectedTenantId],
    queryFn: () => api.usersList(undefined, 1, 500, selectedTenantId),
  });
  const { data: roles } = useQuery({ queryKey: ["admin", "roles", "all"], queryFn: () => api.rolesAll() });
  // SUPER_ADMIN이 아니면 역할 목록에서 SUPER_ADMIN 제거
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("User1234!");
  const [name, setName] = useState("");
  const [roleKey, setRoleKey] = useState("USER");
  const [orgId, setOrgId] = useState<string>("1");

  const createMut = useMutation({
    mutationFn: () => api.userCreate({ username, password, name, roleKey, orgId: orgId ? Number(orgId) : null, enabled: true, tenantId: selectedTenantId }),
    onSuccess: () => {
      setUsername("");
      setName("");
      setShowCreate(false);
      refetch();
      toast.success("생성되었습니다.");
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
      toast.success("수정되었습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const deleteMut = useMutation({
    mutationFn: () => api.userDelete(deleteTarget.userId),
    onSuccess: () => {
      refetch();
      toast.success("삭제되었습니다.");
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
      toast.success("비밀번호가 초기화되었습니다.");
    },
    onError: (e: Error) => {
      setResetError(e.message ?? "초기화에 실패했습니다.");
      toast.error(e.message ?? "초기화에 실패했습니다.");
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
      toast.error(e.message ?? "토큰 생성에 실패했습니다.");
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
      toast.success("클립보드에 복사되었습니다.");
      setTimeout(() => setResetLinkCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Users</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>사용자 목록</CardTitle>
          <div className="flex items-center gap-2">
            <TenantSelector value={selectedTenantId} onChange={(id) => { setSelectedTenantId(id); setPage(1); }} />
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-52"
                placeholder="이름, ID, 역할 검색..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-fg">{filtered.length}명</span>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.usersExport(selectedTenantId);
                  toast.success("CSV 파일이 다운로드되었습니다.");
                } catch (e: any) { toast.error(e.message); }
              }}
            >
              <Download className="mr-1.5 h-4 w-4" />CSV 내보내기
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowCreate((v) => !v); setEditUser(null); }}
            >
              {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showCreate ? "닫기" : "새 사용자 추가"}
            </Button>
          </div>
        </CardHeader>

        {/* Create Form */}
        {showCreate && (
          <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3">
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">새 사용자</div>
            <div className="grid gap-2 md:grid-cols-2">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm"
                value={roleKey}
                onChange={(e) => setRoleKey(e.target.value)}
              >
                {assignableRoles.map((r: any) => (
                  <option key={r.roleKey} value={r.roleKey}>{r.roleKey}</option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                <option value="">— 미배정</option>
                {flatOrgs.map((o) => (
                  <option key={o.orgId} value={o.orgId}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createMut.mutate()} disabled={!username || !password || !name || createMut.isPending}>추가</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
          </div>
        )}

        {/* Edit Panel */}
        {editUser && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              편집 중 — {editUser.username} <span className="text-blue-400">(ID: {editUser.userId})</span>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="이름" />
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
                <option value="">— 미배정</option>
                {flatOrgs.map((o) => (
                  <option key={o.orgId} value={o.orgId}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMut.mutate()} disabled={!editName.trim() || saveMut.isPending}>저장</Button>
              <Button variant="outline" onClick={() => setEditUser(null)}>취소</Button>
            </div>
          </div>
        )}

        {/* Password Reset Panel */}
        {resetUser && (
          <div className="mx-6 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
            <div className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              비밀번호 초기화 — {resetUser.username} <span className="text-amber-400">(ID: {resetUser.userId})</span>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                className="w-56"
                type="password"
                value={resetPassword}
                onChange={(e) => { setResetPassword(e.target.value); setResetError(null); }}
                placeholder="새 비밀번호 (8자 이상)"
              />
              <Button onClick={() => { if (resetPassword.length < 8) { setResetError("8자 이상 입력해주세요."); return; } resetMut.mutate(); }} disabled={resetMut.isPending}>초기화</Button>
              <Button variant="outline" onClick={() => setResetUser(null)}>취소</Button>
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
                <th className="px-4 py-3 text-left font-medium">Login ID</th>
                <th className="px-4 py-3 text-left font-medium">이름</th>
                <th className="px-4 py-3 text-left font-medium">역할</th>
                <th className="px-4 py-3 text-left font-medium">조직</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
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
                            <Pencil className="mr-2 h-3.5 w-3.5" />편집
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startReset(u)}>
                            <KeyRound className="mr-2 h-3.5 w-3.5" />비밀번호 초기화
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startResetLink(u)}>
                            <Link2 className="mr-2 h-3.5 w-3.5" />비밀번호 재설정 링크
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
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
                    {search ? "검색 결과가 없습니다." : "사용자가 없습니다."}
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
        title="사용자 삭제"
        description={`"${deleteTarget?.username}" 사용자를 삭제할까요?`}
        confirmLabel="삭제"
        onConfirm={() => deleteMut.mutate()}
      />

      {/* Reset Link Dialog */}
      {resetLinkUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setResetLinkUser(null)}>
          <div className="w-full max-w-lg rounded-lg border bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">비밀번호 재설정 링크</h3>
            <p className="mt-1 text-sm text-muted-fg">
              <span className="font-medium">{resetLinkUser.username}</span> 사용자의 비밀번호 재설정 링크입니다.
            </p>

            {resetTokenMut.isPending ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-fg">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                토큰 생성 중...
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
                      ? <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />복사됨</>
                      : <><Copy className="mr-1.5 h-3.5 w-3.5" />복사</>
                    }
                  </Button>
                </div>
                <p className="text-xs text-muted-fg">
                  이 링크는 <span className="font-medium text-amber-500">{resetLinkExpiry}분</span> 후 만료됩니다.
                  사용자에게 전달해 주세요.
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex justify-end">
              <Button variant="outline" onClick={() => setResetLinkUser(null)}>닫기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
