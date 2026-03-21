import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import TenantSelector from "@/components/TenantSelector";
import { ChevronRight, ChevronDown, Minus, MoreHorizontal, Pencil, Trash2, Plus, X, Search } from "lucide-react";
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
import type { OrgNode, FlatOrg } from "@/types/org";

function flattenTree(nodes: OrgNode[], collapsedIds: Set<number>, depth = 0): FlatOrg[] {
  return nodes.flatMap((n) => {
    const hasChildren = (n.children?.length ?? 0) > 0;
    const isCollapsed = collapsedIds.has(n.orgId);
    return [
      { ...n, depth, hasChildren, isCollapsed },
      ...(hasChildren && !isCollapsed ? flattenTree(n.children, collapsedIds, depth + 1) : []),
    ];
  });
}

function flattenAll(nodes: OrgNode[], depth = 0): FlatOrg[] {
  return nodes.flatMap((n) => {
    const hasChildren = (n.children?.length ?? 0) > 0;
    return [
      { ...n, depth, hasChildren, isCollapsed: false },
      ...(hasChildren ? flattenAll(n.children, depth + 1) : []),
    ];
  });
}

function flattenForSelect(nodes: OrgNode[], depth = 0): { orgId: number; label: string }[] {
  return nodes.flatMap((n) => [
    { orgId: n.orgId, label: `${"  ".repeat(depth)}${n.name} (${n.orgId})` },
    ...flattenForSelect(n.children ?? [], depth + 1),
  ]);
}

export default function AdminOrgsPage() {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ["admin", "orgs", "tree", selectedTenantId],
    queryFn: () => api.orgTree(selectedTenantId),
  });

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
  const normalRows: FlatOrg[] = flattenTree(data ?? [], collapsedIds);
  const searchRows: FlatOrg[] = allFlattened.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );
  const rows: FlatOrg[] = isSearching ? searchRows : normalRows;

  const selectOptions = flattenForSelect(data ?? []);

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");

  const onCreate = async () => {
    await api.orgCreate(parentId ? Number(parentId) : null, name, 0, true, selectedTenantId);
    setName("");
    setShowCreate(false);
    await refetch();
  };

  // --- Edit ---
  const [editNode, setEditNode] = useState<FlatOrg | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState("");

  const startEdit = (row: FlatOrg) => {
    setEditNode(row);
    setEditName(row.name);
    setEditParentId(row.parentId != null ? String(row.parentId) : "");
    setShowCreate(false);
  };

  const onSave = async () => {
    if (!editNode) return;
    await api.orgUpdate(editNode.orgId, {
      parentId: editParentId ? Number(editParentId) : null,
      name: editName,
      sortOrder: editNode.sortOrder,
      useYn: editNode.useYn,
    });
    setEditNode(null);
    await refetch();
  };

  const onDelete = async (row: FlatOrg) => {
    if (!confirm(`"${row.name}" 조직을 삭제할까요?`)) return;
    await api.orgDelete(row.orgId);
    await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Orgs</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>조직 트리</CardTitle>
          <div className="flex items-center gap-2 ml-auto mr-2">
            <TenantSelector value={selectedTenantId} onChange={setSelectedTenantId} />
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
              <Input
                className="pl-9 w-56"
                placeholder="조직 이름 검색..."
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
            {showCreate ? "닫기" : "새 조직 추가"}
          </Button>
        </CardHeader>

        {/* Create Form */}
        {showCreate && (
          <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3">
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">새 조직</div>
            <div className="flex gap-2">
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm text-foreground w-52"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">— 최상위 (없음)</option>
                {selectOptions.map((o) => (
                  <option key={o.orgId} value={o.orgId}>{o.label}</option>
                ))}
              </select>
              <Input
                className="max-w-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="조직 이름"
              />
              <Button onClick={onCreate} disabled={!name.trim()}>추가</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
          </div>
        )}

        {/* Edit Panel */}
        {editNode && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              편집 중 — {editNode.name} <span className="text-blue-400">(ID: {editNode.orgId})</span>
            </div>
            <div className="flex gap-2">
              <select
                className="h-9 rounded-md border bg-surface px-3 text-sm text-foreground w-52"
                value={editParentId}
                onChange={(e) => setEditParentId(e.target.value)}
              >
                <option value="">— 최상위 (없음)</option>
                {selectOptions
                  .filter((o) => o.orgId !== editNode.orgId)
                  .map((o) => (
                    <option key={o.orgId} value={o.orgId}>{o.label}</option>
                  ))}
              </select>
              <Input
                className="max-w-xs"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="조직 이름"
              />
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
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">상위 ID</th>
                <th className="px-4 py-3 text-left font-medium">사용</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr
                  key={row.orgId}
                  className={`hover:bg-muted/60 transition-colors ${editNode?.orgId === row.orgId ? "bg-blue-500/10/30" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" style={{ paddingLeft: `${row.depth * 20}px` }}>
                      {row.depth > 0 && (
                        <span className="text-slate-300 font-mono text-xs select-none mr-0.5">└</span>
                      )}
                      {!isSearching && row.hasChildren ? (
                        <button
                          onClick={() => toggleCollapse(row.orgId)}
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
                  <td className="px-4 py-3 font-mono text-muted-fg text-xs">{row.orgId}</td>
                  <td className="px-4 py-3 font-mono text-muted-fg text-xs">{row.parentId ?? "—"}</td>
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
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-fg">
                    {isSearching ? "검색 결과가 없습니다." : "조직이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
