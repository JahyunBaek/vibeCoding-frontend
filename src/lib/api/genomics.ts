import { apiRequest, client } from "@/lib/client";
import type { ApiResponse } from "@/types/api";

export const genomicsApi = {
  // ── Samples ──
  sampleList: (page = 1, size = 20, status?: string, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return apiRequest<any>("GET", `/api/genomics/samples?${params}`);
  },
  sampleDetail: (sampleId: number) => apiRequest<any>("GET", `/api/genomics/samples/${sampleId}`),
  sampleCreate: (data: { patientId: number; sampleType: string; panelId?: number; note?: string }) =>
    apiRequest<number>("POST", "/api/genomics/samples", data),
  sampleUpdate: (sampleId: number, data: { sampleType: string; panelId?: number; note?: string }) =>
    apiRequest<void>("PUT", `/api/genomics/samples/${sampleId}`, data),
  sampleUpdateStatus: (sampleId: number, status: string) =>
    apiRequest<void>("PATCH", `/api/genomics/samples/${sampleId}/status`, { status }),
  sampleDelete: (sampleId: number) => apiRequest<void>("DELETE", `/api/genomics/samples/${sampleId}`),
  sampleUploadVcf: async (sampleId: number, file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await client.post<ApiResponse<{ sampleId: number; variantCount: number }>>(
      `/api/genomics/samples/${sampleId}/vcf`,
      fd,
      { onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded * 100) / e.total) : 0) },
    );
    if (!res.data.success) throw new Error(res.data.error?.message ?? "Upload failed");
    return res.data.data;
  },

  // ── Panels ──
  panelList: (page = 1, size = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.set("search", search);
    return apiRequest<any>("GET", `/api/genomics/panels?${params}`);
  },
  panelActive: () => apiRequest<any[]>("GET", "/api/genomics/panels/active"),
  panelDetail: (panelId: number) => apiRequest<any>("GET", `/api/genomics/panels/${panelId}`),
  panelCreate: (data: any) => apiRequest<number>("POST", "/api/genomics/panels", data),
  panelUpdate: (panelId: number, data: any) => apiRequest<void>("PUT", `/api/genomics/panels/${panelId}`, data),
  panelDelete: (panelId: number) => apiRequest<void>("DELETE", `/api/genomics/panels/${panelId}`),

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
  variantDetail: (variantId: number) => apiRequest<any>("GET", `/api/genomics/variants/${variantId}`),

  // ── AI ──
  aiInterpretVariant: (variantId: number) =>
    apiRequest<{ interpretation: string }>("POST", `/api/genomics/ai/interpret/${variantId}`),
  aiSummarizeSample: (sampleId: number) =>
    apiRequest<{ summary: string }>("POST", `/api/genomics/ai/summarize/${sampleId}`),

  // ── Reports ──
  reportList: (page = 1, size = 20, sampleId?: number) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (sampleId) params.set("sampleId", String(sampleId));
    return apiRequest<any>("GET", `/api/genomics/reports?${params}`);
  },
  reportDetail: (reportId: number) => apiRequest<any>("GET", `/api/genomics/reports/${reportId}`),
  reportGenerate: (sampleId: number) => apiRequest<void>("POST", `/api/genomics/reports/generate/${sampleId}`),
  reportUpdateStatus: (reportId: number, status: string) =>
    apiRequest<void>("PATCH", `/api/genomics/reports/${reportId}/status?status=${status}`),
  reportDelete: (reportId: number) => apiRequest<void>("DELETE", `/api/genomics/reports/${reportId}`),

  // ── PGx ──
  pgxList: (page = 1, size = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.set("search", search);
    return apiRequest<any>("GET", `/api/genomics/pgx?${params}`);
  },
  pgxMatchBySample: (sampleId: number) => apiRequest<any[]>("GET", `/api/genomics/pgx/match/${sampleId}`),

  // ── Stats ──
  variantStats: (sampleId?: number) => {
    const params = sampleId ? `?sampleId=${sampleId}` : "";
    return apiRequest<any>("GET", `/api/genomics/stats${params}`);
  },

  // ── Consents ──
  consentList: (page = 1, size = 20, patientId?: number, status?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (patientId) params.set("patientId", String(patientId));
    if (status) params.set("status", status);
    return apiRequest<any>("GET", `/api/genomics/consents?${params}`);
  },
  consentCreate: (data: {
    patientId: number;
    sampleId?: number;
    consentType: string;
    expiresAt?: string;
    note?: string;
  }) => apiRequest<void>("POST", "/api/genomics/consents", data),
  consentSign: (consentId: number, data: { signedByName: string; witnessName?: string }) =>
    apiRequest<void>("PATCH", `/api/genomics/consents/${consentId}/sign`, data),
  consentRevoke: (consentId: number) => apiRequest<void>("PATCH", `/api/genomics/consents/${consentId}/revoke`),
  consentDelete: (consentId: number) => apiRequest<void>("DELETE", `/api/genomics/consents/${consentId}`),

  // ── De-identification Export ──
  exportDeidentified: async (sampleId: number) => {
    const res = await client.get(`/api/genomics/export/deidentify/${sampleId}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `deidentified_sample_${sampleId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // ── Genomic Audit ──
  genomicAuditList: (page = 1, size = 20, action?: string, resourceType?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (action) params.set("action", action);
    if (resourceType) params.set("resourceType", resourceType);
    return apiRequest<any>("GET", `/api/genomics/audit?${params}`);
  },
};
