import { apiRequest, client } from "@/lib/client";

export const adminApi = {
  // Users
  usersList: (orgId?: number, page = 1, size = 20, tenantId?: number | null) => {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    if (orgId) q.set("orgId", String(orgId));
    if (tenantId) q.set("tenantId", String(tenantId));
    return apiRequest<any>("GET", `/api/admin/users?${q.toString()}`);
  },
  userCreate: (payload: any) => apiRequest<void>("POST", "/api/admin/users", payload),
  userUpdate: (userId: number, payload: any) => apiRequest<void>("PUT", `/api/admin/users/${userId}`, payload),
  userResetPassword: (userId: number, newPassword: string) =>
    apiRequest<void>("PATCH", `/api/admin/users/${userId}/password`, { newPassword }),
  userDelete: (userId: number) => apiRequest<void>("DELETE", `/api/admin/users/${userId}`),
  userResetToken: (userId: number) =>
    apiRequest<{ token: string; expiresInMinutes: number }>("POST", `/api/admin/users/${userId}/reset-token`),
  usersExport: async (tenantId?: number | null) => {
    const q = new URLSearchParams();
    if (tenantId) q.set("tenantId", String(tenantId));
    const res = await client.get(`/api/admin/users/export?${q}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  },

  // Orgs
  orgTree: (tenantId?: number | null) => {
    const q = tenantId ? `?tenantId=${tenantId}` : "";
    return apiRequest<any[]>("GET", `/api/admin/orgs/tree${q}`);
  },
  orgList: (page = 1, size = 20, tenantId?: number | null) => {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    if (tenantId) q.set("tenantId", String(tenantId));
    return apiRequest<any>("GET", `/api/admin/orgs?${q}`);
  },
  orgCreate: (parentId: number | null, name: string, sortOrder = 0, useYn = true, tenantId?: number | null) =>
    apiRequest<void>("POST", "/api/admin/orgs", { parentId, name, sortOrder, useYn, tenantId }),
  orgUpdate: (orgId: number, payload: any) => apiRequest<void>("PUT", `/api/admin/orgs/${orgId}`, payload),
  orgDelete: (orgId: number) => apiRequest<void>("DELETE", `/api/admin/orgs/${orgId}`),

  // Roles
  rolesAll: () => apiRequest<any[]>("GET", "/api/admin/roles/all"),
  rolesPage: (page = 1, size = 20) => apiRequest<any>("GET", `/api/admin/roles?page=${page}&size=${size}`),
  roleCreate: (roleKey: string, roleName: string, useYn: boolean) =>
    apiRequest<void>("POST", "/api/admin/roles", { roleKey, roleName, useYn }),
  roleUpdate: (roleKey: string, roleName: string, useYn: boolean) =>
    apiRequest<void>("PUT", `/api/admin/roles/${roleKey}`, { roleName, useYn }),
  roleDelete: (roleKey: string) =>
    apiRequest<void>("DELETE", `/api/admin/roles/${roleKey}`),

  // Menus
  menusMy: () => apiRequest<any[]>("GET", "/api/menus/my"),
  menusAdminTree: (tenantId?: number | null) => {
    const q = tenantId ? `?tenantId=${tenantId}` : "";
    return apiRequest<any[]>("GET", `/api/admin/menus/tree${q}`);
  },
  menuCreate: (payload: any) => apiRequest<number>("POST", "/api/admin/menus", payload),
  menuUpdate: (menuId: number, payload: any) => apiRequest<void>("PUT", `/api/admin/menus/${menuId}`, payload),
  menuDelete: (menuId: number) => apiRequest<void>("DELETE", `/api/admin/menus/${menuId}`),
  menuSetRoles: (menuId: number, roleKeys: string[]) =>
    apiRequest<void>("PUT", `/api/admin/menus/${menuId}/roles`, { roleKeys }),

  // Codes
  codesGroups: (page = 1, size = 20) => apiRequest<any>("GET", `/api/admin/codes/groups?page=${page}&size=${size}`),
  codesItems: (groupKey: string) => apiRequest<any[]>("GET", `/api/admin/codes/groups/${groupKey}/items`),
  codesCreateGroup: (payload: any) => apiRequest<void>("POST", "/api/admin/codes/groups", payload),
  codesCreateItem: (groupKey: string, payload: any) =>
    apiRequest<void>("POST", `/api/admin/codes/groups/${groupKey}/items`, payload),
  codesUpdateGroup: (groupKey: string, groupName: string, useYn: boolean) =>
    apiRequest<void>("PUT", `/api/admin/codes/groups/${groupKey}`, { groupName, useYn }),
  codesDeleteGroup: (groupKey: string) =>
    apiRequest<void>("DELETE", `/api/admin/codes/groups/${groupKey}`),
  codesUpdateItem: (groupKey: string, code: string, name: string, value: string, sortOrder: number, useYn: boolean) =>
    apiRequest<void>("PUT", `/api/admin/codes/groups/${groupKey}/items/${code}`, { name, value, sortOrder, useYn }),
  codesDeleteItem: (groupKey: string, code: string) =>
    apiRequest<void>("DELETE", `/api/admin/codes/groups/${groupKey}/items/${code}`),

  // Permissions / Screens
  permissionsMyList: () => apiRequest<{ screenKey: string; actions: string[] }[]>("GET", "/api/permissions/my"),
  permScreens: () => apiRequest<any[]>("GET", "/api/admin/permissions/screens"),
  permCreateScreen: (screenKey: string, screenName: string) =>
    apiRequest<void>("POST", "/api/admin/permissions/screens", { screenKey, screenName }),
  permUpdateScreen: (screenId: number, screenName: string, useYn: boolean) =>
    apiRequest<void>("PUT", `/api/admin/permissions/screens/${screenId}`, { screenName, useYn }),
  permDeleteScreen: (screenId: number) =>
    apiRequest<void>("DELETE", `/api/admin/permissions/screens/${screenId}`),
  permActions: (screenId: number) =>
    apiRequest<any[]>("GET", `/api/admin/permissions/screens/${screenId}/actions`),
  permCreateAction: (screenId: number, actionKey: string, actionName: string) =>
    apiRequest<void>("POST", `/api/admin/permissions/screens/${screenId}/actions`, { actionKey, actionName }),
  permUpdateAction: (actionId: number, actionName: string, useYn: boolean) =>
    apiRequest<void>("PUT", `/api/admin/permissions/actions/${actionId}`, { actionName, useYn }),
  permDeleteAction: (actionId: number) =>
    apiRequest<void>("DELETE", `/api/admin/permissions/actions/${actionId}`),
  permRolesByAction: (actionId: number) =>
    apiRequest<string[]>("GET", `/api/admin/permissions/actions/${actionId}/roles`),
  permSetRoles: (actionId: number, roleKeys: string[]) =>
    apiRequest<void>("PUT", `/api/admin/permissions/actions/${actionId}/roles`, { roleKeys }),

  // Settings
  settingsGet: (tenantId?: number | null) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<{ tenantId: number; configKey: string; configValue: string }[]>("GET", `/api/admin/settings${q}`);
  },
  settingsSave: (configs: Record<string, string>, tenantId?: number | null) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<void>("PUT", `/api/admin/settings${q}`, configs);
  },

  // Invitations
  invitationCreate: (email: string, roleKey: string) =>
    apiRequest<{ token: string }>("POST", "/api/admin/invitations", { email, roleKey }),
  invitationList: (tenantId?: number | null) => {
    const q = tenantId ? `?tenantId=${tenantId}` : "";
    return apiRequest<any[]>("GET", `/api/admin/invitations${q}`);
  },

  // Audit
  auditList: (params: { tenantId?: number | null; action?: string; targetType?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams();
    if (params.tenantId != null) q.set("tenantId", String(params.tenantId));
    if (params.action) q.set("action", params.action);
    if (params.targetType) q.set("targetType", params.targetType);
    if (params.page) q.set("page", String(params.page));
    if (params.size) q.set("size", String(params.size));
    return apiRequest<any>("GET", `/api/admin/audit?${q.toString()}`);
  },
  auditExport: async (params: { tenantId?: number | null; action?: string; targetType?: string }) => {
    const q = new URLSearchParams();
    if (params.tenantId != null) q.set("tenantId", String(params.tenantId));
    if (params.action) q.set("action", params.action);
    if (params.targetType) q.set("targetType", params.targetType);
    const res = await client.get(`/api/admin/audit/export?${q}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  },
};
