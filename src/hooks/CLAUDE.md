# src/hooks — 재사용 커스텀 훅

## 현재 훅 목록

```
hooks/
├── useAction.ts        # 화면-액션 권한 체크
└── useTenantTheme.ts   # 테넌트 브랜딩 테마 자동 적용
```

### useAction(screen, action) → boolean

Zustand `permissions` 스토어에서 특정 화면의 액션 권한을 확인한다.

```ts
import { useAction } from "@/hooks/useAction";
import { SCREENS, ACTIONS } from "@/config/permissions";

const canCreate = useAction(SCREENS.BOARD_POST, ACTIONS.CREATE);
// canCreate: boolean
```

- 내부적으로 `useAuthStore(s => s.permissions[screen])` 구독
- `<Can>` 컴포넌트가 이 훅을 래핑한 것

### useTenantTheme() → branding

테넌트 브랜딩 정보를 조회하고 CSS 변수 + i18n locale을 자동 적용한다.

```ts
const branding = useTenantTheme();
// branding: { companyName, logoUrl, locale, primaryColor, ... }
```

- `App.tsx`에서 1회 호출
- CSS 변수: `--tenant-primary`, `--tenant-sidebar`, `--tenant-accent`
- locale: `localStorage.language`가 없으면 테넌트 locale로 자동 설정

## 새 훅 추가 기준

| 기준 | 위치 |
|------|------|
| **2개 이상 컴포넌트/페이지**에서 재사용하는 로직 | `src/hooks/` |
| 특정 페이지에서만 쓰는 로직 | 해당 페이지 파일 내부 |
| 서버 상태 조회 (useQuery) | 페이지에서 직접 호출이 일반적. 3곳 이상 동일 패턴이면 훅으로 추출 |
| Zustand 셀렉터 조합 | 단순 셀렉터는 인라인, 복잡한 파생 상태면 훅으로 추출 |

## 네이밍 규칙

- 파일명: `use{Feature}.ts` (camelCase)
- export: `export function use{Feature}(...)` (named export)
- React 훅 규칙 준수 (조건부 호출 금지, 컴포넌트/훅 내부에서만 호출)
