/** 인증된 사용자 기본 정보 */
export type UserSummary = {
  userId: number;
  username: string;
  name: string;
  roleKey: "SUPER_ADMIN" | "ADMIN" | "USER" | string;
  orgId: number | null;
  tenantId: number | null;
};
