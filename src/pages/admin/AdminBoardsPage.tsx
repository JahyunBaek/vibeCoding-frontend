import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import TenantSelector from "@/components/TenantSelector";
import ConfirmDialog from "@/components/ConfirmDialog";
import { MoreHorizontal, Pencil, Trash2, Plus, X, Search } from "lucide-react";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
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

const PAGE_SIZE = 10;

export default function AdminBoardsPage() {
  const qc = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["admin", "boards", selectedTenantId],
    queryFn: () => api.boardsAdminList(1, 200, selectedTenantId),
  });

  const invalidateMenus = () => qc.invalidateQueries({ queryKey: ["menus", "my"] });

  // --- Search & Pagination ---
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const allItems: any[] = data?.items ?? [];
  const filtered = allItems.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMut = useMutation({
    mutationFn: () => api.boardsAdminCreate(name, description, true, selectedTenantId),
    onSuccess: () => {
      setName("");
      setDescription("");
      setShowCreate(false);
      refetch();
      invalidateMenus();
      toast.success("게시판이 생성되었습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const saveMut = useMutation({
    mutationFn: () => api.boardsAdminUpdate(editBoard.boardId, editName, editDesc, true),
    onSuccess: () => {
      setEditBoard(null);
      refetch();
      invalidateMenus();
      toast.success("게시판이 수정되었습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const deleteMut = useMutation({
    mutationFn: () => api.boardsAdminDelete(deleteTarget.boardId),
    onSuccess: () => {
      refetch();
      invalidateMenus();
      toast.success("게시판이 삭제되었습니다.");
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Boards (Dynamic)</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>게시판 목록</CardTitle>
          <div className="flex items-center gap-2">
            <TenantSelector value={selectedTenantId} onChange={(id) => { setSelectedTenantId(id); setPage(1); }} />
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-52"
                placeholder="이름, 설명 검색..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-fg">{filtered.length}개</span>
            <Button
              variant="outline"
              onClick={() => { setShowCreate((v) => !v); setEditBoard(null); }}
            >
              {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showCreate ? "닫기" : "새 게시판 추가"}
            </Button>
          </div>
        </CardHeader>

        {/* Create Form */}
        {showCreate && (
          <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3">
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">새 게시판</div>
            <div className="flex gap-2">
              <Input className="w-48" value={name} onChange={(e) => setName(e.target.value)} placeholder="게시판 이름" />
              <Input className="flex-1" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명" />
              <Button onClick={() => createMut.mutate()} disabled={!name.trim() || createMut.isPending}>추가</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
            <div className="text-xs text-muted-fg">게시판 생성 시 메뉴 트리(Boards 하위)에 자동 반영됩니다.</div>
          </div>
        )}

        {/* Edit Panel */}
        {editBoard && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              편집 중 — {editBoard.name} <span className="text-blue-400">(ID: {editBoard.boardId})</span>
            </div>
            <div className="flex gap-2">
              <Input className="w-48" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="게시판 이름" />
              <Input className="flex-1" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="설명" />
              <Button onClick={() => saveMut.mutate()} disabled={!editName.trim() || saveMut.isPending}>저장</Button>
              <Button variant="outline" onClick={() => setEditBoard(null)}>취소</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">이름</th>
                <th className="px-4 py-3 text-left font-medium">설명</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((b: any) => (
                <tr
                  key={b.boardId}
                  className={`hover:bg-muted/60 transition-colors ${editBoard?.boardId === b.boardId ? "bg-blue-500/10/30" : ""}`}
                >
                  <td className="px-4 py-3 text-xs text-muted-fg font-mono">{b.boardId}</td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-muted-fg text-xs">{b.description ?? "—"}</td>
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
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() => setDeleteTarget(b)}
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
                    {search ? "검색 결과가 없습니다." : "게시판이 없습니다."}
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
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="게시판 삭제"
        description={`"${deleteTarget?.name}" 게시판을 삭제하시겠습니까?`}
        onConfirm={() => deleteMut.mutate()}
      />
    </div>
  );
}
