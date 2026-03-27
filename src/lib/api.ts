import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "@/stores/auth";
import type { ApiResponse } from "@/types/api";

export type { ApiError, ApiResponse } from "@/types/api";

// --------------------------------------------
// axios instance
// --------------------------------------------
const client: AxiosInstance = axios.create({
  baseURL: "",            // same-origin
  withCredentials: true,  // ✅ refresh cookie 전송
  timeout: 15000,
});

// --------------------------------------------
// refresh 상태 + 대기 큐
// --------------------------------------------
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// refresh 동안 401난 요청들을 쌓아둠
type Pending = {
  resolve: (value: AxiosResponse<any>) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig & { _retry?: boolean };
};
let pendingQueue: Pending[] = [];

function isAuthUrl(url: string | undefined) {
  if (!url) return false;
  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/logout") ||
    url.includes("/api/auth/refresh")
  );
}

function flushQueueSuccess() {
  // refresh 성공 -> 큐에 있던 요청들 전부 재시도
  const q = pendingQueue;
  pendingQueue = [];
  for (const item of q) {
    client
      .request(item.config)
      .then(item.resolve)
      .catch(item.reject);
  }
}

function flushQueueFail(err: any) {
  // refresh 실패 -> 큐에 있던 요청들 전부 실패 처리
  const q = pendingQueue;
  pendingQueue = [];
  for (const item of q) item.reject(err);
}

// --------------------------------------------
// request interceptor: access token 자동 첨부
// --------------------------------------------
client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as any)["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// --------------------------------------------
// refresh 함수 (single-flight)
// --------------------------------------------
export async function refresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // refresh는 Bearer 없이 쿠키로만
      const res = await axios.post<ApiResponse<{ accessToken: string; user: any }>>(
        "/api/auth/refresh",
        null,
        { withCredentials: true }
      );

      if (!res.data?.success) return false;

      useAuthStore.getState().setAuth(res.data.data.accessToken, res.data.data.user);
      return true;
    } catch {
      useAuthStore.getState().clear();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// --------------------------------------------
// response interceptor: 401 처리 + 큐잉
// --------------------------------------------
client.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!original) throw error;

    const url = original.url;

    // 401이 아니면 그대로 throw
    if (status !== 401) throw error;

    // auth endpoint는 재시도/refresh 대상에서 제외(무한루프 방지)
    if (isAuthUrl(url)) throw error;

    // 이미 재시도 했는데 또 401이면 그대로 throw
    if (original._retry) throw error;
    original._retry = true;

    // ✅ 이미 refresh 중이면: 이 요청은 큐에 넣고 대기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config: original });
      });
    }

    // ✅ refresh 시작
    isRefreshing = true;
    const ok = await refresh();
    isRefreshing = false;

    if (ok) {
      // refresh 성공 -> 큐 재시도 + 현재 요청 재시도
      flushQueueSuccess();
      return client.request(original);
    } else {
      // refresh 실패 -> 큐 실패 처리
      const err = new Error("Refresh failed");
      flushQueueFail(err);
      throw error;
    }
  }
);

// --------------------------------------------
// 공통 apiRequest
// --------------------------------------------
export async function apiRequest<T>(
  method: string,
  url: string,
  body?: any,
  opts?: { isFormData?: boolean; headers?: Record<string, string> }
): Promise<T> {
  try {
    const res = await client.request<ApiResponse<T>>({
      method,
      url,
      data: body,
      headers: opts?.isFormData
        ? opts?.headers
        : { "Content-Type": "application/json", ...opts?.headers },
    });
    const json = res.data;
    if (!json?.success) {
      const msg = json?.error?.message || "Request failed";
      throw new Error(msg);
    }
    return json.data;
  } catch (e: any) {
    if (axios.isAxiosError(e)) {
      const data = e.response?.data as ApiResponse<any> | undefined;
      const msg =
        data?.error?.message ||
        e.message ||
        `Request failed (${e.response?.status ?? "unknown"})`;
      throw new Error(msg);
    }
    throw e;
  }
}

export const api = {
  login: (username: string, password: string) =>
    apiRequest<{ accessToken: string; user: any }>("POST", "/api/auth/login", { username, password }),

  logout: () => apiRequest<void>("POST", "/api/auth/logout"),

  resetPassword: (token: string, newPassword: string) =>
    apiRequest<void>("POST", "/api/auth/reset-password", { token, newPassword }),

  me: () => apiRequest<any>("GET", "/api/me"),
  updateMe: (name: string, currentPassword?: string, newPassword?: string) =>
    apiRequest<void>("PUT", "/api/me", { name, currentPassword, newPassword }),

  menusMy: () => apiRequest<any[]>("GET", "/api/menus/my"),

  menusAdminTree: (tenantId?: number | null) => {
    const q = tenantId ? `?tenantId=${tenantId}` : "";
    return apiRequest<any[]>("GET", `/api/admin/menus/tree${q}`);
  },

  dashboard: () => apiRequest<any>("GET", "/api/dashboard/summary"),

  boardsAdminList: (page = 1, size = 20, tenantId?: number | null) => {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    if (tenantId) q.set("tenantId", String(tenantId));
    return apiRequest<any>("GET", `/api/admin/boards?${q}`);
  },
  boardsAdminCreate: (name: string, description?: string, useYn = true, tenantId?: number | null) =>
    apiRequest<number>("POST", "/api/admin/boards", { name, description, useYn, tenantId }),
  boardsAdminUpdate: (boardId: number, name: string, description?: string, useYn = true) =>
    apiRequest<void>("PUT", `/api/admin/boards/${boardId}`, { name, description, useYn }),
  boardsAdminDelete: (boardId: number) => apiRequest<void>("DELETE", `/api/admin/boards/${boardId}`),

  fileUploadInlineImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<{ url: string }>("POST", "/api/files/image", formData, { isFormData: true });
  },

  postsList: (boardId: string, page = 1, size = 10, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.set("search", search);
    return apiRequest<any>("GET", `/api/boards/${boardId}/posts?${params}`);
  },
  postDetail: (boardId: string, postId: string) => apiRequest<any>("GET", `/api/boards/${boardId}/posts/${postId}`),
  postCreate: (boardId: string, title: string, content: string, fileIds: number[], idempotencyKey?: string) =>
    apiRequest<number>("POST", `/api/boards/${boardId}/posts`, { title, content, fileIds },
      idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined),
  postUpdate: (boardId: string, postId: string, title: string, content: string, fileIds: number[]) =>
    apiRequest<void>("PUT", `/api/boards/${boardId}/posts/${postId}`, { title, content, fileIds }),
  postDelete: (boardId: string, postId: string) => apiRequest<void>("DELETE", `/api/boards/${boardId}/posts/${postId}`),

  commentsList: (postId: string) => apiRequest<any[]>("GET", `/api/posts/${postId}/comments`),
  commentCreate: (postId: string, content: string) => apiRequest<void>("POST", `/api/posts/${postId}/comments`, { content }),
  commentUpdate: (postId: string, commentId: number, content: string) =>
    apiRequest<void>("PUT", `/api/posts/${postId}/comments/${commentId}`, { content }),
  commentDelete: (postId: string, commentId: number) =>
    apiRequest<void>("DELETE", `/api/posts/${postId}/comments/${commentId}`),

  fileUpload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiRequest<{ fileId: number; originalName: string; sizeBytes: number }>("POST", "/api/files", fd, {
      isFormData: true
    });
  },

  fileUploadWithProgress: async (
    file: File,
    onProgress: (pct: number) => void
  ): Promise<{ fileId: number; originalName: string; sizeBytes: number }> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await client.post<ApiResponse<{ fileId: number; originalName: string; sizeBytes: number }>>(
      "/api/files",
      fd,
      {
        onUploadProgress: (e) =>
          onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
      }
    );
    if (!res.data?.success) throw new Error(res.data?.error?.message ?? "Upload failed");
    return res.data.data;
  },

  fileDelete: (fileId: number) => apiRequest<void>("DELETE", `/api/files/${fileId}`),

  fileDownload: async (fileId: number, fileName: string) => {
    const res = await client.get(`/api/files/${fileId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },

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

  rolesAll: () => apiRequest<any[]>("GET", "/api/admin/roles/all"),
  rolesPage: (page = 1, size = 20) => apiRequest<any>("GET", `/api/admin/roles?page=${page}&size=${size}`),
  roleCreate: (roleKey: string, roleName: string, useYn: boolean) =>
    apiRequest<void>("POST", "/api/admin/roles", { roleKey, roleName, useYn }),
  roleUpdate: (roleKey: string, roleName: string, useYn: boolean) =>
    apiRequest<void>("PUT", `/api/admin/roles/${roleKey}`, { roleName, useYn }),
  roleDelete: (roleKey: string) =>
    apiRequest<void>("DELETE", `/api/admin/roles/${roleKey}`),

  menuCreate: (payload: any) => apiRequest<number>("POST", "/api/admin/menus", payload),
  menuUpdate: (menuId: number, payload: any) => apiRequest<void>("PUT", `/api/admin/menus/${menuId}`, payload),
  menuDelete: (menuId: number) => apiRequest<void>("DELETE", `/api/admin/menus/${menuId}`),
  menuSetRoles: (menuId: number, roleKeys: string[]) =>
    apiRequest<void>("PUT", `/api/admin/menus/${menuId}/roles`, { roleKeys }),

  // Super-Admin: Tenant management
  superAdminTenants: (page = 1, size = 20) =>
    apiRequest<any>("GET", `/api/super-admin/tenants?page=${page}&size=${size}`),
  superAdminTenantCreate: (payload: { tenantKey: string; tenantName: string; planType?: string; adminUsername: string; adminPassword: string }) =>
    apiRequest<{ tenantId: number; adminUsername: string; adminPassword: string }>("POST", "/api/super-admin/tenants", payload),
  superAdminTenantUpdate: (tenantId: number, payload: { tenantName: string; planType: string; active: boolean }) =>
    apiRequest<void>("PUT", `/api/super-admin/tenants/${tenantId}`, payload),
  superAdminTenantDelete: (tenantId: number) =>
    apiRequest<void>("DELETE", `/api/super-admin/tenants/${tenantId}`),

  // Permissions
  permissionsMyList: () => apiRequest<{ screenKey: string; actions: string[] }[]>("GET", "/api/permissions/my"),
  permScreens: () => apiRequest<any[]>("GET", "/api/admin/permissions/screens"),
  permCreateScreen: (screenKey: string, screenName: string) => apiRequest<void>("POST", "/api/admin/permissions/screens", { screenKey, screenName }),
  permUpdateScreen: (screenId: number, screenName: string, useYn: boolean) => apiRequest<void>("PUT", `/api/admin/permissions/screens/${screenId}`, { screenName, useYn }),
  permDeleteScreen: (screenId: number) => apiRequest<void>("DELETE", `/api/admin/permissions/screens/${screenId}`),
  permActions: (screenId: number) => apiRequest<any[]>("GET", `/api/admin/permissions/screens/${screenId}/actions`),
  permCreateAction: (screenId: number, actionKey: string, actionName: string) => apiRequest<void>("POST", `/api/admin/permissions/screens/${screenId}/actions`, { actionKey, actionName }),
  permUpdateAction: (actionId: number, actionName: string, useYn: boolean) => apiRequest<void>("PUT", `/api/admin/permissions/actions/${actionId}`, { actionName, useYn }),
  permDeleteAction: (actionId: number) => apiRequest<void>("DELETE", `/api/admin/permissions/actions/${actionId}`),
  permRolesByAction: (actionId: number) => apiRequest<string[]>("GET", `/api/admin/permissions/actions/${actionId}/roles`),
  permSetRoles: (actionId: number, roleKeys: string[]) => apiRequest<void>("PUT", `/api/admin/permissions/actions/${actionId}/roles`, { roleKeys }),

  // Tenant Branding (any authenticated user)
  tenantBranding: () => apiRequest<{ companyName: string; logoUrl: string; locale: string; primaryColor: string; sidebarColor: string; accentColor: string }>("GET", "/api/tenant/branding"),

  // Settings (Tenant Config)
  settingsGet: (tenantId?: number | null) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<{ tenantId: number; configKey: string; configValue: string }[]>("GET", `/api/admin/settings${q}`);
  },
  settingsSave: (configs: Record<string, string>, tenantId?: number | null) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<void>("PUT", `/api/admin/settings${q}`, configs);
  },

  // Admin invitation
  invitationCreate: (email: string, roleKey: string) =>
    apiRequest<{ token: string }>("POST", "/api/admin/invitations", { email, roleKey }),
  invitationList: (tenantId?: number | null) => {
    const q = tenantId ? `?tenantId=${tenantId}` : "";
    return apiRequest<any[]>("GET", `/api/admin/invitations${q}`);
  },

  // Public signup
  invitationValidate: (token: string) =>
    apiRequest<{ email: string; tenantName: string }>("GET", `/api/auth/invitation/${token}`),
  signup: (token: string, username: string, password: string, name: string) =>
    apiRequest<void>("POST", "/api/auth/signup", { token, username, password, name }),

  // Audit Log
  auditList: (params: { tenantId?: number | null; action?: string; targetType?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams();
    if (params.tenantId != null) q.set("tenantId", String(params.tenantId));
    if (params.action) q.set("action", params.action);
    if (params.targetType) q.set("targetType", params.targetType);
    if (params.page) q.set("page", String(params.page));
    if (params.size) q.set("size", String(params.size));
    return apiRequest<any>("GET", `/api/admin/audit?${q.toString()}`);
  },

  // CSV Export
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
  // Notifications
  notificationsList: () => apiRequest<any[]>("GET", "/api/notifications"),
  notificationsUnreadCount: () => apiRequest<number>("GET", "/api/notifications/unread-count"),
  notificationMarkRead: (id: number) => apiRequest<void>("PUT", `/api/notifications/${id}/read`),
  notificationMarkAllRead: () => apiRequest<void>("PUT", "/api/notifications/read-all"),

  // Sample - Patients
  samplePatients: (page?: number, size?: number, status?: string, department?: string, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (size) params.set("size", String(size));
    if (status) params.set("status", status);
    if (department) params.set("department", department);
    if (search) params.set("search", search);
    return apiRequest<{ items: any[]; page: number; size: number; total: number }>("GET", `/api/sample/patients?${params}`);
  },

  // Sample - Clinical Trials
  sampleTrials: (page?: number, size?: number, phase?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (size) params.set("size", String(size));
    if (phase) params.set("phase", phase);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return apiRequest<{ items: any[]; page: number; size: number; total: number }>("GET", `/api/sample/trials?${params}`);
  },

  // Common Codes (public)
  commonCodes: (groupKey: string) => apiRequest<{ code: string; name: string; value: string }[]>("GET", `/api/common-codes/${groupKey}`),

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
