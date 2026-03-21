/** 서버에서 받는 메뉴 트리 노드 */
export type MenuNode = {
  menuId: number;
  parentId: number | null;
  name: string;
  path: string | null;
  icon: string | null;
  sortOrder: number;
  useYn: boolean;
  menuType: string;
  boardId: number | null;
  children: MenuNode[];
};

/** 트리를 테이블 렌더링용으로 평탄화한 노드 */
export type FlatMenu = MenuNode & {
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
};
