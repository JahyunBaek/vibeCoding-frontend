export type Tenant = {
  tenantId: number;
  tenantKey: string;
  tenantName: string;
  planType: string;
  active: boolean;
  createdAt: string;
};

export type TenantListRow = Tenant & {
  userCount: number;
};

export type TenantCreateRequest = {
  tenantKey: string;
  tenantName: string;
  planType?: string;
};

export type TenantUpdateRequest = {
  tenantName: string;
  planType: string;
  active: boolean;
};
