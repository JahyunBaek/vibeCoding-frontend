/** 서버에서 받는 조직 트리 노드 */
export type OrgNode = {
  orgId: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
  useYn: boolean;
  children: OrgNode[];
};

/** 트리를 테이블 렌더링용으로 평탄화한 노드 */
export type FlatOrg = OrgNode & {
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
};
