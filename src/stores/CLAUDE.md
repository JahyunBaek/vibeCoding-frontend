# src/stores — Zustand 클라이언트 상태

## 파일 구조

```
stores/
├── auth.ts     # 인증 상태: accessToken, user, permissions, initialized
└── theme.ts    # 테마 상태: isDark (localStorage persist)
```

## auth.ts — useAuthStore

인증 관련 전역 상태. **서버 상태(React Query)와 분리된 순수 클라이언트 상태.**

```ts
type AuthState = {
  accessToken: string | null;   // 메모리에만 보관 (새로고침 시 refresh로 복구)
  user: UserSummary | null;     // userId, username, name, roleKey, orgId, tenantId
  initialized: boolean;         // App.tsx에서 refresh 완료 후 true
  permissions: Record<string, string[]>;  // { "BOARD_POST": ["CREATE","EDIT"], ... }

  setAuth(token, user): void;
  clear(): void;
  setInitialized(v): void;
  setPermissions(perms): void;
};
```

**사용 패턴:**
```ts
// 컴포넌트에서 구독
const { user, accessToken } = useAuthStore();

// 셀렉터로 필요한 필드만 구독 (리렌더 최소화)
const roleKey = useAuthStore((s) => s.user?.roleKey);

// 컴포넌트 외부에서 접근 (interceptor, api 등)
const token = useAuthStore.getState().accessToken;
```

## theme.ts — useThemeStore

다크/라이트 모드 토글. `zustand/middleware/persist`로 `localStorage("theme-v2")`에 저장.

```ts
const { isDark, toggle } = useThemeStore();
```

## 새 스토어 추가 기준

| 조건 | 관리 방식 |
|------|-----------|
| 서버에서 오는 데이터 (목록, 상세) | **React Query** (`useQuery`, `useMutation`) |
| 앱 전역 UI 상태 (인증, 테마) | **Zustand** (`src/stores/`) |
| 페이지 내부 상태 (폼, 필터) | **useState** (컴포넌트 로컬) |
| URL에 반영되어야 하는 상태 | **URL params** (`useSearchParams`, `:id`) |

Zustand 스토어는 **진짜 앱 전역에서 공유해야 하는 상태**만 사용한다. 서버 데이터 캐싱은 React Query에 위임.

## 네이밍 규칙

- 파일명: `{domain}.ts` (소문자)
- export: `export const use{Domain}Store = create<{Domain}State>(...)`
- 타입: 스토어 내부에 정의. 공유 타입은 `src/types/`로 분리
