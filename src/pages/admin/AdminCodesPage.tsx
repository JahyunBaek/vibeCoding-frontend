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

export default function AdminCodesPage() {
  const { data: groups, refetch: refetchGroups } = useQuery({
    queryKey: ["admin", "codes", "groups"],
    queryFn: () => api.codesGroups(1, 50),
  });

  const [selected, setSelected] = useState<string>("");

  const { data: items, refetch: refetchItems } = useQuery({
    queryKey: ["admin", "codes", "items", selected],
    queryFn: () => (selected ? api.codesItems(selected) : Promise.resolve([])),
    enabled: !!selected,
  });

  // --- Group Create ---
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [gKey, setGKey] = useState("");
  const [gName, setGName] = useState("");

  const onCreateGroup = async () => {
    await api.codesCreateGroup({ groupKey: gKey, groupName: gName, useYn: true });
    setGKey(""); setGName("");
    setShowGroupCreate(false);
    await refetchGroups();
  };

  // --- Group Edit ---
  const [editGroup, setEditGroup] = useState<any>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupUseYn, setEditGroupUseYn] = useState(true);

  const startEditGroup = (g: any) => {
    setEditGroup(g);
    setEditGroupName(g.groupName);
    setEditGroupUseYn(g.useYn);
    setShowGroupCreate(false);
  };

  const onSaveGroup = async () => {
    await api.codesUpdateGroup(editGroup.groupKey, editGroupName, editGroupUseYn);
    setEditGroup(null);
    await refetchGroups();
  };

  const onDeleteGroup = async (g: any) => {
    if (!confirm(`"${g.groupKey}" 그룹을 삭제할까요?`)) return;
    await api.codesDeleteGroup(g.groupKey);
    if (selected === g.groupKey) setSelected("");
    await refetchGroups();
  };

  // --- Item Create ---
  const [showItemCreate, setShowItemCreate] = useState(false);
  const [code, setCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");

  const onCreateItem = async () => {
    await api.codesCreateItem(selected, { groupKey: selected, code, name: itemName, value: itemValue, sortOrder: 0, useYn: true });
    setCode(""); setItemName(""); setItemValue("");
    setShowItemCreate(false);
    await refetchItems();
  };

  // --- Item Edit ---
  const [editItem, setEditItem] = useState<any>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemValue, setEditItemValue] = useState("");
  const [editItemSortOrder, setEditItemSortOrder] = useState(0);
  const [editItemUseYn, setEditItemUseYn] = useState(true);

  const startEditItem = (it: any) => {
    setEditItem(it);
    setEditItemName(it.name);
    setEditItemValue(it.value ?? "");
    setEditItemSortOrder(it.sortOrder ?? 0);
    setEditItemUseYn(it.useYn);
    setShowItemCreate(false);
  };

  const onSaveItem = async () => {
    await api.codesUpdateItem(selected, editItem.code, editItemName, editItemValue, editItemSortOrder, editItemUseYn);
    setEditItem(null);
    await refetchItems();
  };

  const onDeleteItem = async (it: any) => {
    if (!confirm(`"${it.code}" 항목을 삭제할까요?`)) return;
    await api.codesDeleteItem(selected, it.code);
    await refetchItems();
  };

  const selectGroup = (key: string) => {
    setSelected(key);
    setEditItem(null);
    setShowItemCreate(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin · Common Codes (Redis cache)</div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Groups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>그룹</CardTitle>
            <Button
              variant="outline"
              onClick={() => { setShowGroupCreate((v) => !v); setEditGroup(null); }}
            >
              {showGroupCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showGroupCreate ? "닫기" : "그룹 추가"}
            </Button>
          </CardHeader>

          {showGroupCreate && (
            <div className="mx-4 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-3 space-y-2">
              <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">새 그룹</div>
              <div className="flex gap-2">
                <Input value={gKey} onChange={(e) => setGKey(e.target.value)} placeholder="GROUP_KEY" />
                <Input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="그룹 이름" />
                <Button onClick={onCreateGroup} disabled={!gKey || !gName}>추가</Button>
                <Button variant="outline" onClick={() => setShowGroupCreate(false)}>취소</Button>
              </div>
            </div>
          )}

          {editGroup && (
            <div className="mx-4 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-3 space-y-2">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                편집 중 — <span className="font-mono">{editGroup.groupKey}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} placeholder="그룹 이름" />
                <label className="flex items-center gap-1.5 text-xs whitespace-nowrap h-9">
                  <input type="checkbox" checked={editGroupUseYn} onChange={(e) => setEditGroupUseYn(e.target.checked)} />
                  사용
                </label>
                <Button onClick={onSaveGroup} disabled={!editGroupName.trim()}>저장</Button>
                <Button variant="outline" onClick={() => setEditGroup(null)}>취소</Button>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted text-xs text-muted-fg">
                  <th className="px-4 py-2.5 text-left font-medium">Key</th>
                  <th className="px-4 py-2.5 text-left font-medium">이름</th>
                  <th className="px-4 py-2.5 text-left font-medium">사용</th>
                  <th className="px-4 py-2.5 text-right font-medium">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(groups?.items ?? []).map((g: any) => (
                  <tr
                    key={g.groupKey}
                    onClick={() => selectGroup(g.groupKey)}
                    className={`cursor-pointer hover:bg-muted/60 transition-colors ${
                      selected === g.groupKey ? "bg-accent" : ""
                    } ${editGroup?.groupKey === g.groupKey ? "bg-blue-500/10/30" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-mono font-medium text-xs">{g.groupKey}</td>
                    <td className="px-4 py-2.5 text-muted-fg">{g.groupName}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={g.useYn ? "default" : "secondary"}>{g.useYn ? "Y" : "N"}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditGroup(g)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />편집
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            onClick={() => onDeleteGroup(g)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {(groups?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-fg">그룹이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>
              항목
              {selected && <span className="ml-2 text-xs font-mono text-muted-fg">({selected})</span>}
            </CardTitle>
            {selected && (
              <Button
                variant="outline"
                onClick={() => { setShowItemCreate((v) => !v); setEditItem(null); }}
              >
                {showItemCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
                {showItemCreate ? "닫기" : "항목 추가"}
              </Button>
            )}
          </CardHeader>

          {selected && showItemCreate && (
            <div className="mx-4 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-3 space-y-2">
              <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">새 항목</div>
              <div className="flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" />
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="이름" />
                <Input value={itemValue} onChange={(e) => setItemValue(e.target.value)} placeholder="값" />
                <Button onClick={onCreateItem} disabled={!code || !itemName}>추가</Button>
                <Button variant="outline" onClick={() => setShowItemCreate(false)}>취소</Button>
              </div>
            </div>
          )}

          {editItem && (
            <div className="mx-4 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-3 space-y-2">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                편집 중 — <span className="font-mono">{editItem.code}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input className="w-32" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} placeholder="이름" />
                <Input className="w-32" value={editItemValue} onChange={(e) => setEditItemValue(e.target.value)} placeholder="값" />
                <Input
                  type="number"
                  className="w-20"
                  value={editItemSortOrder}
                  onChange={(e) => setEditItemSortOrder(Number(e.target.value))}
                  placeholder="순서"
                />
                <label className="flex items-center gap-1.5 text-xs h-9">
                  <input type="checkbox" checked={editItemUseYn} onChange={(e) => setEditItemUseYn(e.target.checked)} />
                  사용
                </label>
                <Button onClick={onSaveItem} disabled={!editItemName.trim()}>저장</Button>
                <Button variant="outline" onClick={() => setEditItem(null)}>취소</Button>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            {!selected ? (
              <div className="px-4 py-8 text-center text-sm text-muted-fg">왼쪽에서 그룹을 선택하세요.</div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted text-xs text-muted-fg">
                      <th className="px-4 py-2.5 text-left font-medium">Code</th>
                      <th className="px-4 py-2.5 text-left font-medium">이름</th>
                      <th className="px-4 py-2.5 text-left font-medium">값</th>
                      <th className="px-4 py-2.5 text-left font-medium">사용</th>
                      <th className="px-4 py-2.5 text-right font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(items ?? []).map((it: any) => (
                      <tr
                        key={it.code}
                        className={`hover:bg-muted/60 transition-colors ${editItem?.code === it.code ? "bg-blue-500/10/30" : ""}`}
                      >
                        <td className="px-4 py-2.5 font-mono text-xs font-medium">{it.code}</td>
                        <td className="px-4 py-2.5 text-muted-fg">{it.name}</td>
                        <td className="px-4 py-2.5 text-muted-fg text-xs">{it.value || "—"}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={it.useYn ? "default" : "secondary"}>{it.useYn ? "Y" : "N"}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditItem(it)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" />편집
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                onClick={() => onDeleteItem(it)}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {(items ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-fg">항목이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="border-t px-4 py-3 text-xs text-muted-fg">
                  <span className="font-mono">GET /api/common-codes/{selected}</span> 로 캐시된 목록 조회
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
