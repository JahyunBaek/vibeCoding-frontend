import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminBoardsPage() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["admin", "boards"],
    queryFn: () => api.boardsAdminList(1, 100),
  });

  const invalidateMenus = () => qc.invalidateQueries({ queryKey: ["menus", "my"] });

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const onCreate = async () => {
    await api.boardsAdminCreate(name, description, true);
    setName("");
    setDescription("");
    setShowCreate(false);
    await refetch();
    await invalidateMenus();
  };

  // --- Edit ---
  const [editBoard, setEditBoard] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const startEdit = (b: any) => {
    setEditBoard(b);
    setEditName(b.name);
    setEditDesc(b.description ?? "");
    setShowCreate(false);
  };

  const onSave = async () => {
    await api.boardsAdminUpdate(editBoard.boardId, editName, editDesc, true);
    setEditBoard(null);
    await refetch();
    await invalidateMenus();
  };

  const onDelete = async (b: any) => {
    if (!confirm(`"${b.name}" 게시판을 삭제할까요?`)) return;
    await api.boardsAdminDelete(b.boardId);
    await refetch();
    await invalidateMenus();
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Boards (Dynamic)</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>게시판 목록</CardTitle>
          <Button
            variant="outline"
            onClick={() => { setShowCreate((v) => !v); setEditBoard(null); }}
          >
            {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showCreate ? "닫기" : "새 게시판 추가"}
          </Button>
        </CardHeader>

        {/* Create Form */}
        {showCreate && (
          <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">새 게시판</div>
            <div className="flex gap-2">
              <Input className="w-48" value={name} onChange={(e) => setName(e.target.value)} placeholder="게시판 이름" />
              <Input className="flex-1" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명" />
              <Button onClick={onCreate} disabled={!name.trim()}>추가</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
            <div className="text-xs text-slate-400">게시판 생성 시 메뉴 트리(Boards 하위)에 자동 반영됩니다.</div>
          </div>
        )}

        {/* Edit Panel */}
        {editBoard && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              편집 중 — {editBoard.name} <span className="text-blue-400">(ID: {editBoard.boardId})</span>
            </div>
            <div className="flex gap-2">
              <Input className="w-48" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="게시판 이름" />
              <Input className="flex-1" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="설명" />
              <Button onClick={onSave} disabled={!editName.trim()}>저장</Button>
              <Button variant="outline" onClick={() => setEditBoard(null)}>취소</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">이름</th>
                <th className="px-4 py-3 text-left font-medium">설명</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.items ?? []).map((b: any) => (
                <tr
                  key={b.boardId}
                  className={`hover:bg-slate-50/60 transition-colors ${editBoard?.boardId === b.boardId ? "bg-blue-50/30" : ""}`}
                >
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{b.boardId}</td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{b.description ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(b)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />편집
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => onDelete(b)}
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
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">게시판이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
