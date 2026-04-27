import { apiRequest } from "@/lib/client";

export type DefinitionListRow = {
  definitionId: number;
  tenantId: number;
  approvalCode: string;
  approvalName: string;
  description?: string;
  useRequestDepartment: boolean;
  useSupervisingDepartment: boolean;
  defaultSupervisingDepartmentId?: number | null;
  defaultSupervisingDepartmentName?: string | null;
  useGroupApproval: boolean;
  usePersonalLineTemplate: boolean;
  activeYn: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DefinitionDetail = DefinitionListRow & {
  remark?: string;
  authorityRules: AuthorityRuleRow[];
};

export type AuthorityRuleRow = {
  ruleId: number;
  approvalCode: string;
  targetDepartmentId?: number | null;
  targetDepartmentName?: string | null;
  targetRoleKey?: string | null;
  stepType: string;
  activeYn: boolean;
};

export type TemplateStep = {
  stepId?: number;
  stepOrder: number;
  stepName: string;
  approvalType?: string;
  targetDepartmentType: "REQUEST" | "SUPERVISING" | "CUSTOM" | "USER";
  targetDepartmentId?: number | null;
  targetDepartmentName?: string | null;
  targetRoleKey?: string | null;
  targetUserId?: number | null;
  targetUserName?: string | null;
  groupApprovalYn?: boolean;
  requiredYn?: boolean;
};

export type TemplateListRow = {
  templateId: number;
  approvalCode: string;
  templateName: string;
  defaultYn: boolean;
  activeYn: boolean;
  stepCount: number;
  updatedAt?: string;
};

export type TemplateDetail = {
  templateId: number;
  tenantId: number;
  ownerUserId: number;
  approvalCode: string;
  templateName: string;
  defaultYn: boolean;
  activeYn: boolean;
  steps: TemplateStep[];
};

export type DocumentListRow = {
  documentId: number;
  documentNo: string;
  approvalCode: string;
  approvalName?: string;
  title: string;
  requesterUserId: number;
  requesterName: string;
  requesterDepartmentId?: number | null;
  requesterDepartmentName?: string | null;
  supervisingDepartmentId?: number | null;
  supervisingDepartmentName?: string | null;
  status: string;
  currentStepOrder?: number | null;
  currentStepName?: string | null;
  requestedAt?: string;
  completedAt?: string;
};

export type DocumentStepRow = TemplateStep & {
  stepId: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
  actedByUserId?: number | null;
  actedByName?: string | null;
  actedAt?: string | null;
  comment?: string | null;
};

export type DocumentHistoryRow = {
  historyId: number;
  stepId?: number | null;
  actionType: string;
  actionBy: number;
  actionByName: string;
  actionComment?: string | null;
  actionAt: string;
  beforeStatus?: string | null;
  afterStatus?: string | null;
};

export type DocumentDetail = DocumentListRow & {
  businessType?: string | null;
  businessId?: string | null;
  body?: string | null;
  steps: DocumentStepRow[];
  history: DocumentHistoryRow[];
};

export type PopupInitResponse = {
  definition: DefinitionDetail;
  defaultTemplate?: TemplateDetail | null;
  templates: TemplateListRow[];
  previewSteps: TemplateStep[];
};

export const approvalApi = {
  // --- 관리자: 결재 정책 마스터 ---
  adminDefinitions: (activeOnly = false, keyword?: string, tenantId?: number | null) => {
    const q = new URLSearchParams();
    if (activeOnly) q.set("activeOnly", "true");
    if (keyword) q.set("keyword", keyword);
    if (tenantId != null) q.set("tenantId", String(tenantId));
    return apiRequest<DefinitionListRow[]>("GET", `/api/admin/approval/definitions?${q}`);
  },
  adminDefinitionDetail: (definitionId: number, tenantId?: number | null) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<DefinitionDetail>("GET", `/api/admin/approval/definitions/${definitionId}${q}`);
  },
  adminDefinitionCreate: (
    payload: Partial<DefinitionListRow> & { approvalCode: string; approvalName: string },
    tenantId?: number | null,
  ) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<number>("POST", `/api/admin/approval/definitions${q}`, payload);
  },
  adminDefinitionUpdate: (
    definitionId: number,
    payload: Partial<DefinitionListRow> & { approvalName: string },
    tenantId?: number | null,
  ) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<void>("PUT", `/api/admin/approval/definitions/${definitionId}${q}`, payload);
  },
  adminDefinitionDelete: (definitionId: number, tenantId?: number | null) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<void>("DELETE", `/api/admin/approval/definitions/${definitionId}${q}`);
  },
  adminAuthorityRuleAdd: (
    approvalCode: string,
    payload: {
      targetDepartmentId?: number | null;
      targetRoleKey?: string | null;
      stepType: string;
    },
    tenantId?: number | null,
  ) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<void>("POST", `/api/admin/approval/definitions/${approvalCode}/authorities${q}`, payload);
  },
  adminAuthorityRuleDelete: (ruleId: number, tenantId?: number | null) => {
    const q = tenantId != null ? `?tenantId=${tenantId}` : "";
    return apiRequest<void>("DELETE", `/api/admin/approval/definitions/authorities/${ruleId}${q}`);
  },

  // --- 결재 정책 (사용자 조회용) ---
  approvalDefinitions: (keyword?: string) => {
    const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    return apiRequest<DefinitionListRow[]>("GET", `/api/approval/definitions${q}`);
  },

  // --- 조직 디렉토리 (사용자용) ---
  orgsDirectoryTree: () => apiRequest<any[]>("GET", "/api/orgs/tree"),

  // --- 내 결재선 양식 ---
  myLines: (approvalCode?: string) => {
    const q = approvalCode ? `?approvalCode=${encodeURIComponent(approvalCode)}` : "";
    return apiRequest<TemplateListRow[]>("GET", `/api/approval/lines${q}`);
  },
  myLineDetail: (templateId: number) => apiRequest<TemplateDetail>("GET", `/api/approval/lines/${templateId}`),
  myLineCreate: (payload: { approvalCode: string; templateName: string; defaultYn: boolean; steps: TemplateStep[] }) =>
    apiRequest<number>("POST", "/api/approval/lines", payload),
  myLineUpdate: (
    templateId: number,
    payload: {
      templateName: string;
      defaultYn: boolean;
      activeYn: boolean;
      steps: TemplateStep[];
    },
  ) => apiRequest<void>("PUT", `/api/approval/lines/${templateId}`, payload),
  myLineDelete: (templateId: number) => apiRequest<void>("DELETE", `/api/approval/lines/${templateId}`),

  // --- 결재 문서 ---
  popupInit: (approvalCode: string) =>
    apiRequest<PopupInitResponse>(
      "GET",
      `/api/approval/documents/popup-init?approvalCode=${encodeURIComponent(approvalCode)}`,
    ),

  documentRequest: (payload: {
    approvalCode: string;
    businessType?: string;
    businessId?: string;
    title: string;
    body?: string;
    supervisingDepartmentId?: number | null;
    templateId?: number | null;
    steps?: TemplateStep[];
  }) => apiRequest<number>("POST", "/api/approval/documents", payload),

  documentDetail: (documentId: number) => apiRequest<DocumentDetail>("GET", `/api/approval/documents/${documentId}`),

  documentList: (params: {
    inbox?: "requested" | "pending" | "processed" | "all";
    approvalCode?: string;
    status?: string;
    keyword?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    return apiRequest<{ items: DocumentListRow[]; page: number; size: number; total: number }>(
      "GET",
      `/api/approval/documents?${q}`,
    );
  },

  documentApprove: (documentId: number, stepId: number, comment?: string) =>
    apiRequest<void>("POST", `/api/approval/documents/${documentId}/steps/${stepId}/approve`, { comment }),
  documentReject: (documentId: number, stepId: number, comment?: string) =>
    apiRequest<void>("POST", `/api/approval/documents/${documentId}/steps/${stepId}/reject`, { comment }),
  documentWithdraw: (documentId: number) => apiRequest<void>("POST", `/api/approval/documents/${documentId}/withdraw`),

  // --- 사용자 디렉토리 (결재선 사용자 지정용) - 검색 + 페이징 ---
  usersDirectory: (params: { keyword?: string; orgId?: number | null; page?: number; size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.keyword) q.set("keyword", params.keyword);
    if (params.orgId) q.set("orgId", String(params.orgId));
    q.set("page", String(params.page ?? 1));
    q.set("size", String(params.size ?? 30));
    return apiRequest<{
      items: Array<{
        userId: number;
        username: string;
        name: string;
        roleKey?: string;
        orgId?: number;
        orgName?: string;
      }>;
      page: number;
      size: number;
      total: number;
    }>("GET", `/api/users/search?${q}`);
  },
};
