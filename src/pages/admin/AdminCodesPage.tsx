import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
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
  const { t } = useTranslation();
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

  const createGroupMut = useMutation({
    mutationFn: () => api.codesCreateGroup({ groupKey: gKey, groupName: gName, useYn: true }),
    onSuccess: () => {
      setGKey(""); setGName("");
      setShowGroupCreate(false);
      refetchGroups();
      toast.success(t("admin.groupCreated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const saveGroupMut = useMutation({
    mutationFn: () => api.codesUpdateGroup(editGroup.groupKey, editGroupName, editGroupUseYn),
    onSuccess: () => {
      setEditGroup(null);
      refetchGroups();
      toast.success(t("admin.groupUpdated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteGroupTarget, setDeleteGroupTarget] = useState<any>(null);

  const deleteGroupMut = useMutation({
    mutationFn: () => api.codesDeleteGroup(deleteGroupTarget.groupKey),
    onSuccess: () => {
      if (selected === deleteGroupTarget.groupKey) setSelected("");
      refetchGroups();
      toast.success(t("admin.groupDeleted"));
      setDeleteGroupTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setDeleteGroupTarget(null);
    },
  });

  // --- Item Create ---
  const [showItemCreate, setShowItemCreate] = useState(false);
  const [code, setCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");

  const createItemMut = useMutation({
    mutationFn: () => api.codesCreateItem(selected, { groupKey: selected, code, name: itemName, value: itemValue, sortOrder: 0, useYn: true }),
    onSuccess: () => {
      setCode(""); setItemName(""); setItemValue("");
      setShowItemCreate(false);
      refetchItems();
      toast.success(t("admin.itemCreated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const saveItemMut = useMutation({
    mutationFn: () => api.codesUpdateItem(selected, editItem.code, editItemName, editItemValue, editItemSortOrder, editItemUseYn),
    onSuccess: () => {
      setEditItem(null);
      refetchItems();
      toast.success(t("admin.itemUpdated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteItemTarget, setDeleteItemTarget] = useState<any>(null);

  const deleteItemMut = useMutation({
    mutationFn: () => api.codesDeleteItem(selected, deleteItemTarget.code),
    onSuccess: () => {
      refetchItems();
      toast.success(t("admin.itemDeleted"));
      setDeleteItemTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setDeleteItemTarget(null);
    },
  });

  const selectGroup = (key: string) => {
    setSelected(key);
    setEditItem(null);
    setShowItemCreate(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("admin.codesPageTitle")}</div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Groups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>{t("admin.codeGroups")}</CardTitle>
            <Button
              variant="outline"
              onClick={() => { setShowGroupCreate((v) => !v); setEditGroup(null); }}
            >
              {showGroupCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showGroupCreate ? t("common.close") : t("admin.codeGroupAdd")}
            </Button>
          </CardHeader>

          {showGroupCreate && (
            <div className="mx-4 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-3 space-y-2">
              <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">{t("admin.newGroup")}</div>
              <div className="flex gap-2">
                <Input value={gKey} onChange={(e) => setGKey(e.target.value)} placeholder="GROUP_KEY" />
                <Input value={gName} onChange={(e) => setGName(e.target.value)} placeholder={t("admin.groupName")} />
                <Button onClick={() => createGroupMut.mutate()} disabled={!gKey || !gName || createGroupMut.isPending}>{t("common.create")}</Button>
                <Button variant="outline" onClick={() => setShowGroupCreate(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          {editGroup && (
            <div className="mx-4 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-3 space-y-2">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                {t("admin.editing")} — <span className="font-mono">{editGroup.groupKey}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} placeholder={t("admin.groupName")} />
                <label className="flex items-center gap-1.5 text-xs whitespace-nowrap h-9">
                  <input type="checkbox" checked={editGroupUseYn} onChange={(e) => setEditGroupUseYn(e.target.checked)} />
                  {t("common.use")}
                </label>
                <Button onClick={() => saveGroupMut.mutate()} disabled={!editGroupName.trim() || saveGroupMut.isPending}>{t("common.save")}</Button>
                <Button variant="outline" onClick={() => setEditGroup(null)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted text-xs text-muted-fg">
                  <th className="px-4 py-2.5 text-left font-medium">Key</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t("common.name")}</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t("common.use")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("common.actions")}</th>
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
                            <Pencil className="mr-2 h-3.5 w-3.5" />{t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            onClick={() => setDeleteGroupTarget(g)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />{t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {(groups?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-fg">{t("admin.noGroups")}</td>
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
              {t("admin.codeItems")}
              {selected && <span className="ml-2 text-xs font-mono text-muted-fg">({selected})</span>}
            </CardTitle>
            {selected && (
              <Button
                variant="outline"
                onClick={() => { setShowItemCreate((v) => !v); setEditItem(null); }}
              >
                {showItemCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
                {showItemCreate ? t("common.close") : t("admin.codeItemAdd")}
              </Button>
            )}
          </CardHeader>

          {selected && showItemCreate && (
            <div className="mx-4 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-3 space-y-2">
              <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">{t("admin.newItem")}</div>
              <div className="flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" />
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder={t("admin.itemName")} />
                <Input value={itemValue} onChange={(e) => setItemValue(e.target.value)} placeholder={t("admin.itemValue")} />
                <Button onClick={() => createItemMut.mutate()} disabled={!code || !itemName || createItemMut.isPending}>{t("common.create")}</Button>
                <Button variant="outline" onClick={() => setShowItemCreate(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          {editItem && (
            <div className="mx-4 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-3 space-y-2">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                {t("admin.editing")} — <span className="font-mono">{editItem.code}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input className="w-32" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} placeholder={t("admin.itemName")} />
                <Input className="w-32" value={editItemValue} onChange={(e) => setEditItemValue(e.target.value)} placeholder={t("admin.itemValue")} />
                <Input
                  type="number"
                  className="w-20"
                  value={editItemSortOrder}
                  onChange={(e) => setEditItemSortOrder(Number(e.target.value))}
                  placeholder={t("admin.menuOrder")}
                />
                <label className="flex items-center gap-1.5 text-xs h-9">
                  <input type="checkbox" checked={editItemUseYn} onChange={(e) => setEditItemUseYn(e.target.checked)} />
                  {t("common.use")}
                </label>
                <Button onClick={() => saveItemMut.mutate()} disabled={!editItemName.trim() || saveItemMut.isPending}>{t("common.save")}</Button>
                <Button variant="outline" onClick={() => setEditItem(null)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            {!selected ? (
              <div className="px-4 py-8 text-center text-sm text-muted-fg">{t("admin.selectGroupGuide")}</div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted text-xs text-muted-fg">
                      <th className="px-4 py-2.5 text-left font-medium">Code</th>
                      <th className="px-4 py-2.5 text-left font-medium">{t("common.name")}</th>
                      <th className="px-4 py-2.5 text-left font-medium">{t("admin.itemValue")}</th>
                      <th className="px-4 py-2.5 text-left font-medium">{t("common.use")}</th>
                      <th className="px-4 py-2.5 text-right font-medium">{t("common.actions")}</th>
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
                                <Pencil className="mr-2 h-3.5 w-3.5" />{t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                onClick={() => setDeleteItemTarget(it)}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />{t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {(items ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-fg">{t("admin.noItems")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="border-t px-4 py-3 text-xs text-muted-fg">
                  <span className="font-mono">GET /api/common-codes/{selected}</span> {t("admin.codesCacheNote", { groupKey: "" }).replace("GET /api/common-codes/ ", "")}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteGroupTarget}
        onOpenChange={(open) => { if (!open) setDeleteGroupTarget(null); }}
        title={t("admin.groupDeleteTitle")}
        description={t("admin.groupDeleteConfirm", { groupKey: deleteGroupTarget?.groupKey })}
        confirmLabel={t("common.delete")}
        onConfirm={() => deleteGroupMut.mutate()}
      />

      <ConfirmDialog
        open={!!deleteItemTarget}
        onOpenChange={(open) => { if (!open) setDeleteItemTarget(null); }}
        title={t("admin.itemDeleteTitle")}
        description={t("admin.itemDeleteConfirm", { code: deleteItemTarget?.code })}
        confirmLabel={t("common.delete")}
        onConfirm={() => deleteItemMut.mutate()}
      />
    </div>
  );
}
