import { apiRequest } from "@/lib/client";

export const genomicsApi = {
  // ── Samples ──
  sampleList: (page = 1, size = 20, status?: string, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return apiRequest<any>("GET", `/api/genomics/samples?${params}`);
  },
  sampleDetail: (sampleId: number) =>
    apiRequest<any>("GET", `/api/genomics/samples/${sampleId}`),
  sampleCreate: (data: { patientId: number; sampleType: string; panelId?: number; note?: string }) =>
    apiRequest<number>("POST", "/api/genomics/samples", data),
  sampleUpdate: (sampleId: number, data: { sampleType: string; panelId?: number; note?: string }) =>
    apiRequest<void>("PUT", `/api/genomics/samples/${sampleId}`, data),
  sampleUpdateStatus: (sampleId: number, status: string) =>
    apiRequest<void>("PATCH", `/api/genomics/samples/${sampleId}/status`, { status }),
  sampleDelete: (sampleId: number) =>
    apiRequest<void>("DELETE", `/api/genomics/samples/${sampleId}`),

  // ── Panels ──
  panelList: (page = 1, size = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.set("search", search);
    return apiRequest<any>("GET", `/api/genomics/panels?${params}`);
  },
  panelActive: () =>
    apiRequest<any[]>("GET", "/api/genomics/panels/active"),
  panelDetail: (panelId: number) =>
    apiRequest<any>("GET", `/api/genomics/panels/${panelId}`),
  panelCreate: (data: any) =>
    apiRequest<number>("POST", "/api/genomics/panels", data),
  panelUpdate: (panelId: number, data: any) =>
    apiRequest<void>("PUT", `/api/genomics/panels/${panelId}`, data),
  panelDelete: (panelId: number) =>
    apiRequest<void>("DELETE", `/api/genomics/panels/${panelId}`),

  // ── Variants ──
  variantList: (page = 1, size = 20, filters?: Record<string, any>) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
      });
    }
    return apiRequest<any>("GET", `/api/genomics/variants?${params}`);
  },
  variantDetail: (variantId: number) =>
    apiRequest<any>("GET", `/api/genomics/variants/${variantId}`),
};
