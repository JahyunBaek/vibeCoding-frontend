import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
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
  isSuperAdmin,
}: {
  action: any;
  allRoles: any[];
  isSuperAdmin: boolean;
}) {
  const { t } = useTranslation();
  const { data: assignedRoles = [], refetch } = useQuery<string[]>({
    queryKey: ["perm", "action", action.actionId, "roles"],
    queryFn: () => api.permRolesByAction(action.actionId),
  });

  const toggleMut = useMutation({
    mutationFn: (roleKey: string) => {
      const next = assignedRoles.includes(roleKey)
        ? assignedRoles.filter((k) => k !== roleKey)
        : [...assignedRoles, roleKey];
      return api.permSetRoles(action.actionId, next);
    },
    onSuccess: () => {
      refetch();
      toast.success(t("admin.settingsSaved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visibleRoles = allRoles.filter((r: any) => isSuperAdmin || r.roleKey !== "SUPER_ADMIN");

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {visibleRoles.map((role: any) => {
        const checked = assignedRoles.includes(role.roleKey);
        return (
          <label
            key={role.roleKey}
            className="flex items-center gap-1.5 cursor-pointer text-xs select-none"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleMut.mutate(role.roleKey)}
              disabled={toggleMut.isPending}
              className="rounded"
            />
            <span className={checked ? "font-medium text-foreground" : "text-muted-fg"}>
              {role.roleKey}
            </span>
          </label>
        );
      })}
      {visibleRoles.length === 0 && (
        <span className="text-xs text-muted-fg">{t("admin.noRolesAvailable")}</span>
      )}
    </div>
  );
}

// ------------- Actions panel for selected screen -------------
function ActionsPanel({
  screen,
  allRoles,
  isSuperAdmin,
  onClose,
}: {
  screen: any;
  allRoles: any[];
  isSuperAdmin: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: actions = [], refetch } = useQuery<any[]>({
    queryKey: ["perm", "screen", screen.screenId, "actions"],
    queryFn: () => api.permActions(screen.screenId),
  });

  // Create action
  const [showCreate, setShowCreate] = useState(false);
  const [newActionKey, setNewActionKey] = useState("");
  const [newActionName, setNewActionName] = useState("");

  const createMut = useMutation({
    mutationFn: () => api.permCreateAction(screen.screenId, newActionKey.trim(), newActionName.trim()),
    onSuccess: () => {
      setNewActionKey("");
      setNewActionName("");
      setShowCreate(false);
      refetch();
      toast.success(t("admin.actionCreated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const saveMut = useMutation({
    mutationFn: () => api.permUpdateAction(editAction.actionId, editActionName, editActionUseYn),
    onSuccess: () => {
      setEditAction(null);
      refetch();
      toast.success(t("admin.actionUpdated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteActionTarget, setDeleteActionTarget] = useState<any>(null);

  const deleteMut = useMutation({
    mutationFn: () => api.permDeleteAction(deleteActionTarget.actionId),
    onSuccess: () => {
      refetch();
      toast.success(t("admin.actionDeleted"));
      setDeleteActionTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setDeleteActionTarget(null);
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ChevronRight className="h-4 w-4 text-muted-fg" />
          {t("admin.actionList")} — <span className="font-mono text-sm text-muted-fg">{screen.screenName}</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowCreate((v) => !v); setEditAction(null); }}
          >
            {showCreate ? <X className="mr-1.5 h-3.5 w-3.5" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            {showCreate ? t("common.close") : t("admin.actionAdd")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Create action form */}
      {showCreate && (
        <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3">
          <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">{t("admin.newAction")}</div>
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
              placeholder={t("admin.actionName")}
            />
            <Button
              onClick={() => createMut.mutate()}
              disabled={!newActionKey.trim() || !newActionName.trim() || createMut.isPending}
            >
              {t("common.create")}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel")}</Button>
          </div>
        </div>
      )}

      {/* Edit action panel */}
      {editAction && (
        <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-4 space-y-3">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            {t("admin.editing")} — <span className="font-mono">{editAction.actionKey}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              className="w-48"
              value={editActionName}
              onChange={(e) => setEditActionName(e.target.value)}
              placeholder={t("admin.actionName")}
            />
            <label className="flex items-center gap-2 text-sm h-9">
              <input
                type="checkbox"
                checked={editActionUseYn}
                onChange={(e) => setEditActionUseYn(e.target.checked)}
              />
              {t("common.use")}
            </label>
            <Button onClick={() => saveMut.mutate()} disabled={!editActionName.trim() || saveMut.isPending}>{t("common.save")}</Button>
            <Button variant="outline" onClick={() => setEditAction(null)}>{t("common.cancel")}</Button>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {actions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-fg">{t("admin.noActions")}</div>
        ) : (
          <div className="divide-y">
            {actions.map((a: any) => (
              <div
                key={a.actionId}
                className={`px-4 py-3 transition-colors ${editAction?.actionId === a.actionId ? "bg-blue-500/10/30" : "hover:bg-muted/60"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-foreground">{a.actionKey}</span>
                      <span className="text-sm text-muted-fg">{a.actionName}</span>
                      <Badge variant={a.useYn ? "default" : "secondary"} className="text-[10px]">
                        {a.useYn ? "Y" : "N"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] text-muted-fg mb-1 uppercase tracking-wide">{t("admin.roleAssignment")}</div>
                      <ActionRoleRow action={a} allRoles={allRoles} isSuperAdmin={isSuperAdmin} />
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
                        <Pencil className="mr-2 h-3.5 w-3.5" />{t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                        onClick={() => setDeleteActionTarget(a)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />{t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!deleteActionTarget}
        onOpenChange={(open) => { if (!open) setDeleteActionTarget(null); }}
        title={t("admin.actionDeleteTitle")}
        description={t("admin.actionDeleteConfirm", { actionKey: deleteActionTarget?.actionKey })}
        confirmLabel={t("common.delete")}
        onConfirm={() => deleteMut.mutate()}
      />
    </Card>
  );
}

// ------------- Main page -------------
export default function AdminScreensPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.roleKey === "SUPER_ADMIN";

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

  const createScreenMut = useMutation({
    mutationFn: () => api.permCreateScreen(newScreenKey.trim(), newScreenName.trim()),
    onSuccess: () => {
      setNewScreenKey("");
      setNewScreenName("");
      setShowCreate(false);
      refetchScreens();
      toast.success(t("admin.screenCreated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const saveScreenMut = useMutation({
    mutationFn: () => api.permUpdateScreen(editScreen.screenId, editScreenName, editScreenUseYn),
    onSuccess: () => {
      if (selectedScreen?.screenId === editScreen.screenId) {
        setSelectedScreen({ ...selectedScreen, screenName: editScreenName, useYn: editScreenUseYn });
      }
      setEditScreen(null);
      refetchScreens();
      toast.success(t("admin.screenUpdated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteScreenTarget, setDeleteScreenTarget] = useState<any>(null);

  const deleteScreenMut = useMutation({
    mutationFn: () => {
      if (selectedScreen?.screenId === deleteScreenTarget.screenId) setSelectedScreen(null);
      return api.permDeleteScreen(deleteScreenTarget.screenId);
    },
    onSuccess: () => {
      refetchScreens();
      toast.success(t("admin.screenDeleted"));
      setDeleteScreenTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setDeleteScreenTarget(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <Shield className="h-5 w-5 text-muted-fg" />
        {t("admin.screensPageTitle")}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Screen list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>{t("admin.screenList")}</CardTitle>
            <Button
              variant="outline"
              onClick={() => { setShowCreate((v) => !v); setEditScreen(null); }}
            >
              {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showCreate ? t("common.close") : t("admin.screenAdd")}
            </Button>
          </CardHeader>

          {/* Create form */}
          {showCreate && (
            <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3">
              <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">{t("admin.newScreen")}</div>
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
                  placeholder={t("admin.screenName")}
                />
                <Button
                  onClick={() => createScreenMut.mutate()}
                  disabled={!newScreenKey.trim() || !newScreenName.trim() || createScreenMut.isPending}
                >
                  {t("common.create")}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          {/* Edit panel */}
          {editScreen && (
            <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-4 space-y-3">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                {t("admin.editing")} — <span className="font-mono">{editScreen.screenKey}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  className="w-48"
                  value={editScreenName}
                  onChange={(e) => setEditScreenName(e.target.value)}
                  placeholder={t("admin.screenName")}
                />
                <label className="flex items-center gap-2 text-sm h-9">
                  <input
                    type="checkbox"
                    checked={editScreenUseYn}
                    onChange={(e) => setEditScreenUseYn(e.target.checked)}
                  />
                  {t("common.use")}
                </label>
                <Button onClick={() => saveScreenMut.mutate()} disabled={!editScreenName.trim() || saveScreenMut.isPending}>{t("common.save")}</Button>
                <Button variant="outline" onClick={() => setEditScreen(null)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted text-xs text-muted-fg">
                  <th className="px-4 py-3 text-left font-medium">Screen Key</th>
                  <th className="px-4 py-3 text-left font-medium">{t("common.name")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("common.use")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {screens.map((s: any) => (
                  <tr
                    key={s.screenId}
                    className={`cursor-pointer transition-colors hover:bg-muted/60 ${
                      selectedScreen?.screenId === s.screenId
                        ? "bg-blue-500/10/40 border-l-2 border-l-blue-500"
                        : ""
                    } ${editScreen?.screenId === s.screenId ? "bg-blue-500/10/30" : ""}`}
                    onClick={() =>
                      setSelectedScreen(
                        selectedScreen?.screenId === s.screenId ? null : s
                      )
                    }
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{s.screenKey}</td>
                    <td className="px-4 py-3 text-foreground">{s.screenName}</td>
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
                            <Pencil className="mr-2 h-3.5 w-3.5" />{t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            onClick={() => setDeleteScreenTarget(s)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />{t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {screens.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-fg">
                      {t("admin.noScreens")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="border-t px-4 py-3 text-xs text-muted-fg">
              {t("admin.screenClickGuide")}
            </div>
          </CardContent>
        </Card>

        {/* Right: Actions panel */}
        <div>
          {selectedScreen ? (
            <ActionsPanel
              screen={selectedScreen}
              allRoles={allRoles}
              isSuperAdmin={isSuperAdmin}
              onClose={() => setSelectedScreen(null)}
            />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-base bg-muted text-sm text-muted-fg">
              <div className="flex flex-col items-center gap-2">
                <ChevronRight className="h-6 w-6 opacity-40" />
                {t("admin.screenSelectGuide")}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteScreenTarget}
        onOpenChange={(open) => { if (!open) setDeleteScreenTarget(null); }}
        title={t("admin.screenDeleteTitle")}
        description={t("admin.screenDeleteConfirm", { screenKey: deleteScreenTarget?.screenKey })}
        confirmLabel={t("common.delete")}
        onConfirm={() => deleteScreenMut.mutate()}
      />
    </div>
  );
}
