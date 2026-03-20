import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, ChevronDown, Minus, MoreHorizontal, Pencil, Trash2, Plus, X, Link2, Search } from "lucide-react";
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

type MenuNode = {
  menuId: number;
  parentId: number | null;
  name: string;
  path: string | null;
  icon: string | null;
  sortOrder: number;
  useYn: boolean;
  menuType: string;
  boardId: number | null;
  children: MenuNode[];
};

type FlatMenu = MenuNode & { depth: number; hasChildren: boolean; isCollapsed: boolean };

function flattenTree(nodes: MenuNode[], collapsedIds: Set<number>, depth = 0): FlatMenu[] {
  return nodes.flatMap((n) => {
    const hasChildren = (n.children?.length ?? 0) > 0;
    const isCollapsed = collapsedIds.has(n.menuId);
    return [
      { ...n, depth, hasChildren, isCollapsed },
      ...(hasChildren && !isCollapsed ? flattenTree(n.children, collapsedIds, depth + 1) : []),
    ];
  });
}

function flattenAll(nodes: MenuNode[], depth = 0): FlatMenu[] {
  return nodes.flatMap((n) => {
    const hasChildren = (n.children?.length ?? 0) > 0;
    return [
      { ...n, depth, hasChildren, isCollapsed: false },
      ...(hasChildren ? flattenAll(n.children, depth + 1) : []),
    ];
  });
}

function flattenForSelect(nodes: MenuNode[], depth = 0): { menuId: number; label: string }[] {
  return nodes.flatMap((n) => [
    { menuId: n.menuId, label: `${"  ".repeat(depth)}${n.name} (${n.menuId})` },
    ...flattenForSelect(n.children ?? [], depth + 1),
  ]);
}

export default function AdminMenusPage() {
  const { data: roles } = useQuery({ queryKey: ["admin", "roles", "all"], queryFn: api.rolesAll });
  const { data, refetch } = useQuery({ queryKey: ["admin", "menus", "tree"], queryFn: api.menusAdminTree });

  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const toggleCollapse = (id: number) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // --- Search ---
  const [search, setSearch] = useState("");
  const isSearching = search.trim() !== "";

  const allFlattened = flattenAll(data ?? []);
  const normalRows: FlatMenu[] = flattenTree(data ?? [], collapsedIds);
  const searchRows: FlatMenu[] = allFlattened.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );
  const rows: FlatMenu[] = isSearching ? searchRows : normalRows;

  const selectOptions = flattenForSelect(data ?? []);

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);
  const [cParentId, setCParentId] = useState("");
  const [cName, setCName] = useState("");
  const [cPath, setCPath] = useState("");
  const [cSortOrder, setCSortOrder] = useState(0);
  const [cMenuType, setCMenuType] = useState("MENU");
  const [cRoleKeys, setCRoleKeys] = useState<string[]>([]);

  const toggleCRole = (key: string) =>
    setCRoleKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const onCreate = async () => {
    await api.menuCreate({
      parentId: cParentId ? Number(cParentId) : null,
      name: cName,
      path: cPath || null,
      icon: null,
      sortOrder: cSortOrder,
      useYn: true,
      menuType: cMenuType,
      boardId: null,
      roleKeys: cRoleKeys,
    });
    setCName("");
    setCPath("");
    setCSortOrder(0);
    setCRoleKeys([]);
    setShowCreate(false);
    await refetch();
  };

  // --- Edit ---
  const [editNode, setEditNode] = useState<FlatMenu | null>(null);
  const [editName, setEditName] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editUseYn, setEditUseYn] = useState(true);
  const [editRoleKeys, setEditRoleKeys] = useState<string[]>([]);

  const toggleEditRole = (key: string) =>
    setEditRoleKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const startEdit = (row: FlatMenu) => {
    setEditNode(row);
    setEditName(row.name);
    setEditPath(row.path ?? "");
    setEditParentId(row.parentId != null ? String(row.parentId) : "");
    setEditSortOrder(row.sortOrder);
    setEditUseYn(row.useYn);
    setEditRoleKeys([]);
    setShowCreate(false);
  };

  const onSave = async () => {
    if (!editNode) return;
    await api.menuUpdate(editNode.menuId, {
      parentId: editParentId ? Number(editParentId) : null,
      name: editName,
      path: editPath || null,
      icon: editNode.icon,
      sortOrder: editSortOrder,
      useYn: editUseYn,
    });
    if (editRoleKeys.length > 0) {
      await api.menuSetRoles(editNode.menuId, editRoleKeys);
    }
    setEditNode(null);
    await refetch();
  };

  const onDelete = async (row: FlatMenu) => {
    if (!confirm(`"${row.name}" 메뉴를 삭제할까요?`)) return;
    await api.menuDelete(row.menuId);
    await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Menus</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>메뉴 트리</CardTitle>
          <div className="flex items-center gap-2 ml-auto mr-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-56"
                placeholder="메뉴 이름 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isSearching && (
              <span className="text-xs text-muted-fg">검색 결과 {searchRows.length}개</span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => { setShowCreate((v) => !v); setEditNode(null); }}
          >
            {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showCreate ? "닫기" : "새 메뉴 추가"}
          </Button>
        </CardHeader>

        {/* Create Form */}
        {showCreate && (
          <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3">
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">새 메뉴</div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm text-foreground w-52"
                value={cParentId}
                onChange={(e) => setCParentId(e.target.value)}
              >
                <option value="">— 최상위 (없음)</option>
                {selectOptions.map((o) => (
                  <option key={o.menuId} value={o.menuId}>{o.label}</option>
                ))}
              </select>
              <Input className="w-36" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="메뉴 이름" />
              <Input className="w-36" value={cPath} onChange={(e) => setCPath(e.target.value)} placeholder="/path" />
              <Input
                type="number"
                className="w-20"
                value={cSortOrder}
                onChange={(e) => setCSortOrder(Number(e.target.value))}
                placeholder="순서"
              />
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm text-foreground"
                value={cMenuType}
                onChange={(e) => setCMenuType(e.target.value)}
              >
                <option value="MENU">MENU</option>
                <option value="FOLDER">FOLDER</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-fg">권한:</span>
              <div className="flex flex-wrap gap-3">
                {(roles ?? []).map((r: any) => (
                  <label key={r.roleKey} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={cRoleKeys.includes(r.roleKey)} onChange={() => toggleCRole(r.roleKey)} />
                    {r.roleKey}
                  </label>
                ))}
              </div>
              <Button onClick={onCreate} disabled={!cName.trim()}>추가</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
          </div>
        )}

        {/* Edit Panel */}
        {editNode && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              편집 중 — {editNode.name} <span className="text-blue-400">(ID: {editNode.menuId})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm text-foreground w-52"
                value={editParentId}
                onChange={(e) => setEditParentId(e.target.value)}
              >
                <option value="">— 최상위 (없음)</option>
                {selectOptions
                  .filter((o) => o.menuId !== editNode.menuId)
                  .map((o) => (
                    <option key={o.menuId} value={o.menuId}>{o.label}</option>
                  ))}
              </select>
              <Input className="w-36" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="메뉴 이름" />
              <Input className="w-36" value={editPath} onChange={(e) => setEditPath(e.target.value)} placeholder="/path" />
              <Input
                type="number"
                className="w-20"
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(Number(e.target.value))}
                placeholder="순서"
              />
              <label className="flex items-center gap-2 text-sm h-9">
                <input type="checkbox" checked={editUseYn} onChange={(e) => setEditUseYn(e.target.checked)} />
                사용
              </label>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-fg">권한 재설정 (선택 시 덮어씀):</span>
              <div className="flex flex-wrap gap-3">
                {(roles ?? []).map((r: any) => (
                  <label key={r.roleKey} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={editRoleKeys.includes(r.roleKey)} onChange={() => toggleEditRole(r.roleKey)} />
                    {r.roleKey}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={!editName.trim()}>저장</Button>
              <Button variant="outline" onClick={() => setEditNode(null)}>취소</Button>
            </div>
          </div>
        )}

        {/* Tree Table */}
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">이름</th>
                <th className="px-4 py-3 text-left font-medium">경로</th>
                <th className="px-4 py-3 text-left font-medium">타입</th>
                <th className="px-4 py-3 text-left font-medium">순서</th>
                <th className="px-4 py-3 text-left font-medium">사용</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr
                  key={row.menuId}
                  className={`hover:bg-muted/60 transition-colors ${editNode?.menuId === row.menuId ? "bg-blue-500/10/30" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" style={{ paddingLeft: `${row.depth * 20}px` }}>
                      {row.depth > 0 && (
                        <span className="text-slate-300 font-mono text-xs select-none mr-0.5">└</span>
                      )}
                      {!isSearching && row.hasChildren ? (
                        <button
                          onClick={() => toggleCollapse(row.menuId)}
                          className="p-0.5 rounded hover:bg-accent transition-colors"
                        >
                          {row.isCollapsed
                            ? <ChevronRight className="h-3.5 w-3.5 text-muted-fg" />
                            : <ChevronDown className="h-3.5 w-3.5 text-muted-fg" />
                          }
                        </button>
                      ) : (
                        <Minus className="h-3 w-3 text-slate-300 mx-0.5" />
                      )}
                      <span className={`ml-1 ${row.hasChildren ? "font-medium text-foreground" : "text-foreground"}`}>
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.path ? (
                      <div className="flex items-center gap-1 font-mono text-xs text-muted-fg">
                        <Link2 className="h-3 w-3" />{row.path}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.menuType === "FOLDER" ? "secondary" : "default"} className="text-xs">
                      {row.menuType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-fg">{row.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.useYn ? "default" : "secondary"}>{row.useYn ? "Y" : "N"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(row)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />편집
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {isSearching ? "검색 결과가 없습니다." : "메뉴가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="border-t px-4 py-3 text-xs text-muted-fg">
            게시판 생성/삭제 시 <span className="font-mono">Boards</span> 하위 메뉴가 자동으로 추가/삭제됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
