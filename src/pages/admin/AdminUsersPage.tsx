import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Plus, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
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

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 border-t px-4 py-3">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex h-7 w-7 items-center justify-center rounded border text-muted-fg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | "...")[]>((acc, p, i, arr) => {
          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1 text-xs text-muted-fg">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors ${p === page ? "bg-blue-600 text-white" : "border text-muted-fg hover:bg-muted"}`}
            >
              {p}
            </button>
          )
        )}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="flex h-7 w-7 items-center justify-center rounded border text-muted-fg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function flattenOrgs(nodes: any[], depth = 0): { orgId: number; label: string; name: string }[] {
  return (nodes ?? []).flatMap((n) => [
    { orgId: n.orgId, label: `${"  ".repeat(depth)}${n.name}`, name: n.name },
    ...flattenOrgs(n.children ?? [], depth + 1),
  ]);
}

export default function AdminUsersPage() {
  const { data, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.usersList(undefined, 1, 500),
  });
  const { data: roles } = useQuery({ queryKey: ["admin", "roles", "all"], queryFn: api.rolesAll });
  const { data: orgTree } = useQuery({ queryKey: ["admin", "orgs", "tree"], queryFn: api.orgTree });
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

  const onCreate = async () => {
    await api.userCreate({ username, password, name, roleKey, orgId: orgId ? Number(orgId) : null, enabled: true });
    setUsername("");
    setName("");
    setShowCreate(false);
    await refetch();
  };

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

  const onSave = async () => {
    await api.userUpdate(editUser.userId, {
      name: editName,
      roleKey: editRoleKey,
      orgId: editOrgId ? Number(editOrgId) : null,
    });
    setEditUser(null);
    await refetch();
  };

  const onDelete = async (u: any) => {
    if (!confirm(`"${u.username}" 사용자를 삭제할까요?`)) return;
    await api.userDelete(u.userId);
    await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Users</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>사용자 목록</CardTitle>
          <div className="flex items-center gap-2">
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
                {(roles ?? []).map((r: any) => (
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
              <Button onClick={onCreate} disabled={!username || !password || !name}>추가</Button>
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
                {(roles ?? []).map((r: any) => (
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
              <Button onClick={onSave} disabled={!editName.trim()}>저장</Button>
              <Button variant="outline" onClick={() => setEditUser(null)}>취소</Button>
            </div>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() => onDelete(u)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    </div>
  );
}
