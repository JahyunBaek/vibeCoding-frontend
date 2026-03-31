import { apiRequest } from "@/lib/client";

export const authApi = {
  login: (username: string, password: string) =>
    apiRequest<{ accessToken: string; user: any }>("POST", "/api/auth/login", { username, password }),

  logout: () => apiRequest<void>("POST", "/api/auth/logout"),

  resetPassword: (token: string, newPassword: string) =>
    apiRequest<void>("POST", "/api/auth/reset-password", { token, newPassword }),

  me: () => apiRequest<any>("GET", "/api/me"),

  updateMe: (name: string, currentPassword?: string, newPassword?: string) =>
    apiRequest<void>("PUT", "/api/me", { name, currentPassword, newPassword }),

  invitationValidate: (token: string) =>
    apiRequest<{ email: string; tenantName: string }>("GET", `/api/auth/invitation/${token}`),

  signup: (token: string, username: string, password: string, name: string) =>
    apiRequest<void>("POST", "/api/auth/signup", { token, username, password, name }),
};
