export const SCREENS = {
  BOARD_POST:    "BOARD_POST",
  BOARD_COMMENT: "BOARD_COMMENT",
  ADMIN_USERS:   "ADMIN_USERS",
  ADMIN_ROLES:   "ADMIN_ROLES",
  ADMIN_BOARDS:  "ADMIN_BOARDS",
  ADMIN_ORGS:    "ADMIN_ORGS",
  ADMIN_MENUS:   "ADMIN_MENUS",
  ADMIN_CODES:   "ADMIN_CODES",
  ADMIN_SCREENS: "ADMIN_SCREENS",
} as const;

export const ACTIONS = {
  CREATE: "CREATE",
  EDIT:   "EDIT",
  DELETE: "DELETE",
  MANAGE: "MANAGE",
} as const;

export type ScreenKey = typeof SCREENS[keyof typeof SCREENS];
export type ActionKey = typeof ACTIONS[keyof typeof ACTIONS];
