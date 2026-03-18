import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Plus, X } from "lucide-react";
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

export default function AdminRolesPage() {
  const { data, refetch } = useQuery({
    queryKey: ["admin", "roles", "page"],
    queryFn: () => api.rolesPage(1, 50),
  });

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);
  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");

  const onCreate = async () => {
    await api.roleCreate(roleKey, roleName, true);
    setRoleKey("");
    setRoleName("");
    setShowCreate(false);
    await refetch();
  };

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

  const onSave = async () => {
    await api.roleUpdate(editRole.roleKey, editName, editUseYn);
    setEditRole(null);
    await refetch();
  };

  const onDelete = async (r: any) => {
    if (!confirm(`"${r.roleKey}" 역할을 삭제할까요?`)) return;
    await api.roleDelete(r.roleKey);
    await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Roles (RBAC: A)</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>역할 목록</CardTitle>
          <Button
            variant="outline"
            onClick={() => { setShowCreate((v) => !v); setEditRole(null); }}
          >
            {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showCreate ? "닫기" : "새 역할 추가"}
          </Button>
        </CardHeader>

        {/* Create Form */}
        {showCreate && (
          <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">새 역할</div>
            <div className="flex gap-2">
              <Input className="w-40" value={roleKey} onChange={(e) => setRoleKey(e.target.value)} placeholder="ROLE_KEY" />
              <Input className="w-48" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="역할 이름" />
              <Button onClick={onCreate} disabled={!roleKey.trim() || !roleName.trim()}>추가</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
          </div>
        )}

        {/* Edit Panel */}
        {editRole && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              편집 중 — <span className="font-mono">{editRole.roleKey}</span>
            </div>
            <div className="flex items-center gap-2">
              <Input className="w-48" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="역할 이름" />
              <label className="flex items-center gap-2 text-sm h-9">
                <input type="checkbox" checked={editUseYn} onChange={(e) => setEditUseYn(e.target.checked)} />
                사용
              </label>
              <Button onClick={onSave} disabled={!editName.trim()}>저장</Button>
              <Button variant="outline" onClick={() => setEditRole(null)}>취소</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Role Key</th>
                <th className="px-4 py-3 text-left font-medium">역할 이름</th>
                <th className="px-4 py-3 text-left font-medium">사용</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.items ?? []).map((r: any) => (
                <tr
                  key={r.roleKey}
                  className={`hover:bg-slate-50/60 transition-colors ${editRole?.roleKey === r.roleKey ? "bg-blue-50/30" : ""}`}
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
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => onDelete(r)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {(data?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">역할이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="border-t px-4 py-3 text-xs text-slate-400">
            메뉴 접근 권한은 <span className="font-mono">menu_roles</span> 매핑으로 관리합니다. (권한 방식 A)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
