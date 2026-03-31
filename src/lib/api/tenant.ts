import { apiRequest } from "@/lib/client";

export const tenantApi = {
  // Tenant Branding (any authenticated user)
  tenantBranding: () =>
    apiRequest<{
      companyName: string;
      logoUrl: string;
      locale: string;
      primaryColor: string;
      sidebarColor: string;
      accentColor: string;
    }>("GET", "/api/tenant/branding"),

  // Super-Admin: Tenant management
  superAdminTenants: (page = 1, size = 20) =>
    apiRequest<any>("GET", `/api/super-admin/tenants?page=${page}&size=${size}`),
  superAdminTenantCreate: (payload: {
    tenantKey: string;
    tenantName: string;
    planType?: string;
    adminUsername: string;
    adminPassword: string;
  }) =>
    apiRequest<{ tenantId: number; adminUsername: string; adminPassword: string }>(
      "POST",
      "/api/super-admin/tenants",
      payload
    ),
  superAdminTenantUpdate: (tenantId: number, payload: { tenantName: string; planType: string; active: boolean }) =>
    apiRequest<void>("PUT", `/api/super-admin/tenants/${tenantId}`, payload),
  superAdminTenantDelete: (tenantId: number) =>
    apiRequest<void>("DELETE", `/api/super-admin/tenants/${tenantId}`),
};
