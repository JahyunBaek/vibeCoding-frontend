import { apiRequest } from "@/lib/client";

export const sampleApi = {
  // Patients
  samplePatients: (page?: number, size?: number, status?: string, department?: string, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (size) params.set("size", String(size));
    if (status) params.set("status", status);
    if (department) params.set("department", department);
    if (search) params.set("search", search);
    return apiRequest<{ items: any[]; page: number; size: number; total: number }>(
      "GET",
      `/api/sample/patients?${params}`
    );
  },

  // Clinical Trials
  sampleTrials: (page?: number, size?: number, phase?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (size) params.set("size", String(size));
    if (phase) params.set("phase", phase);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return apiRequest<{ items: any[]; page: number; size: number; total: number }>(
      "GET",
      `/api/sample/trials?${params}`
    );
  },

  // Common Codes (public)
  commonCodes: (groupKey: string) =>
    apiRequest<{ code: string; name: string; value: string }[]>("GET", `/api/common-codes/${groupKey}`),

  // Dashboard
  dashboard: () => apiRequest<any>("GET", "/api/dashboard/summary"),
};
