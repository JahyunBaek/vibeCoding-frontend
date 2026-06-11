import { apiRequest } from "@/lib/client";

export type WorkflowState = {
  stateCode: string;
  stateName: string;
  stateType: "INITIAL" | "INTERMEDIATE" | "FINAL";
  color?: string;
  description?: string;
  sortOrder: number;
};

export type WorkflowListRow = {
  workflowId: number;
  tenantId: number | null;
  workflowCode: string;
  workflowName: string;
  description?: string;
  entityType: string;
  initialStateCode: string;
  activeYn: boolean;
  isTemplate: boolean;
  parentWorkflowId?: number | null;
  templateVersion?: number | null;
  transitionCount: number;
  instanceCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ConditionRow = {
  conditionId?: number;
  conditionType: "ANY" | "ROLE" | "DEPT" | "USER" | "IS_REQUESTER" | "IS_ASSIGNEE";
  roleKey?: string | null;
  deptId?: number | null;
  userId?: number | null;
};

export type PostActionRow = {
  postActionId?: number;
  actionType: "REQUIRE_APPROVAL" | "NOTIFY" | "ASSIGN" | "UPDATE_FIELD";
  approvalCode?: string | null;
  notifyTarget?: string | null;
  notifyTemplate?: string | null;
  fieldPath?: string | null;
  fieldValue?: string | null;
};

export type TransitionRow = {
  transitionId?: number;
  actionCode: string;
  actionName: string;
  fromStateCode: string;
  toStateCode: string;
  buttonColor?: string | null;
  buttonIcon?: string | null;
  commentRequired: boolean;
  autoSkip: boolean;
  sortOrder: number;
  activeYn: boolean;
  conditions?: ConditionRow[];
  postActions?: PostActionRow[];
};

export type WorkflowDetail = {
  workflowId: number;
  tenantId: number | null;
  workflowCode: string;
  workflowName: string;
  description?: string;
  entityType: string;
  initialStateCode: string;
  activeYn: boolean;
  isTemplate: boolean;
  parentWorkflowId?: number | null;
  templateVersion?: number | null;
  transitions: TransitionRow[];
};

export type AvailableAction = {
  transitionId: number;
  actionCode: string;
  actionName: string;
  toStateCode: string;
  buttonColor?: string | null;
  buttonIcon?: string | null;
  commentRequired: boolean;
  requiresApproval: boolean;
};

export type HistoryRow = {
  historyId: number;
  actionCode?: string;
  fromStateCode?: string;
  toStateCode?: string;
  actorUserId?: number;
  actorName?: string;
  comment?: string;
  createdAt: string;
};

export type InstanceDetail = {
  instanceId: number;
  tenantId: number;
  workflowId: number;
  workflowCode: string;
  workflowName: string;
  entityType: string;
  entityId: number;
  currentStateCode: string;
  currentStateName: string;
  currentStateColor?: string | null;
  status: "ACTIVE" | "PENDING_APPROVAL" | "COMPLETED" | "CANCELED";
  requesterUserId?: number;
  requesterName?: string;
  assigneeUserId?: number;
  assigneeName?: string;
  approvalDocumentId?: number | null;
  history: HistoryRow[];
  availableActions: AvailableAction[];
  createdAt: string;
  updatedAt: string;
};

export const workflowApi = {
  // ── SUPER_ADMIN: 시스템 템플릿 ──
  workflowStates: () => apiRequest<WorkflowState[]>("GET", "/api/super-admin/workflow/states"),
  workflowTemplates: () => apiRequest<WorkflowListRow[]>("GET", "/api/super-admin/workflow/templates"),
  workflowTemplateDetail: (id: number) =>
    apiRequest<WorkflowDetail>("GET", `/api/super-admin/workflow/templates/${id}`),
  workflowTemplateCreate: (payload: any) => apiRequest<number>("POST", "/api/super-admin/workflow/templates", payload),
  workflowTemplateUpdate: (id: number, payload: any) =>
    apiRequest<void>("PUT", `/api/super-admin/workflow/templates/${id}`, payload),
  workflowTemplateDelete: (id: number) => apiRequest<void>("DELETE", `/api/super-admin/workflow/templates/${id}`),

  // ── ADMIN: 테넌트 워크플로우 ──
  workflowAdminList: (entityType?: string, activeOnly = false) => {
    const q = new URLSearchParams();
    if (entityType) q.set("entityType", entityType);
    if (activeOnly) q.set("activeOnly", "true");
    return apiRequest<WorkflowListRow[]>("GET", `/api/admin/workflow?${q}`);
  },
  workflowAdminDetail: (id: number) => apiRequest<WorkflowDetail>("GET", `/api/admin/workflow/${id}`),
  workflowAdminCopyTemplate: (templateId: number) =>
    apiRequest<number>("POST", `/api/admin/workflow/copy-from-template/${templateId}`),
  workflowAdminUpdate: (id: number, payload: any) => apiRequest<void>("PUT", `/api/admin/workflow/${id}`, payload),
  workflowAdminDelete: (id: number) => apiRequest<void>("DELETE", `/api/admin/workflow/${id}`),

  // ── 인스턴스 (USER) ──
  workflowInstance: (entityType: string, entityId: number) =>
    apiRequest<InstanceDetail>("GET", `/api/workflow/${entityType}/${entityId}`),
  workflowTransition: (
    entityType: string,
    entityId: number,
    payload: { actionCode: string; comment?: string; assigneeUserId?: number },
  ) => apiRequest<void>("POST", `/api/workflow/${entityType}/${entityId}/transition`, payload),
};
