# src/config — 상수 & 설정

## 파일 구조

```
config/
└── permissions.ts    # SCREENS, ACTIONS as const + ScreenKey, ActionKey 타입
```

## permissions.ts

화면-액션 권한 모델의 프론트엔드 상수 정의.

```ts
export const SCREENS = {
  BOARD_POST:        "BOARD_POST",
  ADMIN_USERS:       "ADMIN_USERS",
  // ...
} as const;

export const ACTIONS = {
  CREATE: "CREATE",
  EDIT:   "EDIT",
  DELETE: "DELETE",
  MANAGE: "MANAGE",
} as const;

export type ScreenKey = typeof SCREENS[keyof typeof SCREENS];
export type ActionKey = typeof ACTIONS[keyof typeof ACTIONS];
```

## 새 화면/액션 추가 절차

1. `permissions.ts`의 `SCREENS` 또는 `ACTIONS`에 상수 추가
2. 백엔드 Flyway 마이그레이션에 INSERT 추가
3. 백엔드 컨트롤러에 `@RequiresAction(screen="...", action="...")` 추가
4. 프론트엔드에서 `useAction()` 훅 또는 `<Can>` 컴포넌트로 UI 제어

## 새 설정 파일 추가 기준

| 파일 | 내용 |
|------|------|
| 앱 전역 상수 (as const) | `src/config/` |
| 환경변수 기반 설정 | `.env` + `import.meta.env` |
| 런타임 서버 설정 | 백엔드 API로 조회 (`api.settingsGet()`) |
