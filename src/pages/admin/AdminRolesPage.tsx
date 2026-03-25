import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Plus, X, Search } from "lucide-react";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
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

export default function AdminRolesPage() {
  const { data, refetch } = useQuery({
    queryKey: ["admin", "roles", "page"],
    queryFn: () => api.rolesPage(1, 200),
  });

  // --- Search & Pagination ---
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const allItems: any[] = data?.items ?? [];
  const filtered = allItems.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.roleKey?.toLowerCase().includes(q) ||
      r.roleName?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);
  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");

  const createMut = useMutation({
    mutationFn: () => api.roleCreate(roleKey, roleName, true),
    onSuccess: () => {
      setRoleKey("");
      setRoleName("");
      setShowCreate(false);
      refetch();
      toast.success("생성되었습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Edit ---
  const [editRole, setEditRole] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editUseYn, setEditUseYn] = useState(true);

  const startEdit = (r: any) => {
    setEditRole(r);
    setEditName(r.roleName);
    setEditUseYn(r.useYn);
    setShowCreate(false);
  };

  const saveMut = useMutation({
    mutationFn: () => api.roleUpdate(editRole.roleKey, editName, editUseYn),
    onSuccess: () => {
      setEditRole(null);
      refetch();
      toast.success("수정되었습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const deleteMut = useMutation({
    mutationFn: () => api.roleDelete(deleteTarget.roleKey),
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

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Roles (RBAC: A)</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>역할 목록</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-52"
                placeholder="역할 키, 이름 검색..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-fg">{filtered.length}개</span>
            <Button
              variant="outline"
              onClick={() => { setShowCreate((v) => !v); setEditRole(null); }}
            >
              {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showCreate ? "닫기" : "새 역할 추가"}
            </Button>
          </div>
        </CardHeader>

        {/* Create Form */}
        {showCreate && (
          <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3">
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">새 역할</div>
            <div className="flex gap-2">
              <Input className="w-40" value={roleKey} onChange={(e) => setRoleKey(e.target.value)} placeholder="ROLE_KEY" />
              <Input className="w-48" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="역할 이름" />
              <Button onClick={() => createMut.mutate()} disabled={!roleKey.trim() || !roleName.trim() || createMut.isPending}>추가</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
          </div>
        )}

        {/* Edit Panel */}
        {editRole && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              편집 중 — <span className="font-mono">{editRole.roleKey}</span>
            </div>
            <div className="flex items-center gap-2">
              <Input className="w-48" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="역할 이름" />
              <label className="flex items-center gap-2 text-sm h-9">
                <input type="checkbox" checked={editUseYn} onChange={(e) => setEditUseYn(e.target.checked)} />
                사용
              </label>
              <Button onClick={() => saveMut.mutate()} disabled={!editName.trim() || saveMut.isPending}>저장</Button>
              <Button variant="outline" onClick={() => setEditRole(null)}>취소</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">Role Key</th>
                <th className="px-4 py-3 text-left font-medium">역할 이름</th>
                <th className="px-4 py-3 text-left font-medium">사용</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((r: any) => (
                <tr
                  key={r.roleKey}
                  className={`hover:bg-muted/60 transition-colors ${editRole?.roleKey === r.roleKey ? "bg-blue-500/10/30" : ""}`}
                >
                  <td className="px-4 py-3 font-mono font-medium">{r.roleKey}</td>
                  <td className="px-4 py-3">{r.roleName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.useYn ? "default" : "secondary"}>{r.useYn ? "Y" : "N"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(r)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />편집
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() => setDeleteTarget(r)}
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
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {search ? "검색 결과가 없습니다." : "역할이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          <div className="border-t px-4 py-3 text-xs text-muted-fg">
            메뉴 접근 권한은 <span className="font-mono">menu_roles</span> 매핑으로 관리합니다. (권한 방식 A)
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="역할 삭제"
        description={`"${deleteTarget?.roleKey}" 역할을 삭제할까요?`}
        confirmLabel="삭제"
        onConfirm={() => deleteMut.mutate()}
      />
    </div>
  );
}
