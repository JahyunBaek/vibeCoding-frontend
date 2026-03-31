# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # 개발 서버 실행 (port 5173)
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과물 미리보기
```

테스트 프레임워크 없음. 타입 체크는 `npx tsc --noEmit`.

## 백엔드 프록시

Vite dev 서버가 `/api` 요청을 백엔드로 프록시한다. 기본 타겟은 `http://localhost:28080`.
변경하려면 `.env` 파일에 `VITE_API_PROXY_TARGET=http://...` 를 설정한다.

## 아키텍처 개요

### 인증 흐름

- 앱 최초 진입 시 `App.tsx`가 `POST /api/auth/refresh` 를 호출해 accessToken을 복구한다.
- accessToken은 **메모리(Zustand)** 에만 보관 (`src/stores/auth.ts`). refresh token은 HttpOnly 쿠키.
- `src/lib/api.ts`의 axios 인스턴스(`client`)가 모든 요청에 `Authorization: Bearer` 헤더를 자동 첨부한다.
- 401 응답 시 single-flight refresh → 성공하면 대기 큐의 요청을 일괄 재시도, 실패하면 전부 reject.
- 파일 다운로드는 `<a href>` 대신 `api.fileDownload()`로 반드시 axios를 통해 처리해야 토큰이 전송된다.

### 라우팅 & 가드

- `src/routes/AppRoutes.tsx`: React Router v6, 중첩 라우트 구조.
- **공개 라우트**: `/login`, `/reset-password` (인증 불필요)
- `RequireAuth`: `initialized` 전까지 Spinner 표시, accessToken 없으면 `/login` 리다이렉트.
- `RequireAdmin`: `user.roleKey`가 `"ADMIN"` 또는 `"SUPER_ADMIN"`이 아니면 403 표시.
- `RequireSuperAdmin`: `user.roleKey !== "SUPER_ADMIN"` 이면 403 표시.
- 인증이 필요한 모든 페이지는 `AppLayout` 하위에 위치한다.

### 레이아웃

- `AppLayout` = `Sidebar` + `Topbar` + `Breadcrumb` + `<Outlet />`
- `Sidebar`는 `GET /api/menus/my` 로 서버에서 메뉴 트리를 받아 동적으로 렌더링한다. 게시판 생성/삭제 후에는 `queryKey: ["menus", "my"]` 를 invalidate해야 사이드바가 갱신된다.
- `Sidebar`는 `GET /api/tenant/branding` 으로 테넌트 회사명/로고를 동적 표시한다.
- `Breadcrumb` (`src/components/Breadcrumb.tsx`) — 현재 경로를 한국어 라벨로 표시.

### API 레이어 (`src/lib/api/`)

모든 백엔드 호출은 `api` 객체 또는 `apiRequest()` 함수를 통한다. API 메서드는 도메인별 파일(`src/lib/api/{domain}.ts`)에 정의하고, `index.ts`에서 통합 export한다. 새 도메인 추가 시 상세 규칙은 `src/lib/CLAUDE.md` 참조.
서버 응답 형식: `{ success: boolean; data: T; error?: { code, message } }`

### 상태 관리

- **서버 상태**: TanStack Query (React Query v5). `useQuery` + `useMutation` 패턴 사용.
- **클라이언트 상태**: Zustand (`useAuthStore`) — accessToken, user, initialized 만 관리.

### Mutation 패턴

모든 CRUD 작업은 `useMutation`을 사용한다:
```ts
const createMut = useMutation({
  mutationFn: () => api.xxxCreate(...),
  onSuccess: () => { refetch(); toast.success("생성되었습니다."); },
  onError: (e: Error) => toast.error(e.message),
});
// 버튼: <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
```

### Toast 알림

`sonner` 라이브러리 사용. `<Toaster />`는 `App.tsx`에 전역 설정.
```ts
import { toast } from "sonner";
toast.success("성공 메시지");
toast.error("에러 메시지");
```

### 삭제 확인 다이얼로그

`window.confirm()` 대신 `ConfirmDialog` 컴포넌트를 사용한다:
```tsx
const [deleteTarget, setDeleteTarget] = useState<any>(null);
<ConfirmDialog
  open={!!deleteTarget}
  onOpenChange={(open) => !open && setDeleteTarget(null)}
  title="삭제 확인"
  description={`"${deleteTarget?.name}"을 삭제하시겠습니까?`}
  onConfirm={() => deleteMut.mutate()}
/>
```

### Error Boundary

`App.tsx`에서 `<ErrorBoundary>`로 전체 앱을 감싼다. 예기치 않은 에러 시 한국어 에러 화면 + 새로고침 버튼 표시.

### 어드민 페이지 공통 UI 패턴

`src/pages/admin/` 하위 페이지는 동일한 구조를 따른다:

1. **생성 폼**: 카드 헤더 우측 버튼 토글. 추가/취소 시 자동 닫힘.
2. **편집 패널**: 파란 점선 배경 패널이 테이블 위에 표시. 편집 중인 행은 하이라이트.
3. **삭제/편집 액션**: 행 우측 `MoreHorizontal` → `DropdownMenu` (편집 / 삭제). 삭제는 `ConfirmDialog` 사용.
4. **트리 페이지** (Orgs, Menus): `flattenTree()`로 평탄화 후 `depth`에 따라 `paddingLeft`로 계층 표현.
5. **페이지네이션**: `src/components/Pagination.tsx` 공통 컴포넌트 사용.
6. **CSV 내보내기**: 사용자 목록, 감사 로그 페이지에 CSV 다운로드 버튼 제공.

### 화면-액션 권한 시스템

**개념**: 화면(Screen) → 액션(Action) → 역할(Role) 3단계 권한 모델.

- **상수 정의**: `src/config/permissions.ts` — `SCREENS`, `ACTIONS` as const + `ScreenKey`, `ActionKey` 타입
- **Zustand 저장**: `useAuthStore`의 `permissions: Record<string, string[]>` — `{ "BOARD_POST": ["CREATE","EDIT"], ... }` 형태
- **권한 조회 Hook**: `useAction(screen: ScreenKey, action: ActionKey): boolean` (`src/hooks/useAction.ts`)
- **UI 조건부 렌더링**: `<Can screen={SCREENS.X} action={ACTIONS.Y} condition={추가조건}>` 컴포넌트 사용
- **로드 시점**: 로그인(`LoginPage`) 및 앱 초기화(`App.tsx`) 시 `GET /api/permissions/my` 호출 → `setPermissions`

**버튼/기능 가시성 패턴**:
```ts
// 권한 체크 + 소유권 체크 조합
const hasEditPerm = useAction(SCREENS.BOARD_POST, ACTIONS.EDIT);
const canEdit = hasEditPerm && (isAdmin || isAuthor);
// 또는 Can 컴포넌트의 condition prop 활용
<Can screen={SCREENS.BOARD_POST} action={ACTIONS.CREATE}>
  <Button>글쓰기</Button>
</Can>
```

**새 화면/액션 추가 시**:
1. `src/config/permissions.ts`의 `SCREENS` 또는 `ACTIONS`에 상수 추가
2. 백엔드 `V2__screen_action_permission.sql` 또는 새 Flyway 마이그레이션에 INSERT 추가
3. 백엔드 컨트롤러 메서드에 `@RequiresAction(screen="...", action="...")` 추가
4. 프론트엔드 `useAction()` 또는 `<Can>` 으로 UI 제어

**어드민 관리 화면**: `/admin/screens` (`AdminScreensPage.tsx`) — 화면 목록 + 화면별 액션에 역할 체크박스 토글 (자동 저장)

### 멀티테넌시 (SaaS)

**역할 계층**:
- `SUPER_ADMIN`: 시스템 전체 관리자. `tenantId = null`. `/api/super-admin/**` 전용 엔드포인트 접근 가능.
- `ADMIN`: 특정 테넌트의 관리자. `tenantId`가 JWT에 포함됨.
- `USER`: 일반 사용자.

**Tenant ID 흐름**:
- 로그인 시 JWT의 `tid` 클레임에 `tenantId` 포함 → `UserSummary.tenantId`로 저장.
- 백엔드는 `TenantContextHolder`로 현재 tenantId를 자동 추출, 모든 쿼리에 필터 적용.
- `SUPER_ADMIN`은 `tenantId = null`이며 모든 테넌트 데이터 접근 가능.

**테넌트 관리 화면**: `/super-admin/tenants` (`SuperAdminTenantsPage.tsx`) — `RequireSuperAdmin` 가드로 보호.

**테넌트 브랜딩**: `Sidebar`가 `GET /api/tenant/branding`으로 `company_name`, `logo_url`, `locale`을 조회하여 동적 표시. `useTenantTheme` 훅이 테마 색상 + locale 자동 적용.

### 공통코드 (Common Codes)

공통코드는 드롭다운/콤보박스 선택 항목을 관리하는 시스템. 백엔드 Redis 캐시 기반.

**조회 API**: `api.commonCodes("GROUP_KEY")` → `GET /api/common-codes/{groupKey}`

**사용 패턴**:
```tsx
const { data: statuses = [] } = useQuery({
  queryKey: ["common-codes", "PATIENT_STATUS"],
  queryFn: () => api.commonCodes("PATIENT_STATUS"),
});
// select에서 사용
<select>
  <option value="">{t("sample.allStatuses")}</option>
  {statuses.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
</select>
// 코드 → 이름 변환
const codeName = (codes: any[], code: string) => codes.find(c => c.code === code)?.name ?? code;
```

**등록된 공통코드 그룹**:

| Group Key | 그룹명 | 용도 |
|-----------|--------|------|
| `YN` | Y/N | 범용 Y/N 선택 |
| `PATIENT_STATUS` | 환자 상태 | 환자 관리 페이지 필터/상태 표시 |
| `DEPARTMENT` | 진료과 | 환자 관리 페이지 필터/부서 표시 |
| `BLOOD_TYPE` | 혈액형 | 환자 관리 페이지 |
| `GENDER` | 성별 | 환자 관리 페이지 |
| `TRIAL_PHASE` | 임상시험 단계 | 임상시험 관리 페이지 필터 |
| `TRIAL_STATUS` | 임상시험 상태 | 임상시험 관리 페이지 필터/상태 표시 |

### 샘플 페이지 (Medical)

**위치**: `src/pages/sample/` — Dashboard와 Boards 사이에 배치

| 페이지 | 경로 | API | 공통코드 |
|--------|------|-----|---------|
| `SamplePatientsPage` | `/sample/patients` | `GET /api/sample/patients` | PATIENT_STATUS, DEPARTMENT, GENDER, BLOOD_TYPE |
| `SampleTrialsPage` | `/sample/trials` | `GET /api/sample/trials` | TRIAL_PHASE, TRIAL_STATUS |

- Mock 데이터 (서버에서 하드코딩 반환, DB 없음)
- 공통코드로 필터 `<select>` 구성 + 코드→이름 변환
- 상태 Badge 색상 매핑 포함

### 비밀번호 재설정

- 관리자가 `/admin/users`에서 사용자 드롭다운 → "비밀번호 재설정 링크" → Redis 토큰 생성 (30분 TTL)
- 생성된 URL을 사용자에게 전달 → `/reset-password?token=xxx` 페이지에서 새 비밀번호 설정
- 토큰은 1회용 (사용 시 즉시 삭제)

### shadcn/ui 컴포넌트

`src/components/ui/`에 있는 것만 사용 가능: `Button`, `Input`, `Card`, `Badge`, `Separator`, `Avatar`, `DropdownMenu`, `AlertDialog`, `Spinner`.
아이콘은 `lucide-react` 사용.

### 공통 컴포넌트

| 컴포넌트 | 위치 | 용도 |
|---------|------|------|
| `Pagination` | `src/components/Pagination.tsx` | 테이블 하단 페이지네이션 |
| `ConfirmDialog` | `src/components/ConfirmDialog.tsx` | 삭제 확인 다이얼로그 (AlertDialog 래퍼) |
| `Breadcrumb` | `src/components/Breadcrumb.tsx` | 현재 경로 네비게이션 |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | 앱 크래시 방지 |
| `Can` | `src/components/Can.tsx` | 권한 기반 조건부 렌더링 |
| `TenantSelector` | `src/components/TenantSelector.tsx` | SUPER_ADMIN용 테넌트 필터 |
| `RichEditor` | `src/components/RichEditor.tsx` | TipTap 기반 HTML 에디터 |

---

## 폴더 구조 및 파일 규칙

```
src/
├── types/          # ★ 공통 타입 정의 (여러 파일에서 공유되는 것만)
│   ├── api.ts      #   ApiError, ApiResponse<T>
│   ├── auth.ts     #   UserSummary (tenantId 포함)
│   ├── menu.ts     #   MenuNode, FlatMenu
│   ├── org.ts      #   OrgNode, FlatOrg
│   └── tenant.ts   #   Tenant, TenantListRow, TenantCreateRequest, TenantUpdateRequest
│
├── config/         # 상수·설정 (런타임 값 포함)
│   └── permissions.ts  # SCREENS, ACTIONS as const + ScreenKey, ActionKey
│
├── lib/            # 순수 유틸리티 & 외부 클라이언트 초기화 (상세: src/lib/CLAUDE.md)
│   ├── client.ts   #   axios 인스턴스 + interceptors + apiRequest (인프라)
│   ├── api/        #   도메인별 API 메서드 (auth, board, admin, tenant, ...)
│   │   └── index.ts #  통합 re-export → import { api } from "@/lib/api"
│   ├── i18n.ts     #   i18next 초기화
│   └── utils.ts    #   cn() 등 범용 헬퍼
│
├── stores/         # Zustand 클라이언트 상태
│   ├── auth.ts     #   accessToken, user, permissions
│   └── theme.ts    #   isDark (persist)
│
├── hooks/          # 재사용 커스텀 훅
│   └── useAction.ts
│
├── components/
│   ├── ui/         #   shadcn/ui 원본 (수정 금지): Button, Input, Card, Badge, Separator, Avatar, DropdownMenu, AlertDialog, Spinner
│   ├── layout/     #   AppLayout, Sidebar, Topbar
│   ├── Can.tsx     #   권한 가드 컴포넌트
│   ├── ConfirmDialog.tsx  # 삭제 확인 다이얼로그
│   ├── Pagination.tsx     # 공통 페이지네이션
│   ├── Breadcrumb.tsx     # 경로 네비게이션
│   └── ErrorBoundary.tsx  # 에러 바운더리
│
├── pages/
│   ├── sample/     #   의료 샘플 페이지 (환자, 임상시험)
│   ├── boards/     #   게시판 관련 페이지
│   ├── admin/      #   어드민 전용 페이지 (ADMIN + SUPER_ADMIN 접근)
│   └── super-admin/ #  슈퍼어드민 전용 페이지 (SUPER_ADMIN만 접근)
│
└── routes/         # 라우터 설정 & 가드
    ├── AppRoutes.tsx
    └── guards.tsx  # RequireAuth, RequireAdmin, RequireSuperAdmin
```

### 타입 작성 규칙

| 위치 | 기준 |
|---|---|
| `src/types/*.ts` | **2개 이상 파일**에서 참조하는 타입. 여기서 정의하고 `export type` |
| 컴포넌트/페이지 내부 | 해당 파일에서만 쓰는 로컬 타입. 파일 상단에 정의 |
| `src/lib/api/index.ts` | `ApiError`, `ApiResponse` 는 `src/types/api.ts` 에서 re-export |
| `src/stores/auth.ts` | `UserSummary` 는 `src/types/auth.ts` 에서 re-export |

### import 순서 (파일 상단 정렬 기준)

1. 외부 라이브러리 (`react`, `react-router-dom`, `lucide-react` …)
2. 내부 — `@/lib/*`, `@/stores/*`, `@/hooks/*`
3. 내부 — `@/components/*`
4. 내부 — `@/types/*` (타입은 마지막, `import type` 사용)

### 새 공통 타입 추가 시 체크리스트

1. `src/types/` 에 적절한 파일 생성 또는 기존 파일에 추가
2. 원본 파일에서는 `export type { X } from "@/types/..."` 로 re-export (기존 import 경로 호환 유지)
3. 이 파일(CLAUDE.md)의 폴더 구조 주석 업데이트
