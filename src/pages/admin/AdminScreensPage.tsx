import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Shield,
  Plus,
  X,
  Pencil,
  Trash2,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
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

// ------------- Role checkboxes for an action -------------
function ActionRoleRow({
  action,
  allRoles,
}: {
  action: any;
  allRoles: any[];
}) {
  const { data: assignedRoles = [], refetch } = useQuery<string[]>({
    queryKey: ["perm", "action", action.actionId, "roles"],
    queryFn: () => api.permRolesByAction(action.actionId),
  });

  const toggle = async (roleKey: string) => {
    const next = assignedRoles.includes(roleKey)
      ? assignedRoles.filter((k) => k !== roleKey)
      : [...assignedRoles, roleKey];
    await api.permSetRoles(action.actionId, next);
    await refetch();
  };

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {allRoles.map((role: any) => {
        const checked = assignedRoles.includes(role.roleKey);
        return (
          <label
            key={role.roleKey}
            className="flex items-center gap-1.5 cursor-pointer text-xs select-none"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(role.roleKey)}
              className="rounded"
            />
            <span className={checked ? "font-medium text-slate-800" : "text-slate-500"}>
              {role.roleKey}
            </span>
          </label>
        );
      })}
      {allRoles.length === 0 && (
        <span className="text-xs text-slate-400">역할 없음</span>
      )}
    </div>
  );
}

// ------------- Actions panel for selected screen -------------
function ActionsPanel({
  screen,
  allRoles,
  onClose,
}: {
  screen: any;
  allRoles: any[];
  onClose: () => void;
}) {
  const { data: actions = [], refetch } = useQuery<any[]>({
    queryKey: ["perm", "screen", screen.screenId, "actions"],
    queryFn: () => api.permActions(screen.screenId),
  });

  // Create action
  const [showCreate, setShowCreate] = useState(false);
  const [newActionKey, setNewActionKey] = useState("");
  const [newActionName, setNewActionName] = useState("");

  const onCreateAction = async () => {
    await api.permCreateAction(screen.screenId, newActionKey.trim(), newActionName.trim());
    setNewActionKey("");
    setNewActionName("");
    setShowCreate(false);
    await refetch();
  };

  // Edit action
  const [editAction, setEditAction] = useState<any>(null);
  const [editActionName, setEditActionName] = useState("");
  const [editActionUseYn, setEditActionUseYn] = useState(true);

  const startEditAction = (a: any) => {
    setEditAction(a);
    setEditActionName(a.actionName);
    setEditActionUseYn(a.useYn);
    setShowCreate(false);
  };

  const onSaveAction = async () => {
    await api.permUpdateAction(editAction.actionId, editActionName, editActionUseYn);
    setEditAction(null);
    await refetch();
  };

  const onDeleteAction = async (a: any) => {
    if (!confirm(`"${a.actionKey}" 액션을 삭제할까요?`)) return;
    await api.permDeleteAction(a.actionId);
    await refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ChevronRight className="h-4 w-4 text-slate-400" />
          액션 목록 — <span className="font-mono text-sm text-slate-600">{screen.screenName}</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowCreate((v) => !v); setEditAction(null); }}
          >
            {showCreate ? <X className="mr-1.5 h-3.5 w-3.5" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            {showCreate ? "닫기" : "액션 추가"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Create action form */}
      {showCreate && (
        <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">새 액션</div>
          <div className="flex gap-2 flex-wrap">
            <Input
              className="w-40"
              value={newActionKey}
              onChange={(e) => setNewActionKey(e.target.value)}
              placeholder="ACTION_KEY"
            />
            <Input
              className="w-48"
              value={newActionName}
              onChange={(e) => setNewActionName(e.target.value)}
              placeholder="액션 이름"
            />
            <Button
              onClick={onCreateAction}
              disabled={!newActionKey.trim() || !newActionName.trim()}
            >
              추가
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
          </div>
        </div>
      )}

      {/* Edit action panel */}
      {editAction && (
        <div className="mx-6 mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            편집 중 — <span className="font-mono">{editAction.actionKey}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              className="w-48"
              value={editActionName}
              onChange={(e) => setEditActionName(e.target.value)}
              placeholder="액션 이름"
            />
            <label className="flex items-center gap-2 text-sm h-9">
              <input
                type="checkbox"
                checked={editActionUseYn}
                onChange={(e) => setEditActionUseYn(e.target.checked)}
              />
              사용
            </label>
            <Button onClick={onSaveAction} disabled={!editActionName.trim()}>저장</Button>
            <Button variant="outline" onClick={() => setEditAction(null)}>취소</Button>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {actions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">액션이 없습니다.</div>
        ) : (
          <div className="divide-y">
            {actions.map((a: any) => (
              <div
                key={a.actionId}
                className={`px-4 py-3 transition-colors ${editAction?.actionId === a.actionId ? "bg-blue-50/30" : "hover:bg-slate-50/60"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-700">{a.actionKey}</span>
                      <span className="text-sm text-slate-600">{a.actionName}</span>
                      <Badge variant={a.useYn ? "default" : "secondary"} className="text-[10px]">
                        {a.useYn ? "Y" : "N"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">역할 배정</div>
                      <ActionRoleRow action={a} allRoles={allRoles} />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-7 w-7 p-0 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEditAction(a)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />편집
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => onDeleteAction(a)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ------------- Main page -------------
export default function AdminScreensPage() {
  const { data: screens = [], refetch: refetchScreens } = useQuery<any[]>({
    queryKey: ["admin", "perm", "screens"],
    queryFn: () => api.permScreens(),
  });

  const { data: allRoles = [] } = useQuery<any[]>({
    queryKey: ["admin", "roles", "all"],
    queryFn: () => api.rolesAll(),
  });

  // Selected screen
  const [selectedScreen, setSelectedScreen] = useState<any>(null);

  // Create screen
  const [showCreate, setShowCreate] = useState(false);
  const [newScreenKey, setNewScreenKey] = useState("");
  const [newScreenName, setNewScreenName] = useState("");

  const onCreateScreen = async () => {
    await api.permCreateScreen(newScreenKey.trim(), newScreenName.trim());
    setNewScreenKey("");
    setNewScreenName("");
    setShowCreate(false);
    await refetchScreens();
  };

  // Edit screen
  const [editScreen, setEditScreen] = useState<any>(null);
  const [editScreenName, setEditScreenName] = useState("");
  const [editScreenUseYn, setEditScreenUseYn] = useState(true);

  const startEditScreen = (s: any) => {
    setEditScreen(s);
    setEditScreenName(s.screenName);
    setEditScreenUseYn(s.useYn);
    setShowCreate(false);
  };

  const onSaveScreen = async () => {
    await api.permUpdateScreen(editScreen.screenId, editScreenName, editScreenUseYn);
    if (selectedScreen?.screenId === editScreen.screenId) {
      setSelectedScreen({ ...selectedScreen, screenName: editScreenName, useYn: editScreenUseYn });
    }
    setEditScreen(null);
    await refetchScreens();
  };

  const onDeleteScreen = async (s: any) => {
    if (!confirm(`"${s.screenKey}" 화면을 삭제할까요?`)) return;
    if (selectedScreen?.screenId === s.screenId) setSelectedScreen(null);
    await api.permDeleteScreen(s.screenId);
    await refetchScreens();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <Shield className="h-5 w-5 text-slate-600" />
        Admin · Screens &amp; Permissions
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Screen list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>화면 목록</CardTitle>
            <Button
              variant="outline"
              onClick={() => { setShowCreate((v) => !v); setEditScreen(null); }}
            >
              {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showCreate ? "닫기" : "화면 추가"}
            </Button>
          </CardHeader>

          {/* Create form */}
          {showCreate && (
            <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">새 화면</div>
              <div className="flex gap-2 flex-wrap">
                <Input
                  className="w-44"
                  value={newScreenKey}
                  onChange={(e) => setNewScreenKey(e.target.value)}
                  placeholder="SCREEN_KEY"
                />
                <Input
                  className="w-44"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="화면 이름"
                />
                <Button
                  onClick={onCreateScreen}
                  disabled={!newScreenKey.trim() || !newScreenName.trim()}
                >
                  추가
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
              </div>
            </div>
          )}

          {/* Edit panel */}
          {editScreen && (
            <div className="mx-6 mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                편집 중 — <span className="font-mono">{editScreen.screenKey}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  className="w-48"
                  value={editScreenName}
                  onChange={(e) => setEditScreenName(e.target.value)}
                  placeholder="화면 이름"
                />
                <label className="flex items-center gap-2 text-sm h-9">
                  <input
                    type="checkbox"
                    checked={editScreenUseYn}
                    onChange={(e) => setEditScreenUseYn(e.target.checked)}
                  />
                  사용
                </label>
                <Button onClick={onSaveScreen} disabled={!editScreenName.trim()}>저장</Button>
                <Button variant="outline" onClick={() => setEditScreen(null)}>취소</Button>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">Screen Key</th>
                  <th className="px-4 py-3 text-left font-medium">이름</th>
                  <th className="px-4 py-3 text-left font-medium">사용</th>
                  <th className="px-4 py-3 text-right font-medium">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {screens.map((s: any) => (
                  <tr
                    key={s.screenId}
                    className={`cursor-pointer transition-colors hover:bg-slate-50/60 ${
                      selectedScreen?.screenId === s.screenId
                        ? "bg-blue-50/40 border-l-2 border-l-blue-500"
                        : ""
                    } ${editScreen?.screenId === s.screenId ? "bg-blue-50/30" : ""}`}
                    onClick={() =>
                      setSelectedScreen(
                        selectedScreen?.screenId === s.screenId ? null : s
                      )
                    }
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{s.screenKey}</td>
                    <td className="px-4 py-3 text-slate-700">{s.screenName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.useYn ? "default" : "secondary"}>{s.useYn ? "Y" : "N"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditScreen(s)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />편집
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => onDeleteScreen(s)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {screens.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                      화면이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="border-t px-4 py-3 text-xs text-slate-400">
              행을 클릭하면 해당 화면의 액션을 관리할 수 있습니다.
            </div>
          </CardContent>
        </Card>

        {/* Right: Actions panel */}
        <div>
          {selectedScreen ? (
            <ActionsPanel
              screen={selectedScreen}
              allRoles={allRoles}
              onClose={() => setSelectedScreen(null)}
            />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
              <div className="flex flex-col items-center gap-2">
                <ChevronRight className="h-6 w-6 opacity-40" />
                화면을 선택하면 액션 목록이 표시됩니다.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
